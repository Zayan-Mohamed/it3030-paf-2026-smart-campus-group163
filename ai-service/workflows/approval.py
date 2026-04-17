import os
import httpx
import json
from typing import TypedDict, Annotated, Literal
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, START, END, add_messages
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import interrupt, Command
from dotenv import load_dotenv

load_dotenv()

SPRING_BOOT_API_URL = os.getenv("SPRING_BOOT_API_URL", "http://localhost:8080")


class ApprovalState(TypedDict, total=False):
    messages: Annotated[list[BaseMessage], add_messages]
    request_details: dict
    approved: bool


def parse_request(state: ApprovalState) -> Command[str]:
    llm = ChatGroq(model="llama-3.3-70b-versatile")
    messages = state.get("messages", [])
    if not messages:
        return Command(update={}, goto=END)

    from datetime import datetime

    current_time = datetime.now().isoformat(timespec="seconds")

    prompt = f"""
    The user is asking to borrow a restricted asset/equipment or book a special room.
    Extract the item name, purpose, start time, end time, and attendees (if applicable).
    Return a STRICT JSON object ONLY (no markdown, no extra text).
    If missing, use reasonable defaults like "now" (which is {current_time}) for start_time, "now+1h" for end_time, "1" for attendees, and "Restricted asset request" for purpose.
    Ensure start_time and end_time are strictly in the future (i.e. after {current_time}).
    
    Conversation: {messages[-1].content}
    
    JSON FORMAT:
    {{
        "item": "name of the requested item/room",
        "start_time": "YYYY-MM-DDTHH:MM:SS",
        "end_time": "YYYY-MM-DDTHH:MM:SS",
        "purpose": "reason for request",
        "attendees": 1
    }}
    """

    try:
        response_text = llm.invoke([HumanMessage(content=prompt)]).content
        # Basic cleanup for potential markdown
        cleaned_json = (
            str(response_text).replace("```json", "").replace("```", "").strip()
        )
        request_details = json.loads(cleaned_json)
    except Exception as e:
        print(f"[Parse Request] Failed to extract JSON: {e}")
        request_details = {
            "item": "Unknown Restricted Asset",
            "start_time": "2026-04-18T10:00:00",
            "end_time": "2026-04-18T11:00:00",
            "purpose": "General use",
            "attendees": 1,
        }

    print(
        f"[Agent] Drafted Ticket for {request_details['item']}. Pausing for Admin Approval."
    )

    return Command(update={"request_details": request_details}, goto="admin_review")


def admin_review(state: ApprovalState) -> Command[str]:
    # This node interrupts execution
    # It sends the payload to the frontend/admin and pauses
    request_details = state.get("request_details", {})

    # interrupt() saves the state and pauses the graph indefinitely
    human_decision = interrupt(
        {
            "action": "Please review and approve this restricted asset request",
            "details": request_details,
        }
    )

    # When resumed, we get the human_decision dict
    if human_decision.get("approved"):
        print("[Admin Review] Request Approved by Admin!")
        return Command(update={"approved": True}, goto="finalize_request")
    else:
        print("[Admin Review] Request Rejected by Admin.")
        return Command(update={"approved": False}, goto=END)


def finalize_request(state: ApprovalState) -> dict:
    request_details = state.get("request_details", {})
    item_name = request_details.get("item", "Asset")
    start_time = request_details.get("start_time")
    end_time = request_details.get("end_time")
    purpose = request_details.get("purpose", "Approved Asset Request")
    attendees = request_details.get("attendees", 1)

    print(
        f"[System] Request Approved. Attempting to create booking in Spring Boot for {item_name}..."
    )

    base_url = SPRING_BOOT_API_URL
    if base_url.endswith("/api"):
        base_url = base_url[:-4]

    from utils.context import auth_token

    token = auth_token.get()
    headers = {"Authorization": f"Bearer {token}"} if token else {}

    try:
        # First try to find a facility matching the item
        fac_response = httpx.get(
            f"{base_url}/api/facilities",
            params={"minCapacity": 1},
            headers=headers,
            timeout=10.0,
            follow_redirects=False,
        )

        facility_id = 1  # Fallback
        if fac_response.status_code == 200:
            facilities = fac_response.json()
            for fac in facilities:
                if (
                    item_name.lower() in str(fac.get("name", "")).lower()
                    or item_name.lower() in str(fac.get("description", "")).lower()
                ):
                    facility_id = fac.get("id")
                    print(f"[System] Found matching facility ID: {facility_id}")
                    break

        # Now create the booking
        book_response = httpx.post(
            f"{base_url}/api/v1/bookings",
            json={
                "facilityId": facility_id,
                "startTime": start_time,
                "endTime": end_time,
                "purpose": f"APPROVED: {purpose}",
                "numberOfAttendees": attendees,
            },
            headers=headers,
            timeout=10.0,
            follow_redirects=False,
        )

        if book_response.status_code in [200, 201]:
            booking_data = book_response.json()
            booking_id = booking_data.get("id")
            print(f"[System] Booking {booking_id} successfully created as PENDING.")

            # Now approve the booking
            review_response = httpx.post(
                f"{base_url}/api/v1/bookings/{booking_id}/review",
                json={
                    "status": "APPROVED",
                    "staffComments": "Approved via AI Workflow",
                },
                headers=headers,
                timeout=10.0,
                follow_redirects=False,
            )

            if review_response.status_code in [200, 201]:
                print(f"[System] Booking {booking_id} successfully APPROVED!")
            else:
                print(
                    f"[System] Failed to approve booking {booking_id}: {review_response.status_code} - {review_response.text}"
                )

        else:
            print(
                f"[System] Booking failed: {book_response.status_code} - {book_response.text}"
            )

    except Exception as e:
        print(f"[System] Error finalizing request with backend: {e}")

    return {}


def get_approval_graph():
    builder = StateGraph(ApprovalState)
    builder.add_node("parse_request", parse_request)
    builder.add_node("admin_review", admin_review)
    builder.add_node("finalize_request", finalize_request)

    builder.add_edge(START, "parse_request")

    # We must provide a checkpointer to use interrupts
    # NOTE: To use Redis for checkpointing, we would use a RedisSaver here.
    # For now we use MemorySaver, but the pending queue is in Redis.
    checkpointer = MemorySaver()
    return builder.compile(checkpointer=checkpointer)


if __name__ == "__main__":
    graph = get_approval_graph()
    config = {"configurable": {"thread_id": "thread_123"}}
    initial_state: ApprovalState = {
        "messages": [
            HumanMessage(
                content="I need the 4K Cinema Camera for my film project this weekend."
            )
        ]
    }
    # ... mock run code omitted ...
