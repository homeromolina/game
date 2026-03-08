export const CANVAS_W = 960;
export const CANVAS_H = 540;
export const GRAVITY = 0.08;
export const MAX_POWER = 100;
export const FUEL_MAX = 60;

export const CHARACTERS = [
    { name: "TITAN", color: "#e63946", accent: "#ff6b6b", icon: "🔴", damage: 35, explosionRadius: 45, special: "Mega Blast", desc: "Heavy artillery tank" },
    { name: "PHANTOM", color: "#457b9d", accent: "#a8dadc", icon: "🔵", damage: 25, explosionRadius: 35, special: "Split Shot", desc: "Precision sniper" },
    { name: "NOVA", color: "#e9c46a", accent: "#f4a261", icon: "🟡", damage: 30, explosionRadius: 40, special: "Solar Flare", desc: "Balanced fighter" },
    { name: "VENOM", color: "#2a9d8f", accent: "#76c893", icon: "🟢", damage: 28, explosionRadius: 38, special: "Acid Rain", desc: "Tactical striker" },
];

export const ITEM_TYPES = [
    { type: "hp", icon: "❤️", label: "+20 HP", color: "#ff6b6b" },
    { type: "power", icon: "⚡", label: "MAX PWR", color: "#ffd166" },
    { type: "shield", icon: "🛡️", label: "SHIELD", color: "#60a5fa" },
];
