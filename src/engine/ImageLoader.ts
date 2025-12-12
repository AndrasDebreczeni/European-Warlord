interface SpriteBounds {
    // Scale of actual visual content relative to full sprite size (0-1)
    // e.g., 0.8 means 80% of sprite is visible content, 20% is transparent padding
    contentScale: number;
    // Optional offset from center if content is not centered in sprite
    offsetX?: number; // -0.5 to 0.5 (as fraction of sprite size)
    offsetY?: number; // -0.5 to 0.5 (as fraction of sprite size)
}

export class ImageLoader {
    private static images: Map<string, HTMLImageElement> = new Map();
    private static loadedCount: number = 0;
    private static totalCount: number = 0;

    // Sprite bounds configuration - defines visible content area within each sprite
    // Adjust these values to make selection boxes fit tighter or looser
    private static spriteBounds: Map<string, SpriteBounds> = new Map([
        // Buildings - typically have some padding around edges
        ['town_center', { contentScale: 0.85, offsetY: -0.05 }],
        ['barracks', { contentScale: 0.80 }],
        ['house', { contentScale: 0.75 }],
        ['tower', { contentScale: 0.75, offsetY: -0.05 }],
        ['wall', { contentScale: 0.90 }],

        // Resources - usually tighter sprites
        ['gold', { contentScale: 0.85 }],
        ['wood', { contentScale: 0.80, offsetY: -0.05 }],
        ['stone', { contentScale: 0.85 }],
        ['iron', { contentScale: 0.85 }],
        ['farm', { contentScale: 0.80 }],
    ]);

    static async loadImage(name: string, path: string): Promise<HTMLImageElement> {
        if (this.images.has(name)) {
            return this.images.get(name)!;
        }

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.images.set(name, img);
                this.loadedCount++;
                resolve(img);
            };
            img.onerror = () => {
                console.warn(`Failed to load image: ${path}`);
                reject(new Error(`Failed to load image: ${path}`));
            };
            img.src = path;
            this.totalCount++;
        });
    }

    static async loadAllAssets(): Promise<void> {
        const assetPath = '/assets/sprites';

        const assets = [
            // Buildings
            { name: 'town_center', path: `${assetPath}/town_center.png` },
            { name: 'barracks', path: `${assetPath}/barracks.png` },
            { name: 'house', path: `${assetPath}/house.png` },
            { name: 'tower', path: `${assetPath}/tower.png` },
            { name: 'wall', path: `${assetPath}/wall.png` },
            // Resources
            { name: 'gold', path: `${assetPath}/gold.png` },
            { name: 'wood', path: `${assetPath}/wood.png` },
            { name: 'stone', path: `${assetPath}/stone.png` },
            { name: 'iron', path: `${assetPath}/iron.png` },
            { name: 'farm', path: `${assetPath}/farm.png` },
        ];

        const promises = assets.map(asset =>
            this.loadImage(asset.name, asset.path).catch(() => {
                // Silently fail for missing images - will use fallback rendering
            })
        );

        await Promise.all(promises);
        console.log(`Loaded ${this.loadedCount}/${this.totalCount} images`);
    }

    static getImage(name: string): HTMLImageElement | null {
        return this.images.get(name) || null;
    }

    static isLoaded(): boolean {
        return this.loadedCount === this.totalCount;
    }

    static getSpriteBounds(name: string): SpriteBounds | null {
        return this.spriteBounds.get(name) || null;
    }
}
