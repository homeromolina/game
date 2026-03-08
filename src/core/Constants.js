export const CANVAS_W = 960;
export const CANVAS_H = 540;
export const GRAVITY = 0.08;
export const MAX_POWER = 100;
export const FUEL_MAX = 60;

export const CHARACTERS = [
    { name: "TITAN",   color: "#e63946", accent: "#ff6b6b", icon: "🔴", damage: 35, explosionRadius: 45, special: "Mega Blast",  desc: "Heavy artillery tank" },
    { name: "PHANTOM", color: "#457b9d", accent: "#a8dadc", icon: "🔵", damage: 25, explosionRadius: 35, special: "Split Shot",  desc: "Precision sniper" },
    { name: "NOVA",    color: "#e9c46a", accent: "#f4a261", icon: "🟡", damage: 30, explosionRadius: 40, special: "Solar Flare", desc: "Balanced fighter" },
    { name: "VENOM",   color: "#2a9d8f", accent: "#76c893", icon: "🟢", damage: 28, explosionRadius: 38, special: "Acid Rain",   desc: "Tactical striker" },
];

// Each weapon modifies base character damage/radius multiplicatively
export const WEAPONS = [
    {
        id: "rocket",   name: "ROCKET",   icon: "🚀", ammoDefault: Infinity,
        damage: 1.0,  radius: 1.0,  drag: 0.999, type: "direct",
        windFactor: 1.0,  speedMult: 1.0,
        color: "#ff4444", trailColor: "#ff6600",
        desc: "Standard rocket",
    },
    {
        id: "grenade",  name: "GRENADE",  icon: "💣", ammoDefault: 3,
        damage: 1.25, radius: 1.3,  drag: 0.996, type: "bounce",
        bounces: 2, restitution: 0.52, windFactor: 1.0, speedMult: 0.9,
        color: "#88dd44", trailColor: "#aaff44",
        desc: "Bounces 2× then explodes",
    },
    {
        id: "cluster",  name: "CLUSTER",  icon: "🌟", ammoDefault: 2,
        damage: 0.65, radius: 0.65, drag: 0.998, type: "cluster",
        subCount: 5, subDamage: 0.35, subRadius: 0.5, spreadX: 160,
        windFactor: 1.0,  speedMult: 1.0,
        color: "#ffaa00", trailColor: "#ffdd00",
        desc: "Splits into 5 sub-bombs on impact",
    },
    {
        id: "sniper",   name: "SNIPER",   icon: "🎯", ammoDefault: 5,
        damage: 2.4,  radius: 0.22, drag: 1.0,   type: "direct",
        windFactor: 0.1, speedMult: 3.0,
        color: "#00ffff", trailColor: "#0088ff",
        desc: "Pinpoint shot, massive damage",
    },
    {
        id: "molotov",  name: "MOLOTOV",  icon: "🔥", ammoDefault: 2,
        damage: 0.35, radius: 0.65, drag: 0.994, type: "fire",
        fireDuration: 280, fireTickDamage: 2.5, fireRadius: 32,
        windFactor: 1.2,  speedMult: 0.85,
        color: "#ff8800", trailColor: "#ff4400",
        desc: "Burns an area for several turns",
    },
];

export const TERRAIN_TYPES = [
    { id: "hills",  name: "GREEN HILLS", icon: "🌄", desc: "Classic rolling terrain" },
    { id: "city",   name: "CITY RUINS",  icon: "🏙️", desc: "Rooftops and rubble" },
    { id: "desert", name: "DESERT",      icon: "🏜️", desc: "Sandy dunes" },
];

export const ITEM_TYPES = [
    { type: "hp",     icon: "❤️",  label: "+25 HP",  color: "#ff6b6b" },
    { type: "power",  icon: "⚡",  label: "MAX PWR",  color: "#ffd166" },
    { type: "shield", icon: "🛡️", label: "SHIELD",   color: "#60a5fa" },
    { type: "ammo",   icon: "🎁",  label: "+AMMO",    color: "#a78bfa" },
];
