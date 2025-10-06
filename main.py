import os
import uuid
import requests
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# CORS middleware for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CHATKIT_API_BASE = os.getenv("CHATKIT_API_BASE", "https://api.openai.com")


class SessionRequest(BaseModel):
    workflow_id: str
    api_key: str
    user_id: Optional[str] = None


@app.post("/api/create-session")
async def create_chatkit_session(request: SessionRequest):
    """Create a ChatKit session with the specified workflow ID"""
    # Use API key from request (or fall back to environment variable)
    api_key = request.api_key or os.getenv("OPENAI_API_KEY")

    if not api_key:
        raise HTTPException(status_code=400, detail="OPENAI_API_KEY is required")

    try:
        # Create ChatKit session using the official API
        url = f"{CHATKIT_API_BASE}/v1/chatkit/sessions"

        # Generate a user ID if not provided (required by ChatKit API)
        user_id = request.user_id or str(uuid.uuid4())

        # Build request payload
        payload = {
            "workflow": {"id": request.workflow_id},
            "user": user_id
        }

        response = requests.post(
            url,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
                "OpenAI-Beta": "chatkit_beta=v1",
            },
            json=payload
        )

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"OpenAI API error: {response.text}"
            )

        data = response.json()
        return JSONResponse(content=data)

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Request failed: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create session: {str(e)}")


@app.get("/")
async def read_root():
    """Serve the main HTML page"""
    return FileResponse("index.html")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
