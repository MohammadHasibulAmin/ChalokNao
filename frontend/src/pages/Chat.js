import React, { useState, useEffect } from "react";
import api from "../services/api";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.id;

  useEffect(() => {
    const loadConversation = async () => {
      try {
        const res = await api.get("/messages/support");
        setMessages(Array.isArray(res.data?.messages) ? res.data.messages : []);
      } catch (err) {
        setStatusMessage(err.response?.data?.message || "Could not load support conversation");
      } finally {
        setIsLoading(false);
      }
    };

    loadConversation();
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) {
      setStatusMessage("Please type a message");
      return;
    }

    try {
      const res = await api.post("/messages/support", {
        message: messageText,
      });
      setMessages([...messages, res.data]);
      setMessageText("");
      setStatusMessage("");
    } catch (err) {
      setStatusMessage(err.response?.data?.message || "Error sending message");
    }
  };

  return (
    <div style={containerStyle}>
      <h2>Support Chat</h2>
      {statusMessage && <p style={{ color: "#d7263d" }}>{statusMessage}</p>}
      <p style={{ color: "#666", marginTop: "-8px" }}>
        This page shows your support conversation. You can also use the floating chat icon at bottom-right from any screen.
      </p>

      <div style={chatBoxStyle}>
        <div style={messagesStyle}>
          {isLoading ? (
            <p style={{ textAlign: "center", color: "#999" }}>Loading messages...</p>
          ) : messages.length === 0 ? (
            <p style={{ textAlign: "center", color: "#999" }}>No messages yet</p>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} style={{ ...messageStyle, alignSelf: msg.senderId === userId ? "flex-end" : "flex-start" }}>
                <p style={{ margin: 0, wordBreak: "break-word" }}>{msg.message}</p>
                <small style={{ fontSize: "10px", marginTop: "5px", opacity: 0.7 }}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </small>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSendMessage} style={formStyle}>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              placeholder="Type your message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button type="submit" style={buttonStyle}>
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const containerStyle = {
  maxWidth: "700px",
  margin: "20px auto",
  padding: "20px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  backgroundColor: "#f9f9f9",
};

const chatBoxStyle = { display: "flex", flexDirection: "column", height: "500px", backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #ddd" };
const messagesStyle = { flex: 1, overflowY: "auto", padding: "15px", display: "flex", flexDirection: "column", gap: "10px" };
const messageStyle = { maxWidth: "70%", padding: "10px 15px", backgroundColor: "#007bff", color: "#fff", borderRadius: "8px", display: "flex", flexDirection: "column" };
const formStyle = { display: "flex", flexDirection: "column", gap: "10px", paddingTop: "15px", borderTop: "1px solid #ddd" };
const inputStyle = { padding: "10px", borderRadius: "5px", border: "1px solid #ccc" };
const buttonStyle = { padding: "10px", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" };

export default Chat;
