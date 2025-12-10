import { Vector2 } from './entities/Entity';

interface Node {
    x: number;
    y: number;
    g: number;
    h: number;
    f: number;
    parent: Node | null;
}

export class Pathfinder {
    static gridSize: number = 32;
    static width: number = 60;
    static height: number = 60;

    static findPath(start: Vector2, end: Vector2, collisionMap: boolean[][]): Vector2[] {
        // Convert world coords to grid coords
        const startX = Math.floor(start.x / this.gridSize);
        const startY = Math.floor(start.y / this.gridSize);
        let endX = Math.floor(end.x / this.gridSize);
        let endY = Math.floor(end.y / this.gridSize);

        // Bounds check
        if (!this.isValid(startX, startY) || !this.isValid(endX, endY)) {
            return []; // Invalid
        }

        // If end is blocked, find nearest valid neighbor
        if (collisionMap[endX] && collisionMap[endX][endY]) {
            let foundNeighbor = false;
            let bestNeighbor = { x: -1, y: -1 };
            let minDist = Infinity;

            const neighbors = [
                { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 },
                { x: -1, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: 1, y: 1 }
            ];

            for (const offset of neighbors) {
                const nx = endX + offset.x;
                const ny = endY + offset.y;

                if (this.isValid(nx, ny) && (!collisionMap[nx] || !collisionMap[nx][ny])) {
                    const dist = Math.pow(nx - startX, 2) + Math.pow(ny - startY, 2);
                    if (dist < minDist) {
                        minDist = dist;
                        bestNeighbor = { x: nx, y: ny };
                        foundNeighbor = true;
                    }
                }
            }

            if (foundNeighbor) {
                // Update target to the neighbor
                endX = bestNeighbor.x;
                endY = bestNeighbor.y;
            } else {
                return []; // Target blocked and no neighbors available
            }
        }

        const openList: Node[] = [];
        const closedList: boolean[][] = Array(this.width).fill(false).map(() => Array(this.height).fill(false));

        const startNode: Node = {
            x: startX,
            y: startY,
            g: 0,
            h: 0,
            f: 0,
            parent: null
        };

        openList.push(startNode);

        while (openList.length > 0) {
            // Get node with lowest f
            let currentNode = openList[0];
            let currentIndex = 0;

            for (let i = 1; i < openList.length; i++) {
                if (openList[i].f < currentNode.f) {
                    currentNode = openList[i];
                    currentIndex = i;
                }
            }

            // Remove from open, add to closed
            openList.splice(currentIndex, 1);
            closedList[currentNode.x][currentNode.y] = true;

            // Found goal
            if (currentNode.x === endX && currentNode.y === endY) {
                const path: Vector2[] = [];
                let curr: Node | null = currentNode;
                while (curr !== null) {
                    // Convert back to world center of tile
                    path.push({
                        x: curr.x * this.gridSize + this.gridSize / 2,
                        y: curr.y * this.gridSize + this.gridSize / 2
                    });
                    curr = curr.parent;
                }
                return path.reverse();
            }

            // Neighbors
            const neighbors = [
                { x: 0, y: -1 },
                { x: 0, y: 1 },
                { x: -1, y: 0 },
                { x: 1, y: 0 },
                // Diagonals? Maybe later. Simplifies movement to keep it cardinal for now, or add diagonals with 1.4 cost.
                { x: -1, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: 1, y: 1 }
            ];

            for (const offset of neighbors) {
                const nodeX = currentNode.x + offset.x;
                const nodeY = currentNode.y + offset.y;

                if (!this.isValid(nodeX, nodeY)) continue;
                if (closedList[nodeX][nodeY]) continue;
                if (collisionMap[nodeX] && collisionMap[nodeX][nodeY]) continue; // Blocked

                // Cost
                const moveCost = (offset.x !== 0 && offset.y !== 0) ? 1.414 : 1;
                const gScore = currentNode.g + moveCost;

                let neighborNode = openList.find(n => n.x === nodeX && n.y === nodeY);

                if (!neighborNode) {
                    neighborNode = {
                        x: nodeX,
                        y: nodeY,
                        g: gScore,
                        h: this.heuristic({ x: nodeX, y: nodeY }, { x: endX, y: endY }),
                        f: 0,
                        parent: currentNode
                    };
                    neighborNode.f = neighborNode.g + neighborNode.h;
                    openList.push(neighborNode);
                } else if (gScore < neighborNode.g) {
                    neighborNode.g = gScore;
                    neighborNode.parent = currentNode;
                    neighborNode.f = neighborNode.g + neighborNode.h;
                }
            }
        }

        return []; // No path found
    }

    static isValid(x: number, y: number): boolean {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    static heuristic(pos: { x: number, y: number }, end: { x: number, y: number }): number {
        // Euclidean for diagonals
        return Math.sqrt(Math.pow(pos.x - end.x, 2) + Math.pow(pos.y - end.y, 2));
    }
}
