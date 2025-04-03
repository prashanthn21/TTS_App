const express = require('express');
const cors = require('cors')
const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");  // Import the Supabase client
const fs = require("fs");
const path = require("path");
require('dotenv').config(); // Load environment variables from .env file    '

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse JSON
//app.use(cors()) // Enable cors
app.use(
    cors({
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    })
  );
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
    res.send('MERN Text-to-Speech API is running!');
});


const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkConnection() {
    const { data, error } = await supabase
      .from('text_to_speech')
      .select('*')
      .limit(1);
  
    if (error) {
      console.error('Error connecting to Supabase:', error.message);
    } else {
      console.log('Connected to Supabase:', data);
    }
  }
    
checkConnection(); // Check connection to Supabase

module.exports = supabase;


const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL";
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET; // Change as per your Supabase storage

// Text-to-Speech API Route
app.post("/convert-text", async (req, res) => {
    const { text } = req.body;

    if (!text || text.trim() === "") {
        return res.status(400).json({ error: "Text cannot be empty" });
    }

    try {
        // Request speech conversion from ElevenLabs
        const response = await axios.post(
            ELEVENLABS_API_URL,
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
                responseType: "arraybuffer", // Receive audio as binary
            }
        );

        // Save audio file locally (temporary)
        const fileName = `audio_${Date.now()}.mp3`;
        const filePath = path.join(__dirname, fileName);
        fs.writeFileSync(filePath, response.data);

        // Log the file creation
        fs.appendFileSync("server.log", `Audio file created: ${fileName}\n`);

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from(SUPABASE_BUCKET)
            .upload(fileName, fs.createReadStream(filePath), {
                contentType: "audio/mpeg",
                upsert: false,
                duplex: "half", // 🔥 Add this to fix the error
            });

        // Remove local temp file
        fs.unlinkSync(filePath);

        // Log the upload status
        if (error) {
            fs.appendFileSync("server.log", `Failed to upload ${fileName} to Supabase: ${error.message}\n`);
            return res.status(500).json({ error: "Failed to upload to Supabase" });
        } else {
            fs.appendFileSync("server.log", `Uploaded ${fileName} to Supabase successfully\n`);
        }

        // Get public URL of the uploaded file
        const { publicURL } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(fileName);

        // Store text & audio URL in Supabase database
        await supabase.from("text_to_speech").insert([{ text, audio_url: publicURL }]);

        // Log the database insertion
        fs.appendFileSync("server.log", `Stored text and audio URL in database for file: ${fileName}\n`);

        res.json({ audio_url: publicURL, message: "Speech generated successfully" });
    } catch (error) {
        // Log the error
        fs.appendFileSync("server.log", `Error during text-to-speech conversion: ${error.message}\n`);
        res.status(500).json({ error: error.message || "Failed to convert text" });
    }
});










// Post endpoint to save audio URL and text to Supabase
// Note: Ensure you have the correct table name and structure in your Supabase database
// Replace 'your_table_name' with the actual name of your table
// Replace 'your_table_name' with the actual name of your table
app.post("/save-audio", async (req, res) => {
    const { text, audio_url } = req.body;
  
    if (!text || !audio_url) {
      return res.status(400).json({ error: "Missing text or audio URL" });
    }
  
    const { data, error } = await supabase
      .from("text_to_speech")
      .insert([{ text, audio_url }]);
  
    if (error) {
      return res.status(500).json({ error: error.message });
    }
  
    res.json({ message: "Data saved successfully", data });
  });


// Get endpoint to retrieve audio URLs and text from Supabase
// Note: Ensure you have the correct table name and structure in your Supabase database
// Replace 'your_table_name' with the actual name of your table


  app.get("/get-audio-files", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("text_to_speech")
        .select("id, text, audio_url")
        .order("created_at", { ascending: false }); // Get latest files first
  
      if (error) {
        return res.status(500).json({ error: error.message });
      }
  
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch audio files" });
    }
  });



// Start the server
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});