import React, { useCallback, useEffect, useRef, useState } from "react";
import api from "../../services/api";

const DirectChatModal = ({ open, onClose, currentUser, counterpartId, counterpartName, title }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const endRef = useRef(null);

  const headerTitle = title || `Chat with ${counterpartName || "User"}`;

  const loadConversation = useCallback(async () => {
    if (!open || !counterpartId) return;

    setLoading(true);
    try {
      const res = await api.get(`/messages/direct/${counterpartId}`);
      setMessages(Array.isArray(res.data?.messages) ? res.data.messages : []);
    } catch (err) {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [open, counterpartId]);

  useEffect(() => {
    if (open) {
      loadConversation();
    }
  }, [open, counterpartId, loadConversation]);

  useEffect(() => {
    if (!open) return undefined;

    const interval = setInterval(() => {
      loadConversation();
    }, 4000);

    return () => clearInterval(interval);
  }, [open, counterpartId, loadConversation]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (event) => {
      event.preventDefault();
      const nextText = String(text || "").trim();
      if (!nextText || !counterpartId) return;

      setSending(true);
      try {
        await api.post("/messages/direct", {
          receiverId: counterpartId,
          message: nextText,
        });
        setText("");
        await loadConversation();
      } catch (err) {
        // keep text so user can retry
      } finally {
        setSending(false);
      }
    },
    [text, counterpartId, loadConversation]
  );

  if (!open) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={modalHeaderStyle}>
          <div>
            <p style={eyebrowStyle}>Interview Chat</p>
            <h3 style={{ margin: 0 }}>{headerTitle}</h3>
          </div>
          <button onClick={onClose} style={closeButtonStyle}>×</button>
        </div>

        <div style={messagesStyle}>
          {loading ? (
            <p style={{ color: "#64748b" }}>Loading conversation...</p>
          ) : messages.length === 0 ? (
            <p style={{ color: "#64748b" }}>No messages yet. Say hello.</p>
          ) : (
            messages.map((msg) => {
              const isMine = String(msg.senderId) === String(currentUser?.id);
              return (
                <div
                  key={String(msg._id)}
                  style={{
                    ...bubbleStyle,
                    alignSelf: isMine ? "flex-end" : "flex-start",
                    backgroundColor: isMine ? "#0f766e" : "#e2e8f0",
                    color: isMine ? "#fff" : "#0f172a",
                  }}
                >
                  <p style={{ margin: 0, wordBreak: "break-word" }}>{msg.message}</p>
                  <small style={{ marginTop: 4, opacity: 0.75, fontSize: 11 }}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </small>
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>

        <form onSubmit={sendMessage} style={formStyle}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a message..."
            style={inputStyle}
          />
          <button type="submit" disabled={sending} style={sendButtonStyle}>
            {sending ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
};

const overlayStyle = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(15, 23, 42, 0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 10000,
  padding: 16,
};

const modalStyle = {
  width: "min(640px, 100%)",
  maxHeight: "85vh",
  backgroundColor: "#fff",
  borderRadius: 16,
  boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const modalHeaderStyle = {
  padding: "16px 18px",
  borderBottom: "1px solid #e2e8f0",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

const eyebrowStyle = {
  margin: 0,
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#0f766e",
  fontWeight: 800,
};

const closeButtonStyle = {
  border: "none",
  background: "#e2e8f0",
  borderRadius: 999,
  width: 32,
  height: 32,
  cursor: "pointer",
  fontSize: 20,
  lineHeight: "32px",
};

const messagesStyle = {
  flex: 1,
  minHeight: 320,
  overflowY: "auto",
  padding: 18,
  display: "flex",
  flexDirection: "column",
  gap: 10,
  backgroundColor: "#f8fafc",
};

const bubbleStyle = {
  maxWidth: "78%",
  padding: "10px 12px",
  borderRadius: 14,
  display: "flex",
  flexDirection: "column",
};

const formStyle = {
  borderTop: "1px solid #e2e8f0",
  padding: 14,
  display: "flex",
  gap: 10,
  backgroundColor: "#fff",
};

const inputStyle = {
  flex: 1,
  borderRadius: 12,
  border: "1px solid #cbd5e1",
  padding: "12px 14px",
  fontSize: 14,
};

const sendButtonStyle = {
  border: "none",
  borderRadius: 12,
  backgroundColor: "#0f766e",
  color: "#fff",
  padding: "12px 16px",
  fontWeight: 800,
  cursor: "pointer",
};

export default DirectChatModal;