import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [dark, setDark] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  useEffect(() => {
    document.body.classList.toggle("dark", dark);
    localStorage.setItem("darkMode", dark);
  }, [dark]);

  const sendPrompt = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setResponse(data.response);
    } catch (err) {
      setResponse("Error getting response.");
    } finally {
      setLoading(false);
    }
  };

  const runSpeechRecognition = () => {
    // Check if we're on HTTPS or localhost
    const isSecure =
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost";

    if (!isSecure) {
      alert(
        "Speech recognition requires HTTPS. Please use https://localhost:3000 or deploy to a secure server."
      );
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Your browser does not support Speech Recognition. Please try Chrome, Edge, or Safari."
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log("Speech recognition started");
      setListening(true);
      setPrompt("Listening... Speak now!");
    };

    recognition.onresult = (event) => {
      console.log("Speech recognition result:", event.results);
      const transcript = event.results[0][0].transcript;
      setPrompt(transcript);
      setListening(false);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      let errorMessage = "Sorry, I couldn't hear that clearly.";

      switch (event.error) {
        case "not-allowed":
          errorMessage =
            "Microphone access denied. Please allow microphone permissions.";
          break;
        case "no-speech":
          errorMessage = "No speech detected. Please try speaking again.";
          break;
        case "audio-capture":
          errorMessage = "Audio capture error. Please check your microphone.";
          break;
        case "network":
          errorMessage =
            "Network error. Please check your internet connection.";
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }

      setPrompt(errorMessage);
      setListening(false);
    };

    recognition.onend = () => {
      console.log("Speech recognition ended");
      setListening(false);
    };

    try {
      recognition.start();
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      setPrompt("Failed to start speech recognition. Please try again.");
      setListening(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendPrompt();
    }
  };

  return (
    <div className="app-container">
      <div className="header">
        <div className="logo">
          <span className="logo-icon">🤖</span>
          <h1>AI Chat Assistant</h1>
        </div>
        <button
          className="theme-toggle"
          aria-label="Toggle dark mode"
          onClick={() => setDark((d) => !d)}
          title={dark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {dark ? "☀️" : "🌙"}
        </button>
      </div>

      <div className="chat-container">
        <div className="chat-messages">
          {response && (
            <div className="message response">
              <div className="message-avatar">AI</div>
              <div className="message-content">
                <pre>{response}</pre>
              </div>
            </div>
          )}
        </div>

        <div className="input-section">
          <div className="input-container">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything... (Press Enter to send, Shift+Enter for new line)"
              rows={1}
              className="message-input"
            />
            <div className="input-actions">
              <button
                className={`voice-btn ${listening ? "listening" : ""}`}
                onClick={runSpeechRecognition}
                disabled={listening}
                title="Voice input (requires HTTPS)"
              >
                {listening ? "🎙️" : "🎤"}
              </button>
              <button
                className={`send-btn ${loading ? "loading" : ""}`}
                onClick={sendPrompt}
                disabled={loading || !prompt.trim()}
                title="Send message"
              >
                {loading ? (
                  <div className="loading-spinner"></div>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22,2 15,22 11,13 2,9"></polygon>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
