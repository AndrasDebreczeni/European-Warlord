export type UpdateCallback = (deltaTime: number) => void;
export type RenderCallback = () => void;

export class GameLoop {
    private lastTime: number = 0;
    private accumulator: number = 0;
    private readonly step: number = 1 / 60;
    private frameId: number | null = null;

    constructor(private update: UpdateCallback, private render: RenderCallback) { }

    start() {
        if (this.frameId !== null) return;
        this.lastTime = performance.now();
        this.frameId = requestAnimationFrame(this.loop);
    }

    stop() {
        if (this.frameId !== null) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }
    }

    private loop = (time: number) => {
        // Cap max deltaTime to avoid spiral of death
        let deltaTime = (time - this.lastTime) / 1000;
        if (deltaTime > 0.25) deltaTime = 0.25;

        this.lastTime = time;

        this.accumulator += deltaTime;
        while (this.accumulator >= this.step) {
            this.update(this.step);
            this.accumulator -= this.step;
        }

        this.render();
        this.frameId = requestAnimationFrame(this.loop);
    };
}
