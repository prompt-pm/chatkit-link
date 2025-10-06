# ChatKit Link

Demo your ChatKit workflows instantly by entering a workflow ID.

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env and add your OPENAI_API_KEY
   ```

3. **Run the server:**
   ```bash
   python main.py
   ```

4. **Open in browser:**
   ```
   http://localhost:8000
   ```

## Usage

### Via Web Interface
1. Enter your workflow ID (e.g., `wf_abc123...`)
2. Click "Load Chat"
3. Start chatting with your workflow

### Via URL Parameter
Share a direct link with a workflow ID:
```
http://localhost:8000?workflow=wf_abc123...
```

## Tech Stack

- **Frontend:** HTML + Alpine.js + ChatKit CDN
- **Backend:** FastAPI + OpenAI Python SDK
- **Deployment:** Single-file HTML, minimal dependencies

## API Endpoints

- `GET /` - Serve the web interface
- `POST /api/chatkit/session` - Create ChatKit session with workflow ID

## Development

Run with auto-reload:
```bash
uvicorn main:app --reload
```
