export enum BuildingType {
    TownCenter = 'TownCenter',
    Barracks = 'Barracks',
    House = 'House',
    Tower = 'Tower',
    Wall = 'Wall'
}

export const BuildingCosts: Record<BuildingType, { gold: number; wood: number; food: number; stone: number }> = {
    [BuildingType.TownCenter]: { gold: 300, wood: 200, food: 0, stone: 100 },
    [BuildingType.Barracks]: { gold: 100, wood: 100, food: 0, stone: 20 },
    [BuildingType.House]: { gold: 0, wood: 30, food: 0, stone: 0 },
    [BuildingType.Tower]: { gold: 50, wood: 50, food: 0, stone: 100 },
    [BuildingType.Wall]: { gold: 0, wood: 10, food: 0, stone: 5 } // Cost per segment
};

export const BuildingStats: Record<BuildingType, { size: number; maxHealth: number; color: string; range?: number; attack?: number; attackCooldown?: number }> = {
    [BuildingType.TownCenter]: { size: 64, maxHealth: 2000, color: '#2563eb' },
    [BuildingType.Barracks]: { size: 48, maxHealth: 1000, color: '#b91c1c' }, // Red 700
    [BuildingType.House]: { size: 64, maxHealth: 300, color: '#ea580c' }, // Orange 600
    [BuildingType.Tower]: { size: 64, maxHealth: 800, color: '#525252', range: 200, attack: 10, attackCooldown: 1.0 }, // Neutral Gray
    [BuildingType.Wall]: { size: 32, maxHealth: 500, color: '#78716c' } // Stone Gray
};
