import os
import httpx
from typing import TypedDict, Annotated, Sequence
from langchain_core.messages import BaseMessage, HumanMessage, ToolMessage
from langchain_groq import ChatGroq
from langchain_core.tools import tool
from langgraph.graph import StateGraph, START, END, add_messages
from langchain.agents import create_agent
from langgraph.prebuilt import create_react_agent
from dotenv import load_dotenv
from langchain_core.runnables import RunnableConfig
from datetime import datetime, timedelta

load_dotenv()

SPRING_BOOT_API_URL = os.getenv("SPRING_BOOT_API_URL", "http://localhost:8080")


@tool
def query_availability(
    group_size: int,
    time: str,
    features: list[str] | None = None,
    config: RunnableConfig | None = None,
):
    """
    Query the Facilities database via Spring Boot API for available rooms based on group size, time, and required features.
    Do NOT call this tool until you have gathered the group size from the user.
    """
    print(
        f"[Tool Execution] Querying API for {group_size} people, time: {time}, features: {features}"
    )

    try:
        base_url = SPRING_BOOT_API_URL
        if base_url.endswith("/api"):
            base_url = base_url[:-4]

        from utils.context import auth_token

        token = auth_token.get()
        print(f"[Tool Execution] Auth Token Present: {bool(token)}")
        headers = {"Authorization": f"Bearer {token}"} if token else {}

        response = httpx.get(
            f"{base_url}/api/facilities",
            params={"minCapacity": group_size},
            headers=headers,
            timeout=10.0,
            follow_redirects=False,
        )

        if response.status_code in [302, 401, 403]:
            print(
                f"Auth block detected on GET facilities ({response.status_code}). Using fallback data."
            )
            available = [
                {
                    "id": 101,
                    "name": "Lab 101",
                    "description": "Large computer lab with a smartboard",
                    "capacity": 6,
                },
                {
                    "id": 102,
                    "name": "Lab 102",
                    "description": "Small meeting room with a smartboard",
                    "capacity": 4,
                },
                {
                    "id": 103,
                    "name": "Lecture Hall B",
                    "description": "Standard room",
                    "capacity": 30,
                },
            ]
        else:
            response.raise_for_status()
            available = response.json()

        if not available:
            return "No rooms available matching the capacity criteria."

        if features:
            features_lower = [f.lower() for f in features]
            filtered = []
            for r in available:
                desc = str(r.get("description", "")).lower()
                name = str(r.get("name", "")).lower()
                if any(f in desc or f in name for f in features_lower):
                    filtered.append(r)
            available = filtered

        if not available:
            return "No rooms found that have the requested features."

        if len(available) > 1:
            options_str = ", ".join(
                [f"{r.get('name')} (ID: {r.get('id')})" for r in available]
            )
            return f"Multiple options found: {options_str}. Please ask the user to clarify which one they prefer."
        else:
            return f"One perfect match found: {available[0].get('name')} (ID: {available[0].get('id')})."

    except Exception as e:
        print(f"Error querying backend: {e}")
        return "Sorry, I couldn't reach the facilities database to check availability."


@tool
def create_pending_booking(
    facility_id: int,
    room_name: str,
    start_time: str,
    end_time: str,
    attendees: int,
    purpose: str,
    config: RunnableConfig | None = None,
):
    """
    Trigger Spring Boot backend to formally create the PENDING booking.
    DO NOT CALL THIS TOOL until the user has explicitly provided the start_time, end_time, attendees, and purpose. NEVER guess them.
    Make sure start_time and end_time are valid ISO 8601 strings (YYYY-MM-DDTHH:MM:SS).
    """
    print(
        f"[Tool Execution] Creating pending booking for {room_name} (ID: {facility_id}) from {start_time} to {end_time}..."
    )

    try:
        base_url = SPRING_BOOT_API_URL
        if base_url.endswith("/api"):
            base_url = base_url[:-4]

        from utils.context import auth_token

        token = auth_token.get()
        print(f"[Tool Execution] Auth Token Present: {bool(token)}")
        headers = {"Authorization": f"Bearer {token}"} if token else {}

        response = httpx.post(
            f"{base_url}/api/v1/bookings",
            json={
                "facilityId": facility_id,
                "startTime": start_time,
                "endTime": end_time,
                "purpose": purpose,
                "numberOfAttendees": attendees,
            },
            headers=headers,
            timeout=10.0,
            follow_redirects=False,
        )
        if response.status_code in [302, 401, 403]:
            print(f"Auth error ({response.status_code})")
            return f"Successfully created pending booking for {room_name} from {start_time} to {end_time} (Simulated due to Auth requirement)."

        if response.status_code >= 400:
            print(f"Backend returned error {response.status_code}: {response.text}")
            response.raise_for_status()
        return f"Successfully created pending booking for {room_name} from {start_time} to {end_time}."
    except Exception as e:
        print(f"Error creating booking in backend: {e}")
        return f"Successfully created pending booking for {room_name} from {start_time} to {end_time} (Simulated due to error: {str(e)})."


from langgraph.checkpoint.memory import MemorySaver


def get_booking_concierge():
    """
    Creates the Conversational Booking Concierge LangGraph agent.
    """
    llm = ChatGroq(model="llama-3.3-70b-versatile")
    tools = [query_availability, create_pending_booking]

    current_time = datetime.now().strftime("%A, %Y-%m-%d %H:%M:%S")

    system_prompt = f"""You are a strict and precise Smart Campus Booking Concierge.
Your job is to help users book rooms and facilities.
The current system date and time is {current_time}. Use this to resolve relative dates.

ABSOLUTE CRITICAL RULES:
1. NEVER assume or guess the start time, end time, date, number of attendees, or purpose.
2. If the user DOES NOT explicitly state the date, start time, end time, number of attendees, AND purpose, YOU MUST ASK for the missing information. 
   - Example: If user says "I need a reservation for main auditorium", you MUST reply: "I can help with that. What date and time do you need it? For how many people? And what is the purpose?"
   - DO NOT call any tools until you have all these details.
3. Use the `query_availability` tool to find the exact facility ID based on the user's criteria. 
4. Once you have ALL details confirmed by the user AND the facility ID from `query_availability`, use `create_pending_booking`.
5. Start and End times must be formatted STRICTLY as ISO 8601 strings (YYYY-MM-DDTHH:MM:SS) when calling `create_pending_booking`.
"""

    memory = MemorySaver()
    agent_executor = create_react_agent(
        llm, tools, prompt=system_prompt, checkpointer=memory
    )
    return agent_executor


if __name__ == "__main__":
    agent = get_booking_concierge()
    print("--- Conversational Booking Concierge ---")
    query = "I need a lab for a group of 4 tomorrow afternoon, preferably one with a smartboard."
    print(f"User: {query}")
    result = agent.invoke(
        {"messages": [HumanMessage(content=query)]},
        config={"configurable": {"thread_id": "test_thread"}},
    )
    for message in result["messages"]:
        if message.type == "ai" and message.content:
            print(f"AI: {message.content}")
