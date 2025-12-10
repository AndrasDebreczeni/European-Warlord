export enum UnitType {
    // Common
    Villager = 'Villager',
    // Western Kingdom
    Swordsman = 'Swordsman', // Man-at-Arms base
    Archer = 'Archer', // Crossbowman base really
    Knight = 'Knight',
    // Steppe Khaganate
    Lancer = 'Lancer', // Replaces Knight
    HorseArcher = 'Horse Archer', // Unique
    Marauder = 'Marauder', // Light Inf
    // Northern Clans
    Huscarl = 'Huscarl', // Heavy Inf
    Axethrower = 'Axethrower', // Ranged Inf
    Berserker = 'Berserker' // Shock Inf
}

export const UnitCosts: Record<UnitType, { gold: number; wood: number; food: number; time: number }> = {
    [UnitType.Villager]: { gold: 0, wood: 0, food: 50, time: 2 },

    // West
    [UnitType.Swordsman]: { gold: 20, wood: 0, food: 60, time: 4 },
    [UnitType.Archer]: { gold: 45, wood: 25, food: 0, time: 5 },
    [UnitType.Knight]: { gold: 75, wood: 0, food: 60, time: 7 },

    // East
    [UnitType.Lancer]: { gold: 60, wood: 0, food: 50, time: 6 },
    [UnitType.HorseArcher]: { gold: 50, wood: 40, food: 0, time: 6 },
    [UnitType.Marauder]: { gold: 10, wood: 0, food: 40, time: 3 },

    // North
    [UnitType.Huscarl]: { gold: 30, wood: 10, food: 50, time: 5 },
    [UnitType.Axethrower]: { gold: 30, wood: 30, food: 0, time: 5 },
    [UnitType.Berserker]: { gold: 40, wood: 0, food: 50, time: 4 },
};

export const UnitStats: Record<UnitType, { maxHealth: number; speed: number; attack: number; range: number; armor: number; attackCooldown: number }> = {
    [UnitType.Villager]: { maxHealth: 25, speed: 100, attack: 3, range: 10, armor: 0, attackCooldown: 1.5 },

    // West - High Armor, Strong Cav
    [UnitType.Swordsman]: { maxHealth: 70, speed: 90, attack: 8, range: 10, armor: 3, attackCooldown: 1.2 },
    [UnitType.Archer]: { maxHealth: 35, speed: 110, attack: 6, range: 140, armor: 0, attackCooldown: 2.2 }, // Crossbow style
    [UnitType.Knight]: { maxHealth: 120, speed: 140, attack: 14, range: 10, armor: 5, attackCooldown: 1.5 },

    // East - Fast, Hit & Run
    [UnitType.Lancer]: { maxHealth: 90, speed: 160, attack: 10, range: 10, armor: 1, attackCooldown: 1.1 },
    [UnitType.HorseArcher]: { maxHealth: 50, speed: 150, attack: 5, range: 130, armor: 0, attackCooldown: 1.8 },
    [UnitType.Marauder]: { maxHealth: 50, speed: 120, attack: 7, range: 10, armor: 0, attackCooldown: 1.0 },

    // North - High Dmg, Aggressive
    [UnitType.Huscarl]: { maxHealth: 80, speed: 100, attack: 9, range: 10, armor: 2, attackCooldown: 1.3 },
    [UnitType.Axethrower]: { maxHealth: 45, speed: 105, attack: 7, range: 90, armor: 1, attackCooldown: 1.5 }, // Short range
    [UnitType.Berserker]: { maxHealth: 60, speed: 130, attack: 12, range: 10, armor: 0, attackCooldown: 0.8 },
};
