import { Entity, EntityType } from './Entity';

export enum ResourceType {
    Gold,
    Wood,
    Food,
    Iron,
    Stone
}

export class ResourceNode extends Entity {
    type = EntityType.Resource;
    amount: number = 1000;

    constructor(x: number, y: number, public resourceType: ResourceType) {
        super(x, y);
        this.size = 32;
        // Color based on type
        switch (resourceType) {
            case ResourceType.Gold: this.color = '#fbbf24'; break; // Amber 400
            case ResourceType.Wood: this.color = '#166534'; break; // Green 800
            case ResourceType.Food: this.color = '#dc2626'; break; // Red 600
            case ResourceType.Iron: this.color = '#94a3b8'; break; // Slate 400 (Iron)
            case ResourceType.Stone: this.color = '#57534e'; break; // Stone 600
        }
    }

    harvest(amount: number): number {
        const harvested = Math.min(this.amount, amount);
        this.amount -= harvested;
        if (this.amount <= 0) {
            // Depleted logic (handled by gamestate cleanup usually)
        }
        return harvested;
    }
}
