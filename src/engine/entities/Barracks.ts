import { Building } from './Building';
import { BuildingType, BuildingStats } from '../data/BuildingRules';

export class Barracks extends Building {
    constructor(x: number, y: number) {
        super(x, y);
        this.buildingType = 'Barracks';
        const stats = BuildingStats[BuildingType.Barracks];
        this.size = stats.size;
        this.color = stats.color;
        this.maxHealth = stats.maxHealth;
        this.health = stats.maxHealth;
    }
}
