import { GameLoop } from './GameLoop';
import { InputHandler } from './InputHandler';
import { Renderer, Camera } from './Renderer';
import { GameState } from './GameState';
import { Entity, Unit, ResourceNode, ResourceType, TownCenter, Barracks, Farm, Building } from './entities';
import { BuildingType, BuildingStats, BuildingCosts } from './data/BuildingRules';
import { UnitType, UnitCosts } from './data/UnitRules';

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
        this.state.update(deltaTime);

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

                this.state.selection.forEach(id => {
                    const entity = this.state.entities.find(e => e.id === id);
                    if (entity && entity instanceof Unit) {
                        if (target && target.id !== entity.id) {
                            if (target instanceof ResourceNode) {
                                entity.gather(target);
                            } else if (target instanceof Unit || target instanceof Building) {
                                entity.attackEntity(target);
                            }
                        } else {
                            entity.moveTo(worldX, worldY);
                        }
                    }
                });
            }
        }
    };

    private render = () => {
        this.renderer.clear();

        // Draw Grid
        const gridSize = 64;
        const mapWidth = 30; // 30x30 tiles
        const mapHeight = 30;

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
