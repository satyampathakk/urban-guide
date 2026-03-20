from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import sqlite3
import json
from datetime import datetime
from typing import List
import os
import shutil
import uuid

app = FastAPI(title="Romantic Memory World API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include admin router
from admin import router as admin_router, init_admin_tables
app.include_router(admin_router)
init_admin_tables()

# Database setup
def init_db():
    conn = sqlite3.connect('romantic_app.db')
    cursor = conn.cursor()
    
    # Messages table — with media support
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            sender TEXT NOT NULL,
            msg_type TEXT DEFAULT 'text',
            media_url TEXT
        )
    ''')
    
    # Memories table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS memories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            caption TEXT,
            image_url TEXT,
            date_created DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Poems table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS poems (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            date_created DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Time-locked messages table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS time_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            unlock_at DATETIME NOT NULL,
            occasion TEXT,
            image_url TEXT DEFAULT ''
        )
    ''')
    
    # Voice capsules table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS voice_capsules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            note TEXT,
            media_url TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    # Migrate: add image_url if it doesn't exist yet
    try:
        cursor.execute("ALTER TABLE time_messages ADD COLUMN image_url TEXT DEFAULT ''")
        conn.commit()
    except Exception:
        pass

    # Migrate: add in_game column to memories if missing
    try:
        cursor.execute("ALTER TABLE memories ADD COLUMN in_game INTEGER DEFAULT 1")
        conn.commit()
    except Exception:
        pass

    # Anniversary events table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS anniversary_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            message TEXT,
            month INTEGER NOT NULL,
            day INTEGER NOT NULL,
            media_url TEXT DEFAULT '',
            media_type TEXT DEFAULT '',
            music_url TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

# Serve uploaded media files
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# File upload endpoint
@app.post("/api/upload")
async def upload_file(
    file: UploadFile = File(...),
    sender: str = Form(...),
    msg_type: str = Form("image")
):
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)

    media_url = f"/uploads/{filename}"
    content = file.filename

    conn = sqlite3.connect('romantic_app.db')
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO messages (content, sender, msg_type, media_url) VALUES (?, ?, ?, ?)",
        (content, sender, msg_type, media_url)
    )
    msg_id = cursor.lastrowid
    conn.commit()
    conn.close()

    msg = {
        "id": msg_id,
        "content": content,
        "sender": sender,
        "msg_type": msg_type,
        "media_url": media_url,
        "timestamp": datetime.now().isoformat()
    }
    await manager.broadcast(json.dumps(msg))
    return msg

# Pydantic models
class LoginRequest(BaseModel):
    password: str

class MessageRequest(BaseModel):
    content: str
    sender: str

class Memory(BaseModel):
    title: str
    caption: str
    image_url: str

class Poem(BaseModel):
    title: str
    content: str

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

# Routes
@app.post("/api/login")
async def login(request: LoginRequest):
    # Hardcoded password - can be made configurable
    if request.password == "iloveyou":
        return {"success": True, "message": "Welcome to your memory world 💕"}
    else:
        raise HTTPException(status_code=401, detail="Incorrect password")

@app.get("/api/memories")
async def get_memories():
    conn = sqlite3.connect('romantic_app.db')
    cursor = conn.cursor()
    cursor.execute("SELECT id,title,caption,image_url,date_created FROM memories ORDER BY date_created DESC")
    memories = cursor.fetchall()
    conn.close()
    return [
        {"id": m[0], "title": m[1], "caption": m[2], "image_url": m[3], "date_created": m[4]}
        for m in memories
    ]

@app.get("/api/memories/game")
async def get_game_memories():
    """Only memories flagged for the match game."""
    conn = sqlite3.connect('romantic_app.db')
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id,title,caption,image_url,date_created FROM memories WHERE in_game=1 OR in_game IS NULL ORDER BY date_created DESC"
    )
    memories = cursor.fetchall()
    conn.close()
    return [
        {"id": m[0], "title": m[1], "caption": m[2], "image_url": m[3], "date_created": m[4]}
        for m in memories
    ]

@app.get("/api/poems")
async def get_poems():
    conn = sqlite3.connect('romantic_app.db')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM poems ORDER BY date_created DESC")
    poems = cursor.fetchall()
    conn.close()
    
    return [
        {
            "id": poem[0],
            "title": poem[1],
            "content": poem[2],
            "date_created": poem[3]
        }
        for poem in poems
    ]

@app.get("/api/messages")
async def get_messages():
    conn = sqlite3.connect('romantic_app.db')
    cursor = conn.cursor()
    cursor.execute("SELECT id, content, timestamp, sender, msg_type, media_url FROM messages ORDER BY timestamp ASC")
    messages = cursor.fetchall()
    conn.close()
    return [
        {
            "id": msg[0],
            "content": msg[1],
            "timestamp": msg[2],
            "sender": msg[3],
            "msg_type": msg[4] or "text",
            "media_url": msg[5]
        }
        for msg in messages
    ]

@app.get("/api/anniversaries")
async def get_anniversaries():
    conn = sqlite3.connect('romantic_app.db')
    cursor = conn.cursor()
    cursor.execute("SELECT id,title,message,month,day,media_url,media_type,music_url FROM anniversary_events ORDER BY month,day")
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "id": r[0],
            "title": r[1],
            "message": r[2] or "",
            "month": r[3],
            "day": r[4],
            "media_url": r[5] or "",
            "media_type": r[6] or "",
            "music_url": r[7] or ""
        }
        for r in rows
    ]

# Voice capsules
@app.get("/api/voice-capsules")
async def get_voice_capsules():
    conn = sqlite3.connect('romantic_app.db')
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, note, media_url, created_at FROM voice_capsules ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "id": r[0],
            "title": r[1] or "",
            "note": r[2] or "",
            "media_url": r[3],
            "created_at": r[4]
        }
        for r in rows
    ]

@app.post("/api/voice-capsules")
async def upload_voice_capsule(
    file: UploadFile = File(...),
    title: str = Form(""),
    note: str = Form("")
):
    ext = os.path.splitext(file.filename)[1] or ".webm"
    filename = f"voice_{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)

    media_url = f"/uploads/{filename}"

    conn = sqlite3.connect('romantic_app.db')
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO voice_capsules (title, note, media_url) VALUES (?, ?, ?)",
        (title, note, media_url)
    )
    cap_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {
        "id": cap_id,
        "title": title,
        "note": note,
        "media_url": media_url,
        "created_at": datetime.now().isoformat()
    }

@app.delete("/api/voice-capsules/{cap_id}")
async def delete_voice_capsule(cap_id: int):
    conn = sqlite3.connect('romantic_app.db')
    cursor = conn.cursor()
    cursor.execute("SELECT media_url FROM voice_capsules WHERE id=?", (cap_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Not found")
    # Delete the file from disk
    media_url = row[0]
    if media_url:
        filepath = media_url.lstrip('/')  # "/uploads/x.webm" → "uploads/x.webm"
        if os.path.exists(filepath):
            os.remove(filepath)
    cursor.execute("DELETE FROM voice_capsules WHERE id=?", (cap_id,))
    conn.commit()
    conn.close()
    return {"ok": True}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)

            conn = sqlite3.connect('romantic_app.db')
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO messages (content, sender, msg_type, media_url) VALUES (?, ?, ?, ?)",
                (message_data.get('content', ''), message_data['sender'],
                 message_data.get('msg_type', 'text'), message_data.get('media_url'))
            )
            msg_id = cursor.lastrowid
            conn.commit()
            conn.close()

            message_data['id'] = msg_id
            await manager.broadcast(json.dumps(message_data))
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/api/time-messages")
async def get_time_messages():
    conn = sqlite3.connect('romantic_app.db')
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    cursor.execute(
        "SELECT id, title, content, unlock_at, occasion, image_url FROM time_messages WHERE unlock_at <= ? ORDER BY unlock_at DESC",
        (now,)
    )
    rows = cursor.fetchall()
    conn.close()
    return [
        {"id": r[0], "title": r[1], "content": r[2], "unlock_at": r[3], "occasion": r[4], "image_url": r[5] or ""}
        for r in rows
    ]

@app.get("/api/time-messages/locked")
async def get_locked_messages():
    conn = sqlite3.connect('romantic_app.db')
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    cursor.execute(
        "SELECT id, title, unlock_at, occasion FROM time_messages WHERE unlock_at > ? ORDER BY unlock_at ASC",
        (now,)
    )
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "title": r[1], "unlock_at": r[2], "occasion": r[3]} for r in rows]

@app.get("/api/timeline")
async def get_timeline():
    conn = sqlite3.connect('romantic_app.db')
    cursor = conn.cursor()
    cursor.execute("SELECT id,title,description,event_date,emoji,media_url,sort_order FROM timeline_events ORDER BY sort_order,event_date")
    rows = cursor.fetchall()
    conn.close()
    return [{"id":r[0],"title":r[1],"description":r[2],"event_date":r[3],
             "emoji":r[4],"media_url":r[5] or "","sort_order":r[6]} for r in rows]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9000)
