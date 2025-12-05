import { Entity, EntityType, Vector2 } from './Entity';
import { ResourceNode, ResourceType } from './ResourceNode';
import { TownCenter } from './TownCenter';

export enum UnitState {
    Idle,
    Moving,
    Gathering,
    Returning
}

export class Unit extends Entity {
    type = EntityType.Unit;
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
    gatherSpeed: number = 1.0; // Seconds per hit

    constructor(x: number, y: number) {
        super(x, y);
        this.size = 20;
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

    returnResources(dropOffTarget: Entity) {
        this.targetEntity = dropOffTarget;
        this.targetPos = { x: dropOffTarget.position.x, y: dropOffTarget.position.y };
        this.state = UnitState.Returning;
    }

    update(deltaTime: number, gameState: any) {
        // Movement Logic
        if (this.targetPos) {
            const dx = this.targetPos.x - this.position.x;
            const dy = this.targetPos.y - this.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            const arrivalThreshold = 5;

            if (dist < arrivalThreshold) {
                this.position.x = this.targetPos.x;
                this.position.y = this.targetPos.y;
                this.targetPos = null;

                // Arrival Logic
                if (this.state === UnitState.Moving) {
                    if (this.targetEntity && this.targetEntity instanceof ResourceNode) {
                        this.state = UnitState.Gathering;
                    } else {
                        this.state = UnitState.Idle;
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
                    // We use the passed gameState to find buildings
                    const townCenters = gameState.entities.filter((e: Entity) => e instanceof TownCenter);

                    if (townCenters.length > 0) {
                        // Find closest (naive implementation)
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
                        console.log("No dropoff point found class!");
                        this.state = UnitState.Idle;
                    }
                }
            }
        }

        // Returning Logic (Checking distance logic inside update vs movement target logic)
        // Note: We already set targetPos in returnResources, so movement logic above handles moving.
        // We just need to check if we arrived at the dropoff.
        if (this.state === UnitState.Returning && this.targetEntity && !this.targetPos) {
            // If targetPos is null, we arrived (handled by movement block above)

            // Deposit logic
            if (this.carriedResourceType !== null) {
                switch (this.carriedResourceType) {
                    case ResourceType.Gold: gameState.resources.gold += this.currentLoad; break;
                    case ResourceType.Wood: gameState.resources.wood += this.currentLoad; break;
                    case ResourceType.Food: gameState.resources.food += this.currentLoad; break;
                }
                console.log(`Deposited ${this.currentLoad}! Resources: G:${gameState.resources.gold} W:${gameState.resources.wood}`);
            }

            this.currentLoad = 0;
            this.carriedResourceType = null;
            this.state = UnitState.Idle; // Or return to harvesting if we remembered source
        }
    }
}
