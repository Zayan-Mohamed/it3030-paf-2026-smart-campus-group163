import os
import json
import redis
from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from langchain_core.messages import HumanMessage
from langgraph.types import Command

# Import the context variable for Token Forwarding
from utils.context import auth_token

# Import the agents/workflows
from workflows.concierge import get_booking_concierge
from workflows.triage import get_triage_graph
from workflows.approval import get_approval_graph
from workflows.rag import setup_rag

app = FastAPI(
    title="Smart Campus AI Service",
    description="API exposing LangGraph Agents for Smart Campus",
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Token Forwarding Middleware
@app.middleware("http")
async def token_forwarding_middleware(request: Request, call_next):
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token_value = auth_header.split("Bearer ")[1].strip()
        auth_token.set(token_value)
    else:
        auth_token.set(None)

    response = await call_next(request)
    return response


# Initialize graphs
concierge_agent = get_booking_concierge()
triage_agent = get_triage_graph()
approval_agent = get_approval_graph()
rag_chain = setup_rag("docs")

# Redis connection
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))
redis_client = redis.Redis(
    host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True
)


class ChatRequest(BaseModel):
    message: str
    thread_id: str = "default_thread"


class TriageRequest(BaseModel):
    message: str
    is_followup: bool = False
    thread_id: str = "triage_1"


class ApprovalResumeRequest(BaseModel):
    thread_id: str
    approved: bool


@app.get("/")
def read_root():
    return {"message": "AI Service is running"}


@app.post("/api/chat/booking")
def chat_booking(req: ChatRequest):
    """
    Endpoint for Conversational Booking Concierge
    """
    try:
        config = {
            "configurable": {
                "thread_id": req.thread_id,
            }
        }

        result = concierge_agent.invoke(
            {"messages": [HumanMessage(content=req.message)]},
            config,  # type: ignore
        )

        ai_responses = [m.content for m in result["messages"] if m.type == "ai"]
        return {"reply": ai_responses[-1] if ai_responses else "No response"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/triage")
def triage_issue(req: TriageRequest):
    """
    Endpoint for Intelligent Maintenance Triage
    """
    try:
        config = {
            "configurable": {
                "thread_id": req.thread_id,
            }
        }

        state = {
            "messages": [HumanMessage(content=req.message)],
            "is_water_near_electrical": None,
        }
        result = triage_agent.invoke(state, config)  # type: ignore

        # Check if the graph asked a follow-up
        if result.get("category"):
            return {
                "status": "CATEGORIZED",
                "severity": result.get("severity"),
                "category": result.get("category"),
                "ticket_id": result.get("ticket_id"),
            }
        else:
            ai_responses = [
                m.content for m in result.get("messages", []) if m.type == "ai"
            ]
            return {
                "status": "FOLLOW_UP_REQUIRED",
                "question": ai_responses[-1] if ai_responses else "Need more details.",
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/approval/request")
def request_approval(req: ChatRequest):
    """
    Start an approval flow that will hit an interrupt node.
    Stores the pending request in Redis instead of a local Python dict.
    """
    try:
        config = {
            "configurable": {
                "thread_id": req.thread_id,
            }
        }
        initial_state = {"messages": [HumanMessage(content=req.message)]}

        pending_action = None
        for event in approval_agent.stream(initial_state, config):  # type: ignore
            if "__interrupt__" in event:
                pending_action = event["__interrupt__"][0].value
                break

        if pending_action:
            # Store in Redis
            pending_data = {
                "thread_id": req.thread_id,
                "message": req.message,
                "action": pending_action.get("action"),
                "details": pending_action.get("details", {}),
            }
            redis_client.hset(
                "smartcampus:pending_approvals", req.thread_id, json.dumps(pending_data)
            )
            return {"status": "PENDING_APPROVAL", "details": pending_action}

        return {"status": "COMPLETED"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/approval/pending")
def get_pending_approvals():
    """
    Get all pending approval requests from Redis.
    """
    try:
        raw_approvals = redis_client.hgetall("smartcampus:pending_approvals")
        pending_list = [json.loads(val) for val in raw_approvals.values()]
        return {"pending": pending_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/approval/resume")
def resume_approval(req: ApprovalResumeRequest):
    """
    Resume an approval flow after human review and remove from Redis.
    """
    try:
        config = {
            "configurable": {
                "thread_id": req.thread_id,
            }
        }
        resume_command = Command(resume={"approved": req.approved})

        for event in approval_agent.stream(resume_command, config):  # type: ignore
            pass

        # Remove from Redis queue
        redis_client.hdel("smartcampus:pending_approvals", req.thread_id)

        return {"status": "FINALIZED", "approved": req.approved}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat/rag")
def chat_rag(req: ChatRequest):
    """
    Chat with the document knowledge base
    """
    try:
        answer = rag_chain.invoke(req.message)
        return {"reply": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
