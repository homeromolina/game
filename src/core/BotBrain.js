import { CANVAS_W, CANVAS_H } from "./Constants";
import { calculateProjectileStep } from "./PhysicsEngine";

export function calculateBotShot(bot, target, wind, terrain, players, currentPlayerIdx) {
    let bestShot = { angle: 45, power: 50, distToTarget: Infinity };

    // Simulate multiple trajectories to find the best angle and power
    for (let angle = 15; angle <= 85; angle += 3) {
        for (let power = 30; power <= 100; power += 5) {
            const rad = (angle * Math.PI) / 180;
            const speed = power * 0.13;
            const dir = bot.facing;

            let px = bot.x;
            let py = bot.y - 10;
            let vx = Math.cos(rad) * speed * dir;
            let vy = -Math.sin(rad) * speed;

            let alive = true;
            let steps = 0;

            while (alive && steps < 200) {
                steps++;
                const nextStep = calculateProjectileStep(px, py, vx, vy, wind, terrain, players, currentPlayerIdx, CANVAS_W, CANVAS_H);
                px = nextStep.px;
                py = nextStep.py;
                vx = nextStep.vx;
                vy = nextStep.vy;

                if (nextStep.outOfBounds) {
                    alive = false;
                } else if (nextStep.hitGround || nextStep.hitPlayerIdx !== -1) {
                    alive = false;
                    const dist = Math.sqrt((px - target.x) ** 2 + (py - target.y) ** 2);

                    if (dist < bestShot.distToTarget) {
                        bestShot = { angle, power, distToTarget: dist };
                    }
                }
            }
        }
    }

    // Add random variance to make the bot feel human (not 100% accurate every time)
    const powerError = Math.random() < 0.4 ? (Math.random() - 0.5) * 6 : 0;
    const angleError = Math.random() < 0.3 ? Math.round((Math.random() - 0.5) * 4) : 0;

    return {
        angle: Math.max(0, Math.min(90, bestShot.angle + angleError)),
        power: Math.max(5, Math.min(100, Math.round(bestShot.power + powerError)))
    };
}
