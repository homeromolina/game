import { GRAVITY } from './Constants.js';

/**
 * Calculates the next step of a projectile with drag and terrain-slope normal.
 * Returns { px, py, vx, vy, hitGround, outOfBounds, hitPlayerIdx, hitDistance, terrainNormal }
 */
export function calculateProjectileStep(
    px, py, vx, vy,
    wind, terrain, players, currentPlayerIdx,
    CANVAS_W, CANVAS_H,
    drag = 0.999,
    windFactor = 1.0
) {
    // Aerodynamic drag + wind
    vx *= drag;
    vy *= drag;
    vx += wind * 0.002 * windFactor;
    vy += GRAVITY;
    px += vx;
    py += vy;

    let outOfBounds = false;
    let hitGround = false;
    let hitPlayerIdx = -1;
    let hitDistance = Infinity;
    // Default flat-ground normal (pointing straight up)
    let terrainNormal = { nx: 0, ny: -1 };

    // Out-of-bounds check
    if (px < -50 || px > CANVAS_W + 50 || py > CANVAS_H + 50) {
        outOfBounds = true;
        return { px, py, vx, vy, outOfBounds, hitGround, hitPlayerIdx, hitDistance, terrainNormal };
    }

    // Terrain collision + slope normal
    const tx = Math.floor(px);
    if (tx >= 0 && tx < CANVAS_W && py >= terrain[tx]) {
        hitGround = true;
        // Compute slope for ricochet: central-difference across 3 pixels
        const x0 = Math.max(0, tx - 2);
        const x1 = Math.min(CANVAS_W - 1, tx + 2);
        const slope = (terrain[x1] - terrain[x0]) / (x1 - x0);
        // Normal perpendicular to slope, pointing up/outward
        const len = Math.sqrt(slope * slope + 1);
        terrainNormal = { nx: -slope / len, ny: -1 / len };
    }

    // Player collision (for any enemy)
    for (let i = 0; i < players.length; i++) {
        if (i === currentPlayerIdx) continue;
        const dist = Math.sqrt((px - players[i].x) ** 2 + (py - players[i].y) ** 2);
        if (dist < 20) {
            hitPlayerIdx = i;
            hitDistance = dist;
            hitGround = true;
            break;
        }
    }

    return { px, py, vx, vy, outOfBounds, hitGround, hitPlayerIdx, hitDistance, terrainNormal };
}

/**
 * Reflects a velocity vector off a surface defined by its outward normal.
 * restitution < 1 means energy loss on bounce.
 */
export function reflectVelocity(vx, vy, nx, ny, restitution = 0.52) {
    const dot = vx * nx + vy * ny;
    return {
        vx: (vx - 2 * dot * nx) * restitution,
        vy: (vy - 2 * dot * ny) * restitution,
    };
}

/**
 * Applies damage to all players within the blast radius.
 * weaponDamageMult scales the character's base damage up/down.
 */
export function applyExplosionDamage(hx, hy, radius, players, activePlayerCharData, suddenDeath, weaponDamageMult = 1.0) {
    const dmgMultiplier = (suddenDeath ? 2 : 1) * weaponDamageMult;
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

/**
 * Calculates horizontal knockback impulse per player from an explosion.
 * Returns array indexed by player index with { dx } (only horizontal push).
 */
export function calculateKnockback(hx, hy, radius, players, force = 10) {
    return players.map(p => {
        const dx = p.x - hx;
        const dy = p.y - hy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < radius + 40 && dist > 0.1) {
            const strength = (1 - dist / (radius + 40)) * force;
            return { dx: (dx / dist) * strength };
        }
        return { dx: 0 };
    });
}
