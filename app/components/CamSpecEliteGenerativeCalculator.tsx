"use client";

import React, { useState, useRef, useEffect } from "react";

interface EngineSpec {
  displacement: number;
  bore: number;
  stroke: number;
  compressionRatio: number;
  cylinderCount: number;
  headFlow: number;
  engineMake: string;
  engineFamily: string;
  intendedUse: string;
  currentHp: number;
  targetHp: number;
  transmissionType: string;
  vehicleWeight: number;
  boost: number;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const DEFAULT_SPECS: EngineSpec = {
  displacement: 351,
  bore: 4.0,
  stroke: 3.5,
  compressionRatio: 9.5,
  cylinderCount: 8,
  headFlow: 0, // 0 = unknown, AI will recommend
  engineMake: "Ford",
  engineFamily: "Windsor",
  intendedUse: "street_strip",
  currentHp: 350,
  targetHp: 500,
  transmissionType: "auto",
  vehicleWeight: 3500,
  boost: 0,
};

const ENGINE_MAKES = ["Ford", "Chevrolet", "Mopar", "Pontiac", "Oldsmobile", "Buick", "AMC", "Other"];
const ENGINE_FAMILIES: Record<string, string[]> = {
  Ford: ["Windsor (289/302/351W)", "Cleveland (351C/400)", "FE (390/428)", "Modular (4.6/5.0)", "Coyote (5.0)", "Godzilla (7.3)"],
  Chevrolet: ["Small Block (350/400)", "Big Block (454/502)", "LS (LS1-LS7)", "LT (LT1-LT4)", "Gen V LT"],
  Mopar: ["Small Block LA (318/340/360)", "Big Block B/RB (383/440)", "Hemi (426/Gen III)", "Magnum"],
  Pontiac: ["326/350/400/455"],
  Oldsmobile: ["330/350/403/455"],
  Buick: ["350/400/430/455"],
  AMC: ["290/304/343/360/390/401"],
  Other: ["Custom/Other"],
};
const INTENDED_USES = [
  { value: "street", label: "Street - Daily Driver" },
  { value: "street_strip", label: "Street/Strip - Weekend Warrior" },
  { value: "drag", label: "Drag Racing - Quarter Mile" },
  { value: "road_race", label: "Road Racing - Autocross/Track" },
  { value: "marine", label: "Marine - Boat Application" },
  { value: "towing", label: "Towing - Max Torque" },
];

export default function CamSpecEliteGenerativeCalculator() {
  const [specs, setSpecs] = useState<EngineSpec>(DEFAULT_SPECS);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [activeTab, setActiveTab] = useState<"specs" | "chat">("specs");
  const [customQuestion, setCustomQuestion] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const generateId = () => Math.random().toString(36).substring(2, 15);

  const buildContextPrompt = () => {
    const headFlowText = specs.headFlow > 0 
      ? `${specs.headFlow} CFM @ 0.500" lift` 
      : "Unknown - please recommend appropriate heads";
    
    return `The user is building a ${specs.engineMake} ${specs.engineFamily} engine. 
IMPORTANT: This is a ${specs.engineMake} engine - ONLY recommend ${specs.engineMake}-compatible parts. Do NOT suggest parts from other manufacturers (e.g., no Chevy parts for Ford engines).

Engine specs:
- Engine: ${specs.engineMake} ${specs.engineFamily}
- Displacement: ${specs.displacement} cubic inches
- Bore x Stroke: ${specs.bore}" x ${specs.stroke}"
- Compression Ratio: ${specs.compressionRatio}:1
- Cylinder Head Flow: ${headFlowText}
- Current HP: ${specs.currentHp} hp
- Target HP: ${specs.targetHp} hp
- Intended Use: ${specs.intendedUse.replace("_", "/")}
- Transmission: ${specs.transmissionType}
- Vehicle Weight: ${specs.vehicleWeight} lbs
- Boost: ${specs.boost > 0 ? specs.boost + " psi" : "N/A (naturally aspirated)"}

Based on these specs, provide detailed, actionable recommendations using ONLY parts compatible with ${specs.engineMake} ${specs.engineFamily} engines.`;
  };

  const askAI = async (question: string) => {
    if (loading) return;

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: question,
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setStreamingContent("");
    setActiveTab("chat");

    try {
      const contextPrompt = buildContextPrompt();
      const conversationHistory = [
        { role: "user" as const, content: contextPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: question },
      ];

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversationHistory, stream: true }),
      });

      if (!response.ok) {
        throw new Error("AI service error");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
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
              } catch {}
            }
          }
        }
      }

      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: fullContent,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent("");
    } catch (err) {
      console.error(err);
      const errorMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: "⚠️ Error getting AI response. Please check your API configuration.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    { label: "🔥 Recommend Heads", prompt: "What cylinder heads would you recommend for this engine to reach my target HP? Include specific brands, part numbers, flow numbers, and port volume. Consider my intended use and budget options." },
    { label: "🎯 Recommend Cam Specs", prompt: "What camshaft specifications would you recommend for this engine combo? Include duration at .050, lift, LSA, and explain why." },
    { label: "⚡ HP Strategy", prompt: "What's the best path to reach my target HP? Break it down into phases with estimated costs." },
    { label: "🔧 Head/Cam Match", prompt: "What cylinder head flow (CFM) do I need to support my target HP? Explain the math and recommend specific heads that would work." },
    { label: "🏎️ Turbo Sizing", prompt: "If I wanted to add boost to this engine, what turbo size would work best? What supporting mods would I need?" },
    { label: "📊 Dyno Prediction", prompt: "Estimate my peak HP, peak torque, and RPM ranges. What will my power curve look like?" },
    { label: "🏁 Quarter Mile", prompt: "With this engine in my vehicle, what quarter mile ET and trap speed can I expect?" },
  ];

  const updateSpec = (key: keyof EngineSpec, value: string | number) => {
    setSpecs((prev) => ({ ...prev, [key]: value }));
  };

  const renderContent = (content: string) => {
    let html = content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    html = html.replace(/`(.*?)`/g, "<code style='background:rgba(0,245,255,0.1);padding:2px 6px;border-radius:4px;'>$1</code>");
    html = html.replace(/\n/g, "<br>");
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <div>
      {/* Tab Switcher */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <button
          onClick={() => setActiveTab("specs")}
          className="pill"
          style={{
            background: activeTab === "specs" ? "rgba(0,245,255,0.25)" : undefined,
            borderColor: activeTab === "specs" ? "#00f5ff" : undefined,
          }}
        >
          📋 Engine Specs
        </button>
        <button
          onClick={() => setActiveTab("chat")}
          className="pill"
          style={{
            background: activeTab === "chat" ? "rgba(0,245,255,0.25)" : undefined,
            borderColor: activeTab === "chat" ? "#00f5ff" : undefined,
          }}
        >
          🤖 AI Recommendations {messages.length > 0 && `(${messages.length})`}
        </button>
      </div>

      {activeTab === "specs" && (
        <div className="card" style={{ background: "rgba(2,6,23,0.55)" }}>
          <div className="card-inner">
            <h2 className="h2" style={{ marginBottom: 16 }}>Engine Specifications</h2>
            
            {/* Engine Make & Family */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label className="label">Engine Make</label>
                <select
                  className="input"
                  value={specs.engineMake}
                  onChange={(e) => {
                    updateSpec("engineMake", e.target.value);
                    updateSpec("engineFamily", ENGINE_FAMILIES[e.target.value]?.[0] || "");
                  }}
                >
                  {ENGINE_MAKES.map((make) => (
                    <option key={make} value={make}>{make}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Engine Family</label>
                <select
                  className="input"
                  value={specs.engineFamily}
                  onChange={(e) => updateSpec("engineFamily", e.target.value)}
                >
                  {(ENGINE_FAMILIES[specs.engineMake] || []).map((fam) => (
                    <option key={fam} value={fam}>{fam}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Core Dimensions */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
              <div>
                <label className="label">Displacement (ci)</label>
                <input
                  type="number"
                  className="input"
                  value={specs.displacement}
                  onChange={(e) => updateSpec("displacement", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="label">Bore (in)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={specs.bore}
                  onChange={(e) => updateSpec("bore", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="label">Stroke (in)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={specs.stroke}
                  onChange={(e) => updateSpec("stroke", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="label">Compression</label>
                <input
                  type="number"
                  step="0.1"
                  className="input"
                  value={specs.compressionRatio}
                  onChange={(e) => updateSpec("compressionRatio", parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Power & Goals */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
              <div>
                <label className="label">Head Flow (CFM) <span style={{ color: "#94a3b8", fontSize: "0.65rem" }}>optional</span></label>
                <input
                  type="number"
                  className="input"
                  value={specs.headFlow || ""}
                  placeholder="Unknown - AI will help"
                  onChange={(e) => updateSpec("headFlow", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="label">Current HP</label>
                <input
                  type="number"
                  className="input"
                  value={specs.currentHp}
                  onChange={(e) => updateSpec("currentHp", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="label">Target HP</label>
                <input
                  type="number"
                  className="input"
                  value={specs.targetHp}
                  onChange={(e) => updateSpec("targetHp", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="label">Boost (psi)</label>
                <input
                  type="number"
                  className="input"
                  value={specs.boost}
                  onChange={(e) => updateSpec("boost", parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Vehicle Info */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
              <div>
                <label className="label">Intended Use</label>
                <select
                  className="input"
                  value={specs.intendedUse}
                  onChange={(e) => updateSpec("intendedUse", e.target.value)}
                >
                  {INTENDED_USES.map((use) => (
                    <option key={use.value} value={use.value}>{use.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Transmission</label>
                <select
                  className="input"
                  value={specs.transmissionType}
                  onChange={(e) => updateSpec("transmissionType", e.target.value)}
                >
                  <option value="auto">Automatic</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
              <div>
                <label className="label">Vehicle Weight (lbs)</label>
                <input
                  type="number"
                  className="input"
                  value={specs.vehicleWeight}
                  onChange={(e) => updateSpec("vehicleWeight", parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <hr className="hr" />

            {/* Quick Action Buttons */}
            <h3 className="h2" style={{ marginBottom: 12 }}>🤖 Ask AI About Your Build</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {quickPrompts.map((qp) => (
                <button
                  key={qp.label}
                  className="pill"
                  onClick={() => askAI(qp.prompt)}
                  disabled={loading}
                  style={{ fontSize: "0.75rem" }}
                >
                  {qp.label}
                </button>
              ))}
            </div>

            {/* Custom Question */}
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                className="input"
                placeholder="Ask a custom question about your build..."
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customQuestion.trim()) {
                    askAI(customQuestion);
                    setCustomQuestion("");
                  }
                }}
              />
              <button
                className="pill"
                onClick={() => {
                  if (customQuestion.trim()) {
                    askAI(customQuestion);
                    setCustomQuestion("");
                  }
                }}
                disabled={loading || !customQuestion.trim()}
              >
                Ask
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "chat" && (
        <div className="card" style={{ background: "rgba(2,6,23,0.55)" }}>
          <div className="card-inner">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 className="h2" style={{ margin: 0 }}>AI Recommendations</h2>
              <button
                className="pill small"
                onClick={() => setMessages([])}
                disabled={messages.length === 0}
              >
                Clear Chat
              </button>
            </div>

            {/* Current Specs Summary */}
            <div style={{ 
              background: "rgba(0,245,255,0.08)", 
              border: "1px solid rgba(0,245,255,0.2)",
              borderRadius: 8, 
              padding: "8px 12px", 
              marginBottom: 16,
              fontSize: "0.75rem",
              color: "#7dd3fc"
            }}>
              <strong>Current Build:</strong> {specs.displacement}ci {specs.engineMake} {specs.engineFamily} | 
              {specs.compressionRatio}:1 CR | {specs.headFlow} CFM heads | 
              Target: {specs.targetHp} HP | {specs.intendedUse.replace("_", "/")}
            </div>

            {/* Messages */}
            <div style={{ 
              maxHeight: 450, 
              overflowY: "auto", 
              marginBottom: 16,
              display: "flex",
              flexDirection: "column",
              gap: 12
            }}>
              {messages.length === 0 && !streamingContent && (
                <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
                  <div style={{ fontSize: "2rem", marginBottom: 10 }}>🏁</div>
                  <p>Enter your engine specs and click a quick prompt to get AI recommendations!</p>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: msg.role === "user" 
                      ? "linear-gradient(135deg, rgba(0, 245, 255, 0.15), rgba(139, 92, 246, 0.15))"
                      : "rgba(30, 30, 50, 0.8)",
                    border: msg.role === "user"
                      ? "1px solid rgba(0, 245, 255, 0.3)"
                      : "1px solid rgba(255, 59, 212, 0.2)",
                    alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: "95%",
                  }}
                >
                  <div style={{ 
                    fontSize: "0.65rem", 
                    fontWeight: 700, 
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "#7dd3fc",
                    marginBottom: 6
                  }}>
                    {msg.role === "user" ? "You" : "AI"}
                  </div>
                  <div style={{ fontSize: "0.85rem", lineHeight: 1.6 }}>
                    {renderContent(msg.content)}
                  </div>
                </div>
              ))}

              {streamingContent && (
                <div style={{
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "rgba(30, 30, 50, 0.8)",
                  border: "1px solid rgba(255, 59, 212, 0.2)",
                  alignSelf: "flex-start",
                  maxWidth: "95%",
                }}>
                  <div style={{ 
                    fontSize: "0.65rem", 
                    fontWeight: 700,
                    color: "#7dd3fc",
                    marginBottom: 6
                  }}>
                    AI
                  </div>
                  <div style={{ fontSize: "0.85rem", lineHeight: 1.6 }}>
                    {renderContent(streamingContent)}
                    <span style={{ color: "#00f5ff", animation: "blink 1s infinite" }}>▌</span>
                  </div>
                </div>
              )}

              {loading && !streamingContent && (
                <div style={{
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "rgba(30, 30, 50, 0.8)",
                  border: "1px solid rgba(255, 59, 212, 0.2)",
                  alignSelf: "flex-start",
                }}>
                  <div style={{ color: "#00f5ff" }}>● ● ●</div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick prompts in chat view too */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {quickPrompts.slice(0, 4).map((qp) => (
                <button
                  key={qp.label}
                  className="pill small"
                  onClick={() => askAI(qp.prompt)}
                  disabled={loading}
                  style={{ fontSize: "0.7rem" }}
                >
                  {qp.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
