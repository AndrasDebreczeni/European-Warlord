import React, { useEffect, useRef } from 'react';
import { Game } from '../engine/Game';
import { Building } from '../engine/entities/Building';
import { Unit } from '../engine/entities/Unit';
import { ResourceNode, ResourceType } from '../engine/entities/ResourceNode';

interface MinimapProps {
    game: Game;
}

export const Minimap: React.FC<MinimapProps> = ({ game }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        let animationFrameId: number;

        const render = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Clear
            ctx.fillStyle = '#0f172a'; // Slate 900
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Scale factors
            // Map is 30x30 tiles * 64px = 1920x1920 world size
            // Canvas is say 150x150
            const worldSize = 30 * 64;
            const scaleX = canvas.width / worldSize;
            const scaleY = canvas.height / worldSize;

            game.state.entities.forEach(entity => {
                let color = '#fff';
                // Simple dots
                if (entity instanceof ResourceNode) {
                    switch (entity.resourceType) {
                        case ResourceType.Gold: color = '#fbbf24'; break;
                        case ResourceType.Wood: color = '#166534'; break;
                        case ResourceType.Food: color = '#dc2626'; break;
                        case ResourceType.Iron: color = '#94a3b8'; break;
                        case ResourceType.Stone: color = '#57534e'; break;
                    }
                } else if (entity instanceof Building) {
                    color = '#3b82f6'; // Blue
                } else if (entity instanceof Unit) {
                    color = '#60a5fa'; // Light Blue
                }

                ctx.fillStyle = color;
                const size = Math.max(2, entity.size * scaleX);
                ctx.fillRect(entity.position.x * scaleX, entity.position.y * scaleY, size, size);
            });

            // Camera Viewport Box
            const cam = game.camera;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.strokeRect(cam.x * scaleX, cam.y * scaleY, cam.width * scaleX, cam.height * scaleY);

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [game]);

    return (
        <div className="absolute top-4 right-4 border-2 border-slate-600 bg-slate-900 shadow-lg">
            <canvas ref={canvasRef} width={150} height={150} className="block" />
        </div>
    );
};
