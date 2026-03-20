"""
Admin router — all routes prefixed /admin
JWT-protected. Default credentials: admin / admin123
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List
import sqlite3, os, shutil, uuid, hashlib, json
from datetime import datetime, timedelta
import jwt  # PyJWT

SECRET_KEY = "romantic_admin_secret_2024"
ALGORITHM = "HS256"
UPLOAD_DIR = "uploads"

# Default admin: admin / admin123
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD_HASH = hashlib.sha256("admin123".encode()).hexdigest()

router = APIRouter(prefix="/admin", tags=["admin"])
bearer = HTTPBearer()

# ── helpers ──────────────────────────────────────────────────────────────────

def db():
    return sqlite3.connect("romantic_app.db")

def make_token(username: str) -> str:
    payload = {"sub": username, "exp": datetime.utcnow() + timedelta(hours=12)}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    try:
        payload = jwt.decode(creds.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload["sub"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except Exception:
        raise HTTPException(401, "Invalid token")

def init_admin_tables():
    conn = db()
    c = conn.cursor()

    c.execute("""CREATE TABLE IF NOT EXISTS secrets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT,
        secret_type TEXT DEFAULT 'message',
        unlock_condition TEXT DEFAULT 'password',
        unlock_value TEXT,
        is_locked INTEGER DEFAULT 1,
        media_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )""")

    c.execute("""CREATE TABLE IF NOT EXISTS timeline_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        event_date TEXT,
        emoji TEXT DEFAULT '💕',
        media_url TEXT,
        sort_order INTEGER DEFAULT 0
    )""")

    c.execute("""CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    )""")

    c.execute("""CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT,
        entity TEXT,
        entity_id INTEGER,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )""")

    # Story chapters table
    c.execute("""CREATE TABLE IF NOT EXISTS story_chapters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        subtitle TEXT DEFAULT '',
        emoji TEXT DEFAULT '💕',
        video_url TEXT DEFAULT '',
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )""")

    # Migrate: add video_url if it doesn't exist yet
    try:
        c.execute("ALTER TABLE story_chapters ADD COLUMN video_url TEXT DEFAULT ''")
    except Exception:
        pass

    # Migrate: add in_game flag to memories
    try:
        c.execute("ALTER TABLE memories ADD COLUMN in_game INTEGER DEFAULT 1")
    except Exception:
        pass

    # Story slides table (memories + videos per chapter)
    c.execute("""CREATE TABLE IF NOT EXISTS story_slides (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chapter_id INTEGER,
        slide_type TEXT DEFAULT 'memory',
        title TEXT DEFAULT '',
        caption TEXT DEFAULT '',
        media_url TEXT DEFAULT '',
        sort_order INTEGER DEFAULT 0,
        FOREIGN KEY (chapter_id) REFERENCES story_chapters(id)
    )""")

    # Music tracks table
    c.execute("""CREATE TABLE IF NOT EXISTS music_tracks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        artist TEXT DEFAULT '',
        file_url TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )""")

    # Anniversary events table
    c.execute("""CREATE TABLE IF NOT EXISTS anniversary_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        message TEXT,
        month INTEGER NOT NULL,
        day INTEGER NOT NULL,
        media_url TEXT DEFAULT '',
        media_type TEXT DEFAULT '',
        music_url TEXT DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )""")

    # Default settings
    defaults = {
        "app_password": "iloveyou",
        "music_enabled": "true",
        "surprise_enabled": "true",
        "game_enabled": "true",
        "game_reward_message": "You unlocked our first memory 💕",
        "her_name": "My Love",
        "primary_color": "#ff69b4",
    }
    for k, v in defaults.items():
        c.execute("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", (k, v))

    conn.commit()
    conn.close()

def log_action(action: str, entity: str, entity_id: int = 0):
    conn = db()
    conn.execute(
        "INSERT INTO activity_log (action, entity, entity_id) VALUES (?, ?, ?)",
        (action, entity, entity_id)
    )
    conn.commit()
    conn.close()

# ── auth ─────────────────────────────────────────────────────────────────────

class LoginReq(BaseModel):
    username: str
    password: str

@router.post("/login")
def admin_login(req: LoginReq):
    pw_hash = hashlib.sha256(req.password.encode()).hexdigest()
    if req.username != ADMIN_USERNAME or pw_hash != ADMIN_PASSWORD_HASH:
        raise HTTPException(401, "Invalid credentials")
    return {"token": make_token(req.username), "username": req.username}

# ── stats ─────────────────────────────────────────────────────────────────────

@router.get("/stats")
def get_stats(user=Depends(verify_token)):
    conn = db()
    c = conn.cursor()
    stats = {}
    for table, label in [("memories","memories"),("messages","messages"),
                          ("poems","poems"),("secrets","secrets"),
                          ("timeline_events","timeline_events")]:
        try:
            c.execute(f"SELECT COUNT(*) FROM {table}")
            stats[label] = c.fetchone()[0]
        except Exception:
            stats[label] = 0

    c.execute("SELECT action, entity, timestamp FROM activity_log ORDER BY timestamp DESC LIMIT 10")
    stats["recent_activity"] = [{"action":r[0],"entity":r[1],"timestamp":r[2]} for r in c.fetchall()]
    conn.close()
    return stats

# ── memories ─────────────────────────────────────────────────────────────────

class MemoryBody(BaseModel):
    title: str
    caption: Optional[str] = ""
    image_url: Optional[str] = ""
    date_created: Optional[str] = None

@router.get("/memories")
def list_memories(user=Depends(verify_token)):
    conn = db()
    c = conn.cursor()
    c.execute("SELECT id,title,caption,image_url,date_created FROM memories ORDER BY date_created DESC")
    rows = c.fetchall()
    conn.close()
    return [{"id":r[0],"title":r[1],"caption":r[2],"image_url":r[3],"date_created":r[4]} for r in rows]

@router.post("/memories")
def create_memory(body: MemoryBody, user=Depends(verify_token)):
    conn = db()
    c = conn.cursor()
    c.execute("INSERT INTO memories (title,caption,image_url) VALUES (?,?,?)",
              (body.title, body.caption, body.image_url))
    mid = c.lastrowid
    conn.commit(); conn.close()
    log_action("created", "memory", mid)
    return {"id": mid, **body.dict()}

@router.put("/memories/{mid}")
def update_memory(mid: int, body: MemoryBody, user=Depends(verify_token)):
    conn = db()
    if body.date_created:
        conn.execute("UPDATE memories SET title=?,caption=?,image_url=?,date_created=? WHERE id=?",
                     (body.title, body.caption, body.image_url, body.date_created, mid))
    else:
        conn.execute("UPDATE memories SET title=?,caption=?,image_url=? WHERE id=?",
                     (body.title, body.caption, body.image_url, mid))
    conn.commit(); conn.close()
    log_action("updated", "memory", mid)
    return {"id": mid, **body.dict()}

@router.delete("/memories/{mid}")
def delete_memory(mid: int, user=Depends(verify_token)):
    conn = db()
    conn.execute("DELETE FROM memories WHERE id=?", (mid,))
    conn.commit(); conn.close()
    log_action("deleted", "memory", mid)
    return {"ok": True}

# ── poems ─────────────────────────────────────────────────────────────────────

class PoemBody(BaseModel):
    title: str
    content: str

@router.get("/poems")
def list_poems(user=Depends(verify_token)):
    conn = db()
    c = conn.cursor()
    c.execute("SELECT id,title,content,date_created FROM poems ORDER BY date_created DESC")
    rows = c.fetchall()
    conn.close()
    return [{"id":r[0],"title":r[1],"content":r[2],"date_created":r[3]} for r in rows]

@router.post("/poems")
def create_poem(body: PoemBody, user=Depends(verify_token)):
    conn = db()
    c = conn.cursor()
    c.execute("INSERT INTO poems (title,content) VALUES (?,?)", (body.title, body.content))
    pid = c.lastrowid
    conn.commit(); conn.close()
    log_action("created", "poem", pid)
    return {"id": pid, **body.dict()}

@router.put("/poems/{pid}")
def update_poem(pid: int, body: PoemBody, user=Depends(verify_token)):
    conn = db()
    conn.execute("UPDATE poems SET title=?,content=? WHERE id=?", (body.title, body.content, pid))
    conn.commit(); conn.close()
    log_action("updated", "poem", pid)
    return {"id": pid, **body.dict()}

@router.delete("/poems/{pid}")
def delete_poem(pid: int, user=Depends(verify_token)):
    conn = db()
    conn.execute("DELETE FROM poems WHERE id=?", (pid,))
    conn.commit(); conn.close()
    log_action("deleted", "poem", pid)
    return {"ok": True}

# ── messages ─────────────────────────────────────────────────────────────────

@router.get("/messages")
def list_messages(user=Depends(verify_token)):
    conn = db()
    c = conn.cursor()
    c.execute("SELECT id,content,timestamp,sender,msg_type,media_url FROM messages ORDER BY timestamp DESC")
    rows = c.fetchall()
    conn.close()
    return [{"id":r[0],"content":r[1],"timestamp":r[2],"sender":r[3],
             "msg_type":r[4] or "text","media_url":r[5]} for r in rows]

@router.delete("/messages/{mid}")
def delete_message(mid: int, user=Depends(verify_token)):
    conn = db()
    conn.execute("DELETE FROM messages WHERE id=?", (mid,))
    conn.commit(); conn.close()
    log_action("deleted", "message", mid)
    return {"ok": True}

# ── secrets ───────────────────────────────────────────────────────────────────

class SecretBody(BaseModel):
    title: str
    content: Optional[str] = ""
    secret_type: Optional[str] = "message"
    unlock_condition: Optional[str] = "password"
    unlock_value: Optional[str] = ""
    is_locked: Optional[int] = 1
    media_url: Optional[str] = ""

@router.get("/secrets")
def list_secrets(user=Depends(verify_token)):
    conn = db()
    c = conn.cursor()
    c.execute("SELECT id,title,content,secret_type,unlock_condition,unlock_value,is_locked,media_url,created_at FROM secrets")
    rows = c.fetchall()
    conn.close()
    return [{"id":r[0],"title":r[1],"content":r[2],"secret_type":r[3],
             "unlock_condition":r[4],"unlock_value":r[5],"is_locked":r[6],
             "media_url":r[7],"created_at":r[8]} for r in rows]

@router.post("/secrets")
def create_secret(body: SecretBody, user=Depends(verify_token)):
    conn = db()
    c = conn.cursor()
    c.execute("""INSERT INTO secrets (title,content,secret_type,unlock_condition,unlock_value,is_locked,media_url)
                 VALUES (?,?,?,?,?,?,?)""",
              (body.title,body.content,body.secret_type,body.unlock_condition,
               body.unlock_value,body.is_locked,body.media_url))
    sid = c.lastrowid
    conn.commit(); conn.close()
    log_action("created", "secret", sid)
    return {"id": sid, **body.dict()}

@router.put("/secrets/{sid}")
def update_secret(sid: int, body: SecretBody, user=Depends(verify_token)):
    conn = db()
    conn.execute("""UPDATE secrets SET title=?,content=?,secret_type=?,unlock_condition=?,
                    unlock_value=?,is_locked=?,media_url=? WHERE id=?""",
                 (body.title,body.content,body.secret_type,body.unlock_condition,
                  body.unlock_value,body.is_locked,body.media_url,sid))
    conn.commit(); conn.close()
    log_action("updated", "secret", sid)
    return {"id": sid, **body.dict()}

@router.delete("/secrets/{sid}")
def delete_secret(sid: int, user=Depends(verify_token)):
    conn = db()
    conn.execute("DELETE FROM secrets WHERE id=?", (sid,))
    conn.commit(); conn.close()
    log_action("deleted", "secret", sid)
    return {"ok": True}

# ── timeline ──────────────────────────────────────────────────────────────────

class TimelineBody(BaseModel):
    title: str
    description: Optional[str] = ""
    event_date: Optional[str] = ""
    emoji: Optional[str] = "💕"
    media_url: Optional[str] = ""
    sort_order: Optional[int] = 0

@router.get("/timeline")
def list_timeline(user=Depends(verify_token)):
    conn = db()
    c = conn.cursor()
    c.execute("SELECT id,title,description,event_date,emoji,media_url,sort_order FROM timeline_events ORDER BY sort_order,event_date")
    rows = c.fetchall()
    conn.close()
    return [{"id":r[0],"title":r[1],"description":r[2],"event_date":r[3],
             "emoji":r[4],"media_url":r[5],"sort_order":r[6]} for r in rows]

@router.post("/timeline")
def create_event(body: TimelineBody, user=Depends(verify_token)):
    conn = db()
    c = conn.cursor()
    c.execute("INSERT INTO timeline_events (title,description,event_date,emoji,media_url,sort_order) VALUES (?,?,?,?,?,?)",
              (body.title,body.description,body.event_date,body.emoji,body.media_url,body.sort_order))
    eid = c.lastrowid
    conn.commit(); conn.close()
    log_action("created", "timeline", eid)
    return {"id": eid, **body.dict()}

@router.put("/timeline/{eid}")
def update_event(eid: int, body: TimelineBody, user=Depends(verify_token)):
    conn = db()
    conn.execute("UPDATE timeline_events SET title=?,description=?,event_date=?,emoji=?,media_url=?,sort_order=? WHERE id=?",
                 (body.title,body.description,body.event_date,body.emoji,body.media_url,body.sort_order,eid))
    conn.commit(); conn.close()
    log_action("updated", "timeline", eid)
    return {"id": eid, **body.dict()}

@router.delete("/timeline/{eid}")
def delete_event(eid: int, user=Depends(verify_token)):
    conn = db()
    conn.execute("DELETE FROM timeline_events WHERE id=?", (eid,))
    conn.commit(); conn.close()
    log_action("deleted", "timeline", eid)
    return {"ok": True}

# ── settings ──────────────────────────────────────────────────────────────────

@router.get("/settings")
def get_settings(user=Depends(verify_token)):
    conn = db()
    c = conn.cursor()
    c.execute("SELECT key,value FROM settings")
    rows = c.fetchall()
    conn.close()
    return {r[0]: r[1] for r in rows}

@router.put("/settings")
def update_settings(data: dict, user=Depends(verify_token)):
    conn = db()
    for k, v in data.items():
        conn.execute("INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)", (k, str(v)))
    conn.commit(); conn.close()
    log_action("updated", "settings", 0)
    return {"ok": True}

# ── file upload ───────────────────────────────────────────────────────────────

@router.post("/upload")
def admin_upload(file: UploadFile = File(...), user=Depends(verify_token)):
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return {"url": f"/uploads/{filename}", "filename": filename}

# ── time-locked messages ──────────────────────────────────────────────────────

class TimeMessageBody(BaseModel):
    title: str
    content: str
    unlock_at: str
    occasion: Optional[str] = ""
    image_url: Optional[str] = ""

@router.get("/letters")
def list_letters(user=Depends(verify_token)):
    conn = db()
    c = conn.cursor()
    c.execute("SELECT id,title,content,unlock_at,occasion,image_url FROM time_messages ORDER BY unlock_at ASC")
    rows = c.fetchall()
    conn.close()
    return [{"id":r[0],"title":r[1],"content":r[2],"unlock_at":r[3],"occasion":r[4],"image_url":r[5] or ""} for r in rows]

@router.post("/letters")
def create_letter(body: TimeMessageBody, user=Depends(verify_token)):
    conn = db()
    c = conn.cursor()
    c.execute("INSERT INTO time_messages (title,content,unlock_at,occasion,image_url) VALUES (?,?,?,?,?)",
              (body.title, body.content, body.unlock_at, body.occasion, body.image_url))
    lid = c.lastrowid
    conn.commit(); conn.close()
    log_action("created", "letter", lid)
    return {"id": lid, **body.dict()}

@router.put("/letters/{lid}")
def update_letter(lid: int, body: TimeMessageBody, user=Depends(verify_token)):
    conn = db()
    conn.execute("UPDATE time_messages SET title=?,content=?,unlock_at=?,occasion=?,image_url=? WHERE id=?",
                 (body.title, body.content, body.unlock_at, body.occasion, body.image_url, lid))
    conn.commit(); conn.close()
    log_action("updated", "letter", lid)
    return {"id": lid, **body.dict()}

@router.delete("/letters/{lid}")
def delete_letter(lid: int, user=Depends(verify_token)):
    conn = db()
    conn.execute("DELETE FROM time_messages WHERE id=?", (lid,))
    conn.commit(); conn.close()
    log_action("deleted", "letter", lid)
    return {"ok": True}

# —— anniversary events ——

class AnniversaryBody(BaseModel):
    title: str
    message: Optional[str] = ""
    month: int
    day: int
    media_url: Optional[str] = ""
    media_type: Optional[str] = ""
    music_url: Optional[str] = ""

@router.get("/anniversaries")
def list_anniversaries(user=Depends(verify_token)):
    conn = db()
    c = conn.cursor()
    c.execute("SELECT id,title,message,month,day,media_url,media_type,music_url FROM anniversary_events ORDER BY month,day")
    rows = c.fetchall()
    conn.close()
    return [
        {"id": r[0], "title": r[1], "message": r[2], "month": r[3], "day": r[4],
         "media_url": r[5] or "", "media_type": r[6] or "", "music_url": r[7] or ""}
        for r in rows
    ]

@router.post("/anniversaries")
def create_anniversary(body: AnniversaryBody, user=Depends(verify_token)):
    conn = db()
    c = conn.cursor()
    c.execute(
        "INSERT INTO anniversary_events (title,message,month,day,media_url,media_type,music_url) VALUES (?,?,?,?,?,?,?)",
        (body.title, body.message, body.month, body.day, body.media_url, body.media_type, body.music_url)
    )
    aid = c.lastrowid
    conn.commit(); conn.close()
    log_action("created", "anniversary", aid)
    return {"id": aid, **body.dict()}

@router.put("/anniversaries/{aid}")
def update_anniversary(aid: int, body: AnniversaryBody, user=Depends(verify_token)):
    conn = db()
    conn.execute(
        "UPDATE anniversary_events SET title=?,message=?,month=?,day=?,media_url=?,media_type=?,music_url=? WHERE id=?",
        (body.title, body.message, body.month, body.day, body.media_url, body.media_type, body.music_url, aid)
    )
    conn.commit(); conn.close()
    log_action("updated", "anniversary", aid)
    return {"id": aid, **body.dict()}

@router.delete("/anniversaries/{aid}")
def delete_anniversary(aid: int, user=Depends(verify_token)):
    conn = db()
    conn.execute("DELETE FROM anniversary_events WHERE id=?", (aid,))
    conn.commit(); conn.close()
    log_action("deleted", "anniversary", aid)
    return {"ok": True}

# ── story chapters ────────────────────────────────────────────────────────────

class ChapterBody(BaseModel):
    title: str
    subtitle: Optional[str] = ""
    emoji: Optional[str] = "💕"
    video_url: Optional[str] = ""
    sort_order: Optional[int] = 0

@router.get("/story/chapters")
def list_chapters(user=Depends(verify_token)):
    conn = db()
    c = conn.cursor()
    c.execute("SELECT id,title,subtitle,emoji,video_url,sort_order FROM story_chapters ORDER BY sort_order")
    rows = c.fetchall()
    conn.close()
    return [{"id":r[0],"title":r[1],"subtitle":r[2],"emoji":r[3],"video_url":r[4],"sort_order":r[5]} for r in rows]

@router.post("/story/chapters")
def create_chapter(body: ChapterBody, user=Depends(verify_token)):
    conn = db()
    c = conn.cursor()
    c.execute("INSERT INTO story_chapters (title,subtitle,emoji,video_url,sort_order) VALUES (?,?,?,?,?)",
              (body.title, body.subtitle, body.emoji, body.video_url, body.sort_order))
    cid = c.lastrowid
    conn.commit(); conn.close()
    log_action("created", "chapter", cid)
    return {"id": cid, **body.dict()}

@router.put("/story/chapters/{cid}")
def update_chapter(cid: int, body: ChapterBody, user=Depends(verify_token)):
    conn = db()
    conn.execute("UPDATE story_chapters SET title=?,subtitle=?,emoji=?,video_url=?,sort_order=? WHERE id=?",
                 (body.title, body.subtitle, body.emoji, body.video_url, body.sort_order, cid))
    conn.commit(); conn.close()
    log_action("updated", "chapter", cid)
    return {"id": cid, **body.dict()}

@router.delete("/story/chapters/{cid}")
def delete_chapter(cid: int, user=Depends(verify_token)):
    conn = db()
    conn.execute("DELETE FROM story_slides WHERE chapter_id=?", (cid,))
    conn.execute("DELETE FROM story_chapters WHERE id=?", (cid,))
    conn.commit(); conn.close()
    log_action("deleted", "chapter", cid)
    return {"ok": True}

# ── story slides ──────────────────────────────────────────────────────────────

class SlideBody(BaseModel):
    chapter_id: int
    slide_type: Optional[str] = "memory"   # memory | video | image
    title: Optional[str] = ""
    caption: Optional[str] = ""
    media_url: Optional[str] = ""
    sort_order: Optional[int] = 0

@router.get("/story/slides")
def list_slides(user=Depends(verify_token)):
    conn = db()
    c = conn.cursor()
    c.execute("SELECT id,chapter_id,slide_type,title,caption,media_url,sort_order FROM story_slides ORDER BY chapter_id,sort_order")
    rows = c.fetchall()
    conn.close()
    return [{"id":r[0],"chapter_id":r[1],"slide_type":r[2],"title":r[3],
             "caption":r[4],"media_url":r[5],"sort_order":r[6]} for r in rows]

@router.post("/story/slides")
def create_slide(body: SlideBody, user=Depends(verify_token)):
    conn = db()
    c = conn.cursor()
    c.execute("INSERT INTO story_slides (chapter_id,slide_type,title,caption,media_url,sort_order) VALUES (?,?,?,?,?,?)",
              (body.chapter_id, body.slide_type, body.title, body.caption, body.media_url, body.sort_order))
    sid = c.lastrowid
    conn.commit(); conn.close()
    log_action("created", "slide", sid)
    return {"id": sid, **body.dict()}

@router.put("/story/slides/{sid}")
def update_slide(sid: int, body: SlideBody, user=Depends(verify_token)):
    conn = db()
    conn.execute("UPDATE story_slides SET chapter_id=?,slide_type=?,title=?,caption=?,media_url=?,sort_order=? WHERE id=?",
                 (body.chapter_id, body.slide_type, body.title, body.caption, body.media_url, body.sort_order, sid))
    conn.commit(); conn.close()
    log_action("updated", "slide", sid)
    return {"id": sid, **body.dict()}

@router.delete("/story/slides/{sid}")
def delete_slide(sid: int, user=Depends(verify_token)):
    conn = db()
    conn.execute("DELETE FROM story_slides WHERE id=?", (sid,))
    conn.commit(); conn.close()
    log_action("deleted", "slide", sid)
    return {"ok": True}

# ── music tracks ──────────────────────────────────────────────────────────────

class TrackBody(BaseModel):
    title: str
    artist: Optional[str] = ""
    file_url: str
    is_active: Optional[int] = 1
    sort_order: Optional[int] = 0

@router.get("/music")
def list_tracks(user=Depends(verify_token)):
    conn = db()
    c = conn.cursor()
    c.execute("SELECT id,title,artist,file_url,is_active,sort_order FROM music_tracks ORDER BY sort_order")
    rows = c.fetchall()
    conn.close()
    return [{"id":r[0],"title":r[1],"artist":r[2],"file_url":r[3],"is_active":r[4],"sort_order":r[5]} for r in rows]

@router.post("/music")
def create_track(body: TrackBody, user=Depends(verify_token)):
    conn = db()
    c = conn.cursor()
    c.execute("INSERT INTO music_tracks (title,artist,file_url,is_active,sort_order) VALUES (?,?,?,?,?)",
              (body.title, body.artist, body.file_url, body.is_active, body.sort_order))
    tid = c.lastrowid
    conn.commit(); conn.close()
    log_action("created", "track", tid)
    return {"id": tid, **body.dict()}

@router.put("/music/{tid}")
def update_track(tid: int, body: TrackBody, user=Depends(verify_token)):
    conn = db()
    conn.execute("UPDATE music_tracks SET title=?,artist=?,file_url=?,is_active=?,sort_order=? WHERE id=?",
                 (body.title, body.artist, body.file_url, body.is_active, body.sort_order, tid))
    conn.commit(); conn.close()
    log_action("updated", "track", tid)
    return {"id": tid, **body.dict()}

@router.delete("/music/{tid}")
def delete_track(tid: int, user=Depends(verify_token)):
    conn = db()
    conn.execute("DELETE FROM music_tracks WHERE id=?", (tid,))
    conn.commit(); conn.close()
    log_action("deleted", "track", tid)
    return {"ok": True}

# Public endpoint — music player reads active tracks without auth
@router.get("/music/public")
def public_tracks():
    conn = db()
    c = conn.cursor()
    c.execute("SELECT id,title,artist,file_url FROM music_tracks WHERE is_active=1 ORDER BY sort_order")
    rows = c.fetchall()
    conn.close()
    return [{"id":r[0],"title":r[1],"artist":r[2],"file_url":r[3]} for r in rows]

# ── game cards ────────────────────────────────────────────────────────────────

@router.get("/game-cards")
def list_game_cards(user=Depends(verify_token)):
    """All memories with their in_game flag."""
    conn = db()
    c = conn.cursor()
    c.execute("SELECT id,title,caption,image_url,in_game,date_created FROM memories ORDER BY date_created DESC")
    rows = c.fetchall()
    conn.close()
    return [{"id":r[0],"title":r[1],"caption":r[2],"image_url":r[3],
             "in_game": 1 if r[4] is None else r[4], "date_created":r[5]} for r in rows]

@router.put("/game-cards/{mid}/toggle")
def toggle_game_card(mid: int, user=Depends(verify_token)):
    """Flip the in_game flag for a memory."""
    conn = db()
    c = conn.cursor()
    c.execute("SELECT in_game FROM memories WHERE id=?", (mid,))
    row = c.fetchone()
    if not row:
        raise HTTPException(404, "Memory not found")
    new_val = 0 if (row[0] == 1 or row[0] is None) else 1
    conn.execute("UPDATE memories SET in_game=? WHERE id=?", (new_val, mid))
    conn.commit(); conn.close()
    return {"id": mid, "in_game": new_val}

@router.put("/game-cards/bulk-toggle")
def bulk_toggle(data: dict, user=Depends(verify_token)):
    """Set in_game for multiple ids at once. Body: {ids:[1,2,3], in_game:1}"""
    ids = data.get("ids", [])
    val = data.get("in_game", 1)
    if not ids:
        return {"ok": True}
    conn = db()
    for mid in ids:
        conn.execute("UPDATE memories SET in_game=? WHERE id=?", (val, mid))
    conn.commit(); conn.close()
    return {"ok": True, "updated": len(ids)}

@router.post("/game-cards/upload")
async def upload_game_card(
    file: UploadFile = File(...),
    title: str = Form(""),
    caption: str = Form(""),
    user=Depends(verify_token)
):
    """Upload an image and immediately create a memory with in_game=1."""
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)
    image_url = f"/uploads/{filename}"
    card_title = title or file.filename.replace(ext, "").replace("-", " ").replace("_", " ")
    conn = db()
    c = conn.cursor()
    c.execute("INSERT INTO memories (title,caption,image_url,in_game) VALUES (?,?,?,1)",
              (card_title, caption, image_url))
    mid = c.lastrowid
    conn.commit(); conn.close()
    log_action("created", "game_card", mid)
    return {"id": mid, "title": card_title, "caption": caption, "image_url": image_url, "in_game": 1}
