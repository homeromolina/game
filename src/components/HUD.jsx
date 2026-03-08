import React from "react";
import { CHARACTERS, WEAPONS, MAX_POWER, FUEL_MAX } from "../core/Constants";

export function HUDTop({ players, currentPlayer, suddenDeath, message }) {
    return (
        <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: "linear-gradient(90deg, #1a1a2e, #16213e, #1a1a2e)",
            padding: "6px 16px", borderRadius: "12px 12px 0 0",
            border: "1px solid #2a2a4a", borderBottom: "none",
        }}>
            {players.map((p, i) => {
                const c = CHARACTERS[p.char];
                return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, opacity: currentPlayer === i ? 1 : 0.5 }}>
                        <div style={{
                            width: 30, height: 30, borderRadius: "50%", background: c.color,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 16, position: "relative",
                            border: currentPlayer === i ? `2px solid ${c.accent}` : "2px solid transparent",
                        }}>
                            {c.icon}
                            {p.shield && (
                                <div style={{ position: "absolute", inset: -3, borderRadius: "50%", border: "2px solid #60a5fa", animation: "pulse 1s infinite" }} />
                            )}
                        </div>
                        <div>
                            <div style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>P{i + 1} {c.name}</div>
                            <div style={{ width: 80, height: 6, background: "#333", borderRadius: 3, overflow: "hidden" }}>
                                <div style={{
                                    width: `${p.hp}%`, height: "100%", borderRadius: 3,
                                    background: p.hp > 50 ? "#4ade80" : p.hp > 25 ? "#fbbf24" : "#ef4444",
                                    transition: "width 0.5s",
                                }} />
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
    angle, setAngle,
    power, setPower,
    fire,
    gameState, setGameState,
    projectile,
    turnTransition,
    playerWeapons,
    cycleWeapon,
    selectWeapon,
    isBot,
}) {
    const cp       = players[currentPlayerIdx];
    const ch       = cp ? CHARACTERS[cp.char] : CHARACTERS[0];
    const disabled = !!projectile || turnTransition || gameState === "gameover" || isBot?.[currentPlayerIdx];
    const pw       = playerWeapons?.[currentPlayerIdx];
    const wd       = pw ? WEAPONS[pw.current] : WEAPONS[0];
    const ammo     = pw ? pw.ammo[pw.current] : Infinity;

    return (
        <div style={{
            background: "linear-gradient(90deg, #1a1a2e, #16213e, #1a1a2e)",
            borderRadius: "0 0 12px 12px", border: "1px solid #2a2a4a", borderTop: "none",
        }}>
            {/* Weapon selector row */}
            {pw && (
                <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "6px 20px 2px",
                    borderBottom: "1px solid #2a2a4a",
                }}>
                    <span style={{ color: "#666", fontSize: 9, fontWeight: 700, letterSpacing: 1, minWidth: 58 }}>WEAPON (Q/E)</span>
                    {WEAPONS.map((w, idx) => {
                        const isActive   = pw.current === idx;
                        const wAmmo      = pw.ammo[idx];
                        const outOfAmmo  = wAmmo === 0;
                        return (
                            <button
                                key={w.id}
                                onClick={() => !disabled && selectWeapon && selectWeapon(idx)}
                                title={`${w.name} – ${w.desc}`}
                                style={{
                                    background: isActive ? `${ch.color}cc` : outOfAmmo ? "#1a1a1a" : "rgba(255,255,255,0.06)",
                                    border: isActive ? `1.5px solid ${ch.accent}` : "1.5px solid #333",
                                    borderRadius: 6, padding: "3px 7px",
                                    cursor: disabled || outOfAmmo ? "not-allowed" : "pointer",
                                    opacity: outOfAmmo ? 0.35 : 1,
                                    minWidth: 54, textAlign: "center",
                                    transition: "background 0.15s",
                                }}
                            >
                                <div style={{ fontSize: 14 }}>{w.icon}</div>
                                <div style={{ color: isActive ? "#fff" : "#aaa", fontSize: 8, fontWeight: 700, letterSpacing: 0.5 }}>{w.name}</div>
                                <div style={{ color: isActive ? ch.accent : "#666", fontSize: 8 }}>
                                    {wAmmo === Infinity ? "∞" : wAmmo}
                                </div>
                            </button>
                        );
                    })}
                    {/* Active weapon info */}
                    <div style={{ marginLeft: "auto", textAlign: "right" }}>
                        <div style={{ color: ch.accent, fontSize: 10, fontWeight: 700 }}>{wd.icon} {wd.name}</div>
                        <div style={{ color: "#888", fontSize: 8 }}>{wd.desc}</div>
                        <div style={{ color: "#aaa", fontSize: 8 }}>
                            AMMO: <span style={{ color: ammo === 0 ? "#ef4444" : "#4ade80", fontWeight: 700 }}>
                                {ammo === Infinity ? "∞" : ammo}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Main controls row */}
            <div style={{ padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                {/* Angle */}
                <div style={{ flex: 1 }}>
                    <div style={{ color: "#888", fontSize: 9, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>ANGLE</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button onClick={() => setAngle(a => Math.max(0, a - 2))} disabled={disabled}
                            style={{ background: "#333", border: "none", color: "#fff", width: 28, height: 28, borderRadius: 6, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>−</button>
                        <div style={{ color: "#fff", fontSize: 20, fontWeight: 800, minWidth: 42, textAlign: "center" }}>{angle}°</div>
                        <button onClick={() => setAngle(a => Math.min(90, a + 2))} disabled={disabled}
                            style={{ background: "#333", border: "none", color: "#fff", width: 28, height: 28, borderRadius: 6, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>+</button>
                        <svg width="32" height="20" viewBox="0 0 32 20" style={{ marginLeft: 4 }}>
                            <path d="M 2 18 A 16 16 0 0 1 30 18" fill="none" stroke="#333" strokeWidth="2" />
                            <line
                                x1="16" y1="18"
                                x2={16 + Math.cos((180 - angle) * Math.PI / 180) * 14}
                                y2={18 + Math.sin((180 - angle) * Math.PI / 180) * -14}
                                stroke={ch.accent} strokeWidth="2" strokeLinecap="round"
                            />
                        </svg>
                    </div>
                    {cp && <div style={{ color: "#555", fontSize: 8, marginTop: 2 }}>LAST: {cp.lastAngle}° / {cp.lastPower}%</div>}
                </div>

                {/* Power */}
                <div style={{ flex: 1.5 }}>
                    <div style={{ color: "#888", fontSize: 9, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>POWER</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input type="range" min={5} max={MAX_POWER} value={power}
                            onChange={e => setPower(Number(e.target.value))}
                            disabled={disabled}
                            style={{ flex: 1, accentColor: ch.color, height: 6 }} />
                        <div style={{ color: ch.accent, fontSize: 18, fontWeight: 800, minWidth: 40, textAlign: "center" }}>{power}%</div>
                    </div>
                </div>

                {/* Fuel */}
                {cp && (
                    <div style={{ flex: 0.8, marginLeft: 10 }}>
                        <div style={{ color: "#888", fontSize: 9, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>FUEL (A/D)</div>
                        <div style={{ width: "100%", height: 8, background: "#333", borderRadius: 4, overflow: "hidden" }}>
                            <div style={{
                                width: `${(cp.fuel / FUEL_MAX) * 100}%`, height: "100%", borderRadius: 4,
                                background: cp.fuel > FUEL_MAX * 0.3 ? "#f59e0b" : "#ef4444",
                                transition: "width 0.15s",
                            }} />
                        </div>
                        <div style={{ color: "#666", fontSize: 8, marginTop: 2 }}>{cp.fuel}/{FUEL_MAX}</div>
                    </div>
                )}

                {/* Fire button */}
                <button onClick={fire} disabled={disabled || ammo === 0} title={ammo === 0 ? "No ammo!" : "Fire (Space)"}
                    style={{
                        background: (disabled || ammo === 0) ? "#555" : `linear-gradient(135deg, ${ch.color}, ${ch.accent})`,
                        border: "none", borderRadius: 30, padding: "10px 28px",
                        color: "#fff", fontSize: 14, fontWeight: 800, letterSpacing: 2,
                        cursor: (disabled || ammo === 0) ? "not-allowed" : "pointer",
                        boxShadow: (disabled || ammo === 0) ? "none" : `0 0 20px ${ch.color}44`,
                        marginLeft: 10, minWidth: 110,
                    }}>
                    {wd.icon} FIRE
                </button>

                {gameState === "gameover" && (
                    <button onClick={() => setGameState("menu")}
                        style={{ background: "linear-gradient(135deg, #e63946, #ff6b35)", border: "none", borderRadius: 30, padding: "10px 24px", color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: 1, cursor: "pointer", marginLeft: 10 }}>
                        MENU
                    </button>
                )}
            </div>
        </div>
    );
}
