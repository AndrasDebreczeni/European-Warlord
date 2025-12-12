import { Building } from './Building';
import { BuildingType, BuildingStats } from '../data/BuildingRules';

export class Wall extends Building {
    public rotation: number = 0;
    public length: number = 32;

    constructor(x: number, y: number, length: number = 32, rotation: number = 0) {
        super(x, y);
        this.buildingType = 'Wall';
        this.size = 32; // Base breadth
        this.length = length;
        this.rotation = rotation;
        this.color = BuildingStats[BuildingType.Wall].color;
        this.maxHealth = BuildingStats[BuildingType.Wall].maxHealth;
        this.health = this.maxHealth;
    }
}
