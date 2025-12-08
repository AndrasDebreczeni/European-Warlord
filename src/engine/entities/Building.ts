import { Entity, EntityType } from './Entity';
import { UnitType, UnitCosts } from '../data/UnitRules';
import { Unit } from './Unit';

export class Building extends Entity {
    type = EntityType.Building;
    isConstructed: boolean = true;

    // Production
    productionQueue: UnitType[] = [];
    productionTimer: number = 0;

    constructor(x: number, y: number) {
        super(x, y);
        this.size = 50;
        this.color = '#64748b';
    }

    queueUnit(unitType: UnitType) {
        this.productionQueue.push(unitType);
    }

    update(deltaTime: number, gameState: any): void {
        // super.update(deltaTime, gameState); // Building entity might not have move logic

        if (this.productionQueue.length > 0) {
            const currentUnit = this.productionQueue[0];
            const cost = UnitCosts[currentUnit];

            this.productionTimer += deltaTime;

            if (this.productionTimer >= cost.time) {
                this.productionTimer = 0;
                this.productionQueue.shift(); // Remove from queue

                // Spawn Unit
                const spawnX = this.position.x + this.size + 10;
                const spawnY = this.position.y + this.size / 2;

                const newUnit = new Unit(spawnX, spawnY, currentUnit);
                gameState.addEntity(newUnit);

                console.log(`Trained ${currentUnit}`);
            }
        }
    }
}
