import React from "react";
import { CHARACTERS, MAX_POWER, FUEL_MAX } from "../core/Constants";

export function HUDTop({ players, currentPlayer, suddenDeath, message }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(90deg, #1a1a2e, #16213e, #1a1a2e)", padding: "6px 16px", borderRadius: "12px 12px 0 0", border: "1px solid #2a2a4a", borderBottom: "none" }}>
            {players.map((p, i) => {
                const c = CHARACTERS[p.char];
                return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, opacity: currentPlayer === i ? 1 : 0.5 }}>
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: c.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, border: currentPlayer === i ? `2px solid ${c.accent}` : "2px solid transparent", position: "relative" }}>
                            {c.icon}
                            {p.shield && <div style={{ position: "absolute", inset: -3, borderRadius: "50%", border: "2px solid #60a5fa", animation: "pulse 1s infinite" }} />}
                        </div>
                        <div>
                            <div style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>P{i + 1} {c.name}</div>
                            <div style={{ width: 80, height: 6, background: "#333", borderRadius: 3, overflow: "hidden" }}>
                                <div style={{ width: `${p.hp}%`, height: "100%", background: p.hp > 50 ? "#4ade80" : p.hp > 25 ? "#fbbf24" : "#ef4444", borderRadius: 3, transition: "width 0.5s" }} />
                            </div>
                            <div style={{ color: "#aaa", fontSize: 9 }}>{p.hp} HP {p.shield ? "🛡️" : ""}</div>
                        </div>
                    </div>
                );
            })}
            <div style={{ textAlign: "center" }}>
                <div style={{ color: suddenDeath ? "#ff4444" : "#ffd166", fontSize: 12, fontWeight: 700, minWidth: 120 }}>{message}</div>
                {suddenDeath && <div style={{ color: "#ff6b6b", fontSize: 9, fontWeight: 700, animation: "twinkle 1s infinite" }}>⚠ SUDDEN DEATH ⚠</div>}
            </div>
        </div>
    );
}

export function HUDBottom({
    currentPlayerIdx,
    players,
    angle,
    setAngle,
    power,
    setPower,
    fire,
    gameState,
    setGameState,
    projectile,
    turnTransition
}) {
    const cp = players[currentPlayerIdx];
    const ch = cp ? CHARACTERS[cp.char] : CHARACTERS[0];
    const disabled = !!projectile || turnTransition || gameState === "gameover";

    return (
        <div style={{ background: "linear-gradient(90deg, #1a1a2e, #16213e, #1a1a2e)", padding: "10px 20px", borderRadius: "0 0 12px 12px", border: "1px solid #2a2a4a", borderTop: "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* Angle with mini gauge */}
            <div style={{ flex: 1 }}>
                <div style={{ color: "#888", fontSize: 9, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>ANGLE</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button onClick={() => setAngle(a => Math.max(0, a - 2))} disabled={disabled}
                        style={{ background: "#333", border: "none", color: "#fff", width: 28, height: 28, borderRadius: 6, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>−</button>
                    <div style={{ color: "#fff", fontSize: 20, fontWeight: 800, minWidth: 42, textAlign: "center" }}>{angle}°</div>
                    <button onClick={() => setAngle(a => Math.min(90, a + 2))} disabled={disabled}
                        style={{ background: "#333", border: "none", color: "#fff", width: 28, height: 28, borderRadius: 6, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>+</button>
                    {/* Mini angle gauge */}
                    <svg width="32" height="20" viewBox="0 0 32 20" style={{ marginLeft: 4 }}>
                        <path d="M 2 18 A 16 16 0 0 1 30 18" fill="none" stroke="#333" strokeWidth="2" />
                        <line x1="16" y1="18" x2={16 + Math.cos((180 - angle) * Math.PI / 180) * 14} y2={18 + Math.sin((180 - angle) * Math.PI / 180) * -14} stroke={ch.accent} strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </div>
                {cp && <div style={{ color: "#555", fontSize: 8, marginTop: 2 }}>LAST: {cp.lastAngle}° / {cp.lastPower}%</div>}
            </div>

            {/* Power */}
            <div style={{ flex: 1.5 }}>
                <div style={{ color: "#888", fontSize: 9, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>POWER</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="range" min={5} max={MAX_POWER} value={power} onChange={e => setPower(Number(e.target.value))} disabled={disabled} style={{ flex: 1, accentColor: ch.color, height: 6 }} />
                    <div style={{ color: ch.accent, fontSize: 18, fontWeight: 800, minWidth: 40, textAlign: "center" }}>{power}%</div>
                </div>
            </div>

            {/* Fuel */}
            {cp && (
                <div style={{ flex: 0.8, marginLeft: 10 }}>
                    <div style={{ color: "#888", fontSize: 9, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>FUEL (A/D)</div>
                    <div style={{ width: "100%", height: 8, background: "#333", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ width: `${(cp.fuel / FUEL_MAX) * 100}%`, height: "100%", background: cp.fuel > FUEL_MAX * 0.3 ? "#f59e0b" : "#ef4444", borderRadius: 4, transition: "width 0.15s" }} />
                    </div>
                    <div style={{ color: "#666", fontSize: 8, marginTop: 2 }}>{cp.fuel}/{FUEL_MAX}</div>
                </div>
            )}

            {/* Fire */}
            <button onClick={fire} disabled={disabled}
                style={{ background: disabled ? "#555" : `linear-gradient(135deg, ${ch.color}, ${ch.accent})`, border: "none", borderRadius: 30, padding: "10px 30px", color: "#fff", fontSize: 14, fontWeight: 800, letterSpacing: 2, cursor: disabled ? "not-allowed" : "pointer", boxShadow: disabled ? "none" : `0 0 20px ${ch.color}44`, marginLeft: 10 }}>
                🎯 FIRE
            </button>

            {gameState === "gameover" && (
                <button onClick={() => setGameState("menu")}
                    style={{ background: "linear-gradient(135deg, #e63946, #ff6b35)", border: "none", borderRadius: 30, padding: "10px 24px", color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: 1, cursor: "pointer", marginLeft: 10 }}>
                    MENU
                </button>
            )}
        </div>
    );
}
