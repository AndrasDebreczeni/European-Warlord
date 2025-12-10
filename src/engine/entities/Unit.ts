import { Entity, EntityType, Vector2 } from './Entity';
import { ResourceNode, ResourceType } from './ResourceNode';
import { TownCenter } from './TownCenter';
import { UnitType, UnitStats } from '../data/UnitRules';
import { Projectile } from './Projectile';
import { Pathfinder } from '../Pathfinder';

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
    lastGatherTarget: ResourceNode | null = null; // Remember what we were harvesting

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

    setPath(path: Vector2[]) {
        this.path = path;
        // Prune first node if too close (prevents backtracking to center of current tile)
        if (this.path.length > 0) {
            const first = this.path[0];
            const dist = Math.sqrt(Math.pow(first.x - this.position.x, 2) + Math.pow(first.y - this.position.y, 2));
            if (dist < 16) { // Half of new gridSize (32)
                this.path.shift();
            }
        }

        if (this.path.length > 0) {
            this.targetPos = this.path[0];
            this.state = UnitState.Moving;
        } else {
            this.state = UnitState.Idle; // No path
        }
    }

    moveTo(x: number, y: number) {
        // Fallback or direct move (used for short distances or if pathfinding fails? or maybe deprecated?)
        // Let's keep it but it might be overridden by setPath usage in Game.ts
        this.targetPos = { x, y };
        this.path = []; // Clear path if manual move
        this.targetEntity = null;
        this.state = UnitState.Moving;
    }

    gather(resource: ResourceNode) {
        if (this.unitType !== UnitType.Villager) return;
        this.targetEntity = resource;
        this.lastGatherTarget = resource;
        // Ideally we pathfind to resource
        // this.targetPos = { x: resource.position.x, y: resource.position.y }; 
        // Logic handled in Game.ts now preferably? 
        // For now, keep simple behavior or let Game.ts set path
        this.state = UnitState.Moving;
    }

    attackEntity(target: Entity) {
        this.targetEntity = target;
        this.state = UnitState.Attacking;
    }

    returnResources(dropOffTarget: Entity) {
        this.targetEntity = dropOffTarget;
        // this.targetPos = ... // Handled by Game.ts pathfinding usually?
        this.state = UnitState.Returning;
    }

    update(deltaTime: number, gameState: any, collisionMap?: boolean[][]) {
        // Check Death
        if (this.health <= 0) {
            gameState.removeEntity(this.id);
            return;
        }

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
                    this.path = []; // Clear path

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
                            this.targetEntity.hitTimer = 0.1;
                            console.log(`${this.unitType} dealt ${damage} to ${this.targetEntity.type}`);
                        }
                    }
                } else {
                    // Chase
                    // Move towards target (Direct chase, no pathfinding usually for dynamic targets unless re-pathed often)
                    const moveX = (dx / dist) * this.speed * deltaTime;
                    const moveY = (dy / dist) * this.speed * deltaTime;
                    this.position.x += moveX;
                    this.position.y += moveY;
                }
            }
        }


        // Movement Logic (Path Following)
        // Allow movement for Moving, Gathering (moving to resource), Returning
        if ((this.state === UnitState.Moving || this.state === UnitState.Returning || this.state === UnitState.Gathering) && (this.targetPos || this.path.length > 0)) {
            // Ensure we have a targetPos
            if (!this.targetPos && this.path.length > 0) {
                this.targetPos = this.path[0];
            }

            if (this.targetPos) {
                const dx = this.targetPos.x - this.position.x;
                const dy = this.targetPos.y - this.position.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                const arrivalThreshold = 5;

                if (dist < arrivalThreshold) {
                    this.position.x = this.targetPos.x;
                    this.position.y = this.targetPos.y;

                    // Arrived at current waypoint
                    if (this.path.length > 0) {
                        this.path.shift(); // Remove current
                        if (this.path.length > 0) {
                            this.targetPos = this.path[0]; // Next
                            // Continue moving in next frame
                        } else {
                            // Path Complete
                            this.targetPos = null;
                        }
                    } else {
                        this.targetPos = null;
                    }

                    // If effectively done
                    if (!this.targetPos) {
                        if (this.targetEntity) {
                            if (this.targetEntity instanceof ResourceNode) {
                                this.state = UnitState.Gathering;
                            }
                            // returning logic is handled in its own state block
                        } else {
                            this.state = UnitState.Idle; // Done moving
                        }
                    }
                } else {
                    const moveX = (dx / dist) * this.speed * deltaTime;
                    const moveY = (dy / dist) * this.speed * deltaTime;
                    this.position.x += moveX;
                    this.position.y += moveY;
                }
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

                        // Calculate path to return immediately if map is available
                        if (collisionMap) {
                            const path = Pathfinder.findPath(this.position, closest.position, collisionMap);
                            this.setPath(path);
                            this.state = UnitState.Returning;
                        }
                    } else {
                        this.state = UnitState.Idle; // No dropoff
                    }
                }
            }
        }

        // Returning Logic
        if (this.state === UnitState.Returning && this.targetEntity) {
            const target = this.targetEntity;
            const buffer = 5;

            // Check if touching (AABB with buffer)
            const touching =
                this.position.x < target.position.x + target.size + buffer &&
                this.position.x + this.size > target.position.x - buffer &&
                this.position.y < target.position.y + target.size + buffer &&
                this.position.y + this.size > target.position.y - buffer;

            if (touching) {
                // Arrived at Town Center -> Deposit
                if (this.carriedResourceType !== null) {
                    switch (this.carriedResourceType) {
                        case ResourceType.Gold: gameState.resources.gold += this.currentLoad; break;
                        case ResourceType.Wood: gameState.resources.wood += this.currentLoad; break;
                        case ResourceType.Food: gameState.resources.food += this.currentLoad; break;
                        case ResourceType.Iron: gameState.resources.iron += this.currentLoad; break;
                        case ResourceType.Stone: gameState.resources.stone += this.currentLoad; break;
                    }
                    console.log(`Deposited ${this.currentLoad}!`);
                }

                this.currentLoad = 0;
                this.carriedResourceType = null;

                // Return to work!
                if (this.lastGatherTarget && this.lastGatherTarget.amount > 0) {
                    this.gather(this.lastGatherTarget);
                    // Need to calculate path back!
                    if (collisionMap) {
                        const path = Pathfinder.findPath(this.position, this.lastGatherTarget.position, collisionMap);
                        if (path && path.length > 0) {
                            this.setPath(path);
                        } else {
                            // If path blocked, just idle
                            this.state = UnitState.Idle;
                            this.lastGatherTarget = null;
                        }
                    }
                } else {
                    this.state = UnitState.Idle;
                    this.targetPos = null;
                    this.targetEntity = null;
                    this.lastGatherTarget = null;
                }
            } else {
                // Not touching yet
                const closestX = Math.max(target.position.x, Math.min(this.position.x, target.position.x + target.size));
                const closestY = Math.max(target.position.y, Math.min(this.position.y, target.position.y + target.size));

                // If we don't have a path/targetPos, try to find one
                if ((!this.path || this.path.length === 0) && !this.targetPos && collisionMap) {
                    // Target the closest border point, not top-left
                    const path = Pathfinder.findPath(this.position, { x: closestX, y: closestY }, collisionMap);
                    this.setPath(path);
                    this.state = UnitState.Returning;
                }

                // Fallback: If still no path (Pathfinder failed or near), use direct approach
                if ((!this.path || this.path.length === 0) && !this.targetPos) {
                    this.targetPos = { x: closestX, y: closestY };
                }
            }
        }
    }
}
