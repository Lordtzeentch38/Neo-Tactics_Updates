export const DEFAULT_BOARD_SIZE = 15;

// ... (ICONS e TIBERIUM_TYPES rimangono uguali, copiali dal vecchio file) ...
export const ICONS = {
    base: `<svg viewBox="0 0 100 100" class="unit-svg"><path d="M30,90 L10,50 L30,10 L70,10 L90,50 L70,90 Z" opacity="0.4" /><path d="M35,80 L20,50 L35,20 L65,20 L80,50 L65,80 Z" stroke="currentColor" stroke-width="3" fill="none"/><circle cx="50" cy="50" r="10" fill="currentColor" /></svg>`,
    scout: `<svg viewBox="0 0 100 100" class="unit-svg"><rect x="15" y="10" width="20" height="15" rx="4" fill="currentColor" opacity="0.7"/><rect x="15" y="75" width="20" height="15" rx="4" fill="currentColor" opacity="0.7"/><rect x="65" y="20" width="20" height="15" rx="4" fill="currentColor" opacity="0.7"/><rect x="65" y="65" width="20" height="15" rx="4" fill="currentColor" opacity="0.7"/><path d="M20,30 L80,45 L90,50 L80,55 L20,70 L10,50 Z" fill="currentColor" /><rect x="50" y="45" width="35" height="10" fill="currentColor" /><circle cx="45" cy="50" r="8" fill="#1e293b" /><rect x="45" y="46" width="25" height="8" fill="#334155" /><rect x="65" y="44" width="20" height="3" fill="#94a3b8" /><rect x="65" y="48" width="22" height="3" fill="#94a3b8" /><rect x="65" y="52" width="20" height="3" fill="#94a3b8" /></svg>`,
    tank: `<svg viewBox="0 0 100 100" class="unit-svg"><rect x="10" y="15" width="70" height="20" rx="5" fill="currentColor" opacity="0.8"/><rect x="10" y="65" width="70" height="20" rx="5" fill="currentColor" opacity="0.8"/><rect x="20" y="30" width="45" height="40" rx="5" fill="currentColor" /><rect x="40" y="42" width="55" height="16" fill="currentColor" /></svg>`,
    harvester: `<svg viewBox="0 0 100 100" class="unit-svg"><path d="M10,25 L60,25 L60,75 L10,75 Z" fill="currentColor" /><path d="M60,30 L90,15 L90,85 L60,70 Z" fill="currentColor" opacity="0.7" /><path d="M60,35 L85,35 M60,50 L85,50 M60,65 L85,65" stroke="black" stroke-width="3" /></svg>`,
    builder: `<svg viewBox="0 0 100 100" class="unit-svg"><rect x="5" y="15" width="55" height="18" rx="3" fill="currentColor" opacity="0.8"/><rect x="5" y="67" width="55" height="18" rx="3" fill="currentColor" opacity="0.8"/><rect x="10" y="30" width="40" height="40" rx="3" fill="currentColor" /><rect x="20" y="40" width="15" height="20" fill="black" opacity="0.2"/><path d="M50,40 L70,30 L85,35" stroke="currentColor" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M50,60 L70,70 L85,65" stroke="currentColor" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="85" cy="35" r="4" fill="#94a3b8"/><circle cx="85" cy="65" r="4" fill="#94a3b8"/><path d="M85,35 L95,30 M85,35 L95,40" stroke="#94a3b8" stroke-width="3"/><path d="M85,65 L95,60 M85,65 L95,70" stroke="#94a3b8" stroke-width="3"/></svg>`,
    turret: `<svg viewBox="0 0 100 100" class="unit-svg"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.4" stroke="currentColor" stroke-width="2" /><rect x="30" y="30" width="40" height="40" fill="currentColor" /><path d="M50,50 L95,50" stroke="currentColor" stroke-width="12" stroke-linecap="round" /><circle cx="50" cy="50" r="10" fill="black" /></svg>`,
    wall: `<svg viewBox="0 0 100 100" class="unit-svg"><rect x="5" y="5" width="90" height="90" fill="#475569" stroke="#94a3b8" stroke-width="4" /><path d="M5,35 L95,35 M5,65 L95,65 M35,5 L35,35 M65,35 L65,65 M35,65 L35,95" stroke="#94a3b8" stroke-width="2" /></svg>`,
    pending_wall: `<svg viewBox="0 0 100 100" class="unit-svg"><rect x="10" y="10" width="80" height="80" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="5,5" /><path d="M20,20 L80,80 M80,20 L20,80" stroke="currentColor" stroke-width="2" /></svg>`,
    transformer: `<svg viewBox="0 0 100 100" class="unit-svg"><rect x="25" y="25" width="50" height="50" fill="currentColor" opacity="0.3" rx="10" /><circle cx="50" cy="50" r="20" stroke="currentColor" stroke-width="4" stroke-dasharray="10, 5" /></svg>`,
    deep_drill: `<svg viewBox="0 0 100 100" class="unit-svg"><path d="M20,80 L80,80 L50,20 Z" fill="currentColor" opacity="0.8"/><path d="M50,20 L50,90" stroke="black" stroke-width="4" stroke-dasharray="5,5"/><rect x="30" y="70" width="40" height="20" fill="currentColor" stroke="black" stroke-width="2"/></svg>`,
    missile_turret: `<svg viewBox="0 0 100 100" class="unit-svg"><circle cx="50" cy="50" r="35" fill="currentColor" opacity="0.4" stroke="currentColor" stroke-width="2" /><rect x="35" y="35" width="30" height="30" fill="currentColor" /><path d="M50,50 L85,50" stroke="currentColor" stroke-width="8" stroke-linecap="round" /><path d="M85,50 L75,40 M85,50 L75,60" stroke="currentColor" stroke-width="4" /></svg>`,
    artillery: `<svg viewBox="0 0 100 100" class="unit-svg"><rect x="5" y="10" width="90" height="20" rx="5" fill="currentColor" opacity="0.7"/><rect x="5" y="70" width="90" height="20" rx="5" fill="currentColor" opacity="0.7"/><rect x="15" y="25" width="70" height="50" fill="currentColor"/><rect x="10" y="35" width="85" height="30" rx="10" fill="currentColor" stroke="black" stroke-width="2"/><rect x="70" y="35" width="5" height="30" fill="black" opacity="0.5"/><path d="M10,35 L0,25" stroke="currentColor" stroke-width="4"/><path d="M10,65 L0,75" stroke="currentColor" stroke-width="4"/></svg>`
};

export const TIBERIUM_TYPES = {
    small: { max: 200, yield: 25, class: "" },
    large: { max: 500, yield: 50, class: "tib-large" }
};

export const UNIT_TYPES = {
    base: { name: "HQ", hp: 600, atk: 0, range: 0, maxMove: 0, maxAttacks: 0, cost: 0, desc: "Main Base" },
    scout: { name: "Scout", hp: 50, atk: 8, range: 2.5, maxMove: 8, maxAttacks: 2, cost: 50, desc: "Fast, Ranged Skirmisher" },
    tank: { name: "Titan", hp: 250, atk: 45, range: 2, maxMove: 3, maxAttacks: 1, cost: 150, desc: "Heavy Armor, Close Combat" },
    harvester: { name: "Harvester", hp: 100, atk: 0, range: 0, maxMove: 4, maxAttacks: 0, cost: 100, desc: "Mines Tiberium" },
    builder: { name: "Builder", hp: 60, atk: 0, range: 1.5, maxMove: 4, maxAttacks: 1, cost: 25, desc: "Builds Walls & Turrets" },
    turret: { name: "Turret", hp: 180, atk: 25, range: 2.5, maxMove: 0, maxAttacks: 2, cost: 30, desc: "Auto-Defensive Structure" },
    wall: { name: "Wall", hp: 180, atk: 0, range: 0, maxMove: 0, maxAttacks: 0, cost: 5, desc: "Defensive Barrier" },
    pending_wall: { name: "Site", hp: 50, atk: 0, range: 0, maxMove: 0, maxAttacks: 0, cost: 0, desc: "Under Construction" },
    transformer: { name: "Morph", hp: 180, atk: 0, range: 0, maxMove: 0, maxAttacks: 0, cost: 0, desc: "Transforming..." },
    deep_drill: { name: "Deep Drill", hp: 800, atk: 10, range: 2, maxMove: 0, maxAttacks: 2, cost: 400, desc: "Infinite Mining & Defense" },
    missile_turret: { name: "Missile Turret", hp: 150, atk: 55, range: 5, minRange: 2, maxMove: 0, maxAttacks: 1, cost: 100, desc: "Long Range Anti-Armor" },
    artillery: { name: "Artillery", hp: 60, atk: 40, range: 5, maxMove: 3, maxAttacks: 1, cost: 120, desc: "Mobile Long-Range Gun" }
};

// --- NUOVA SEZIONE AUDIO ---
export const AUDIO_FILES = {
    // Selezione (Loop)
    select_base: 'assets/sounds/select_base.mp3',
    select_scout: 'assets/sounds/select_scout.mp3',
    select_tank: 'assets/sounds/select_tank.mp3',
    select_harvester: 'assets/sounds/select_harvester.mp3',
    select_builder: 'assets/sounds/select_builder.mp3',
    select_turret: 'assets/sounds/select_turret.mp3',
    select_missile_turret: 'assets/sounds/select_MissileTurret.mp3',
    select_artillery: 'assets/sounds/select_Artillery.mp3',
    select_deep_drill: 'assets/sounds/select_drill.mp3',
    select_wall: 'assets/sounds/select_wall.mp3',
    select_construction: 'assets/sounds/construction_loop.mp3',

    // Movimento (Loop durante il movimento)
    move_scout: 'assets/sounds/move_scout.mp3',
    move_tank: 'assets/sounds/move_tank.mp3',
    move_artillery: 'assets/sounds/move_tank.mp3', // Uses Titan sound
    move_harvester: 'assets/sounds/move_harvester.mp3',
    move_builder: 'assets/sounds/move_builder.mp3',

    // Combattimento (One Shot)
    atk_scout: 'assets/sounds/atk_scout.mp3',
    atk_tank: 'assets/sounds/atk_tank.mp3',
    atk_turret: 'assets/sounds/atk_turret.mp3',
    atk_missile_turret: 'assets/sounds/atk_artillery.mp3', // Updated to match Artillery
    atk_artillery: 'assets/sounds/atk_artillery.mp3',
    atk_deep_drill: 'assets/sounds/atk_drill.mp3',
    atk_builder: 'assets/sounds/atk_builder.mp3',

    // Eventi e Speciali (Loops & One Shots)
    select_harvesting: 'assets/sounds/select_harvesting.mp3',
    bgm_game: 'assets/sounds/Aggiuntivi/Orbital Vanguard_PlayGame.mp3',
    bgm_menu: 'assets/sounds/Aggiuntivi/Orbital Vanguard_Menu.mp3',
    btn_click: 'assets/sounds/Button_Click.mp3',
    btn_end_turn: 'assets/sounds/Button_End-Turn.mp3', // NEW
    transform: 'assets/sounds/transform.mp3',
    explode: 'assets/sounds/explode.mp3',
    explode_wall: 'assets/sounds/Aggiuntivi/small-rock-break-194553.mp3'
};