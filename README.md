# Text-to-Speech (TTS) App

## Overview
This is a **Text-to-Speech (TTS) app** built with a **MERN stack** (MongoDB, Express, React, Node.js), using **ElevenLabs API** for speech synthesis and **Supabase** for storing audio files. The app allows users to enter text, generate speech, and store/play audio files.

## Features
- Convert text into **realistic speech** using ElevenLabs API.
- Store generated **audio files** in Supabase.
- Fetch and play previously generated **audio files**.
- **Deployed on Vercel** for serverless execution.

---

## Tech Stack
- **Frontend**: React, Tailwind CSS, Axios
- **Backend**: Node.js, Express.js, Supabase SDK, ElevenLabs API
- **Database & Storage**: Supabase (PostgreSQL + Storage)
- **Deployment**: Vercel (Frontend + Backend)

---

## Installation

### **1. Clone the Repository**
```bash
  git clone https://github.com/your-repo/tts-app.git
  cd tts-app
```

### **2. Set Up Environment Variables**
Create a `.env` file in the **root directory** and add:
```env
ELEVENLABS_API_KEY=your_elevenlabs_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
PORT=5000  # Change if needed
```

### **3. Install Dependencies**
#### **Backend**
```bash
  cd server
  npm install
```

#### **Frontend**
```bash
  cd client
  npm install
```

---

## Running Locally

### **Start Backend**
```bash
  cd server
  npm start
```

### **Start Frontend**
```bash
  cd client
  npm run dev
```
> The frontend runs on **http://localhost:3000** and the backend on **http://localhost:5000**

---

## API Routes

### **1. Convert Text to Speech**
**POST** `/convert-text`
```json
{
  "text": "Hello, this is a test!"
}
```

#### **Response:**
```json
{
  "audio_url": "https://your-supabase-url.com/path/to/audio.mp3",
  "message": "Speech generated successfully"
}
```

### **2. Fetch Audio Files**
**GET** `/get-audio-files`
#### **Response:**
```json
[
  {
    "id": 1,
    "text": "Hello, this is a test!",
    "audio_url": "https://your-supabase-url.com/path/to/audio.mp3"
  }
]
```

---

## Deployment

### **1. Deploy Backend to Vercel**
```bash
  cd server
  vercel deploy
```
#### **Fix for Read-Only File System Error on Vercel**
Use temporary storage (e.g., `/tmp/`):
```js
const tempFilePath = `/tmp/audio_${Date.now()}.mp3`;
```

### **2. Deploy Frontend to Vercel**
```bash
  cd client
  vercel deploy
```

---

## Troubleshooting

**1. CORS Issues?**  
Ensure backend allows frontend access:
```js
const cors = require("cors");
app.use(cors({ origin: "http://localhost:3000" }));
```

**2. ElevenLabs API Errors?**  
Check if your **API key** is correct in `.env`.

**3. Audio Not Playing?**  
Check **Supabase storage rules** and ensure files are public.

---

## Contributors
- **Your Name** ([@yourGithub](https://github.com/yourGithub))

---

## License
This project is licensed under the **MIT License**.

