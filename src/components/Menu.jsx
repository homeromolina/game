import React from "react";
import { CANVAS_W, CANVAS_H, CHARACTERS, TERRAIN_TYPES } from "../core/Constants";

export default function Menu({
    startGame,
    selectedChars, setSelectedChars,
    isBot, setIsBot,
    selectedTerrainType, setSelectedTerrainType,
}) {
    return (
        <div style={{
            width: CANVAS_W, height: CANVAS_H, margin: "0 auto",
            background: "linear-gradient(180deg, #0b1026 0%, #1a1a40 30%, #2d1b69 60%, #8b3a62 85%, #d4654a 100%)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            fontFamily: "'Segoe UI', sans-serif", position: "relative", overflow: "hidden",
            borderRadius: 12, border: "2px solid #3a2a5c",
        }}>
            {/* Star background */}
            <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
                {[...Array(20)].map((_, i) => (
                    <div key={i} style={{
                        position: "absolute",
                        width: 2 + Math.random() * 3, height: 2 + Math.random() * 3,
                        background: "#fff", borderRadius: "50%",
                        left: `${Math.random() * 100}%`, top: `${Math.random() * 40}%`,
                        opacity: 0.3 + Math.random() * 0.5,
                        animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
                        animationDelay: `${Math.random() * 3}s`,
                    }} />
                ))}
            </div>

            <style>{`
                @keyframes twinkle { 0%,100%{opacity:0.2} 50%{opacity:0.8} }
                @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
                @keyframes pulse   { 0%,100%{box-shadow:0 0 20px rgba(255,107,53,0.3)} 50%{box-shadow:0 0 40px rgba(255,107,53,0.6)} }
            `}</style>

            {/* Title */}
            <div style={{ animation: "float 3s ease-in-out infinite", marginBottom: 6 }}>
                <div style={{ fontSize: 46, fontWeight: 900, color: "#fff", textShadow: "0 0 30px rgba(255,107,53,0.5), 0 4px 8px rgba(0,0,0,0.5)", letterSpacing: 4, textAlign: "center" }}>
                    GUNBOUND
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#ffd166", textAlign: "center", letterSpacing: 8, textShadow: "0 0 15px rgba(255,209,102,0.5)" }}>
                    ★ ALL STARS ★
                </div>
            </div>

            {/* Character selection */}
            <div style={{ display: "flex", gap: 40, margin: "14px 0 10px" }}>
                {[0, 1].map(pIdx => (
                    <div key={pIdx} style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <div style={{ color: "#aaa", fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>PLAYER {pIdx + 1}</div>
                            {pIdx === 1 && (
                                <button
                                    onClick={() => setIsBot([false, !isBot[1]])}
                                    style={{
                                        background: isBot[1] ? "#dc2626" : "#2563eb",
                                        border: "none", borderRadius: 4, padding: "2px 8px",
                                        color: "#fff", fontSize: 10, cursor: "pointer", fontWeight: "bold", marginLeft: 8,
                                    }}>
                                    {isBot[1] ? "🤖 BOT" : "👤 HUMAN"}
                                </button>
                            )}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                            {CHARACTERS.map((ch, cIdx) => (
                                <button key={cIdx}
                                    onClick={() => setSelectedChars(s => { const n = [...s]; n[pIdx] = cIdx; return n; })}
                                    style={{
                                        background: selectedChars[pIdx] === cIdx ? ch.color : "rgba(255,255,255,0.08)",
                                        border: selectedChars[pIdx] === cIdx ? `2px solid ${ch.accent}` : "2px solid rgba(255,255,255,0.15)",
                                        borderRadius: 8, padding: "8px 10px", color: "#fff", cursor: "pointer",
                                        transition: "all 0.2s", minWidth: 100, textAlign: "left",
                                    }}>
                                    <div style={{ fontSize: 12, fontWeight: 800 }}>{ch.icon} {ch.name}</div>
                                    <div style={{ fontSize: 9, opacity: 0.7, marginTop: 2 }}>{ch.desc}</div>
                                    <div style={{ fontSize: 9, opacity: 0.6, marginTop: 2 }}>DMG: {ch.damage} | RAD: {ch.explosionRadius}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Terrain type selector */}
            <div style={{ marginBottom: 14, textAlign: "center" }}>
                <div style={{ color: "#888", fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>BATTLEFIELD</div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                    {TERRAIN_TYPES.map(tt => (
                        <button key={tt.id}
                            onClick={() => setSelectedTerrainType(tt.id)}
                            style={{
                                background: selectedTerrainType === tt.id ? "rgba(255,209,102,0.25)" : "rgba(255,255,255,0.07)",
                                border: selectedTerrainType === tt.id ? "2px solid #ffd166" : "2px solid rgba(255,255,255,0.15)",
                                borderRadius: 8, padding: "8px 16px", color: "#fff", cursor: "pointer",
                                transition: "all 0.2s", minWidth: 110,
                            }}>
                            <div style={{ fontSize: 18 }}>{tt.icon}</div>
                            <div style={{ fontSize: 10, fontWeight: 700, marginTop: 3 }}>{tt.name}</div>
                            <div style={{ fontSize: 8, opacity: 0.6, marginTop: 2 }}>{tt.desc}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Start button */}
            <button
                onClick={() => startGame(selectedTerrainType)}
                style={{
                    background: "linear-gradient(135deg, #e63946, #ff6b35)", border: "none",
                    borderRadius: 30, padding: "14px 50px", color: "#fff",
                    fontSize: 18, fontWeight: 800, letterSpacing: 3, cursor: "pointer",
                    animation: "pulse 2s ease-in-out infinite", transition: "transform 0.2s",
                }}
                onMouseOver={e => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
            >
                ⚔ BATTLE ⚔
            </button>

            <div style={{ color: "#666", fontSize: 9, marginTop: 14, letterSpacing: 1, textAlign: "center" }}>
                ARROWS: AIM &amp; POWER · A/D: MOVE · Q/E: WEAPON · SPACE: FIRE
            </div>
        </div>
    );
}
