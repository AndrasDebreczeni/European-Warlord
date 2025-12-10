export class ImageLoader {
    private static images: Map<string, HTMLImageElement> = new Map();
    private static loadedCount: number = 0;
    private static totalCount: number = 0;

    static async loadImage(name: string, path: string): Promise<HTMLImageElement> {
        if (this.images.has(name)) {
            return this.images.get(name)!;
        }

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                // Remove white/light backgrounds
                const processedImg = this.removeBackground(img);
                this.images.set(name, processedImg);
                this.loadedCount++;
                resolve(processedImg);
            };
            img.onerror = () => {
                console.warn(`Failed to load image: ${path}`);
                reject(new Error(`Failed to load image: ${path}`));
            };
            img.src = path;
            this.totalCount++;
        });
    }

    private static removeBackground(img: HTMLImageElement): HTMLImageElement {
        // Create a canvas to process the image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw the image
        ctx.drawImage(img, 0, 0);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Extremely aggressive background removal for all light colors
            const avg = (r + g + b) / 3;
            const colorVariance = Math.max(Math.abs(r - avg), Math.abs(g - avg), Math.abs(b - avg));

            // Remove backgrounds - catch white, cream, beige, tan, light brown, light gray
            if (avg > 140) {
                if (colorVariance < 30) {
                    // Low variance = solid background color - remove completely
                    data[i + 3] = 0;
                } else if (colorVariance < 60 && avg > 160) {
                    // Medium variance but still light - fade heavily
                    data[i + 3] = Math.floor(data[i + 3] * 0.15);
                } else if (avg > 190) {
                    // Very light - reduce significantly
                    data[i + 3] = Math.floor(data[i + 3] * 0.3);
                }
            }

            // Special case: catch beige/tan (higher red/yellow, less blue)
            if (r > 180 && g > 160 && b < 200 && b < g) {
                data[i + 3] = Math.floor(data[i + 3] * 0.2);
            }
        }

        // Put the modified data back
        ctx.putImageData(imageData, 0, 0);

        // Create a new image from the canvas
        const processedImg = new Image();
        processedImg.src = canvas.toDataURL();
        return processedImg;
    }

    static async loadAllAssets(): Promise<void> {
        const assetPath = '/assets/sprites';

        const assets = [
            // Buildings
            { name: 'town_center', path: `${assetPath}/town_center_sprite_1765406456673.png` },
            { name: 'barracks', path: `${assetPath}/barracks_sprite_1765406473381.png` },
            { name: 'house', path: `${assetPath}/house_sprite_1765406487904.png` },
            { name: 'tower', path: `${assetPath}/tower_sprite_1765406499947.png` },
            { name: 'wall', path: `${assetPath}/wall_sprite_1765406514413.png` },
            // Units
            { name: 'villager', path: `${assetPath}/villager_sprite_1765406526812.png` },
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
}
