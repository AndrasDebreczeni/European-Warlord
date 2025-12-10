import { GameLoop } from './GameLoop';
import { InputHandler } from './InputHandler';
import { Renderer, Camera } from './Renderer';
import { GameState } from './GameState';
import { Entity, Unit, ResourceNode, ResourceType, TownCenter, Barracks, Farm, Building } from './entities';
import { BuildingType, BuildingStats, BuildingCosts } from './data/BuildingRules';
import { UnitType, UnitCosts } from './data/UnitRules';
import { Pathfinder } from './Pathfinder';

export class Game {
    loop: GameLoop;
    input: InputHandler;
    renderer: Renderer;
    camera: Camera;
    state: GameState;

    // Building Placement
    placementMode: boolean = false;
    placementBuildingType: BuildingType | null = null;

    constructor(private canvas: HTMLCanvasElement) {
        this.camera = new Camera(canvas.width, canvas.height);
        this.renderer = new Renderer(canvas.getContext('2d')!, this.camera);
        this.input = new InputHandler(canvas);
        this.state = new GameState();
        this.loop = new GameLoop(this.update, this.render);

        // Add test unit
        const u = new Unit(100, 100);
        this.state.addEntity(u);

        // Add Resources
        this.state.addEntity(new ResourceNode(300, 300, ResourceType.Gold));
        this.state.addEntity(new ResourceNode(400, 100, ResourceType.Wood));
        this.state.addEntity(new ResourceNode(600, 400, ResourceType.Iron));
        this.state.addEntity(new ResourceNode(200, 600, ResourceType.Stone));
        this.state.addEntity(new ResourceNode(700, 200, ResourceType.Food)); // Berry Bush?

        // Add Town Center
        this.state.addEntity(new TownCenter(50, 250));

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
    }

    private placeBuilding(x: number, y: number) {
        if (!this.placementBuildingType) return;

        const cost = BuildingCosts[this.placementBuildingType];

        // Check resources - Naive check, should move to better resource manager later
        if (this.state.resources.gold >= cost.gold &&
            this.state.resources.wood >= cost.wood &&
            this.state.resources.food >= cost.food) {

            // Deduct resources
            this.state.resources.gold -= cost.gold;
            this.state.resources.wood -= cost.wood;
            this.state.resources.food -= cost.food;

            // Create building
            let building: Entity;
            switch (this.placementBuildingType) {
                case BuildingType.TownCenter: building = new TownCenter(x, y); break;
                case BuildingType.Barracks: building = new Barracks(x, y); break;
                case BuildingType.Farm: building = new Farm(x, y); break;
                default: return;
            }

            this.state.addEntity(building);

            // Exit placement mode unless Shift is held
            if (!this.input.isKeyPressed('ShiftLeft')) {
                this.cancelPlacement();
            }
        } else {
            console.log("Not enough resources!");
        }
    }

    trainUnit(building: Building, unitType: UnitType) {
        const cost = UnitCosts[unitType];

        if (this.state.resources.gold >= cost.gold &&
            this.state.resources.wood >= cost.wood &&
            this.state.resources.food >= cost.food) {

            this.state.resources.gold -= cost.gold;
            this.state.resources.wood -= cost.wood;
            this.state.resources.food -= cost.food;

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

        // Update Game State
        const collisionMap = this.getCollisionMap();
        this.state.update(deltaTime, collisionMap);

        // Interaction
        if (this.input.isMouseDown) { // Left Click
            const worldX = this.input.mousePos.x + this.camera.x;
            const worldY = this.input.mousePos.y + this.camera.y;

            if (this.placementMode && this.placementBuildingType) {
                this.placeBuilding(worldX, worldY);
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
            // Only Buildings and Resources block path
            // Units don't strictly block in this simple RTS (usually soft collision or ignored)
            if (e instanceof Building || e instanceof ResourceNode) {
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
        });

        return map;
    }

    private render = () => {
        this.renderer.clear();

        // Draw Grid
        const gridSize = 32;
        const mapWidth = 60; // 60x60 tiles
        const mapHeight = 60;

        for (let x = 0; x < mapWidth; x++) {
            for (let y = 0; y < mapHeight; y++) {
                const color = (x + y) % 2 === 0 ? '#334155' : '#475569';
                this.renderer.drawRect(x * gridSize, y * gridSize, gridSize, gridSize, color);
                this.renderer.drawRect(x * gridSize, y * gridSize, gridSize, gridSize, '#1e293b', true);
            }
        }

        // Draw Entities
        this.state.entities.forEach(entity => {
            this.renderer.drawEntity(entity);
        });

        // Draw selection outlines
        this.state.selection.forEach(id => {
            const entity = this.state.entities.find(e => e.id === id);
            if (entity) {
                this.renderer.drawRect(
                    entity.position.x - 2,
                    entity.position.y - 2,
                    entity.size + 4,
                    entity.size + 4,
                    '#00ff00',
                    true
                );
            }
        });

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
