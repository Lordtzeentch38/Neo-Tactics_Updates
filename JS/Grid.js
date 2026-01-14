import { DEFAULT_BOARD_SIZE, TIBERIUM_TYPES } from './Constants.js';

export class Grid {
    constructor(size = DEFAULT_BOARD_SIZE) {
        this.size = size;
        this.board = [];
    }

    generateMap() {
        this.board = [];
        const totalTiles = this.size * this.size;
        for (let i = 0; i < totalTiles; i++) {
            let type = 'ground';
            let tibData = null;
            const r = Math.random();
            if (r < 0.15) type = 'obstacle';
            else if (r < 0.25) {
                type = 'tiberium';
                const isLarge = Math.random() > 0.7;
                const tType = isLarge ? TIBERIUM_TYPES.large : TIBERIUM_TYPES.small;
                tibData = { ...tType, current: tType.max };
            }
            this.board.push({ id: i, type, tiberium: tibData });
        }

        // Dynamic SAFE ZONES (Corners)
        // TL(0,0), TR(N-1,0), BL(0,N-1), BR(N-1,N-1) + Neighbors
        const safeIndices = new Set();
        const corners = [
            0, this.size - 1,
            (this.size * (this.size - 1)), (this.size * this.size) - 1
        ];

        corners.forEach(corner => {
            safeIndices.add(corner);
            this.getNeighbors(corner).forEach(n => safeIndices.add(n));
        });

        safeIndices.forEach(i => {
            if (this.board[i]) {
                this.board[i].type = 'ground';
                this.board[i].tiberium = null;
            }
        });
    }

    getStepCost(fromIdx, toIdx) {
        const x1 = fromIdx % this.size, y1 = Math.floor(fromIdx / this.size);
        const x2 = toIdx % this.size, y2 = Math.floor(toIdx / this.size);
        return (x1 !== x2 && y1 !== y2) ? 2 : 1;
    }

    getNeighbors(idx) {
        const x = idx % this.size;
        const y = Math.floor(idx / this.size);
        const neighbors = [];
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < this.size && ny >= 0 && ny < this.size) {
                    neighbors.push(ny * this.size + nx);
                }
            }
        }
        return neighbors;
    }

    findPath(startIdx, endIdx, units) {
        let dist = {};
        let prev = {};
        let queue = [{ idx: startIdx, cost: 0 }];
        dist[startIdx] = 0;
        prev[startIdx] = null;

        while (queue.length > 0) {
            queue.sort((a, b) => a.cost - b.cost);
            let u = queue.shift();

            if (u.idx === endIdx) break;

            const neighbors = this.getNeighbors(u.idx);
            for (let v of neighbors) {
                if (this.board[v].type === 'obstacle') continue;
                // Check if unit exists at v (and is not the target)
                const unitAtV = units.find(unit => unit.index === v);
                if (unitAtV && v !== endIdx) continue;

                const stepCost = this.getStepCost(u.idx, v);
                const newCost = u.cost + stepCost;

                if (dist[v] === undefined || newCost < dist[v]) {
                    dist[v] = newCost;
                    prev[v] = u.idx;
                    queue.push({ idx: v, cost: newCost });
                }
            }
        }

        if (prev[endIdx] === undefined) return null;

        let path = [];
        let curr = endIdx;
        while (curr !== null) {
            path.push(curr);
            curr = prev[curr];
        }
        return path.reverse();
    }
}