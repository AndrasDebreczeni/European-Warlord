export enum EntityType {
    Unit,
    Building,
    Resource,
    Projectile
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

    health: number = 100;
    maxHealth: number = 100;
    hitTimer: number = 0;

    constructor(x: number, y: number) {
        this.id = crypto.randomUUID();
        this.position = { x, y };
    }

    abstract type: EntityType;

    // Update now takes GameState as context (using any to avoid circular import for now, or use interface)
    update(deltaTime: number, _gameState: any, _collisionMap?: boolean[][]): void {
        if (this.hitTimer > 0) {
            this.hitTimer -= deltaTime;
        }
    }

    // Simple AABB collision check
    contains(x: number, y: number): boolean {
        // If entity has scaled sprite, use the larger hitbox
        const size = (this as any)._renderSize || this.size;
        const offset = (this as any)._renderOffset || 0;

        return (
            x >= this.position.x - offset &&
            x <= this.position.x - offset + size &&
            y >= this.position.y - offset &&
            y <= this.position.y - offset + size
        );
    }
}
