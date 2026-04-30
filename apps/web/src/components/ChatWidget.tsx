import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  text: string;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Bonjour ! Je suis l'assistant OGADE. Posez-moi une question sur vos matériels ou maquettes." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post<{ reply: string }>("/chat", { message: text });
      setMessages((prev) => [...prev, { role: "assistant", text: res.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Erreur de connexion. Réessayez." }]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 50,
          width: 52, height: 52, borderRadius: "50%",
          background: "linear-gradient(135deg, var(--accent) 0%, oklch(0.55 0.20 320) 100%)",
          border: "none", cursor: "pointer",
          display: "grid", placeItems: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          transition: "transform 0.15s ease",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.08)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        title="Assistant OGADE"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 50,
        width: "min(400px, calc(100vw - 32px))",
        height: "min(560px, calc(100vh - 48px))",
        borderRadius: 16,
        background: "var(--bg-panel)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        animation: "modalin 0.2s ease",
        border: "1px solid var(--line)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--line)",
          display: "flex", alignItems: "center", gap: 10,
        }}
      >
        <div
          style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--accent) 0%, oklch(0.55 0.20 320) 100%)",
            display: "grid", placeItems: "center", flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>Assistant OGADE</div>
          <div style={{ fontSize: 11, color: "var(--ink-3)" }}>Recherche matériels & maquettes</div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          style={{
            appearance: "none", border: "none", background: "none",
            padding: 6, borderRadius: 8, color: "var(--ink-3)",
            cursor: "pointer", display: "flex",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-sunken)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 5l10 10M15 5L5 15" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        style={{
          flex: 1, overflowY: "auto",
          padding: "16px 14px",
          display: "flex", flexDirection: "column", gap: 10,
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "85%",
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                background: msg.role === "user"
                  ? "linear-gradient(135deg, var(--accent), oklch(0.55 0.20 320))"
                  : "var(--bg-sunken)",
                color: msg.role === "user" ? "white" : "var(--ink)",
                fontSize: 13,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: "flex-start", maxWidth: "85%" }}>
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "14px 14px 14px 4px",
                background: "var(--bg-sunken)",
                display: "flex", gap: 4, alignItems: "center",
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ink-4)", animation: "pulse 1.2s ease infinite" }} />
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ink-4)", animation: "pulse 1.2s ease infinite 0.2s" }} />
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ink-4)", animation: "pulse 1.2s ease infinite 0.4s" }} />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        style={{
          padding: "12px 14px",
          borderTop: "1px solid var(--line)",
          display: "flex", gap: 8,
        }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Posez votre question..."
          disabled={loading}
          style={{
            flex: 1, padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid var(--line)",
            background: "var(--bg)",
            color: "var(--ink)",
            fontSize: 13,
            outline: "none",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "var(--line)"; }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            appearance: "none", border: "none",
            width: 38, height: 38, borderRadius: 10,
            background: input.trim() ? "var(--accent)" : "var(--bg-sunken)",
            color: input.trim() ? "white" : "var(--ink-4)",
            cursor: input.trim() ? "pointer" : "default",
            display: "grid", placeItems: "center",
            transition: "background 0.15s",
            flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
