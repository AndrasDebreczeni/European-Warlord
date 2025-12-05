import { Entity, EntityType } from './Entity';

export class Building extends Entity {
    type = EntityType.Building;
    health: number = 1000;
    maxHealth: number = 1000;
    isConstructed: boolean = true; // For construction logic later

    constructor(x: number, y: number) {
        super(x, y);
        this.size = 50; // Buildings are larger
        this.color = '#64748b'; // Slate 500
    }
}
