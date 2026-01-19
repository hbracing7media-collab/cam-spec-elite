"use client";

import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIChatBotProps {
  /** Initial collapsed state */
  defaultCollapsed?: boolean;
  /** Title shown in header */
  title?: string;
  /** Placeholder text for input */
  placeholder?: string;
}

export default function AIChatBot({
  defaultCollapsed = true,
  title = "Cam Spec Elite AI",
  placeholder = "Ask about cams, engines, HP estimates...",
}: AIChatBotProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Focus input when expanded
  useEffect(() => {
    if (!collapsed) {
      inputRef.current?.focus();
    }
  }, [collapsed]);

  const generateId = () => Math.random().toString(36).substring(2, 15);

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setError(null);
    setLoading(true);
    setStreamingContent("");

    try {
      // Build conversation history for API
      const conversationHistory = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: trimmed },
      ];

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: conversationHistory,
          stream: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `Error: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response stream available");
      }

      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content || "";
              fullContent += delta;
              setStreamingContent(fullContent);
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }

      // Add completed assistant message
      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: fullContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get response";
      setError(errorMessage);
      console.error("Chat error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
    setStreamingContent("");
  };

  // Render markdown-like formatting (basic)
  const renderContent = (content: string) => {
    // Convert **bold** to <strong>
    let html = content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    // Convert *italic* to <em>
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    // Convert `code` to <code>
    html = html.replace(/`(.*?)`/g, "<code>$1</code>");
    // Convert newlines to <br>
    html = html.replace(/\n/g, "<br>");
    
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <div style={{
      ...styles.container,
      width: collapsed ? "auto" : 380,
    }}>
      {/* Header - always visible */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          ...styles.header,
          padding: collapsed ? "10px 14px" : "12px 16px",
        }}
        aria-expanded={!collapsed}
      >
        <div style={styles.headerLeft}>
          <span style={styles.aiIcon}>🤖</span>
          {!collapsed && <span style={styles.title}>{title}</span>}
        </div>
        <span style={styles.toggleIcon}>{collapsed ? "💬" : "▼"}</span>
      </button>

      {/* Chat body - collapsible */}
      {!collapsed && (
        <div style={styles.body}>
          {/* Messages area */}
          <div style={styles.messagesContainer}>
            {messages.length === 0 && !streamingContent && (
              <div style={styles.welcomeMessage}>
                <div style={styles.welcomeIcon}>🏁</div>
                <p style={styles.welcomeText}>
                  Hey! I&apos;m your AI performance assistant. Ask me about:
                </p>
                <ul style={styles.welcomeList}>
                  <li>Camshaft selection & specs</li>
                  <li>Horsepower estimates</li>
                  <li>Engine combos & tuning</li>
                  <li>Drag & roll race calcs</li>
                  <li>Turbo sizing & boost</li>
                </ul>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  ...styles.message,
                  ...(msg.role === "user" ? styles.userMessage : styles.assistantMessage),
                }}
              >
                <div style={styles.messageRole}>
                  {msg.role === "user" ? "You" : "AI"}
                </div>
                <div style={styles.messageContent}>
                  {renderContent(msg.content)}
                </div>
              </div>
            ))}

            {/* Streaming message */}
            {streamingContent && (
              <div style={{ ...styles.message, ...styles.assistantMessage }}>
                <div style={styles.messageRole}>AI</div>
                <div style={styles.messageContent}>
                  {renderContent(streamingContent)}
                  <span style={styles.cursor}>▌</span>
                </div>
              </div>
            )}

            {/* Loading indicator */}
            {loading && !streamingContent && (
              <div style={{ ...styles.message, ...styles.assistantMessage }}>
                <div style={styles.messageRole}>AI</div>
                <div style={styles.loadingDots}>
                  <span>●</span><span>●</span><span>●</span>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div style={styles.errorMessage}>
                ⚠️ {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <form onSubmit={handleSubmit} style={styles.inputForm}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              style={styles.input}
              rows={2}
              disabled={loading}
            />
            <div style={styles.inputActions}>
              <button
                type="button"
                onClick={clearChat}
                style={styles.clearButton}
                disabled={messages.length === 0 || loading}
              >
                Clear
              </button>
              <button
                type="submit"
                style={styles.sendButton}
                disabled={!input.trim() || loading}
              >
                {loading ? "..." : "Send"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: "fixed",
    bottom: 100,
    right: 20,
    width: 380,
    maxWidth: "calc(100vw - 40px)",
    borderRadius: 16,
    border: "1px solid rgba(0, 245, 255, 0.35)",
    background: "rgba(5, 8, 22, 0.95)",
    boxShadow: "0 0 30px rgba(0, 245, 255, 0.25), 0 8px 32px rgba(0, 0, 0, 0.5)",
    zIndex: 10000,
    overflow: "hidden",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    background: "linear-gradient(135deg, rgba(0, 245, 255, 0.15), rgba(255, 59, 212, 0.15))",
    border: "none",
    borderBottom: "1px solid rgba(0, 245, 255, 0.2)",
    cursor: "pointer",
    width: "100%",
    color: "#e5e7eb",
    transition: "background 0.2s ease",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  aiIcon: {
    fontSize: "1.2rem",
  },
  title: {
    fontSize: "0.9rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  toggleIcon: {
    fontSize: "0.7rem",
    opacity: 0.7,
  },
  body: {
    display: "flex",
    flexDirection: "column",
    height: 400,
    maxHeight: "60vh",
  },
  messagesContainer: {
    flex: 1,
    overflowY: "auto",
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  welcomeMessage: {
    textAlign: "center",
    padding: "20px 10px",
    color: "#94a3b8",
  },
  welcomeIcon: {
    fontSize: "2rem",
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: "0.9rem",
    marginBottom: 12,
    color: "#e5e7eb",
  },
  welcomeList: {
    textAlign: "left",
    fontSize: "0.8rem",
    margin: "0 auto",
    paddingLeft: 20,
    maxWidth: 200,
    lineHeight: 1.8,
  },
  message: {
    padding: "10px 12px",
    borderRadius: 12,
    maxWidth: "90%",
    wordBreak: "break-word",
  },
  userMessage: {
    alignSelf: "flex-end",
    background: "linear-gradient(135deg, rgba(0, 245, 255, 0.2), rgba(139, 92, 246, 0.2))",
    border: "1px solid rgba(0, 245, 255, 0.3)",
  },
  assistantMessage: {
    alignSelf: "flex-start",
    background: "rgba(30, 30, 50, 0.8)",
    border: "1px solid rgba(255, 59, 212, 0.2)",
  },
  messageRole: {
    fontSize: "0.65rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#7dd3fc",
    marginBottom: 4,
  },
  messageContent: {
    fontSize: "0.85rem",
    lineHeight: 1.5,
    color: "#e5e7eb",
  },
  cursor: {
    animation: "blink 1s infinite",
    color: "#00f5ff",
  },
  loadingDots: {
    display: "flex",
    gap: 4,
    fontSize: "0.8rem",
    color: "#00f5ff",
  },
  errorMessage: {
    padding: "8px 12px",
    borderRadius: 8,
    background: "rgba(239, 68, 68, 0.2)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    color: "#fca5a5",
    fontSize: "0.8rem",
    alignSelf: "center",
  },
  inputForm: {
    padding: 12,
    borderTop: "1px solid rgba(0, 245, 255, 0.15)",
    background: "rgba(2, 6, 23, 0.5)",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(148, 163, 184, 0.3)",
    background: "rgba(2, 6, 23, 0.8)",
    color: "#e5e7eb",
    fontSize: "0.85rem",
    resize: "none",
    outline: "none",
    fontFamily: "inherit",
  },
  inputActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 8,
  },
  clearButton: {
    padding: "6px 12px",
    borderRadius: 6,
    border: "1px solid rgba(148, 163, 184, 0.3)",
    background: "transparent",
    color: "#94a3b8",
    fontSize: "0.75rem",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  sendButton: {
    padding: "6px 16px",
    borderRadius: 6,
    border: "1px solid rgba(0, 245, 255, 0.4)",
    background: "linear-gradient(135deg, rgba(0, 245, 255, 0.2), rgba(255, 59, 212, 0.2))",
    color: "#e5e7eb",
    fontSize: "0.75rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
};
