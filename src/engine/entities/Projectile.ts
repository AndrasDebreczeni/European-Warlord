import { Entity, EntityType } from './Entity';

export class Projectile extends Entity {
    type = EntityType.Projectile;
    target: Entity;
    speed: number = 400; // Fast moving
    damage: number;
    owner: Entity; // Who shot this?

    constructor(x: number, y: number, target: Entity, damage: number, owner: Entity) {
        super(x, y);
        this.size = 5;
        this.color = '#ffffff';
        this.target = target;
        this.damage = damage;
        this.owner = owner;
    }

    update(deltaTime: number, gameState: any) {
        if (this.target.health <= 0) {
            // Target dead while projectile in flight
            gameState.removeEntity(this.id);
            return;
        }

        const dx = this.target.position.x - this.position.x;
        const dy = this.target.position.y - this.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 10) {
            // Hit
            const targetArmor = (this.target as any)['armor'] || 0;
            const finalDamage = Math.max(1, this.damage - targetArmor);
            this.target.health -= finalDamage;
            this.target.hitTimer = 0.1;
            console.log(`Projectile hit ${this.target.type} for ${finalDamage} damage`);
            gameState.removeEntity(this.id);
        } else {
            // Move
            const moveX = (dx / dist) * this.speed * deltaTime;
            const moveY = (dy / dist) * this.speed * deltaTime;
            this.position.x += moveX;
            this.position.y += moveY;
        }
    }
}
