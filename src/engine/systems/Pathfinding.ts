export class Pathfinding {
    // Simple A* or BFS for grid
    // Grid size is assumed 64x64
    private gridSize: number = 64;

    constructor(private mapWidth: number, private mapHeight: number) { }

    findPath(startX: number, startY: number, targetX: number, targetY: number): { x: number, y: number }[] {
        // Convert world coords to grid coords
        const startGrid = { x: Math.floor(startX / this.gridSize), y: Math.floor(startY / this.gridSize) };
        const targetGrid = { x: Math.floor(targetX / this.gridSize), y: Math.floor(targetY / this.gridSize) };

        // Simple direct path if not blocked (todo: add collision map)
        // For now, return a straight line equivalent or just the target

        // BFS implementation
        const queue: { x: number, y: number, path: { x: number, y: number }[] }[] = [];
        const visited = new Set<string>();

        queue.push({ x: startGrid.x, y: startGrid.y, path: [] });
        visited.add(`${startGrid.x},${startGrid.y}`);

        // Safety break
        let iterations = 0;

        while (queue.length > 0 && iterations < 1000) {
            iterations++;
            const current = queue.shift()!;

            if (current.x === targetGrid.x && current.y === targetGrid.y) {
                // Convert back to world center
                return current.path.map(p => ({
                    x: p.x * this.gridSize + this.gridSize / 2,
                    y: p.y * this.gridSize + this.gridSize / 2
                }));
            }

            const neighbors = [
                { x: current.x + 1, y: current.y },
                { x: current.x - 1, y: current.y },
                { x: current.x, y: current.y + 1 },
                { x: current.x, y: current.y - 1 },
            ];

            for (const n of neighbors) {
                if (n.x < 0 || n.y < 0 || n.x >= this.mapWidth || n.y >= this.mapHeight) continue;

                const key = `${n.x},${n.y}`;
                if (!visited.has(key)) {
                    visited.add(key);
                    // Heuristic optimization: prioritizing nodes closer to target in queue would make this A*
                    // For now, basic BFS

                    queue.push({
                        x: n.x, y: n.y,
                        path: [...current.path, { x: n.x, y: n.y }]
                    });
                }
            }
        }

        return [{ x: targetX, y: targetY }];
    }
}
