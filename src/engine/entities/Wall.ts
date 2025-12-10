import { Building } from './Building';
import { BuildingType, BuildingStats } from '../data/BuildingRules';

export class Wall extends Building {
    constructor(x: number, y: number) {
        super(x, y);
        this.buildingType = 'Wall';
        this.size = BuildingStats[BuildingType.Wall].size;
        this.color = BuildingStats[BuildingType.Wall].color;
        this.maxHealth = BuildingStats[BuildingType.Wall].maxHealth;
        this.health = this.maxHealth;
    }
}
