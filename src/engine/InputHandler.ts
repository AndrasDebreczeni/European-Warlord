export class InputHandler {
    keys: Set<string> = new Set();
    mousePos: { x: number; y: number } = { x: 0, y: 0 };
    isMouseDown: boolean = false;
    isRightMouseDown: boolean = false;

    // Clean up listeners if needed
    private cleanupFns: (() => void)[] = [];

    constructor(private canvas: HTMLCanvasElement) {
        this.init();
    }

    private init() {
        const onKeyDown = (e: KeyboardEvent) => this.keys.add(e.code);
        const onKeyUp = (e: KeyboardEvent) => this.keys.delete(e.code);

        const onMouseMove = (e: MouseEvent) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePos.x = e.clientX - rect.left;
            this.mousePos.y = e.clientY - rect.top;
        };

        const onMouseDown = (e: MouseEvent) => {
            if (e.button === 0) this.isMouseDown = true;
            if (e.button === 2) this.isRightMouseDown = true;
        };

        const onMouseUp = (e: MouseEvent) => {
            if (e.button === 0) this.isMouseDown = false;
            if (e.button === 2) this.isRightMouseDown = false;
        };

        const onContextMenu = (e: MouseEvent) => e.preventDefault();

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        this.canvas.addEventListener('mousemove', onMouseMove);
        this.canvas.addEventListener('mousedown', onMouseDown);
        this.canvas.addEventListener('mouseup', onMouseUp);
        this.canvas.addEventListener('contextmenu', onContextMenu);

        this.cleanupFns.push(() => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            this.canvas.removeEventListener('mousemove', onMouseMove);
            this.canvas.removeEventListener('mousedown', onMouseDown);
            this.canvas.removeEventListener('mouseup', onMouseUp);
            this.canvas.removeEventListener('contextmenu', onContextMenu);
        });
    }

    isKeyPressed(code: string): boolean {
        return this.keys.has(code);
    }

    destroy() {
        this.cleanupFns.forEach(fn => fn());
        this.cleanupFns = [];
    }
}
