import { GameLoop } from './GameLoop';
import { InputHandler } from './InputHandler';
import { Renderer, Camera } from './Renderer';
import { GameState } from './GameState';
import { Entity, Unit, ResourceNode, ResourceType, TownCenter, Barracks, House, Tower, Wall, Building } from './entities';
import { BuildingType, BuildingStats, BuildingCosts } from './data/BuildingRules';
import { UnitType, UnitCosts } from './data/UnitRules';
import { Pathfinder } from './Pathfinder';
import { ImageLoader } from './ImageLoader';

export class Game {
    loop: GameLoop;
    input: InputHandler;
    renderer: Renderer;
    camera: Camera;
    state: GameState;
    imageLoader: typeof ImageLoader;



    // Building Placement
    placementMode: boolean = false;
    placementBuildingType: BuildingType | null = null;
    placementStart: { x: number, y: number } | null = null;
    private wasMouseDown: boolean = false;

    constructor(private canvas: HTMLCanvasElement) {
        this.camera = new Camera(canvas.width, canvas.height);
        this.renderer = new Renderer(canvas.getContext('2d')!, this.camera);
        this.input = new InputHandler(canvas);
        this.state = new GameState();
        this.loop = new GameLoop(this.update, this.render);
        this.imageLoader = ImageLoader;

        // Load images
        ImageLoader.loadAllAssets().then(() => {
            console.log('All game assets loaded!');
        }).catch(err => {
            console.warn('Some assets failed to load:', err);
        });

        // Add test unit
        const u = new Unit(100, 100);
        this.state.addEntity(u);
        this.state.population.current++; // Count initial unit

        // Add Resources
        this.state.addEntity(new ResourceNode(300, 300, ResourceType.Gold));

        // Spawn Wood Cluster
        const woodStartX = 400;
        const woodStartY = 100;
        for (let i = 0; i < 10; i++) {
            const offsetX = (Math.random() - 0.5) * 100;
            const offsetY = (Math.random() - 0.5) * 100;
            this.state.addEntity(new ResourceNode(woodStartX + offsetX, woodStartY + offsetY, ResourceType.Wood));
        }

        this.state.addEntity(new ResourceNode(600, 400, ResourceType.Iron));
        this.state.addEntity(new ResourceNode(200, 600, ResourceType.Stone));
        this.state.addEntity(new ResourceNode(700, 200, ResourceType.Food)); // Berry Bush?

        // Add Town Center
        this.state.addEntity(new TownCenter(400, 250));

        // Handle resize
        const resize = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.camera.width = this.canvas.width;
            this.camera.height = this.canvas.height;
        };
        window.addEventListener('resize', resize);
        resize();
    }

    start() {
        this.loop.start();
    }

    stop() {
        this.loop.stop();
        this.input.destroy();
    }

    setPlacementMode(type: BuildingType) {
        this.placementMode = true;
        this.placementBuildingType = type;
        this.state.clearSelection();
    }

    cancelPlacement() {
        this.placementMode = false;
        this.placementBuildingType = null;
        this.placementStart = null;
    }

    private placeBuilding(x: number, y: number) {
        if (!this.placementBuildingType) return;


        if (this.placementBuildingType === BuildingType.Wall && this.placementStart) {
            // Wall Drag Logic
            this.placeWallSegment(this.placementStart.x, this.placementStart.y, x, y);
            this.placementStart = null; // Reset start after placement
            if (!this.input.isKeyPressed('ShiftLeft')) {
                this.cancelPlacement();
            }
            return;
        }

        // Single Building Placement
        const cost = BuildingCosts[this.placementBuildingType];

        // Check resources - Naive check, should move to better resource manager later
        if (this.state.resources.gold >= cost.gold &&
            this.state.resources.wood >= cost.wood &&
            this.state.resources.food >= cost.food &&
            this.state.resources.stone >= cost.stone) {

            // Deduct resources
            this.state.resources.gold -= cost.gold;
            this.state.resources.wood -= cost.wood;
            this.state.resources.food -= cost.food;
            this.state.resources.stone -= cost.stone;

            // Create building
            let building: Entity;
            switch (this.placementBuildingType) {
                case BuildingType.TownCenter: building = new TownCenter(x, y); break;
                case BuildingType.Barracks: building = new Barracks(x, y); break;
                case BuildingType.House:
                    building = new House(x, y);
                    this.state.population.max += 5;
                    break;
                case BuildingType.Tower: building = new Tower(x, y); break;
                case BuildingType.Wall:
                    // Should be handled by drag, but if single click:
                    building = new Wall(x, y);
                    break;
                default: return;
            }

            this.state.addEntity(building);

            // Exit placement mode unless Shift is held
            if (this.placementBuildingType !== BuildingType.Wall && !this.input.isKeyPressed('ShiftLeft')) {
                this.cancelPlacement();
            }
        } else {
            console.log("Not enough resources!");
        }
    }

    private placeWallSegment(x1: number, y1: number, x2: number, y2: number) {
        // Calculate angle and length
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        // Ensure minimum length
        const wallSize = 32;
        if (dist < wallSize) return;

        const count = Math.ceil(dist / wallSize); // Still use count for cost calculation
        const costPerWall = BuildingCosts[BuildingType.Wall];
        const totalCost = {
            gold: costPerWall.gold * count,
            wood: costPerWall.wood * count,
            food: costPerWall.food * count,
            stone: costPerWall.stone * count
        };

        if (this.state.resources.gold >= totalCost.gold &&
            this.state.resources.wood >= totalCost.wood &&
            this.state.resources.food >= totalCost.food &&
            this.state.resources.stone >= totalCost.stone) {

            this.state.resources.gold -= totalCost.gold;
            this.state.resources.wood -= totalCost.wood;
            this.state.resources.food -= totalCost.food;
            this.state.resources.stone -= totalCost.stone;

            // Place single wall entity at midpoint
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;

            this.state.addEntity(new Wall(midX, midY, dist, angle));
        } else {
            console.log("Not enough resources for wall!");
        }
    }

    trainUnit(building: Building, unitType: UnitType) {
        if (this.state.population.current >= this.state.population.max) {
            console.log("Population limit reached!");
            return;
        }

        const cost = UnitCosts[unitType];

        if (this.state.resources.gold >= cost.gold &&
            this.state.resources.wood >= cost.wood &&
            this.state.resources.food >= cost.food) {

            this.state.resources.gold -= cost.gold;
            this.state.resources.wood -= cost.wood;
            this.state.resources.food -= cost.food;

            // Pop Logic will be handled when unit actually spawns? 
            // Or reserve it now? Usually reserve. 
            // But `building.queueUnit` is just queue logic.
            // If we reserve now, we should inc pop. If we wait, we check then.
            // Typical RTS: Reserve cost immediately. Pop space is usually checked at start of queue or end.
            // Let's increment pop immediately to be safe for now, assuming 100% training success.
            // Wait, if it's queued, it takes time. 
            // Let's simplified: Check valid now. Add to pending? 
            // Simplest: `population.current++` when the unit is CREATED (spawned).
            // So we need to modify where the unit is spawned. 
            // `Building.ts` handles spawning. `Game.ts` just queues.
            // So we pass the check here, but the increment happens in `Building.update`?
            // Actually, we can just increment it here and decrement if cancelled.
            // Let's implement: Inc Pop Here. 
            this.state.population.current++;

            building.queueUnit(unitType);
            console.log(`Queued ${unitType} at ${building.type}`);
        } else {
            console.log("Not enough resources to train unit");
        }
    }

    private update = (deltaTime: number) => {
        // Camera movement
        const speed = 500 * deltaTime;
        if (this.input.isKeyPressed('KeyW') || this.input.isKeyPressed('ArrowUp')) this.camera.move(0, -speed);
        if (this.input.isKeyPressed('KeyS') || this.input.isKeyPressed('ArrowDown')) this.camera.move(0, speed);
        if (this.input.isKeyPressed('KeyA') || this.input.isKeyPressed('ArrowLeft')) this.camera.move(-speed, 0);
        if (this.input.isKeyPressed('KeyD') || this.input.isKeyPressed('ArrowRight')) this.camera.move(speed, 0);

        // Escape to Deselect / Cancel
        if (this.input.isKeyPressed('Escape')) {
            if (this.placementMode) {
                this.cancelPlacement();
            } else {
                this.state.clearSelection();
            }
        }

        // Mouse Click Latch (Simple "Just Pressed" detection)
        const isClick = !this.wasMouseDown && this.input.isMouseDown;
        this.wasMouseDown = this.input.isMouseDown;

        // Update Game State
        const collisionMap = this.getCollisionMap();
        this.state.update(deltaTime, collisionMap);

        // Interaction
        if (isClick) { // Left Click (Fresh press)
            const worldX = this.input.mousePos.x + this.camera.x;
            const worldY = this.input.mousePos.y + this.camera.y;

            if (this.placementMode && this.placementBuildingType) {
                if (this.placementBuildingType === BuildingType.Wall) {
                    if (!this.placementStart) {
                        this.placementStart = { x: worldX, y: worldY };
                    } else {
                        // Place wall from Start to Current
                        this.placeWallSegment(this.placementStart.x, this.placementStart.y, worldX, worldY);
                        this.placementStart = null;
                        if (!this.input.isKeyPressed('ShiftLeft')) {
                            this.cancelPlacement();
                        }
                    }
                } else {
                    this.placeBuilding(worldX, worldY);
                }
            } else {
                // Select
                const clicked = this.state.entities.find(e => e.contains(worldX, worldY));
                if (clicked) {
                    this.state.selectEntity(clicked.id, this.input.isKeyPressed('ShiftLeft'));
                } else {
                    this.state.clearSelection();
                }
            }
        }

        if (this.input.isRightMouseDown) { // Right Click - Move/Interact Command
            const worldX = this.input.mousePos.x + this.camera.x;
            const worldY = this.input.mousePos.y + this.camera.y;

            if (this.placementMode) {
                this.cancelPlacement();
            } else {
                // Move/Gather
                const target = this.state.entities.find(e => e.contains(worldX, worldY));

                // Calculate Collision Map
                const collisionMap = this.getCollisionMap();

                this.state.selection.forEach(id => {
                    const entity = this.state.entities.find(e => e.id === id);
                    if (entity && entity instanceof Unit) {
                        if (target && target.id !== entity.id) {
                            if (target instanceof ResourceNode) {
                                entity.gather(target);
                                // Calculate Path to resource
                                const path = Pathfinder.findPath(entity.position, target.position, collisionMap);
                                entity.setPath(path);
                            } else if (target instanceof Unit || target instanceof Building) {
                                entity.attackEntity(target);
                                // Calculate Path to target
                                const path = Pathfinder.findPath(entity.position, target.position, collisionMap);
                                entity.setPath(path);
                            }
                        } else {
                            // Pathfinding Move
                            const path = Pathfinder.findPath(
                                entity.position,
                                { x: worldX, y: worldY },
                                collisionMap
                            );
                            entity.setPath(path);
                        }
                    }
                });
            }
        }
    };

    private getCollisionMap(): boolean[][] {
        const width = 60;
        const height = 60;
        const gridSize = 32;
        const map: boolean[][] = Array(width).fill(false).map(() => Array(height).fill(false));

        this.state.entities.forEach(e => {
            // Only Buildings block path
            if (e instanceof Building) {
                if (e instanceof Wall) {
                    // Rasterize rotated wall
                    const wall = e as Wall;
                    // Walk along the wall length and mark grid cells
                    const dx = Math.cos(wall.rotation);
                    const dy = Math.sin(wall.rotation);

                    // Start from one end (-length/2) to other end (+length/2) relative to center
                    const halfLen = wall.length / 2;
                    // const segments = Math.ceil(wall.length / gridSize); // Only check every grid size step

                    for (let i = -halfLen; i <= halfLen; i += gridSize / 2) {
                        const wx = wall.position.x + dx * i;
                        const wy = wall.position.y + dy * i;

                        const gx = Math.floor(wx / gridSize);
                        const gy = Math.floor(wy / gridSize);

                        if (gx >= 0 && gx < width && gy >= 0 && gy < height) {
                            map[gx][gy] = true;
                        }
                    }
                } else {
                    const startX = Math.floor(e.position.x / gridSize);
                    const startY = Math.floor(e.position.y / gridSize);
                    const endX = Math.floor((e.position.x + e.size) / gridSize);
                    const endY = Math.floor((e.position.y + e.size) / gridSize);

                    for (let x = startX; x <= endX; x++) {
                        for (let y = startY; y <= endY; y++) {
                            if (x >= 0 && x < width && y >= 0 && y < height) {
                                map[x][y] = true;
                            }
                        }
                    }
                }
            }
        });

        return map;
    }

    private render = () => {
        this.renderer.clear();

        // Draw Grass Background
        const gridSize = 32;
        const mapWidth = 60; // 60x60 tiles
        const mapHeight = 60;
        const grassColor = '#4d7c0f'; // Grass green color
        this.renderer.drawRect(0, 0, mapWidth * gridSize, mapHeight * gridSize, grassColor);

        // Draw Entities
        this.state.entities.forEach(entity => {
            this.renderer.drawEntity(entity, this.imageLoader);
        });

        // Draw selection outlines are now handled in Renderer.drawEntity()

        // Render Placement Ghost
        if (this.placementMode && this.placementBuildingType) {
            const worldX = this.input.mousePos.x + this.camera.x;
            const worldY = this.input.mousePos.y + this.camera.y;
            const stats = BuildingStats[this.placementBuildingType];

            this.renderer.drawRect(
                worldX - stats.size / 2,
                worldY - stats.size / 2,
                stats.size,
                stats.size,
                'rgba(255, 255, 255, 0.5)'
            );

            // Range indicator
            const ctx = this.renderer.ctx;
            const screenX = worldX - this.camera.x;
            const screenY = worldY - this.camera.y;

            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.arc(screenX, screenY, stats.size * 1.5, 0, Math.PI * 2);
            ctx.stroke();
        }
    };
}
