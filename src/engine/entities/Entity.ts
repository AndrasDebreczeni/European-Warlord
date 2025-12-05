export enum EntityType {
    Unit,
    Building,
    Resource
}

export interface Vector2 {
    x: number;
    y: number;
}

export abstract class Entity {
    id: string;
    position: Vector2;
    size: number = 32;
    color: string = '#fff';
    selected: boolean = false;

    constructor(x: number, y: number) {
        this.id = crypto.randomUUID();
        this.position = { x, y };
    }

    abstract type: EntityType;

    // Update now takes GameState as context (using any to avoid circular import for now, or use interface)
    update(_deltaTime: number, _gameState: any): void {
        // Base update logic
    }

    // Simple AABB collision check
    contains(x: number, y: number): boolean {
        return (
            x >= this.position.x &&
            x <= this.position.x + this.size &&
            y >= this.position.y &&
            y <= this.position.y + this.size
        );
    }
}
