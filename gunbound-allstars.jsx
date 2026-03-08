import { useState, useEffect, useRef, useCallback } from "react";

const CANVAS_W = 960;
const CANVAS_H = 540;
const GRAVITY = 0.08;
const MAX_POWER = 100;
const FUEL_MAX = 60;

const CHARACTERS = [
  { name: "TITAN", color: "#e63946", accent: "#ff6b6b", icon: "🔴", damage: 35, explosionRadius: 45, special: "Mega Blast", desc: "Heavy artillery tank" },
  { name: "PHANTOM", color: "#457b9d", accent: "#a8dadc", icon: "🔵", damage: 25, explosionRadius: 35, special: "Split Shot", desc: "Precision sniper" },
  { name: "NOVA", color: "#e9c46a", accent: "#f4a261", icon: "🟡", damage: 30, explosionRadius: 40, special: "Solar Flare", desc: "Balanced fighter" },
  { name: "VENOM", color: "#2a9d8f", accent: "#76c893", icon: "🟢", damage: 28, explosionRadius: 38, special: "Acid Rain", desc: "Tactical striker" },
];

const ITEM_TYPES = [
  { type: "hp", icon: "❤️", label: "+20 HP", color: "#ff6b6b" },
  { type: "power", icon: "⚡", label: "MAX PWR", color: "#ffd166" },
  { type: "shield", icon: "🛡️", label: "SHIELD", color: "#60a5fa" },
];

function generateTerrain(w, h) {
  const terrain = new Float32Array(w);
  const baseHeight = h * 0.55;
  const segments = 6 + Math.floor(Math.random() * 4);
  const points = [];
  for (let i = 0; i <= segments; i++) {
    points.push({ x: (i / segments) * w, y: baseHeight + (Math.random() - 0.5) * h * 0.3 });
  }
  for (let x = 0; x < w; x++) {
    let segIdx = 0;
    for (let i = 0; i < points.length - 1; i++) {
      if (x >= points[i].x && x <= points[i + 1].x) { segIdx = i; break; }
    }
    const p0 = points[Math.max(0, segIdx - 1)];
    const p1 = points[segIdx];
    const p2 = points[Math.min(points.length - 1, segIdx + 1)];
    const p3 = points[Math.min(points.length - 1, segIdx + 2)];
    const t = (x - p1.x) / (p2.x - p1.x || 1);
    const t2 = t * t, t3 = t2 * t;
    terrain[x] = 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
    terrain[x] += Math.sin(x * 0.02) * 15 + Math.sin(x * 0.05) * 8;
    terrain[x] = Math.max(h * 0.2, Math.min(h * 0.85, terrain[x]));
  }
  return terrain;
}

function destroyTerrain(terrain, cx, cy, radius) {
  const newTerrain = new Float32Array(terrain);
  for (let x = Math.max(0, Math.floor(cx - radius)); x < Math.min(terrain.length, Math.ceil(cx + radius)); x++) {
    const dx = x - cx;
    const halfChord = Math.sqrt(Math.max(0, radius * radius - dx * dx));
    const circleBottom = cy + halfChord;
    const circleTop = cy - halfChord;
    const surfaceY = newTerrain[x];
    if (surfaceY >= circleTop && surfaceY <= circleBottom) {
      newTerrain[x] = Math.min(540, circleBottom);
    } else if (circleBottom > surfaceY && surfaceY < circleTop) {
      newTerrain[x] = Math.min(540, circleBottom);
    }
  }
  return newTerrain;
}

function generateItems(terrain) {
  const items = [];
  const count = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < count; i++) {
    const x = 150 + Math.floor(Math.random() * (CANVAS_W - 300));
    const typeIdx = Math.floor(Math.random() * ITEM_TYPES.length);
    items.push({ x, y: terrain[x] - 12, ...ITEM_TYPES[typeIdx], id: Math.random(), bobPhase: Math.random() * Math.PI * 2 });
  }
  return items;
}

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
  // New state
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

  const startGame = useCallback(() => {
    const t = generateTerrain(CANVAS_W, CANVAS_H);
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

  const addFloatingText = (x, y, text, color, size = 16) => {
    setFloatingTexts(prev => [...prev, { x, y, text, color, size, life: 60, id: Math.random() }]);
  };

  const fire = useCallback(() => {
    if (projectile || turnTransition) return;
    const p = players[currentPlayer];
    const dir = currentPlayer === 0 ? 1 : -1;
    const rad = (angle * Math.PI) / 180;
    const speed = power * 0.13;
    // Save angle/power to player
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
      vx += wind * 0.002;
      vy += GRAVITY;
      px += vx;
      py += vy;
      trailPoints.push({ x: px, y: py, age: 0 });
      if (trailPoints.length > 120) trailPoints.shift();
      trailRef.current = trailPoints;
      setTrail([...trailPoints]);

      if (px < -50 || px > CANVAS_W + 50 || py > CANVAS_H + 50) {
        alive = false;
        setLastTrails(prev => { const n = [...prev]; n[currentPlayer] = [...trailPoints]; return n; });
        setProjectile(null);
        setMessage("MISS!");
        addFloatingText(CANVAS_W / 2, CANVAS_H / 2, "MISS!", "#ff6b6b", 28);
        setTimeout(() => nextTurn(), 800);
        return;
      }

      const tx = Math.floor(px);
      if (tx >= 0 && tx < CANVAS_W && py >= terrain[tx]) {
        alive = false;
        setLastTrails(prev => { const n = [...prev]; n[currentPlayer] = [...trailPoints]; return n; });
        handleHit(px, py);
        return;
      }

      for (let i = 0; i < players.length; i++) {
        if (i === currentPlayer) continue;
        const dist = Math.sqrt((px - players[i].x) ** 2 + (py - players[i].y) ** 2);
        if (dist < 20) {
          alive = false;
          setLastTrails(prev => { const n = [...prev]; n[currentPlayer] = [...trailPoints]; return n; });
          handleHit(px, py);
          return;
        }
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
    const dmgMultiplier = suddenDeath ? 2 : 1;

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

    // Destroy items in radius
    setItems(prev => prev.filter(it => Math.sqrt((hx - it.x) ** 2 + (hy - it.y) ** 2) > radius));

    const updatedPlayers = players.map((p, i) => {
      const dist = Math.sqrt((hx - p.x) ** 2 + (hy - p.y) ** 2);
      if (dist < radius + 15) {
        let dmg = Math.round(charData.damage * (1 - dist / (radius + 15)) * dmgMultiplier);
        if (p.shield) { dmg = Math.round(dmg * 0.5); }
        const newHp = Math.max(0, p.hp - dmg);
        if (dmg > 0) addFloatingText(p.x, p.y - 40, `-${dmg} HP`, "#ff4444", 18);
        return { ...p, hp: newHp, shield: false };
      }
      return p;
    });

    setPlayers(updatedPlayers);
    setProjectile(null);

    // Hit quality feedback
    const target = updatedPlayers.find((_, i) => i !== currentPlayer);
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
    // Wind changes more drastically every 3 turns
    const windChange = newTurn % 3 === 0 ? (Math.random() - 0.5) * 4 : (Math.random() - 0.5) * 1.5;
    setWind(prev => Math.max(-6, Math.min(6, prev + windChange)));

    setTimeout(() => {
      setCurrentPlayer(nextP);
      // Restore angle/power from player's last shot
      setPlayers(prev => {
        const p = prev[nextP];
        setAngle(p.lastAngle);
        setPower(p.lastPower);
        return prev.map((pl, i) => i === nextP ? { ...pl, fuel: FUEL_MAX, prevY: pl.y } : pl);
      });
      setTrail([]);
      setTurnTransition(false);
      setMessage(`PLAYER ${nextP + 1} — FIRE!`);
      // Occasionally spawn new items
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

  // Move tank
  const moveTank = useCallback((dir) => {
    if (projectile || turnTransition || gameState !== "playing") return;
    setPlayers(prev => prev.map((p, i) => {
      if (i !== currentPlayer) return p;
      if (p.fuel <= 0) return p;
      const newX = Math.max(20, Math.min(CANVAS_W - 20, p.x + dir * 3));
      const tx = Math.floor(newX);
      const newY = terrain ? terrain[tx] - 15 : p.y;
      // Check item collection
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

      // Screen shake
      ctx.save();
      if (screenShake.intensity > 0) {
        const sx = (Math.random() - 0.5) * screenShake.intensity;
        const sy = (Math.random() - 0.5) * screenShake.intensity;
        ctx.translate(sx, sy);
        setScreenShake(prev => ({ ...prev, intensity: prev.intensity * 0.9 }));
      }

      // Camera zoom
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

      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      skyGrad.addColorStop(0, "#0b1026");
      skyGrad.addColorStop(0.3, "#1a1a40");
      skyGrad.addColorStop(0.5, "#2d1b69");
      skyGrad.addColorStop(0.7, "#8b3a62");
      skyGrad.addColorStop(0.85, "#d4654a");
      skyGrad.addColorStop(1, "#f0a35e");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(-20, -20, CANVAS_W + 40, CANVAS_H + 40);

      // Stars
      stars.forEach(s => {
        const twinkle = Math.sin(frame * 0.05 + s.twinkle) * 0.5 + 0.5;
        ctx.globalAlpha = twinkle * 0.8;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Moon
      ctx.fillStyle = "#ffe8b8";
      ctx.shadowColor = "#ffe8b8";
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.arc(780, 60, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Clouds
      clouds.forEach(c => {
        c.x += c.speed;
        if (c.x > CANVAS_W + 100) c.x = -c.w;
        ctx.globalAlpha = c.opacity;
        ctx.fillStyle = "#d4a574";
        ctx.beginPath();
        ctx.ellipse(c.x, c.y, c.w / 2, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(c.x - c.w * 0.2, c.y - 5, c.w * 0.3, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(c.x + c.w * 0.2, c.y - 3, c.w * 0.25, 8, 0, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Terrain
      if (terrain) {
        const tGrad = ctx.createLinearGradient(0, CANVAS_H * 0.4, 0, CANVAS_H);
        tGrad.addColorStop(0, "#5a8f4e");
        tGrad.addColorStop(0.3, "#4a7c3f");
        tGrad.addColorStop(0.7, "#3b5e2f");
        tGrad.addColorStop(1, "#2d4a28");
        ctx.fillStyle = tGrad;
        ctx.beginPath();
        ctx.moveTo(0, CANVAS_H);
        for (let x = 0; x < CANVAS_W; x++) ctx.lineTo(x, terrain[x]);
        ctx.lineTo(CANVAS_W, CANVAS_H);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#7ab562";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x < CANVAS_W; x++) { if (x === 0) ctx.moveTo(x, terrain[x]); else ctx.lineTo(x, terrain[x]); }
        ctx.stroke();
        ctx.strokeStyle = "#6aad50";
        ctx.lineWidth = 1;
        for (let x = 10; x < CANVAS_W; x += 15) {
          const ty = terrain[x];
          for (let g = -3; g <= 3; g += 3) {
            ctx.beginPath();
            ctx.moveTo(x + g, ty);
            ctx.lineTo(x + g + Math.sin(frame * 0.03 + x) * 2, ty - 4 - Math.random() * 3);
            ctx.stroke();
          }
        }
      }

      // Items (power-ups)
      items.forEach(it => {
        const bob = Math.sin(frame * 0.06 + it.bobPhase) * 4;
        const iy = it.y + bob;
        // Glow
        ctx.shadowColor = it.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.fillRect(it.x - 10, iy - 10, 20, 20);
        ctx.fillStyle = it.color + "44";
        ctx.fillRect(it.x - 10, iy - 10, 20, 20);
        ctx.strokeStyle = it.color;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(it.x - 10, iy - 10, 20, 20);
        ctx.shadowBlur = 0;
        ctx.font = "14px serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#fff";
        ctx.fillText(it.icon, it.x, iy + 5);
      });

      // Ghost trail (last shot)
      const ghostTrail = lastTrails[currentPlayer];
      if (ghostTrail && ghostTrail.length > 1 && !projectile) {
        ctx.setLineDash([4, 6]);
        ctx.strokeStyle = CHARACTERS[players[currentPlayer]?.char || 0].accent + "55";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ghostTrail.forEach((t, i) => { if (i === 0) ctx.moveTo(t.x, t.y); else ctx.lineTo(t.x, t.y); });
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Current trail
      trail.forEach((t, i) => {
        const alpha = (i / trail.length) * 0.7;
        ctx.globalAlpha = alpha;
        // Fire trail effect
        const r = 2 + Math.random() * 2;
        ctx.fillStyle = i > trail.length * 0.7 ? "#ff4400" : "#ffd166";
        ctx.beginPath();
        ctx.arc(t.x + (Math.random() - 0.5) * 3, t.y + (Math.random() - 0.5) * 3, r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Players (tanks)
      players.forEach((p, idx) => {
        const ch = CHARACTERS[p.char];
        const isActive = idx === currentPlayer && gameState === "playing";
        // Recoil offset
        let recoilOff = 0;
        if (recoil.player === idx && recoil.frame > 0) {
          recoilOff = Math.sin(recoil.frame * 0.8) * recoil.frame * 0.5 * -p.facing;
          setRecoil(prev => prev.player === idx ? { ...prev, frame: prev.frame - 0.3 } : prev);
        }
        const px = p.x + recoilOff;

        // Shield visual
        if (p.shield) {
          ctx.strokeStyle = "#60a5fa88";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(px, p.y - 2, 22, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = "#60a5fa11";
          ctx.fill();
        }

        // Tank shadow
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath();
        ctx.ellipse(px + 2, p.y + 14, 18, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Treads
        ctx.fillStyle = "#333";
        ctx.fillRect(px - 16, p.y + 2, 32, 10);
        ctx.strokeStyle = "#555";
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(px - 14 + i * 7, p.y + 2); ctx.lineTo(px - 14 + i * 7, p.y + 12); ctx.stroke(); }
        // Body
        const bodyGrad = ctx.createLinearGradient(px - 12, p.y - 12, px + 12, p.y + 4);
        bodyGrad.addColorStop(0, ch.accent);
        bodyGrad.addColorStop(1, ch.color);
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.moveTo(px - 14, p.y + 4);
        ctx.lineTo(px - 10, p.y - 6);
        ctx.lineTo(px + 10, p.y - 6);
        ctx.lineTo(px + 14, p.y + 4);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();
        // Turret
        ctx.fillStyle = ch.color;
        ctx.beginPath();
        ctx.arc(px, p.y - 6, 8, Math.PI, 0);
        ctx.fill();
        // Cannon
        if (isActive) {
          const dir = p.facing;
          const rad = (angle * Math.PI) / 180;
          const bx = px + Math.cos(rad) * 22 * dir;
          const by = p.y - 6 - Math.sin(rad) * 22;
          ctx.strokeStyle = "#222";
          ctx.lineWidth = 5;
          ctx.beginPath(); ctx.moveTo(px, p.y - 6); ctx.lineTo(bx, by); ctx.stroke();
          ctx.strokeStyle = ch.accent;
          ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(px, p.y - 6); ctx.lineTo(bx, by); ctx.stroke();
          ctx.fillStyle = ch.accent;
          ctx.shadowColor = ch.accent;
          ctx.shadowBlur = 8;
          ctx.beginPath(); ctx.arc(bx, by, 3, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          const dir = p.facing;
          ctx.strokeStyle = "#222";
          ctx.lineWidth = 5;
          ctx.beginPath(); ctx.moveTo(px, p.y - 6); ctx.lineTo(px + 20 * dir, p.y - 16); ctx.stroke();
          ctx.strokeStyle = ch.color;
          ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(px, p.y - 6); ctx.lineTo(px + 20 * dir, p.y - 16); ctx.stroke();
        }
        // Active indicator
        if (isActive && !turnTransition) {
          const bounce = Math.sin(frame * 0.08) * 3;
          ctx.fillStyle = ch.accent;
          ctx.beginPath();
          ctx.moveTo(px, p.y - 32 + bounce);
          ctx.lineTo(px - 5, p.y - 38 + bounce);
          ctx.lineTo(px + 5, p.y - 38 + bounce);
          ctx.closePath();
          ctx.fill();
        }
        // HP bar
        const hpW = 36;
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(px - hpW / 2 - 1, p.y - 26, hpW + 2, 6);
        const hpRatio = p.hp / p.maxHp;
        const hpColor = hpRatio > 0.5 ? "#4ade80" : hpRatio > 0.25 ? "#fbbf24" : "#ef4444";
        ctx.fillStyle = hpColor;
        ctx.fillRect(px - hpW / 2, p.y - 25, hpW * hpRatio, 4);
        // Label
        ctx.fillStyle = "#fff";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`P${idx + 1}`, px, p.y - 30);
      });

      // Projectile
      if (projectile) {
        ctx.fillStyle = "#ff4444";
        ctx.shadowColor = "#ff6600";
        ctx.shadowBlur = 15;
        ctx.beginPath(); ctx.arc(projectile.x, projectile.y, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#ffff00";
        ctx.beginPath(); ctx.arc(projectile.x, projectile.y, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Explosions
      setExplosions(prev => prev.map(e => ({ ...e, frame: e.frame + 1 })).filter(e => e.frame < e.maxFrames));
      explosions.forEach(e => {
        const progress = e.frame / e.maxFrames;
        const r = e.radius * (0.5 + progress * 0.5);
        const alpha = 1 - progress;
        ctx.globalAlpha = alpha * 0.4;
        ctx.fillStyle = "#ff4500";
        ctx.beginPath(); ctx.arc(e.x, e.y, r * 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = alpha * 0.8;
        const exGrad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, r);
        exGrad.addColorStop(0, "#ffffff");
        exGrad.addColorStop(0.3, "#ffdd44");
        exGrad.addColorStop(0.6, "#ff6600");
        exGrad.addColorStop(1, "rgba(255,0,0,0)");
        ctx.fillStyle = exGrad;
        ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Particles
      setParticles(prev => prev.map(pt => ({ ...pt, x: pt.x + pt.vx, y: pt.y + pt.vy, vy: pt.vy + 0.1, life: pt.life - 1 })).filter(pt => pt.life > 0));
      particles.forEach(pt => {
        ctx.globalAlpha = pt.life / 50;
        ctx.fillStyle = pt.color;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Floating texts
      setFloatingTexts(prev => prev.map(ft => ({ ...ft, y: ft.y - 0.8, life: ft.life - 1 })).filter(ft => ft.life > 0));
      floatingTexts.forEach(ft => {
        ctx.globalAlpha = Math.min(1, ft.life / 20);
        ctx.fillStyle = ft.color;
        ctx.font = `bold ${ft.size}px 'Segoe UI', sans-serif`;
        ctx.textAlign = "center";
        ctx.strokeStyle = "rgba(0,0,0,0.7)";
        ctx.lineWidth = 3;
        ctx.strokeText(ft.text, ft.x, ft.y);
        ctx.fillText(ft.text, ft.x, ft.y);
      });
      ctx.globalAlpha = 1;

      // Confetti (gameover)
      if (confetti.length > 0) {
        setConfetti(prev => prev.map(c => ({ ...c, x: c.x + c.vx, y: c.y + c.vy, vy: c.vy + 0.08, rot: c.rot + c.rotSpeed, life: c.life - 1 })).filter(c => c.life > 0));
        confetti.forEach(c => {
          ctx.globalAlpha = Math.min(1, c.life / 30);
          ctx.fillStyle = c.color;
          ctx.save();
          ctx.translate(c.x, c.y);
          ctx.rotate((c.rot * Math.PI) / 180);
          ctx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2);
          ctx.restore();
        });
        ctx.globalAlpha = 1;
      }

      // Sudden death overlay
      if (suddenDeath) {
        ctx.globalAlpha = 0.08 + Math.sin(frame * 0.05) * 0.04;
        ctx.fillStyle = "#ff0000";
        ctx.fillRect(-20, -20, CANVAS_W + 40, CANVAS_H + 40);
        ctx.globalAlpha = 1;
      }

      // Wind indicator
      const windX = CANVAS_W / 2, windY = 20;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(windX - 50, windY - 8, 100, 16);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1;
      ctx.strokeRect(windX - 50, windY - 8, 100, 16);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText("WIND", windX, windY - 12);
      const windLen = wind * 10;
      ctx.strokeStyle = wind > 0 ? "#60a5fa" : "#f87171";
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(windX, windY); ctx.lineTo(windX + windLen, windY); ctx.stroke();
      if (Math.abs(wind) > 0.2) {
        const dir = wind > 0 ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(windX + windLen, windY);
        ctx.lineTo(windX + windLen - 5 * dir, windY - 4);
        ctx.lineTo(windX + windLen - 5 * dir, windY + 4);
        ctx.closePath();
        ctx.fillStyle = wind > 0 ? "#60a5fa" : "#f87171";
        ctx.fill();
      }

      // Turn counter on canvas
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(CANVAS_W - 80, 8, 70, 20);
      ctx.strokeStyle = suddenDeath ? "#ff4444" : "#555";
      ctx.lineWidth = 1;
      ctx.strokeRect(CANVAS_W - 80, 8, 70, 20);
      ctx.fillStyle = suddenDeath ? "#ff6b6b" : "#ccc";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(suddenDeath ? `SD T${turnCount}` : `TURN ${turnCount}`, CANVAS_W - 45, 22);

      ctx.restore(); // screenShake restore

      requestAnimationFrame(render);
    };
    render();
    return () => { running = false; };
  }, [gameState, terrain, players, currentPlayer, projectile, angle, trail, turnTransition, explosions, particles, stars, clouds, wind, floatingTexts, confetti, lastTrails, items, screenShake, cameraZoom, suddenDeath, turnCount, recoil]);

  // Keyboard controls
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

  const cp = players[currentPlayer];
  const ch = cp ? CHARACTERS[cp.char] : CHARACTERS[0];

  return (
    <div style={{ width: CANVAS_W, margin: "0 auto", fontFamily: "'Segoe UI', sans-serif", userSelect: "none" }}>
      {/* HUD Top */}
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

      <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} style={{ display: "block", border: "1px solid #2a2a4a", borderTop: "none", borderBottom: "none" }} />

      {/* Controls Bottom */}
      <div style={{ background: "linear-gradient(90deg, #1a1a2e, #16213e, #1a1a2e)", padding: "10px 20px", borderRadius: "0 0 12px 12px", border: "1px solid #2a2a4a", borderTop: "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Angle with mini gauge */}
        <div style={{ flex: 1 }}>
          <div style={{ color: "#888", fontSize: 9, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>ANGLE</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setAngle(a => Math.max(0, a - 2))} disabled={!!projectile || turnTransition}
              style={{ background: "#333", border: "none", color: "#fff", width: 28, height: 28, borderRadius: 6, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>−</button>
            <div style={{ color: "#fff", fontSize: 20, fontWeight: 800, minWidth: 42, textAlign: "center" }}>{angle}°</div>
            <button onClick={() => setAngle(a => Math.min(90, a + 2))} disabled={!!projectile || turnTransition}
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
            <input type="range" min={5} max={MAX_POWER} value={power} onChange={e => setPower(Number(e.target.value))} disabled={!!projectile || turnTransition} style={{ flex: 1, accentColor: ch.color, height: 6 }} />
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
        <button onClick={fire} disabled={!!projectile || turnTransition || gameState === "gameover"}
          style={{ background: projectile || turnTransition ? "#555" : `linear-gradient(135deg, ${ch.color}, ${ch.accent})`, border: "none", borderRadius: 30, padding: "10px 30px", color: "#fff", fontSize: 14, fontWeight: 800, letterSpacing: 2, cursor: projectile || turnTransition ? "not-allowed" : "pointer", boxShadow: projectile || turnTransition ? "none" : `0 0 20px ${ch.color}44`, marginLeft: 10 }}>
          🎯 FIRE
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
