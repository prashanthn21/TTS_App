const express = require("express");
const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();
app.use(express.json());
const cors = require("cors");
app.use(cors());

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech";
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SUPABASE_BUCKET = "tts-audio";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 🔥 Convert Text-to-Speech & Upload to Supabase
app.post("/convert-text", async (req, res) => {
    const { text } = req.body;

    if (!text || text.trim() === "") {
        return res.status(400).json({ error: "Text cannot be empty" });
    }

    try {
        console.log(`📨 Sending text to ElevenLabs: "${text}"`);
        const API_URL = `https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL`;
        // Request speech conversion from ElevenLabs API
        const response = await axios.post(
            `${API_URL}`,
            {
                text,
                model_id: "eleven_multilingual_v1",
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.8,
                },
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "xi-api-key": ELEVENLABS_API_KEY,
                },
                responseType: "arraybuffer", // Receive audio as binary buffer
            }
        );

        console.log("✅ Speech conversion successful!");

        // 🔹 Generate a unique filename
        const fileName = `audio_${Date.now()}.mp3`;

        // 🔹 Upload to Supabase directly (without saving to disk)
        const { data, error: uploadError } = await supabase.storage
            .from(SUPABASE_BUCKET)
            .upload(fileName, Buffer.from(response.data), {
                contentType: "audio/mpeg",
                upsert: false,
            });

        if (uploadError) {
            console.error("❌ Supabase Upload Error:", uploadError.message);
            return res.status(500).json({ error: "Failed to upload to Supabase" });
        }

        console.log("✅ Audio uploaded to Supabase");

        // 🔹 Get the public URL of the uploaded file
        const { data: publicURL } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(fileName);

        // 🔹 Store text & audio URL in the database
        const { error: dbError } = await supabase
            .from("text_to_speech")
            .insert([{ text, audio_url: publicURL.publicUrl }]);

        if (dbError) {
            console.error("❌ Database Insert Error:", dbError.message);
            return res.status(500).json({ error: "Failed to save to database" });
        }

        console.log("✅ Audio URL saved to database:", publicURL.publicUrl);

        res.json({ audio_url: publicURL.publicUrl, message: "Speech generated successfully" });
    } catch (error) {
        console.error("❌ TTS Conversion Error:", error.message);
        res.status(500).json({ error: error.message || "Failed to convert text" });
    }
});

// 🔥 Get List of Stored Audio Files
app.get("/get-audio-files", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("text_to_speech")
            .select("id, text, audio_url")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("❌ Fetch Error:", error.message);
            return res.status(500).json({ error: "Failed to fetch audio files" });
        }

        console.log(`✅ Retrieved ${data.length} audio files from database`);
        res.json(data);
    } catch (error) {
        console.error("❌ Error fetching audio files:", error.message);
        res.status(500).json({ error: "Failed to fetch audio files" });
    }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
