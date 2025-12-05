import { Entity } from './entities/Entity';

export interface Resources {
    gold: number;
    wood: number;
    food: number;
}

export class GameState {
    resources: Resources = {
        gold: 100,
        wood: 100,
        food: 100
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

    update(deltaTime: number) {
        // Pass self to entities so they can query game state (e.g. find TownCenter)
        this.entities.forEach(entity => entity.update(deltaTime, this));
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
