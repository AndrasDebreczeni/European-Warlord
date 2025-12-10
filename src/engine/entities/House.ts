import { Building } from './Building';
import { BuildingType, BuildingStats } from '../data/BuildingRules';

export class House extends Building {
    constructor(x: number, y: number) {
        super(x, y);
        this.buildingType = 'House';
        this.size = BuildingStats[BuildingType.House].size;
        this.color = BuildingStats[BuildingType.House].color;
        this.maxHealth = BuildingStats[BuildingType.House].maxHealth;
        this.health = this.maxHealth;
    }
}
