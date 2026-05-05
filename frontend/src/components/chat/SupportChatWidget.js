import React, { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import api from "../../services/api";

const SOCKET_URL = "http://localhost:5000";

function formatTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function byTimestampAsc(a, b) {
  return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
}

function getCounterpartId(message, adminId) {
  const senderId = String(message.senderId);
  const receiverId = String(message.receiverId);
  return senderId === String(adminId) ? receiverId : senderId;
}

const SupportChatWidget = ({ user }) => {
  const token = localStorage.getItem("token");
  const role = user?.role;
  const isAdmin = role === "admin";

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [adminInfo, setAdminInfo] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const [conversations, setConversations] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");

  const socketRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadUserConversation = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/messages/support");
      setMessages(Array.isArray(res.data?.messages) ? res.data.messages.sort(byTimestampAsc) : []);
      setAdminInfo(res.data?.admin || null);
    } catch (err) {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAdminConversations = useCallback(async () => {
    try {
      const res = await api.get("/messages/support/conversations");
      const list = Array.isArray(res.data) ? res.data : [];
      const sorted = list.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
      setConversations(sorted);

      if (!selectedUserId && sorted.length > 0) {
        setSelectedUserId(String(sorted[0].userId));
      }
    } catch (err) {
      setConversations([]);
    }
  }, [selectedUserId]);

  const loadAdminConversationMessages = useCallback(async (targetUserId) => {
    if (!targetUserId) return;

    setLoading(true);
    try {
      const res = await api.get(`/messages/support/${targetUserId}`);
      setMessages(Array.isArray(res.data?.messages) ? res.data.messages.sort(byTimestampAsc) : []);
      setAdminInfo(res.data?.admin || null);
    } catch (err) {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token || !user?.id) {
      return undefined;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("support:new-message", (incoming) => {
      setMessages((prev) => {
        const exists = prev.some((item) => String(item._id) === String(incoming._id));
        if (exists) return prev;

        if (!isAdmin) {
          return [...prev, incoming].sort(byTimestampAsc);
        }

        const counterpartId = getCounterpartId(incoming, user.id);
        if (!selectedUserId || String(selectedUserId) !== String(counterpartId)) {
          return prev;
        }

        return [...prev, incoming].sort(byTimestampAsc);
      });

      if (!isOpen && String(incoming.senderId) !== String(user.id)) {
        setUnreadCount((prev) => prev + 1);
      }

      if (isAdmin) {
        loadAdminConversations();
      }
    });

    socket.on("support:inbox-updated", () => {
      if (isAdmin) {
        loadAdminConversations();
      }
    });

    // listen for admin verification notifications
    socket.on("verification:updated", (notif) => {
      try {
        // only show if notification is for current user - server emits to user room
        // simple in-app toast: use window alert fallback
        // Prefer non-blocking UI: dispatch custom event so other components can show UI
        window.dispatchEvent(new CustomEvent("app:notification", { detail: notif }));
      } catch (err) {
        console.warn("notification receive failed", err.message);
      }
    });

    socket.on("connect_error", () => {
      // Keep REST fallback available when socket auth/connect fails.
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, user?.id, isAdmin, isOpen, selectedUserId, loadAdminConversations]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      if (isAdmin) {
        loadAdminConversations();
      } else {
        loadUserConversation();
      }
    }
  }, [isOpen, isAdmin, loadAdminConversations, loadUserConversation]);

  useEffect(() => {
    if (isAdmin && selectedUserId) {
      loadAdminConversationMessages(selectedUserId);
    }
  }, [isAdmin, selectedUserId, loadAdminConversationMessages]);

  const sendMessage = async (event) => {
    event.preventDefault();
    const nextText = String(text || "").trim();
    if (!nextText) return;

    if (isAdmin && !selectedUserId) {
      return;
    }

    setText("");

    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit(
        "support:send",
        {
          receiverId: isAdmin ? selectedUserId : undefined,
          message: nextText,
        },
        async (ack) => {
          if (ack?.ok) {
            if (isAdmin) {
              loadAdminConversations();
            }
            return;
          }

          try {
            const res = await api.post("/messages/support", {
              receiverId: isAdmin ? selectedUserId : undefined,
              message: nextText,
            });
            setMessages((prev) => [...prev, res.data].sort(byTimestampAsc));
            if (isAdmin) {
              loadAdminConversations();
            }
          } catch (err) {
            setText(nextText);
          }
        }
      );
      return;
    }

    try {
      const res = await api.post("/messages/support", {
        receiverId: isAdmin ? selectedUserId : undefined,
        message: nextText,
      });
      setMessages((prev) => [...prev, res.data].sort(byTimestampAsc));
      if (isAdmin) {
        loadAdminConversations();
      }
    } catch (err) {
      setText(nextText);
    }
  };

  const panelTitle = isAdmin
    ? "Admin Support Inbox"
    : `Support Chat${adminInfo?.name ? ` (${adminInfo.name})` : ""}`;

  return (
    <>
      <button type="button" onClick={() => setIsOpen((prev) => !prev)} style={launcherStyle} aria-label="Open support chat">
        <span style={iconStyle}>💬</span>
        {unreadCount > 0 ? <span style={badgeStyle}>{unreadCount > 9 ? "9+" : unreadCount}</span> : null}
      </button>

      {isOpen ? (
        <section style={panelStyle}>
          <header style={headerStyle}>
            <h4 style={{ margin: 0 }}>{panelTitle}</h4>
            <button type="button" onClick={() => setIsOpen(false)} style={closeButtonStyle} aria-label="Close support chat">
              x
            </button>
          </header>

          <div style={bodyStyle}>
            {isAdmin ? (
              <aside style={threadListStyle}>
                {conversations.length === 0 ? (
                  <p style={mutedTextStyle}>No user messages yet.</p>
                ) : (
                  conversations.map((item) => {
                    const active = String(item.userId) === String(selectedUserId);
                    return (
                      <button
                        key={item.userId}
                        type="button"
                        onClick={() => setSelectedUserId(String(item.userId))}
                        style={{ ...threadButtonStyle, ...(active ? activeThreadButtonStyle : {}) }}
                      >
                        <strong>{item.userName}</strong>
                        <small>{item.userRole}</small>
                        <small style={mutedSmallStyle}>{item.lastMessage}</small>
                        <small style={mutedSmallStyle}>{formatTime(item.lastMessageAt)}</small>
                        {item.unreadCount > 0 ? <span style={threadBadgeStyle}>{item.unreadCount}</span> : null}
                      </button>
                    );
                  })
                )}
              </aside>
            ) : null}

            <div style={chatAreaStyle}>
              <div style={messageAreaStyle}>
                {loading ? (
                  <p style={mutedTextStyle}>Loading conversation...</p>
                ) : messages.length === 0 ? (
                  <p style={mutedTextStyle}>Start typing to contact admin support.</p>
                ) : (
                  messages.map((item) => {
                    const mine = String(item.senderId) === String(user?.id);
                    return (
                      <div
                        key={String(item._id)}
                        style={{
                          ...bubbleBaseStyle,
                          ...(mine ? myBubbleStyle : theirBubbleStyle),
                          alignSelf: mine ? "flex-end" : "flex-start",
                        }}
                      >
                        <div>{item.message}</div>
                        <small style={bubbleTimeStyle}>{formatTime(item.timestamp)}</small>
                      </div>
                    );
                  })
                )}
                <div ref={endRef} />
              </div>

              <form onSubmit={sendMessage} style={formStyle}>
                <input
                  type="text"
                  placeholder={isAdmin && !selectedUserId ? "Select a conversation to reply" : "Type your message"}
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  disabled={isAdmin && !selectedUserId}
                  style={inputStyle}
                />
                <button type="submit" style={sendButtonStyle} disabled={isAdmin && !selectedUserId}>
                  Send
                </button>
              </form>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
};

const launcherStyle = {
  position: "fixed",
  right: "20px",
  bottom: "20px",
  width: "60px",
  height: "60px",
  borderRadius: "50%",
  border: "none",
  background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
  color: "#fff",
  cursor: "pointer",
  boxShadow: "0 12px 28px rgba(37, 99, 235, 0.35)",
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const iconStyle = { fontSize: "26px", lineHeight: 1, transform: "translateY(-1px)" };

const badgeStyle = {
  position: "absolute",
  top: "-4px",
  right: "-4px",
  minWidth: "22px",
  height: "22px",
  padding: "0 6px",
  borderRadius: "12px",
  backgroundColor: "#d7263d",
  color: "#fff",
  fontSize: "12px",
  fontWeight: 700,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const panelStyle = {
  position: "fixed",
  right: "20px",
  bottom: "88px",
  width: "min(94vw, 760px)",
  height: "min(80vh, 560px)",
  backgroundColor: "#ffffff",
  borderRadius: "14px",
  boxShadow: "0 18px 40px rgba(0,0,0,0.25)",
  overflow: "hidden",
  zIndex: 1001,
  display: "flex",
  flexDirection: "column",
  border: "1px solid #d6dbe1",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 14px",
  color: "#fff",
  background: "linear-gradient(135deg, #0a7f5a, #0d5f8f)",
};

const closeButtonStyle = {
  border: "none",
  background: "transparent",
  color: "#fff",
  fontSize: "18px",
  cursor: "pointer",
  width: "24px",
  height: "24px",
};

const bodyStyle = {
  display: "flex",
  flex: 1,
  minHeight: 0,
};

const threadListStyle = {
  width: "min(38%, 260px)",
  borderRight: "1px solid #e6eaf0",
  overflowY: "auto",
  padding: "8px",
  backgroundColor: "#f7fafc",
};

const threadButtonStyle = {
  width: "100%",
  border: "1px solid #dfe5ec",
  borderRadius: "10px",
  padding: "10px",
  marginBottom: "8px",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: "4px",
  backgroundColor: "#fff",
  cursor: "pointer",
  textAlign: "left",
  position: "relative",
};

const activeThreadButtonStyle = {
  borderColor: "#0d5f8f",
  boxShadow: "0 0 0 2px rgba(13,95,143,0.15)",
};

const threadBadgeStyle = {
  position: "absolute",
  right: "8px",
  top: "8px",
  minWidth: "18px",
  height: "18px",
  borderRadius: "9px",
  fontSize: "11px",
  fontWeight: 700,
  backgroundColor: "#d7263d",
  color: "#fff",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 5px",
};

const mutedSmallStyle = {
  fontSize: "11px",
  color: "#616b77",
  maxWidth: "100%",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const chatAreaStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
};

const messageAreaStyle = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  padding: "12px",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  backgroundColor: "#fbfdff",
};

const bubbleBaseStyle = {
  maxWidth: "80%",
  borderRadius: "12px",
  padding: "8px 10px",
  lineHeight: 1.35,
  fontSize: "14px",
  display: "flex",
  flexDirection: "column",
};

const myBubbleStyle = {
  color: "#fff",
  backgroundColor: "#0d5f8f",
};

const theirBubbleStyle = {
  color: "#222",
  backgroundColor: "#edf2f7",
};

const bubbleTimeStyle = {
  marginTop: "4px",
  fontSize: "11px",
  opacity: 0.75,
};

const formStyle = {
  borderTop: "1px solid #e6eaf0",
  padding: "10px",
  display: "flex",
  gap: "8px",
};

const inputStyle = {
  flex: 1,
  border: "1px solid #c8d3de",
  borderRadius: "8px",
  padding: "10px",
  outline: "none",
};

const sendButtonStyle = {
  border: "none",
  borderRadius: "8px",
  backgroundColor: "#0a7f5a",
  color: "#fff",
  fontWeight: 600,
  padding: "10px 14px",
  cursor: "pointer",
};

const mutedTextStyle = {
  color: "#6b7280",
  textAlign: "center",
  marginTop: "16px",
};

export default SupportChatWidget;
