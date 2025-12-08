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

    drawEntity(entity: any) { // Using any for now to avoid circular dependency issues if strict
        const screenX = entity.position.x - this.camera.x;
        const screenY = entity.position.y - this.camera.y;

        // Cull
        if (screenX + entity.size < 0 || screenX > this.camera.width ||
            screenY + entity.size < 0 || screenY > this.camera.height) {
            return;
        }

        this._ctx.fillStyle = entity.color;
        this._ctx.fillRect(screenX, screenY, entity.size, entity.size);

        if (entity.selected) {
            this._ctx.strokeStyle = '#00ff00';
            this._ctx.lineWidth = 2;
            this._ctx.strokeRect(screenX, screenY, entity.size, entity.size);
        }

        // Draw Health Bar
        if (entity.maxHealth && entity.health < entity.maxHealth) {
            const barWidth = entity.size;
            const barHeight = 4;
            const barX = screenX;
            const barY = screenY - 8;

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
