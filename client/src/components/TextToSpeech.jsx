import { useState, useEffect } from "react";
import axios from "axios";
import { FiPlayCircle, FiLoader } from "react-icons/fi";

const API_URL = "https://server-omega-rust.vercel.app"; // Update if deployed

const TextToSpeech = () => {
  const [text, setText] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [audioFiles, setAudioFiles] = useState([]);

  // 🔥 Fetch stored audio files from backend
  useEffect(() => {
    const fetchAudioFiles = async () => {
      console.log("📥 Fetching stored audio files...");
      try {
        const response = await axios.get(`${API_URL}/get-audio-files`);
        setAudioFiles(response.data);
        console.log(`✅ Fetched ${response.data.length} audio files.`);
      } catch (error) {
        console.error("❌ Error fetching audio files:", error.message);
      }
    };

    fetchAudioFiles();
  }, []);

  // 🔥 Convert text to speech
  const handleConvert = async () => {
    if (!text.trim()) {
      alert("⚠️ Please enter some text");
      return;
    }

    setLoading(true);
    setAudioUrl(""); // Reset previous audio

    try {
      console.log(`📨 Sending text to backend: "${text}"`);
      const response = await axios.post(`${API_URL}/convert-text`, { text });

      if (response.data.audio_url) {
        console.log("✅ Speech generated successfully!", response.data.audio_url);
        setAudioUrl(response.data.audio_url);

        // Update UI with new audio file
        setAudioFiles((prev) => [
          { text, audio_url: response.data.audio_url },
          ...prev,
        ]);
      } else {
        throw new Error("No audio URL returned");
      }
    } catch (error) {
      console.error("❌ Error:", error.message);
      alert("❌ Failed to generate speech. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="bg-white bg-opacity-10 backdrop-blur-lg shadow-xl rounded-2xl p-8 max-w-xl w-full border border-gray-700">
        <h1 className="text-3xl font-extrabold text-center text-blue-400">🎙 Text to Speech</h1>

        {/* Text Input */}
        <textarea
          className="w-full p-4 mt-4 bg-gray-700 bg-opacity-50 text-white border border-gray-600 rounded-lg focus:ring focus:ring-blue-500 outline-none transition-all duration-300"
          rows="4"
          placeholder="Type your text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {/* Convert Button */}
        <button
          className={`mt-4 w-full px-6 py-3 rounded-lg text-lg font-semibold text-white transition-all duration-300 shadow-lg flex items-center justify-center gap-2 ${
            loading
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800"
          }`}
          onClick={handleConvert}
          disabled={loading}
        >
          {loading ? <FiLoader className="animate-spin text-xl" /> : "Convert to Speech"}
        </button>

        {/* Latest Audio Player */}
        {audioUrl && (
          <div className="mt-6 text-center">
            <p className="text-green-400">✅ Speech generated successfully!</p>
            <div className="mt-3 flex items-center justify-center bg-gray-700 p-3 rounded-lg">
              <audio controls className="w-full">
                <source src={audioUrl} type="audio/mpeg" />
                Your browser does not support audio playback.
              </audio>
            </div>
          </div>
        )}

        {/* List of Past Audio Files */}
        <h2 className="mt-6 text-xl font-semibold text-blue-300">🔊 Recent Audio Files</h2>
        <div className="mt-4 grid gap-4">
          {audioFiles.length > 0 ? (
            audioFiles.map((file, index) => (
              <div
                key={index}
                className="p-4 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-xl shadow-md transition-all duration-300 hover:scale-105"
              >
                <p className="text-sm text-gray-300">📝 "{file.text}"</p>
                <div className="mt-2 flex items-center gap-2">
                  <FiPlayCircle className="text-blue-400 text-xl" />
                  <audio controls className="w-full">
                    <source src={file.audio_url} type="audio/mpeg" />
                  </audio>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-center">No audio files found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TextToSpeech;
