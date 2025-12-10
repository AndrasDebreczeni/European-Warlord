import { Entity } from './entities/Entity';

export interface Resources {
    gold: number;
    wood: number;
    food: number;
    iron: number;
    stone: number;
}

export interface Population {
    current: number;
    max: number;
}

export class GameState {
    resources: Resources = {
        gold: 1000,
        wood: 1000,
        food: 1000,
        iron: 1000,
        stone: 1000
    };

    population: Population = {
        current: 0,
        max: 5
    };

    entities: Entity[] = [];
    selection: string[] = [];

    constructor() { }

    addEntity(entity: Entity) {
        this.entities.push(entity);
    }

    removeEntity(id: string) {
        this.entities = this.entities.filter(e => e.id !== id);
        this.selection = this.selection.filter(selId => selId !== id);
    }

    update(deltaTime: number, collisionMap?: boolean[][]) {
        // Pass self to entities so they can query game state (e.g. find TownCenter)
        this.entities.forEach(entity => entity.update(deltaTime, this, collisionMap));

        // Cleanup Depleted Resources
        // We iterate backwards or use filter to safely remove
        this.entities = this.entities.filter(e => {
            if (e.type === 2) { // Resource
                return (e as any).amount > 0;
            }
            return true;
        });
    }

    // Selection Logic
    selectEntity(id: string, multiSelect: boolean = false) {
        if (!multiSelect) {
            this.clearSelection();
        }
        const entity = this.entities.find(e => e.id === id);
        if (entity) {
            entity.selected = true;
            if (!this.selection.includes(id)) {
                this.selection.push(id);
            }
        }
    }

    clearSelection() {
        this.entities.forEach(e => {
            if (this.selection.includes(e.id)) {
                e.selected = false;
            }
        });
        this.selection = [];
    }

    getEntitiesWithinRect(x: number, y: number, w: number, h: number): Entity[] {
        return this.entities.filter(e =>
            e.position.x >= x && e.position.x + e.size <= x + w &&
            e.position.y >= y && e.position.y + e.size <= y + h
        );
    }
}
