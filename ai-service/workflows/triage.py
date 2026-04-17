import os
import httpx
from typing import TypedDict, Annotated, Literal
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, START, END, add_messages
from langchain_core.runnables import RunnableConfig
from dotenv import load_dotenv

load_dotenv()

SPRING_BOOT_API_URL = os.getenv("SPRING_BOOT_API_URL", "http://localhost:8080")


class TriageState(TypedDict, total=False):
    messages: Annotated[list[BaseMessage], add_messages]
    issue: str
    location: str
    is_water_near_electrical: bool | None
    severity: str
    category: str
    ticket_id: str


def analyze_issue(state: TriageState) -> dict:
    llm = ChatGroq(model="llama-3.3-70b-versatile")
    messages = state.get("messages", [])
    if not messages:
        return {}
    last_message = messages[-1].content

    prompt = f"""
    Analyze the maintenance report: "{last_message}"
    
    Extract issue, location, and determine if there's mention of water near electrical/servers.
    Respond in format:
    ISSUE: <text>
    LOCATION: <text>
    WATER_ELECTRICAL: YES / NO / UNKNOWN
    """
    response = llm.invoke([HumanMessage(content=prompt)]).content

    water_electrical = None
    if "WATER_ELECTRICAL: YES" in str(response):
        water_electrical = True
    elif "WATER_ELECTRICAL: NO" in str(response):
        water_electrical = False

    location = "Unknown Location"
    for line in str(response).split("\n"):
        if line.strip().startswith("LOCATION:"):
            location = line.replace("LOCATION:", "").strip()

    return {
        "is_water_near_electrical": water_electrical,
        "issue": last_message,
        "location": location,
    }


def should_ask_follow_up(
    state: TriageState,
) -> Literal["ask_follow_up", "categorize_and_assign"]:
    messages_content = " ".join(
        [str(m.content).lower() for m in state.get("messages", [])]
    )
    if ("leak" in messages_content or "water" in messages_content) and state.get(
        "is_water_near_electrical"
    ) is None:
        return "ask_follow_up"
    return "categorize_and_assign"


def ask_follow_up(state: TriageState) -> dict:
    question = "Is the water near any electrical outlets or servers?"
    print(f"[Follow Up Node] Agent asks: {question}")
    return {"messages": [AIMessage(content=question)]}


def categorize_and_assign(state: TriageState, config: RunnableConfig) -> dict:
    llm = ChatGroq(model="llama-3.3-70b-versatile")
    messages = state.get("messages", [])

    prompt = f"""
    Categorize the maintenance ticket based on conversation history:
    {messages}
    
    If water is near electrical, it's CRITICAL. Otherwise LOW/MEDIUM.
    Return category and Severity EXACTLY from these lists:
    CATEGORIES: ELECTRICAL, PLUMBING, HVAC, EQUIPMENT, CLEANLINESS, SECURITY, FURNITURE, AV_EQUIPMENT, NETWORK, OTHER
    SEVERITIES: LOW, MEDIUM, HIGH, CRITICAL
    
    Format:
    CATEGORY: <category>
    SEVERITY: <severity>
    """
    result = llm.invoke([HumanMessage(content=prompt)]).content

    severity = "LOW"
    category = "OTHER"

    for line in str(result).split("\n"):
        if line.strip().startswith("SEVERITY:"):
            severity = line.replace("SEVERITY:", "").strip().upper()
        if line.strip().startswith("CATEGORY:"):
            category = line.replace("CATEGORY:", "").strip().upper()

    print(f"[Categorize Node] Assigned Category: {category}, Severity: {severity}")

    # POST ticket to Spring Boot Backend
    issue_desc = state.get("issue", "Unknown maintenance issue")
    ticket_id = f"TICK-{os.urandom(4).hex().upper()}"  # Mock ID in case of failure

    base_url = SPRING_BOOT_API_URL
    if base_url.endswith("/api"):
        base_url = base_url[:-4]

    from utils.context import auth_token

    token = auth_token.get()
    print(f"[Categorize Node] Auth Token Present: {bool(token)}")
    headers = {"Authorization": f"Bearer {token}"} if token else {}

    try:
        response = httpx.post(
            f"{base_url}/api/v1/incidents",
            data={
                "resourceLocation": state.get("location", "N/A"),
                "category": category.upper(),
                "description": issue_desc,
                "priority": severity.upper(),
                "preferredContact": "AI Assistant",
            },
            files={
                "dummy": ("", b"")
            },  # Force multipart/form-data as expected by the controller
            headers=headers,
            timeout=10.0,
            follow_redirects=False,
        )
        if response.status_code in [200, 201]:
            ticket_data = response.json()
            ticket_id = str(ticket_data.get("id", ticket_id))
            print(
                f"[Categorize Node] Ticket successfully created in backend. ID: {ticket_id}"
            )
        else:
            print(f"API Error ({response.status_code}): {response.text}")
            ticket_id = f"SIM-{ticket_id}"  # Indicate simulated

    except Exception as e:
        print(f"Error submitting ticket to backend (simulating success): {e}")
        ticket_id = f"SIM-{ticket_id}"

    return {"severity": severity, "category": category, "ticket_id": ticket_id}


from langgraph.checkpoint.memory import MemorySaver


def get_triage_graph():
    builder = StateGraph(TriageState)
    builder.add_node("analyze_issue", analyze_issue)
    builder.add_node("ask_follow_up", ask_follow_up)
    builder.add_node("categorize_and_assign", categorize_and_assign)

    builder.add_edge(START, "analyze_issue")
    builder.add_conditional_edges(
        "analyze_issue",
        should_ask_follow_up,
        {
            "ask_follow_up": "ask_follow_up",
            "categorize_and_assign": "categorize_and_assign",
        },
    )
    builder.add_edge("ask_follow_up", END)  # Pauses for user input
    builder.add_edge("categorize_and_assign", END)

    memory = MemorySaver()
    return builder.compile(checkpointer=memory)


if __name__ == "__main__":
    graph = get_triage_graph()

    # Initial state
    initial_state: TriageState = {
        "messages": [HumanMessage(content="The AC in Hall A is leaking.")],
        "is_water_near_electrical": None,
    }
    print("User: The AC in Hall A is leaking.")

    result = graph.invoke(
        initial_state, config={"configurable": {"thread_id": "test_1"}}
    )  # type: ignore
    print(
        "Graph Result:",
        result.get("is_water_near_electrical"),  # type: ignore
        "| Router chose ask_follow_up",
    )

    # Simulate user answering the follow-up
    print("User: Yes, it's dripping right onto a power strip.")
    result["messages"].append(  # type: ignore
        HumanMessage(content="Yes, it's dripping right onto a power strip.")
    )

    # Resume the graph from analyze_issue
    final_result = graph.invoke(None, config={"configurable": {"thread_id": "test_1"}})  # type: ignore
    print(
        f"Final Outcome -> Severity: {final_result.get('severity')}, Category: {final_result.get('category')}"  # type: ignore
    )
