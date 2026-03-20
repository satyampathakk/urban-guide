# Romantic Memory World 💕

A private, password-protected romantic web application that serves as a digital "memory world" for couples.

## Features

- 🌐 Animated landing page with password protection
- 📖 Interactive memory book with flipbook animations
- 💬 Real-time messaging with WebSockets
- ✍️ Poetry & writing section
- 🎮 Mini romantic games
- 🎨 Beautiful romantic UI with smooth animations


## Tech Stack

- **Frontend**: React with Framer Motion for animations
- **Backend**: FastAPI with WebSocket support
- **Database**: SQLite
- **Real-time**: WebSocket messaging

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm start
```

Default password: `iloveyou`

## Project Structure

```
romantic-app/
├── frontend/          # React application
├── backend/           # FastAPI server
├── database/          # SQLite database
└── assets/           # Sample images and data
```