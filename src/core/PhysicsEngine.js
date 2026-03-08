import { GRAVITY } from './Constants.js';

/**
 * Calculates the next step of a projectile.
 * Returns { px, py, vx, vy, hitGround, outOfBounds, hitPlayerIdx, hitDistance }
 */
export function calculateProjectileStep(px, py, vx, vy, wind, terrain, players, CANVAS_W, CANVAS_H) {
    // Apply physics
    vx += wind * 0.002;
    vy += GRAVITY;
    px += vx;
    py += vy;

    let outOfBounds = false;
    let hitGround = false;
    let hitPlayerIdx = -1;
    let hitDistance = Infinity;

    // Check bounds
    if (px < -50 || px > CANVAS_W + 50 || py > CANVAS_H + 50) {
        outOfBounds = true;
        return { px, py, vx, vy, outOfBounds, hitGround, hitPlayerIdx, hitDistance };
    }

    // Check terrain collision
    const tx = Math.floor(px);
    if (tx >= 0 && tx < CANVAS_W && py >= terrain[tx]) {
        hitGround = true;
    }

    // Check player collision
    for (let i = 0; i < players.length; i++) {
        const dist = Math.sqrt((px - players[i].x) ** 2 + (py - players[i].y) ** 2);
        if (dist < 20) {
            hitPlayerIdx = i;
            hitDistance = dist;
            hitGround = true; // Still counting as a hit to stop the projectile
            break;
        }
    }

    return { px, py, vx, vy, outOfBounds, hitGround, hitPlayerIdx, hitDistance };
}

/**
 * Applies damage to players based on explosion epicenter and radius
 */
export function applyExplosionDamage(hx, hy, radius, players, activePlayerCharData, suddenDeath) {
    const dmgMultiplier = suddenDeath ? 2 : 1;
    const floatingTexts = [];

    const updatedPlayers = players.map(p => {
        const dist = Math.sqrt((hx - p.x) ** 2 + (hy - p.y) ** 2);
        if (dist < radius + 15) {
            let dmg = Math.round(activePlayerCharData.damage * (1 - dist / (radius + 15)) * dmgMultiplier);
            if (p.shield) { dmg = Math.round(dmg * 0.5); }
            const newHp = Math.max(0, p.hp - dmg);

            if (dmg > 0) {
                floatingTexts.push({ x: p.x, y: p.y - 40, text: `-${dmg} HP`, color: "#ff4444", size: 18 });
            }
            return { ...p, hp: newHp, shield: false };
        }
        return p;
    });

    return { updatedPlayers, newFloatingTexts: floatingTexts };
}
