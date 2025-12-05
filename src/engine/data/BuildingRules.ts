export enum BuildingType {
    TownCenter = 'TownCenter',
    Barracks = 'Barracks',
    Farm = 'Farm'
}

export const BuildingCosts: Record<BuildingType, { gold: number; wood: number; food: number }> = {
    [BuildingType.TownCenter]: { gold: 200, wood: 200, food: 0 },
    [BuildingType.Barracks]: { gold: 100, wood: 50, food: 0 },
    [BuildingType.Farm]: { gold: 0, wood: 50, food: 0 }
};

export const BuildingStats: Record<BuildingType, { size: number; maxHealth: number; color: string }> = {
    [BuildingType.TownCenter]: { size: 64, maxHealth: 2000, color: '#2563eb' },
    [BuildingType.Barracks]: { size: 48, maxHealth: 1000, color: '#dc2626' }, // Red
    [BuildingType.Farm]: { size: 32, maxHealth: 500, color: '#16a34a' } // Green
};
