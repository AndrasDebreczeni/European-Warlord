export class Camera {
    x: number = 0;
    y: number = 0;
    constructor(public width: number, public height: number) { }

    move(dx: number, dy: number) {
        this.x += dx;
        this.y += dy;
    }
}


export class Renderer {
    constructor(private _ctx: CanvasRenderingContext2D, private camera: Camera) { }

    get ctx() { return this._ctx; }

    clear() {
        this._ctx.clearRect(0, 0, this.camera.width, this.camera.height);
        this._ctx.fillStyle = '#1a1a1a'; // Dark background
        this._ctx.fillRect(0, 0, this.camera.width, this.camera.height);
    }

    drawRect(x: number, y: number, w: number, h: number, color: string, stroke: boolean = false) {
        const screenX = x - this.camera.x;
        const screenY = y - this.camera.y;

        // Cull if out of screen
        if (screenX + w < 0 || screenX > this.camera.width ||
            screenY + h < 0 || screenY > this.camera.height) {
            return;
        }

        if (stroke) {
            this._ctx.strokeStyle = color;
            this._ctx.strokeRect(screenX, screenY, w, h);
        } else {
            this._ctx.fillStyle = color;
            this._ctx.fillRect(screenX, screenY, w, h);
        }
    }

    drawCircle(x: number, y: number, radius: number, color: string) {
        const screenX = x - this.camera.x;
        const screenY = y - this.camera.y;

        this._ctx.beginPath();
        this._ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
        this._ctx.fillStyle = color;
        this._ctx.fill();
    }

    drawText(text: string, x: number, y: number, color: string = '#fff', size: number = 12) {
        const screenX = x - this.camera.x;
        const screenY = y - this.camera.y;

        this._ctx.fillStyle = color;
        this._ctx.font = `${size}px sans-serif`;
        this._ctx.fillText(text, screenX, screenY);
    }

    drawResource(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, type: number, imageLoader?: any) {
        // ResourceType: Gold=0, Wood=1, Food=2, Iron=3, Stone=4
        let spriteName: string | null = null;

        switch (type) {
            case 1: spriteName = 'wood'; break;
            case 4: spriteName = 'stone'; break;
            case 0: spriteName = 'gold'; break;
            case 3: spriteName = 'iron'; break;
            case 2: spriteName = 'farm'; break;
        }

        if (spriteName && imageLoader) {
            const sprite = imageLoader.getImage(spriteName);
            if (sprite && sprite.complete) {
                // Draw resource sprite
                ctx.drawImage(sprite, x, y, size, size);
                return;
            }
        }

        // Fallback or Food (2)
        switch (type) {
            case 1: // Wood
                // Trunk
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(x + size * 0.4, y + size * 0.6, size * 0.2, size * 0.4);
                // Leaves
                ctx.fillStyle = '#166534';
                ctx.beginPath();
                ctx.arc(x + size / 2, y + size * 0.4, size * 0.4, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 4: // Stone
                ctx.fillStyle = '#57534e';
                ctx.beginPath();
                ctx.arc(x + size / 2, y + size / 2, size * 0.4, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 0: // Gold
                ctx.fillStyle = '#fbbf24';
                ctx.beginPath();
                ctx.arc(x + size * 0.3, y + size * 0.7, size * 0.2, 0, Math.PI * 2);
                ctx.arc(x + size * 0.7, y + size * 0.7, size * 0.2, 0, Math.PI * 2);
                ctx.arc(x + size * 0.5, y + size * 0.4, size * 0.25, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 2: // Food
                ctx.fillStyle = '#4d7c0f'; // Green bush
                ctx.beginPath();
                ctx.arc(x + size / 2, y + size / 2, size * 0.4, 0, Math.PI * 2);
                ctx.fill();
                // Berries
                ctx.fillStyle = '#dc2626';
                ctx.beginPath();
                ctx.arc(x + size * 0.3, y + size * 0.3, size * 0.1, 0, Math.PI * 2);
                ctx.arc(x + size * 0.7, y + size * 0.4, size * 0.1, 0, Math.PI * 2);
                ctx.arc(x + size * 0.5, y + size * 0.7, size * 0.1, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 3: // Iron
                ctx.fillStyle = '#94a3b8';
                ctx.fillRect(x + size * 0.2, y + size * 0.2, size * 0.6, size * 0.6);
                break;
            default:
                ctx.fillStyle = '#fff';
                ctx.fillRect(x, y, size, size);
                break;
        }
    }

    drawEntity(entity: any, imageLoader?: any) { // Using any for now to avoid circular dependency issues if strict
        const screenX = entity.position.x - this.camera.x;
        const screenY = entity.position.y - this.camera.y;

        // Cull
        if (screenX + entity.size < 0 || screenX > this.camera.width ||
            screenY + entity.size < 0 || screenY > this.camera.height) {
            return;
        }

        if (entity.hitTimer && entity.hitTimer > 0) {
            this._ctx.fillStyle = '#ffffff';
            this._ctx.fillRect(screenX, screenY, entity.size, entity.size);
            return;
        }

        // Custom Resource Rendering
        if (entity.type === 2) { // EntityType.Resource
            const rType = (entity as any).resourceType;
            let spriteName: string | null = null;
            if (rType !== undefined) {
                switch (rType) {
                    case 1: spriteName = 'wood'; break;
                    case 4: spriteName = 'stone'; break;
                    case 0: spriteName = 'gold'; break;
                    case 3: spriteName = 'iron'; break;
                    case 2: spriteName = 'farm'; break;
                }
            }

            if (spriteName && imageLoader) {
                const sprite = imageLoader.getImage(spriteName);
                if (sprite && sprite.complete) {
                    const spriteScale = 3.0; // 2x bigger for resources
                    const renderSize = entity.size * spriteScale;
                    const offset = (renderSize - entity.size) / 2;
                    this._ctx.drawImage(sprite, screenX - offset, screenY - offset, renderSize, renderSize);

                    // Track render size for selection box
                    entity._renderSize = renderSize;
                    entity._renderOffset = offset;

                    if (entity.selected) {
                        this._ctx.strokeStyle = '#00ff00';
                        this._ctx.lineWidth = 2;

                        // Apply sprite bounds if available
                        const bounds = spriteName && imageLoader ? imageLoader.getSpriteBounds(spriteName) : null;

                        if (bounds) {
                            const tightSize = renderSize * bounds.contentScale;
                            const sizeDiff = renderSize - tightSize;
                            const tightOffset = offset - sizeDiff / 2;

                            const offsetXPx = (bounds.offsetX || 0) * renderSize;
                            const offsetYPx = (bounds.offsetY || 0) * renderSize;

                            this._ctx.strokeRect(
                                screenX - tightOffset + offsetXPx,
                                screenY - tightOffset + offsetYPx,
                                tightSize,
                                tightSize
                            );
                        } else {
                            this._ctx.strokeRect(screenX - offset, screenY - offset, renderSize, renderSize);
                        }
                    }
                    return;
                }
            }

            if (rType !== undefined) {
                this.drawResource(this._ctx, screenX, screenY, entity.size, rType, imageLoader);
                if (entity.selected) {
                    this._ctx.strokeStyle = '#00ff00';
                    this._ctx.lineWidth = 2;
                    this._ctx.strokeRect(screenX, screenY, entity.size, entity.size);
                }
                return;
            }
        }

        // Try to draw sprite if available
        let spriteDrawn = false;
        if (imageLoader) {
            let spriteName: string | null = null;

            // Determine sprite name based on entity type
            if (entity.buildingType) {
                // It's a building
                const buildingTypeMap: { [key: string]: string } = {
                    'Town Center': 'town_center',
                    'Barracks': 'barracks',
                    'House': 'house',
                    'Tower': 'tower',
                    'Wall': 'wall'
                };
                spriteName = buildingTypeMap[entity.buildingType] || null;
            } else if (entity.unitType) {
                // It's a unit
                const unitTypeMap: { [key: string]: string } = {
                    'Swordsman': 'swordsman',
                    'Archer': 'archer',
                    'Knight': 'knight',
                    'Lancer': 'lancer',
                    'Horse Archer': 'horse_archer',
                    'Marauder': 'marauder',
                    'Huscarl': 'huscarl',
                    'Axethrower': 'axethrower',
                    'Berserker': 'berserker'
                };
                spriteName = unitTypeMap[entity.unitType] || null;
            }

            if (spriteName) {
                const sprite = imageLoader.getImage(spriteName);
                if (sprite && sprite.complete) {
                    // Scale sprites to be larger (4x the entity size)
                    const spriteScale = 4.0;
                    const renderSize = entity.size * spriteScale;
                    const offset = (renderSize - entity.size) / 2;
                    this._ctx.drawImage(sprite, screenX - offset, screenY - offset, renderSize, renderSize);
                    spriteDrawn = true;

                    // Store actual render size for selection box
                    entity._renderSize = renderSize;
                    entity._renderOffset = offset;
                }
            }
        }

        // Fallback to colored rectangle if no sprite
        if (!spriteDrawn) {
            this._ctx.fillStyle = entity.color;
            this._ctx.fillRect(screenX, screenY, entity.size, entity.size);
        }

        if (entity.selected) {
            this._ctx.strokeStyle = '#00ff00';
            this._ctx.lineWidth = 2;

            // Use sprite bounds if available to fit actual visible content
            if (entity._renderSize && entity._renderOffset && spriteDrawn) {
                // Try to get sprite bounds configuration
                let spriteName: string | null = null;
                if (entity.buildingType) {
                    const buildingTypeMap: { [key: string]: string } = {
                        'Town Center': 'town_center',
                        'Barracks': 'barracks',
                        'House': 'house',
                        'Tower': 'tower',
                        'Wall': 'wall'
                    };
                    spriteName = buildingTypeMap[entity.buildingType] || null;
                } else if (entity.unitType) {
                    const unitTypeMap: { [key: string]: string } = {
                        'Swordsman': 'swordsman',
                        'Archer': 'archer',
                        'Knight': 'knight',
                        'Lancer': 'lancer',
                        'Horse Archer': 'horse_archer',
                        'Marauder': 'marauder',
                        'Huscarl': 'huscarl',
                        'Axethrower': 'axethrower',
                        'Berserker': 'berserker'
                    };
                    spriteName = unitTypeMap[entity.unitType] || null;
                }

                const bounds = spriteName && imageLoader ? imageLoader.getSpriteBounds(spriteName) : null;

                if (bounds) {
                    // Calculate tight box based on content scale
                    const tightSize = entity._renderSize * bounds.contentScale;
                    const sizeDiff = entity._renderSize - tightSize;
                    const tightOffset = entity._renderOffset - sizeDiff / 2;

                    // Apply offset if content is not centered
                    const offsetXPx = (bounds.offsetX || 0) * entity._renderSize;
                    const offsetYPx = (bounds.offsetY || 0) * entity._renderSize;

                    this._ctx.strokeRect(
                        screenX - tightOffset + offsetXPx,
                        screenY - tightOffset + offsetYPx,
                        tightSize,
                        tightSize
                    );
                } else {
                    // Fallback to full sprite size
                    this._ctx.strokeRect(screenX - entity._renderOffset, screenY - entity._renderOffset, entity._renderSize, entity._renderSize);
                }
            } else {
                this._ctx.strokeRect(screenX, screenY, entity.size, entity.size);
            }
        }

        // Draw Health Bar
        if (entity.maxHealth && entity.health < entity.maxHealth) {
            const barWidth = (entity._renderSize && spriteDrawn) ? entity._renderSize : entity.size;
            const barHeight = 4;
            const barX = (entity._renderOffset && spriteDrawn) ? screenX - entity._renderOffset : screenX;
            const barY = (entity._renderOffset && spriteDrawn) ? screenY - entity._renderOffset - 8 : screenY - 8;

            // Background
            this._ctx.fillStyle = '#ef4444'; // Red-500
            this._ctx.fillRect(barX, barY, barWidth, barHeight);

            // Health
            const percent = Math.max(0, entity.health / entity.maxHealth);
            this._ctx.fillStyle = '#22c55e'; // Green-500
            this._ctx.fillRect(barX, barY, barWidth * percent, barHeight);

            // Border (optional, keeps it clean)
            // this._ctx.strokeStyle = '#000';
            // this._ctx.lineWidth = 1;
            // this._ctx.strokeRect(barX, barY, barWidth, barHeight);
        }
    }
}
