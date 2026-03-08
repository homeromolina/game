import { useState, useEffect, useRef, useCallback } from "react";
import { CANVAS_W, CANVAS_H, MAX_POWER, FUEL_MAX, CHARACTERS } from "../core/Constants";
import { generateTerrain, destroyTerrain, generateItems } from "../core/TerrainEngine";
import { calculateProjectileStep, applyExplosionDamage } from "../core/PhysicsEngine";
import Menu from "./Menu";
import { HUDTop, HUDBottom } from "./HUD";

export default function GunboundAllStars() {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState("menu");
  const [terrain, setTerrain] = useState(null);
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [angle, setAngle] = useState(45);
  const [power, setPower] = useState(50);
  const [wind, setWind] = useState(0);
  const [projectile, setProjectile] = useState(null);
  const [explosions, setExplosions] = useState([]);
  const [message, setMessage] = useState("");
  const [selectedChars, setSelectedChars] = useState([0, 1]);
  const [winner, setWinner] = useState(null);
  const [particles, setParticles] = useState([]);
  const [trail, setTrail] = useState([]);
  const [turnTransition, setTurnTransition] = useState(false);
  const [clouds, setClouds] = useState([]);
  const [stars, setStars] = useState([]);
  const [turnCount, setTurnCount] = useState(1);
  const [suddenDeath, setSuddenDeath] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [items, setItems] = useState([]);
  const [screenShake, setScreenShake] = useState({ x: 0, y: 0, intensity: 0 });
  const [cameraZoom, setCameraZoom] = useState({ active: false, cx: 0, cy: 0, scale: 1, frames: 0 });
  const [confetti, setConfetti] = useState([]);
  const [lastTrails, setLastTrails] = useState([[], []]);
  const [recoil, setRecoil] = useState({ player: -1, frame: 0 });

  const animRef = useRef(null);
  const projectileRef = useRef(null);
  const trailRef = useRef([]);

  useEffect(() => {
    const c = [];
    for (let i = 0; i < 8; i++) c.push({ x: Math.random() * CANVAS_W, y: 20 + Math.random() * 80, w: 60 + Math.random() * 80, speed: 0.1 + Math.random() * 0.3, opacity: 0.15 + Math.random() * 0.2 });
    setClouds(c);
    const s = [];
    for (let i = 0; i < 40; i++) s.push({ x: Math.random() * CANVAS_W, y: Math.random() * 150, size: 0.5 + Math.random() * 1.5, twinkle: Math.random() * Math.PI * 2 });
    setStars(s);
  }, []);

  const addFloatingText = (x, y, text, color, size = 16) => {
    setFloatingTexts(prev => [...prev, { x, y, text, color, size, life: 60, id: Math.random() }]);
  };

  const startGame = useCallback(() => {
    const t = generateTerrain();
    setTerrain(t);
    const p1x = 80 + Math.floor(Math.random() * 120);
    const p2x = CANVAS_W - 80 - Math.floor(Math.random() * 120);
    setPlayers([
      { x: p1x, y: t[p1x] - 15, hp: 100, maxHp: 100, char: selectedChars[0], facing: 1, lastAngle: 45, lastPower: 50, fuel: FUEL_MAX, shield: false, prevY: t[p1x] - 15 },
      { x: p2x, y: t[p2x] - 15, hp: 100, maxHp: 100, char: selectedChars[1], facing: -1, lastAngle: 45, lastPower: 50, fuel: FUEL_MAX, shield: false, prevY: t[p2x] - 15 },
    ]);
    setCurrentPlayer(0);
    setAngle(45);
    setPower(50);
    setWind((Math.random() - 0.5) * 4);
    setProjectile(null);
    setExplosions([]);
    setParticles([]);
    setTrail([]);
    setWinner(null);
    setTurnCount(1);
    setSuddenDeath(false);
    setFloatingTexts([]);
    setItems(generateItems(t));
    setScreenShake({ x: 0, y: 0, intensity: 0 });
    setCameraZoom({ active: false, cx: 0, cy: 0, scale: 1, frames: 0 });
    setConfetti([]);
    setLastTrails([[], []]);
    setRecoil({ player: -1, frame: 0 });
    setMessage("PLAYER 1 — FIRE!");
    setGameState("playing");
  }, [selectedChars]);

  const fire = useCallback(() => {
    if (projectile || turnTransition) return;
    const p = players[currentPlayer];
    const dir = currentPlayer === 0 ? 1 : -1;
    const rad = (angle * Math.PI) / 180;
    const speed = power * 0.13;
    setPlayers(prev => prev.map((pl, i) => i === currentPlayer ? { ...pl, lastAngle: angle, lastPower: power } : pl));
    setProjectile({ x: p.x, y: p.y - 10, vx: Math.cos(rad) * speed * dir, vy: -Math.sin(rad) * speed });
    setTrail([]);
    trailRef.current = [];
    setRecoil({ player: currentPlayer, frame: 8 });
  }, [projectile, players, currentPlayer, angle, power, turnTransition]);

  useEffect(() => {
    if (!projectile || !terrain) return;
    projectileRef.current = projectile;

    let px = projectile.x, py = projectile.y, vx = projectile.vx, vy = projectile.vy;
    let trailPoints = [...trailRef.current];
    let alive = true;

    const step = () => {
      if (!alive) return;

      const nextStep = calculateProjectileStep(px, py, vx, vy, wind, terrain, players, CANVAS_W, CANVAS_H);
      px = nextStep.px;
      py = nextStep.py;
      vx = nextStep.vx;
      vy = nextStep.vy;

      trailPoints.push({ x: px, y: py, age: 0 });
      if (trailPoints.length > 120) trailPoints.shift();
      trailRef.current = trailPoints;
      setTrail([...trailPoints]);

      if (nextStep.outOfBounds) {
        alive = false;
        setLastTrails(prev => { const n = [...prev]; n[currentPlayer] = [...trailPoints]; return n; });
        setProjectile(null);
        setMessage("MISS!");
        addFloatingText(CANVAS_W / 2, CANVAS_H / 2, "MISS!", "#ff6b6b", 28);
        setTimeout(() => nextTurn(), 800);
        return;
      }

      if (nextStep.hitGround) {
        alive = false;
        setLastTrails(prev => { const n = [...prev]; n[currentPlayer] = [...trailPoints]; return n; });
        handleHit(px, py);
        return;
      }

      setProjectile({ x: px, y: py, vx, vy });
      animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    return () => { alive = false; cancelAnimationFrame(animRef.current); };
  }, [projectile ? 1 : 0]);

  const handleHit = (hx, hy) => {
    const charData = CHARACTERS[players[currentPlayer].char];
    const radius = charData.explosionRadius;

    setExplosions(prev => [...prev, { x: hx, y: hy, radius, frame: 0, maxFrames: 40 }]);
    setScreenShake({ x: 0, y: 0, intensity: 12 });
    setCameraZoom({ active: true, cx: hx, cy: hy, scale: 1.3, frames: 0 });

    const newParts = [];
    for (let i = 0; i < 50; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 1 + Math.random() * 6;
      const isDirt = Math.random() > 0.35;
      newParts.push({ x: hx, y: hy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3, life: 30 + Math.random() * 30, color: isDirt ? (Math.random() > 0.5 ? "#5a4a2a" : "#3b5e2f") : (Math.random() > 0.5 ? "#ff6b35" : "#ffd166") });
    }
    setParticles(prev => [...prev, ...newParts]);
    setTerrain(prev => destroyTerrain(prev, hx, hy, radius));

    // Destroy items in explosion radius
    setItems(prev => prev.filter(it => Math.sqrt((hx - it.x) ** 2 + (hy - it.y) ** 2) > radius));

    // Calculate Damage Using Physics Engine
    const { updatedPlayers, newFloatingTexts } = applyExplosionDamage(hx, hy, radius, players, charData, suddenDeath);

    newFloatingTexts.forEach(ft => {
      setFloatingTexts(prev => [...prev, { ...ft, life: 60, id: Math.random() }]);
    });
    setPlayers(updatedPlayers);
    setProjectile(null);

    // Hit quality text feedback
    const distToTarget = Math.sqrt((hx - players.find((_, i) => i !== currentPlayer).x) ** 2 + (hy - players.find((_, i) => i !== currentPlayer).y) ** 2);
    if (distToTarget < 15) {
      addFloatingText(hx, hy - 30, "PERFECT! 🎯", "#ffd166", 24);
      setMessage("PERFECT HIT! 🎯");
    } else if (distToTarget < radius * 0.5) {
      addFloatingText(hx, hy - 30, "EXCELLENT! 💥", "#ff6b35", 20);
      setMessage("EXCELLENT! 💥");
    } else if (distToTarget < radius + 15) {
      addFloatingText(hx, hy - 30, "NICE SHOT!", "#4ade80", 18);
      setMessage("NICE SHOT! 💣");
    } else {
      setMessage("BOOM! 💣");
    }

    const loser = updatedPlayers.findIndex(p => p.hp <= 0);
    if (loser >= 0) {
      const w = loser === 0 ? 1 : 0;
      setWinner(w);
      setMessage(`🏆 PLAYER ${w + 1} (${CHARACTERS[updatedPlayers[w].char].name}) WINS!`);
      setGameState("gameover");
      // Confetti
      const conf = [];
      for (let i = 0; i < 100; i++) {
        conf.push({ x: CANVAS_W / 2, y: CANVAS_H / 2, vx: (Math.random() - 0.5) * 12, vy: -Math.random() * 10 - 2, color: ["#ff6b6b", "#ffd166", "#4ade80", "#60a5fa", "#c084fc", "#fb923c"][Math.floor(Math.random() * 6)], life: 120 + Math.random() * 60, rot: Math.random() * 360, rotSpeed: (Math.random() - 0.5) * 10, size: 3 + Math.random() * 5 });
      }
      setConfetti(conf);
    } else {
      setTimeout(() => nextTurn(), 1200);
    }
  };

  const nextTurn = () => {
    setTurnTransition(true);
    const nextP = 1 - currentPlayer;
    const newTurn = turnCount + 1;
    setTurnCount(newTurn);
    if (newTurn > 20 && !suddenDeath) {
      setSuddenDeath(true);
      addFloatingText(CANVAS_W / 2, CANVAS_H / 3, "⚠ SUDDEN DEATH ⚠", "#ff4444", 30);
    }
    const windChange = newTurn % 3 === 0 ? (Math.random() - 0.5) * 4 : (Math.random() - 0.5) * 1.5;
    setWind(prev => Math.max(-6, Math.min(6, prev + windChange)));

    setTimeout(() => {
      setCurrentPlayer(nextP);
      setPlayers(prev => {
        const p = prev[nextP];
        setAngle(p.lastAngle);
        setPower(p.lastPower);
        return prev.map((pl, i) => i === nextP ? { ...pl, fuel: FUEL_MAX, prevY: pl.y } : pl);
      });
      setTrail([]);
      setTurnTransition(false);
      setMessage(`PLAYER ${nextP + 1} — FIRE!`);
      if (newTurn % 4 === 0 && terrain) {
        setItems(prev => prev.length < 3 ? [...prev, ...generateItems(terrain)] : prev);
      }
    }, 600);
  };

  // Gravity settle + fall damage
  useEffect(() => {
    if (!terrain || !players.length) return;
    setPlayers(prev => prev.map(p => {
      const tx = Math.floor(Math.max(0, Math.min(CANVAS_W - 1, p.x)));
      const newY = terrain[tx] - 15;
      const fallDist = newY - p.prevY;
      let hp = p.hp;
      if (fallDist > 30 && gameState === "playing") {
        const fallDmg = Math.round(fallDist / 5);
        hp = Math.max(0, p.hp - fallDmg);
        if (fallDmg > 0) addFloatingText(p.x, p.y - 50, `FALL -${fallDmg}`, "#f87171", 14);
      }
      return { ...p, y: newY, prevY: newY, hp };
    }));
  }, [terrain]);

  const moveTank = useCallback((dir) => {
    if (projectile || turnTransition || gameState !== "playing") return;
    setPlayers(prev => prev.map((p, i) => {
      if (i !== currentPlayer) return p;
      if (p.fuel <= 0) return p;
      const newX = Math.max(20, Math.min(CANVAS_W - 20, p.x + dir * 3));
      const tx = Math.floor(newX);
      const newY = terrain ? terrain[tx] - 15 : p.y;

      setItems(prevItems => {
        const collected = prevItems.filter(it => Math.abs(it.x - newX) < 20);
        const remaining = prevItems.filter(it => Math.abs(it.x - newX) >= 20);
        collected.forEach(it => {
          if (it.type === "hp") {
            setPlayers(pp => pp.map((pl, j) => j === currentPlayer ? { ...pl, hp: Math.min(pl.maxHp, pl.hp + 20) } : pl));
            addFloatingText(newX, newY - 40, "+20 HP", "#4ade80", 16);
          } else if (it.type === "power") {
            setPower(MAX_POWER);
            addFloatingText(newX, newY - 40, "MAX POWER!", "#ffd166", 16);
          } else if (it.type === "shield") {
            setPlayers(pp => pp.map((pl, j) => j === currentPlayer ? { ...pl, shield: true } : pl));
            addFloatingText(newX, newY - 40, "SHIELD ON!", "#60a5fa", 16);
          }
        });
        return remaining;
      });
      return { ...p, x: newX, y: newY, fuel: p.fuel - 1, facing: dir === 1 ? 1 : -1 };
    }));
  }, [currentPlayer, projectile, turnTransition, gameState, terrain]);

  // Render loop
  useEffect(() => {
    if (gameState !== "playing" && gameState !== "gameover") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let running = true;
    let frame = 0;

    const render = () => {
      if (!running) return;
      frame++;
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      ctx.save();
      if (screenShake.intensity > 0) {
        const sx = (Math.random() - 0.5) * screenShake.intensity;
        const sy = (Math.random() - 0.5) * screenShake.intensity;
        ctx.translate(sx, sy);
        setScreenShake(prev => ({ ...prev, intensity: prev.intensity * 0.9 }));
      }

      if (cameraZoom.active && cameraZoom.frames < 30) {
        const progress = cameraZoom.frames / 30;
        const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        const s = 1 + (cameraZoom.scale - 1) * (1 - eased);
        ctx.translate(cameraZoom.cx * (1 - s), cameraZoom.cy * (1 - s));
        ctx.scale(s, s);
        setCameraZoom(prev => ({ ...prev, frames: prev.frames + 1 }));
      } else if (cameraZoom.active) {
        setCameraZoom({ active: false, cx: 0, cy: 0, scale: 1, frames: 0 });
      }

      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      skyGrad.addColorStop(0, "#0b1026"); skyGrad.addColorStop(0.3, "#1a1a40"); skyGrad.addColorStop(0.5, "#2d1b69");
      skyGrad.addColorStop(0.7, "#8b3a62"); skyGrad.addColorStop(0.85, "#d4654a"); skyGrad.addColorStop(1, "#f0a35e");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(-20, -20, CANVAS_W + 40, CANVAS_H + 40);

      stars.forEach(s => {
        ctx.globalAlpha = (Math.sin(frame * 0.05 + s.twinkle) * 0.5 + 0.5) * 0.8;
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;

      ctx.fillStyle = "#ffe8b8"; ctx.shadowColor = "#ffe8b8"; ctx.shadowBlur = 30;
      ctx.beginPath(); ctx.arc(780, 60, 28, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;

      clouds.forEach(c => {
        c.x += c.speed; if (c.x > CANVAS_W + 100) c.x = -c.w;
        ctx.globalAlpha = c.opacity; ctx.fillStyle = "#d4a574";
        ctx.beginPath(); ctx.ellipse(c.x, c.y, c.w / 2, 12, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(c.x - c.w * 0.2, c.y - 5, c.w * 0.3, 10, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(c.x + c.w * 0.2, c.y - 3, c.w * 0.25, 8, 0, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;

      if (terrain) {
        const tGrad = ctx.createLinearGradient(0, CANVAS_H * 0.4, 0, CANVAS_H);
        tGrad.addColorStop(0, "#5a8f4e"); tGrad.addColorStop(0.3, "#4a7c3f"); tGrad.addColorStop(0.7, "#3b5e2f"); tGrad.addColorStop(1, "#2d4a28");
        ctx.fillStyle = tGrad; ctx.beginPath(); ctx.moveTo(0, CANVAS_H);
        for (let x = 0; x < CANVAS_W; x++) ctx.lineTo(x, terrain[x]);
        ctx.lineTo(CANVAS_W, CANVAS_H); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#7ab562"; ctx.lineWidth = 2; ctx.beginPath();
        for (let x = 0; x < CANVAS_W; x++) { if (x === 0) ctx.moveTo(x, terrain[x]); else ctx.lineTo(x, terrain[x]); }
        ctx.stroke();
        ctx.strokeStyle = "#6aad50"; ctx.lineWidth = 1;
        for (let x = 10; x < CANVAS_W; x += 15) {
          const ty = terrain[x];
          for (let g = -3; g <= 3; g += 3) {
            ctx.beginPath(); ctx.moveTo(x + g, ty); ctx.lineTo(x + g + Math.sin(frame * 0.03 + x) * 2, ty - 4 - Math.random() * 3); ctx.stroke();
          }
        }
      }

      items.forEach(it => {
        const iy = it.y + Math.sin(frame * 0.06 + it.bobPhase) * 4;
        ctx.shadowColor = it.color; ctx.shadowBlur = 10; ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(it.x - 10, iy - 10, 20, 20);
        ctx.fillStyle = it.color + "44"; ctx.fillRect(it.x - 10, iy - 10, 20, 20);
        ctx.strokeStyle = it.color; ctx.lineWidth = 1.5; ctx.strokeRect(it.x - 10, iy - 10, 20, 20); ctx.shadowBlur = 0;
        ctx.font = "14px serif"; ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.fillText(it.icon, it.x, iy + 5);
      });

      const ghostTrail = lastTrails[currentPlayer];
      if (ghostTrail && ghostTrail.length > 1 && !projectile) {
        ctx.setLineDash([4, 6]); ctx.strokeStyle = CHARACTERS[players[currentPlayer]?.char || 0].accent + "55"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ghostTrail.forEach((t, i) => { if (i === 0) ctx.moveTo(t.x, t.y); else ctx.lineTo(t.x, t.y); });
        ctx.stroke(); ctx.setLineDash([]);
      }

      trail.forEach((t, i) => {
        ctx.globalAlpha = (i / trail.length) * 0.7;
        ctx.fillStyle = i > trail.length * 0.7 ? "#ff4400" : "#ffd166";
        ctx.beginPath(); ctx.arc(t.x + (Math.random() - 0.5) * 3, t.y + (Math.random() - 0.5) * 3, 2 + Math.random() * 2, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;

      players.forEach((p, idx) => {
        const ch = CHARACTERS[p.char];
        const isActive = idx === currentPlayer && gameState === "playing";
        let recoilOff = 0;
        if (recoil.player === idx && recoil.frame > 0) {
          recoilOff = Math.sin(recoil.frame * 0.8) * recoil.frame * 0.5 * -p.facing;
          setRecoil(prev => prev.player === idx ? { ...prev, frame: prev.frame - 0.3 } : prev);
        }
        const px = p.x + recoilOff;

        if (p.shield) {
          ctx.strokeStyle = "#60a5fa88"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, p.y - 2, 22, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = "#60a5fa11"; ctx.fill();
        }

        ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(px + 2, p.y + 14, 18, 5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#333"; ctx.fillRect(px - 16, p.y + 2, 32, 10);
        ctx.strokeStyle = "#555"; ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(px - 14 + i * 7, p.y + 2); ctx.lineTo(px - 14 + i * 7, p.y + 12); ctx.stroke(); }

        const bodyGrad = ctx.createLinearGradient(px - 12, p.y - 12, px + 12, p.y + 4);
        bodyGrad.addColorStop(0, ch.accent); bodyGrad.addColorStop(1, ch.color);
        ctx.fillStyle = bodyGrad; ctx.beginPath(); ctx.moveTo(px - 14, p.y + 4); ctx.lineTo(px - 10, p.y - 6); ctx.lineTo(px + 10, p.y - 6); ctx.lineTo(px + 14, p.y + 4); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 1; ctx.stroke();

        ctx.fillStyle = ch.color; ctx.beginPath(); ctx.arc(px, p.y - 6, 8, Math.PI, 0); ctx.fill();

        if (isActive) {
          const dir = p.facing; const rad = (angle * Math.PI) / 180;
          const bx = px + Math.cos(rad) * 22 * dir, by = p.y - 6 - Math.sin(rad) * 22;
          ctx.strokeStyle = "#222"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(px, p.y - 6); ctx.lineTo(bx, by); ctx.stroke();
          ctx.strokeStyle = ch.accent; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px, p.y - 6); ctx.lineTo(bx, by); ctx.stroke();
          ctx.fillStyle = ch.accent; ctx.shadowColor = ch.accent; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(bx, by, 3, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
        } else {
          const dir = p.facing;
          ctx.strokeStyle = "#222"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(px, p.y - 6); ctx.lineTo(px + 20 * dir, p.y - 16); ctx.stroke();
          ctx.strokeStyle = ch.color; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px, p.y - 6); ctx.lineTo(px + 20 * dir, p.y - 16); ctx.stroke();
        }

        if (isActive && !turnTransition) {
          const bounce = Math.sin(frame * 0.08) * 3;
          ctx.fillStyle = ch.accent; ctx.beginPath(); ctx.moveTo(px, p.y - 32 + bounce); ctx.lineTo(px - 5, p.y - 38 + bounce); ctx.lineTo(px + 5, p.y - 38 + bounce); ctx.closePath(); ctx.fill();
        }
      });

      if (projectile) {
        ctx.fillStyle = "#ff4444"; ctx.shadowColor = "#ff6600"; ctx.shadowBlur = 15; ctx.beginPath(); ctx.arc(projectile.x, projectile.y, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#ffff00"; ctx.beginPath(); ctx.arc(projectile.x, projectile.y, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      }

      setExplosions(prev => prev.map(e => ({ ...e, frame: e.frame + 1 })).filter(e => e.frame < e.maxFrames));
      explosions.forEach(e => {
        const progress = e.frame / e.maxFrames, r = e.radius * (0.5 + progress * 0.5), alpha = 1 - progress;
        ctx.globalAlpha = alpha * 0.4; ctx.fillStyle = "#ff4500"; ctx.beginPath(); ctx.arc(e.x, e.y, r * 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = alpha * 0.8; const exGrad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, r);
        exGrad.addColorStop(0, "#ffffff"); exGrad.addColorStop(0.3, "#ffdd44"); exGrad.addColorStop(0.6, "#ff6600"); exGrad.addColorStop(1, "rgba(255,0,0,0)");
        ctx.fillStyle = exGrad; ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      });

      setParticles(prev => prev.map(pt => ({ ...pt, x: pt.x + pt.vx, y: pt.y + pt.vy, vy: pt.vy + 0.1, life: pt.life - 1 })).filter(pt => pt.life > 0));
      particles.forEach(pt => { ctx.globalAlpha = pt.life / 50; ctx.fillStyle = pt.color; ctx.beginPath(); ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2); ctx.fill(); });
      ctx.globalAlpha = 1;

      setFloatingTexts(prev => prev.map(ft => ({ ...ft, y: ft.y - 0.8, life: ft.life - 1 })).filter(ft => ft.life > 0));
      floatingTexts.forEach(ft => {
        ctx.globalAlpha = Math.min(1, ft.life / 20); ctx.fillStyle = ft.color; ctx.font = `bold ${ft.size}px 'Segoe UI', sans-serif`; ctx.textAlign = "center";
        ctx.strokeStyle = "rgba(0,0,0,0.7)"; ctx.lineWidth = 3; ctx.strokeText(ft.text, ft.x, ft.y); ctx.fillText(ft.text, ft.x, ft.y);
      });
      ctx.globalAlpha = 1;

      if (confetti.length > 0) {
        setConfetti(prev => prev.map(c => ({ ...c, x: c.x + c.vx, y: c.y + c.vy, vy: c.vy + 0.08, rot: c.rot + c.rotSpeed, life: c.life - 1 })).filter(c => c.life > 0));
        confetti.forEach(c => {
          ctx.globalAlpha = Math.min(1, c.life / 30); ctx.fillStyle = c.color; ctx.save(); ctx.translate(c.x, c.y); ctx.rotate((c.rot * Math.PI) / 180);
          ctx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2); ctx.restore();
        });
        ctx.globalAlpha = 1;
      }

      if (suddenDeath) { ctx.globalAlpha = 0.08 + Math.sin(frame * 0.05) * 0.04; ctx.fillStyle = "#ff0000"; ctx.fillRect(-20, -20, CANVAS_W + 40, CANVAS_H + 40); ctx.globalAlpha = 1; }

      const windX = CANVAS_W / 2, windY = 20;
      ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(windX - 50, windY - 8, 100, 16); ctx.strokeStyle = "#fff"; ctx.lineWidth = 1; ctx.strokeRect(windX - 50, windY - 8, 100, 16);
      ctx.fillStyle = "#fff"; ctx.font = "bold 9px monospace"; ctx.textAlign = "center"; ctx.fillText("WIND", windX, windY - 12);
      const windLen = wind * 10; ctx.strokeStyle = wind > 0 ? "#60a5fa" : "#f87171"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(windX, windY); ctx.lineTo(windX + windLen, windY); ctx.stroke();
      if (Math.abs(wind) > 0.2) {
        const dir = wind > 0 ? 1 : -1; ctx.beginPath(); ctx.moveTo(windX + windLen, windY); ctx.lineTo(windX + windLen - 5 * dir, windY - 4); ctx.lineTo(windX + windLen - 5 * dir, windY + 4); ctx.closePath();
        ctx.fillStyle = wind > 0 ? "#60a5fa" : "#f87171"; ctx.fill();
      }

      ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(CANVAS_W - 80, 8, 70, 20); ctx.strokeStyle = suddenDeath ? "#ff4444" : "#555"; ctx.lineWidth = 1; ctx.strokeRect(CANVAS_W - 80, 8, 70, 20);
      ctx.fillStyle = suddenDeath ? "#ff6b6b" : "#ccc"; ctx.font = "bold 10px monospace"; ctx.textAlign = "center"; ctx.fillText(suddenDeath ? `SD T${turnCount}` : `TURN ${turnCount}`, CANVAS_W - 45, 22);

      ctx.restore();
      requestAnimationFrame(render);
    };
    render();
    return () => { running = false; };
  }, [gameState, terrain, players, currentPlayer, projectile, angle, trail, turnTransition, explosions, particles, stars, clouds, wind, floatingTexts, confetti, lastTrails, items, screenShake, cameraZoom, suddenDeath, turnCount, recoil]);

  useEffect(() => {
    if (gameState !== "playing") return;
    const handleKey = (e) => {
      if (projectile || turnTransition) return;
      switch (e.key) {
        case "ArrowUp": setAngle(a => Math.min(90, a + 2)); break;
        case "ArrowDown": setAngle(a => Math.max(0, a - 2)); break;
        case "ArrowLeft": setPower(p => Math.max(5, p - 2)); break;
        case "ArrowRight": setPower(p => Math.min(MAX_POWER, p + 2)); break;
        case "a": case "A": moveTank(-1); break;
        case "d": case "D": moveTank(1); break;
        case " ": case "Enter": e.preventDefault(); fire(); break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [gameState, fire, projectile, turnTransition, moveTank]);

  if (gameState === "menu") {
    return <Menu startGame={startGame} selectedChars={selectedChars} setSelectedChars={setSelectedChars} />;
  }

  return (
    <div style={{ width: CANVAS_W, margin: "0 auto", fontFamily: "'Segoe UI', sans-serif", userSelect: "none" }}>
      <HUDTop players={players} currentPlayer={currentPlayer} suddenDeath={suddenDeath} message={message} />

      <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} style={{ display: "block", border: "1px solid #2a2a4a", borderTop: "none", borderBottom: "none" }} />

      <HUDBottom
        currentPlayerIdx={currentPlayer} players={players}
        angle={angle} setAngle={setAngle}
        power={power} setPower={setPower}
        fire={fire} gameState={gameState} setGameState={setGameState}
        projectile={projectile} turnTransition={turnTransition}
      />
    </div>
  );
}
