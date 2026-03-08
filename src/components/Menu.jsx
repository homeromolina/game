import React from "react";
import { CANVAS_W, CANVAS_H, CHARACTERS } from "../core/Constants";

export default function Menu({ startGame, selectedChars, setSelectedChars }) {
    return (
        <div style={{ width: CANVAS_W, height: CANVAS_H, margin: "0 auto", background: "linear-gradient(180deg, #0b1026 0%, #1a1a40 30%, #2d1b69 60%, #8b3a62 85%, #d4654a 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', sans-serif", position: "relative", overflow: "hidden", borderRadius: 12, border: "2px solid #3a2a5c" }}>
            <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
                {[...Array(20)].map((_, i) => (
                    <div key={i} style={{ position: "absolute", width: 2 + Math.random() * 3, height: 2 + Math.random() * 3, background: "#fff", borderRadius: "50%", left: `${Math.random() * 100}%`, top: `${Math.random() * 40}%`, opacity: 0.3 + Math.random() * 0.5, animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`, animationDelay: `${Math.random() * 3}s` }} />
                ))}
            </div>
            <style>{`
        @keyframes twinkle { 0%,100%{opacity:0.2} 50%{opacity:0.8} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes pulse { 0%,100%{box-shadow:0 0 20px rgba(255,107,53,0.3)} 50%{box-shadow:0 0 40px rgba(255,107,53,0.6)} }
      `}</style>
            <div style={{ animation: "float 3s ease-in-out infinite", marginBottom: 8 }}>
                <div style={{ fontSize: 48, fontWeight: 900, color: "#fff", textShadow: "0 0 30px rgba(255,107,53,0.5), 0 4px 8px rgba(0,0,0,0.5)", letterSpacing: 4, textAlign: "center" }}>GUNBOUND</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#ffd166", textAlign: "center", letterSpacing: 8, textShadow: "0 0 15px rgba(255,209,102,0.5)" }}>★ ALL STARS ★</div>
            </div>
            <div style={{ display: "flex", gap: 40, margin: "20px 0" }}>
                {[0, 1].map(pIdx => (
                    <div key={pIdx} style={{ textAlign: "center" }}>
                        <div style={{ color: "#aaa", fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>PLAYER {pIdx + 1}</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                            {CHARACTERS.map((ch, cIdx) => (
                                <button key={cIdx} onClick={() => setSelectedChars(s => { const n = [...s]; n[pIdx] = cIdx; return n; })}
                                    style={{ background: selectedChars[pIdx] === cIdx ? ch.color : "rgba(255,255,255,0.08)", border: selectedChars[pIdx] === cIdx ? `2px solid ${ch.accent}` : "2px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "8px 10px", color: "#fff", cursor: "pointer", transition: "all 0.2s", minWidth: 100, textAlign: "left" }}>
                                    <div style={{ fontSize: 12, fontWeight: 800 }}>{ch.icon} {ch.name}</div>
                                    <div style={{ fontSize: 9, opacity: 0.7, marginTop: 2 }}>{ch.desc}</div>
                                    <div style={{ fontSize: 9, opacity: 0.6, marginTop: 2 }}>DMG: {ch.damage} | RAD: {ch.explosionRadius}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <button onClick={startGame}
                style={{ background: "linear-gradient(135deg, #e63946, #ff6b35)", border: "none", borderRadius: 30, padding: "14px 50px", color: "#fff", fontSize: 18, fontWeight: 800, letterSpacing: 3, cursor: "pointer", marginTop: 12, animation: "pulse 2s ease-in-out infinite", transition: "transform 0.2s" }}
                onMouseOver={e => e.target.style.transform = "scale(1.05)"}
                onMouseOut={e => e.target.style.transform = "scale(1)"}>
                ⚔ BATTLE ⚔
            </button>
            <div style={{ color: "#888", fontSize: 10, marginTop: 16, letterSpacing: 1 }}>
                ARROWS: AIM & POWER · A/D: MOVE · SPACE: FIRE
            </div>
        </div>
    );
}
