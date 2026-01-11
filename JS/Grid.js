import { BOARD_SIZE, TIBERIUM_TYPES } from './Constants.js';

export class Grid {
    constructor() {
        this.board = [];
    }

    generateMap() {
        this.board = [];
        for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
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
        // Clear start areas
        [0,1,2,10,11,12, 99,98,97,89,88,87].forEach(i => {
            this.board[i].type = 'ground';
            this.board[i].tiberium = null;
        });
    }

    getStepCost(fromIdx, toIdx) {
        const x1 = fromIdx % 10, y1 = Math.floor(fromIdx / 10);
        const x2 = toIdx % 10, y2 = Math.floor(toIdx / 10);
        return (x1 !== x2 && y1 !== y2) ? 2 : 1;
    }

    getNeighbors(idx) {
        const x = idx % 10;
        const y = Math.floor(idx / 10);
        const neighbors = [];
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < 10 && ny >= 0 && ny < 10) {
                    neighbors.push(ny * 10 + nx);
                }
            }
        }
        return neighbors;
    }

    findPath(startIdx, endIdx, units) {
        let dist = {};
        let prev = {};
        let queue = [{idx: startIdx, cost: 0}];
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
                    queue.push({idx: v, cost: newCost});
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