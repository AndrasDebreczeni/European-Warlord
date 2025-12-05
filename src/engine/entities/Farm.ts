import { Building } from './Building';
import { BuildingType, BuildingStats } from '../data/BuildingRules';

export class Farm extends Building {
    constructor(x: number, y: number) {
        super(x, y);
        const stats = BuildingStats[BuildingType.Farm];
        this.size = stats.size;
        this.color = stats.color;
        this.maxHealth = stats.maxHealth;
        this.health = stats.maxHealth;
    }
}
