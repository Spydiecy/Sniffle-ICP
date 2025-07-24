import asyncio
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from agent import initialize_knowledge_base, rag_update_daemon, chat_with_sniffle

app = FastAPI()

# ✅ FIXED: More specific CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:4943",                          # Local dfx
        "http://u6s2n-gx777-77774-qaaba-cai.localhost:4943",  # Your specific canister
        "http://localhost:3000",                          # Local dev
        "https://sni-ffle.duckdns.org",                   # Your domain
        # Add your actual ICP canister URL when deployed
        # "https://your-actual-canister-id.icp0.io",     
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=[
        "Content-Type",
        "Authorization", 
        "Cache-Control",
        "Pragma",
        "Expires",
        "X-Requested-With",
        "Accept",
        "Origin"
    ],
)

class AgentRequest(BaseModel):
    input: str

@app.on_event("startup")
async def startup_event():
    await initialize_knowledge_base()
    app.state.rag_task = asyncio.create_task(rag_update_daemon())
    print("🐶 FastAPI Agent server started - Ready for ICP frontend requests!")

@app.on_event("shutdown")
async def shutdown_event():
    rag_task = getattr(app.state, 'rag_task', None)
    if rag_task:
        rag_task.cancel()
        try:
            await rag_task
        except asyncio.CancelledError:
            pass
    print("🐶 FastAPI Agent server shutting down...")

@app.post("/api/agent")
async def agent_endpoint(request: AgentRequest):
    try:
        response = await chat_with_sniffle(request.input)
        return {"response": response}
    except Exception as e:
        print(f"❌ Agent error: {e}")
        return {"error": str(e)}

# ✅ ADDED: Explicit OPTIONS handler for debugging
@app.options("/api/agent")
async def agent_options():
    return {"message": "OK"}

@app.get("/api/agent/health")
async def agent_health():
    return {
        "status": "OK",
        "service": "Sniffle AI Agent",
        "timestamp": asyncio.get_event_loop().time()
    }
