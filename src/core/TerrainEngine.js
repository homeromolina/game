import { CANVAS_W, CANVAS_H, ITEM_TYPES } from './Constants.js';

export function generateTerrain(w = CANVAS_W, h = CANVAS_H) {
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

export function destroyTerrain(terrain, cx, cy, radius, h = CANVAS_H) {
    const newTerrain = new Float32Array(terrain);
    for (let x = Math.max(0, Math.floor(cx - radius)); x < Math.min(terrain.length, Math.ceil(cx + radius)); x++) {
        const dx = x - cx;
        const halfChord = Math.sqrt(Math.max(0, radius * radius - dx * dx));
        const circleBottom = cy + halfChord;
        const circleTop = cy - halfChord;
        const surfaceY = newTerrain[x];
        if (surfaceY >= circleTop && surfaceY <= circleBottom) {
            newTerrain[x] = Math.min(h, circleBottom);
        } else if (circleBottom > surfaceY && surfaceY < circleTop) {
            newTerrain[x] = Math.min(h, circleBottom);
        }
    }
    return newTerrain;
}

export function generateItems(terrain, w = CANVAS_W) {
    const items = [];
    const count = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
        const x = 150 + Math.floor(Math.random() * (w - 300));
        const typeIdx = Math.floor(Math.random() * ITEM_TYPES.length);
        items.push({ x, y: terrain[x] - 12, ...ITEM_TYPES[typeIdx], id: Math.random(), bobPhase: Math.random() * Math.PI * 2 });
    }
    return items;
}
