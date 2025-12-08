import { Entity, EntityType, Vector2 } from './Entity';
import { ResourceNode, ResourceType } from './ResourceNode';
import { TownCenter } from './TownCenter';
import { UnitType, UnitStats } from '../data/UnitRules';
import { Projectile } from './Projectile';

export enum UnitState {
    Idle,
    Moving,
    Gathering,
    Returning,
    Attacking
}

export class Unit extends Entity {
    type = EntityType.Unit;
    unitType: UnitType;

    speed: number = 100;
    path: Vector2[] = [];
    targetPos: Vector2 | null = null;
    targetEntity: Entity | null = null;

    state: UnitState = UnitState.Idle;

    // Gathering stats
    carryCapacity: number = 10;
    currentLoad: number = 0;
    carriedResourceType: ResourceType | null = null;
    gatherTimer: number = 0;
    gatherSpeed: number = 1.0;

    // Combat stats
    attack: number;
    range: number;
    armor: number;
    attackCooldown: number;
    attackTimer: number = 0;

    constructor(x: number, y: number, unitType: UnitType = UnitType.Villager) {
        super(x, y);
        this.unitType = unitType;
        this.size = 20;

        const stats = UnitStats[unitType];
        this.speed = stats.speed;
        this.maxHealth = stats.maxHealth;
        this.health = stats.maxHealth;
        this.attack = stats.attack;
        this.range = stats.range;
        this.armor = stats.armor;
        this.attackCooldown = stats.attackCooldown;

        switch (unitType) {
            case UnitType.Villager: this.color = '#3b82f6'; break;
            // West
            case UnitType.Swordsman: this.color = '#94a3b8'; break;
            case UnitType.Archer: this.color = '#10b981'; break;
            case UnitType.Knight: this.color = '#eab308'; break;
            // East
            case UnitType.Lancer: this.color = '#f97316'; break; // Orange
            case UnitType.HorseArcher: this.color = '#f59e0b'; break; // Amber
            case UnitType.Marauder: this.color = '#78716c'; break; // Stone
            // North
            case UnitType.Huscarl: this.color = '#0f766e'; break; // Teal
            case UnitType.Axethrower: this.color = '#06b6d4'; break; // Cyan
            case UnitType.Berserker: this.color = '#ef4444'; break; // Red
        }
    }

    moveTo(x: number, y: number) {
        this.targetPos = { x, y };
        this.targetEntity = null;
        this.state = UnitState.Moving;
    }

    gather(resource: ResourceNode) {
        this.targetEntity = resource;
        this.targetPos = { x: resource.position.x, y: resource.position.y };
        this.state = UnitState.Moving;
    }

    attackEntity(target: Entity) {
        this.targetEntity = target;
        // Don't set static targetPos, we will update it in loop
        this.state = UnitState.Attacking;
    }

    returnResources(dropOffTarget: Entity) {
        this.targetEntity = dropOffTarget;
        this.targetPos = { x: dropOffTarget.position.x, y: dropOffTarget.position.y };
        this.state = UnitState.Returning;
    }

    update(deltaTime: number, gameState: any) {
        // Combat Timer
        if (this.attackTimer > 0) {
            this.attackTimer -= deltaTime;
        }

        // Combat State
        if (this.state === UnitState.Attacking) {
            if (!this.targetEntity || this.targetEntity.health <= 0) {
                this.state = UnitState.Idle;
                this.targetEntity = null;
                this.targetPos = null;
            } else {
                // Update target position
                const dx = this.targetEntity.position.x - this.position.x;
                const dy = this.targetEntity.position.y - this.position.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const combinedSize = this.size / 2 + (this.targetEntity.size / 2);
                const attackRange = this.range + combinedSize;

                if (dist <= attackRange) {
                    // In Range
                    this.targetPos = null; // Stop moving

                    if (this.attackTimer <= 0) {
                        this.attackTimer = this.attackCooldown;

                        if (this.range > 50) { // Ranged Unit Logic (Simple check based on range)
                            const proj = new Projectile(this.position.x, this.position.y, this.targetEntity, this.attack, this);
                            gameState.addEntity(proj);
                        } else {
                            // Melee - Instant Hit
                            const targetArmor = (this.targetEntity as any)['armor'] || 0;
                            const damage = Math.max(1, this.attack - targetArmor);
                            this.targetEntity.health -= damage;
                            console.log(`${this.unitType} dealt ${damage} to ${this.targetEntity.type}`);
                        }
                    }
                } else {
                    // Chase
                    // Move towards target
                    const moveX = (dx / dist) * this.speed * deltaTime;
                    const moveY = (dy / dist) * this.speed * deltaTime;
                    this.position.x += moveX;
                    this.position.y += moveY;
                }
            }
        }

        // Movement Logic (Standard Move)
        if (this.state === UnitState.Moving && this.targetPos) {
            const dx = this.targetPos.x - this.position.x;
            const dy = this.targetPos.y - this.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            const arrivalThreshold = 5;

            if (dist < arrivalThreshold) {
                this.position.x = this.targetPos.x;
                this.position.y = this.targetPos.y;

                // If simple move, we are done
                if (!this.targetEntity) {
                    this.state = UnitState.Idle;
                    this.targetPos = null;
                } else {
                    // Interaction Arrival
                    if (this.targetEntity instanceof ResourceNode) {
                        this.state = UnitState.Gathering;
                    }
                }
            } else {
                const moveX = (dx / dist) * this.speed * deltaTime;
                const moveY = (dy / dist) * this.speed * deltaTime;
                this.position.x += moveX;
                this.position.y += moveY;
            }
        }

        // Gathering Logic
        if (this.state === UnitState.Gathering && this.targetEntity instanceof ResourceNode) {
            this.gatherTimer += deltaTime;
            if (this.gatherTimer >= this.gatherSpeed) {
                this.gatherTimer = 0;
                if (this.currentLoad < this.carryCapacity) {
                    const gathered = this.targetEntity.harvest(1);
                    this.currentLoad += gathered;
                    this.carriedResourceType = this.targetEntity.resourceType;
                } else {
                    // Full, return to base
                    this.state = UnitState.Returning;
                    this.targetEntity = null;

                    // Find nearest Dropoff (TownCenter)
                    const townCenters = gameState.entities.filter((e: Entity) => e instanceof TownCenter);

                    if (townCenters.length > 0) {
                        let closest = townCenters[0];
                        let minDst = Infinity;

                        townCenters.forEach((tc: Entity) => {
                            const d = Math.pow(tc.position.x - this.position.x, 2) + Math.pow(tc.position.y - this.position.y, 2);
                            if (d < minDst) {
                                minDst = d;
                                closest = tc;
                            }
                        });

                        this.returnResources(closest);
                    } else {
                        this.state = UnitState.Idle; // No dropoff
                    }
                }
            }
        }

        // Returning Logic
        if (this.state === UnitState.Returning && this.targetEntity && this.targetPos) {
            // Move logic handles getting there (see above, actually wait... I separated normal move logic)
            // My previous Move logic handled ALL movement including Returning. 
            // I need to make sure Returning state also processes movement.

            // Re-using the movement block above is tricky if I hardcoded state checks.
            // Let's duplicate simple move logic or consolidate.

            const dx = this.targetPos.x - this.position.x;
            const dy = this.targetPos.y - this.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 5) {
                // Arrived at Town Center
                if (this.carriedResourceType !== null) {
                    switch (this.carriedResourceType) {
                        case ResourceType.Gold: gameState.resources.gold += this.currentLoad; break;
                        case ResourceType.Wood: gameState.resources.wood += this.currentLoad; break;
                        case ResourceType.Food: gameState.resources.food += this.currentLoad; break;
                    }
                    console.log(`Deposited ${this.currentLoad}!`);
                }

                this.currentLoad = 0;
                this.carriedResourceType = null;
                this.state = UnitState.Idle; // Or back to harvesting? For now Idle.
                this.targetPos = null;
                this.targetEntity = null;
            } else {
                const moveX = (dx / dist) * this.speed * deltaTime;
                const moveY = (dy / dist) * this.speed * deltaTime;
                this.position.x += moveX;
                this.position.y += moveY;
            }
        }
    }
}
