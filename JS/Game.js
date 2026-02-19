import { UNIT_TYPES, DEFAULT_BOARD_SIZE } from './Constants.js';
import { Grid } from './Grid.js';
import { UI } from './UI.js';
import { AudioManager } from './AudioManager.js';

export class Game {
    constructor() {
        this.mapSize = DEFAULT_BOARD_SIZE; // Default Size
        this.grid = new Grid(this.mapSize);
        this.ui = new UI(this);
        this.audio = new AudioManager();
        this.units = [];
        this.turn = 1;
        this.playerTurn = true;
        this.resources = { player: 150, enemy: 150 };
        this.selectedUnit = null;
        this.builderMode = null;
        this.gameOver = false;
        this.isMoving = false;

        // Camera State
        this.camera = { x: 0, y: 0, zoom: 1, isDragging: false, lastX: 0, lastY: 0 };
        this.initCamera();

        // Start Screen Logic
        this.gameStarted = false;
        this.hasReadInfo = false;
        this.audioUnlocked = false;

        this.screens = {
            cover: document.getElementById('cover-screen'),
            info: document.getElementById('info-screen')
        };

        // Stats Tracking
        this.stats = {
            tiberiumMined: 0,
            unitsDestroyed: 0,
            unitsLost: 0,
            startTime: 0
        };

        this.bindScreenEvents();
        this.bindSettingsEvents();

        // START ASSET LOADING
        this.audio.loadAssets((progress) => this.onLoadingProgress(progress))
            .then(() => this.onLoadingComplete());

        document.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (btn && !btn.disabled && !btn.classList.contains('disabled')) {
                if (this.audio) this.audio.playOneShot('btn_click', 0.5);
            }
        });

        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    initCamera() {
        const viewport = document.getElementById('game-viewport');
        const world = document.getElementById('game-world');

        // Zoom (Wheel)
        // Zoom (Wheel) - MOUSE CENTERED
        viewport.addEventListener('wheel', (e) => {
            e.preventDefault();

            // 1. Get Mouse Position relative to Viewport
            const rect = viewport.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // 2. Calculate New Zoom
            const zoomSpeed = 0.1;
            const delta = e.deltaY > 0 ? -zoomSpeed : zoomSpeed;
            const newZoom = Math.min(Math.max(this.camera.zoom + delta, 0.5), 3);

            // 3. Calculate Scale Ratio
            // ratio = new / old
            const scaleRatio = newZoom / this.camera.zoom;

            // 4. Adjust Camera Position (Offset)
            // Formula: NewOffset = Mouse - (Mouse - OldOffset) * Ratio
            this.camera.x = mouseX - (mouseX - this.camera.x) * scaleRatio;
            this.camera.y = mouseY - (mouseY - this.camera.y) * scaleRatio;

            // 5. Apply New Zoom
            this.camera.zoom = newZoom;
            this.updateCamera();
        }, { passive: false });

        // Pan (Drag) - MIDDLE MOUSE ONLY
        viewport.addEventListener('mousedown', (e) => {
            if (e.button !== 1) return; // Only Middle Mouse (Wheel Click)
            e.preventDefault(); // Prevent scroll cursor
            this.camera.isDragging = true;
            this.camera.lastX = e.clientX;
            this.camera.lastY = e.clientY;
            viewport.style.cursor = 'grabbing';
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.camera.isDragging) return;
            const dx = e.clientX - this.camera.lastX;
            const dy = e.clientY - this.camera.lastY;

            this.camera.x += dx;
            this.camera.y += dy;

            this.camera.lastX = e.clientX;
            this.camera.lastY = e.clientY;

            this.updateCamera();
        });

        window.addEventListener('mouseup', () => {
            if (this.camera.isDragging) {
                this.camera.isDragging = false;
                viewport.style.cursor = 'default';
            }
        });
    }

    updateCamera() {
        const world = document.getElementById('game-world');
        if (world) {
            world.style.transform = `translate(${this.camera.x}px, ${this.camera.y}px) scale(${this.camera.zoom})`;
        }
    }

    resetCamera() {
        const viewport = document.getElementById('game-viewport');
        const viewportW = viewport ? viewport.clientWidth : window.innerWidth;
        const boardW = this.mapSize * 64; // 64px TILE_SIZE
        const offsetX = (viewportW - boardW) / 2;

        this.camera.x = offsetX;
        this.camera.y = 0; // Top aligned
        this.camera.zoom = 1;

        // Ensure update
        this.updateCamera();
    }

    bindSettingsEvents() {
        const modal = document.getElementById('modal-settings');
        const btnOptions = document.getElementById('btn-options');
        const btnClose = document.getElementById('btn-close-settings');
        const sizeBtns = document.querySelectorAll('.settings-opt-btn');
        const volSlider = document.getElementById('vol-slider');
        const muteBtn = document.getElementById('btn-mute');

        btnOptions.onclick = () => {
            modal.classList.add('active');
            // Ensure audio context is ready if user interacts here
            if (!this.audioUnlocked) {
                this.audio.initContext();
                this.audio.playMusic('bgm_menu', 0.4);
                this.audioUnlocked = true;
            }
        };

        btnClose.onclick = () => modal.classList.remove('active');

        sizeBtns.forEach(btn => {
            btn.onclick = (e) => {
                sizeBtns.forEach(b => b.classList.remove('active', 'border-blue-400/50', 'bg-blue-500/20'));
                e.target.classList.add('active', 'border-blue-400/50', 'bg-blue-500/20');
                this.mapSize = parseInt(e.target.dataset.size);
            };
        });

        volSlider.oninput = (e) => {
            const vol = parseFloat(e.target.value);
            this.audio.setMusicVolume(vol); // ONLY MUSIC
        };

        muteBtn.onclick = () => {
            const isMuted = this.audio.toggleMusicMute(); // ONLY MUSIC
            muteBtn.innerText = isMuted ? "MUTE: ON" : "MUTE: OFF";
            muteBtn.classList.toggle('text-red-400', isMuted);
        };
    }

    onLoadingProgress(percent) {
        const fill = document.getElementById('loading-bar-fill');
        const text = document.getElementById('loading-text');
        if (fill) fill.style.width = `${percent * 100}%`;
        if (text) text.innerText = `${Math.floor(percent * 100)}%`;
    }

    onLoadingComplete() {
        const loader = document.getElementById('loading-container');
        const btnInfo = document.getElementById('btn-info');
        const unlockMsg = document.getElementById('unlock-msg');
        if (loader) loader.classList.add('hidden');
        if (unlockMsg) unlockMsg.classList.remove('hidden');
        if (btnInfo) {
            btnInfo.disabled = false;
            btnInfo.classList.remove('disabled');
            btnInfo.classList.add('pulse');
        }
    }

    bindScreenEvents() {
        document.getElementById('btn-info').onclick = () => this.showInfo();
        document.getElementById('btn-back').onclick = () => this.showCover();
        document.getElementById('btn-start').onclick = () => this.startGame();
        document.getElementById('btn-restart').onclick = () => this.resetGame();
    }

    showInfo() {
        this.contextUnlocked = true;
        if (!this.audioUnlocked) {
            this.audio.initContext();
            this.audio.playMusic('bgm_menu', 0.4);
            this.audioUnlocked = true;
        }
        this.screens.cover.classList.add('hidden');
        this.screens.cover.classList.remove('active');
        this.screens.info.classList.remove('hidden');
        this.screens.info.classList.add('active');
        this.hasReadInfo = true;
        this.enablePlayButton();
    }

    showCover() {
        this.screens.info.classList.add('hidden');
        this.screens.info.classList.remove('active');
        this.screens.cover.classList.remove('hidden');
        this.screens.cover.classList.add('active');
    }

    enablePlayButton() {
        const btnStart = document.getElementById('btn-start');
        const btnOptions = document.getElementById('btn-options'); // Options unlocked with Start
        const msg = document.getElementById('unlock-msg');

        btnStart.disabled = false;
        btnStart.classList.remove('disabled');
        btnStart.classList.add('pulse');

        btnOptions.disabled = false;
        btnOptions.classList.remove('disabled');
        // btnOptions.classList.add('pulse'); // Optional, mainly for start

        msg.style.opacity = '0';
    }

    startGame() {
        this.screens.cover.classList.add('hidden');
        this.screens.cover.classList.remove('active');
        this.gameStarted = true;
        this.stats.startTime = Date.now();
        this.audio.playMusic('bgm_game', 0.2);
        this.init();
    }

    init() {
        // Re-initialize Grid with selected size
        this.grid = new Grid(this.mapSize);
        // Clean UI Grid Style
        document.documentElement.style.setProperty('--board-size', this.mapSize);

        this.grid.generateMap();
        this.spawnStartingUnits();
        this.ui.renderGrid(this.grid.board); // Grid UI needs to support dynamic columns
        this.ui.syncUnits(this.units);
        this.ui.updateResources(this.resources.player, this.resources.enemy, this.turn);
        this.resetCamera();
    }

    spawnStartingUnits() {
        // Player: Fixed at Top-Left (0) + Scout (1)
        this.addUnit('base', 0, 'player');
        this.addUnit('scout', 1, 'player');

        // Enemy: Random in South-East Quadrant
        this.spawnEnemyBase();
    }

    spawnEnemyBase() {
        const mSize = this.mapSize;
        const minX = Math.floor(mSize / 2);
        const minY = Math.floor(mSize / 2);

        let validSpot = -1;
        let attempts = 0;

        while (validSpot === -1 && attempts < 100) {
            const rx = minX + Math.floor(Math.random() * (mSize - minX));
            const ry = minY + Math.floor(Math.random() * (mSize - minY));
            const idx = ry * mSize + rx;

            if (this.grid.board[idx].type !== 'obstacle') {
                validSpot = idx;
            }
            attempts++;
        }

        // Fallback if random fails (corner)
        if (validSpot === -1) validSpot = mSize * mSize - 1;

        // Spawn Base
        this.addUnit('base', validSpot, 'enemy');

        // Spawn Scout nearby
        const scoutIdx = this.findSpawnSpot(validSpot);
        if (scoutIdx !== -1) {
            this.addUnit('scout', scoutIdx, 'enemy');
        }
    }

    addUnit(type, index, owner) {
        const t = UNIT_TYPES[type];
        const u = {
            id: Math.random().toString(36).substr(2),
            type, ...t, maxHp: t.hp, owner, index,
            currentMove: t.maxMove,
            attacksLeft: t.maxAttacks,
            rotation: owner === 'player' ? 0 : 180,
            constructionTime: 0,
            transformTarget: null
        };
        this.units.push(u);
        return u;
    }

    getUnitAt(i) { return this.units.find(u => u.index == i); }
    dist(a, b) { return Math.abs((a % this.mapSize) - (b % this.mapSize)) + Math.abs(Math.floor(a / this.mapSize) - Math.floor(b / this.mapSize)); }
    sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    handleTileClick(i) {
        // Sblocca audio al primo click (safety)
        this.audio.initContext();

        // Check is game started
        if (!this.gameStarted || !this.playerTurn || this.gameOver || this.isMoving) return;

        // Builder Mode
        if (this.selectedUnit && this.selectedUnit.type === 'builder' && this.builderMode === 'wall') {
            const tile = document.querySelector(`.tile[data-index="${i}"]`);
            if (tile.classList.contains('build-target')) {
                this.executeBuildWall(i);
                return;
            } else {
                this.builderMode = null;
                this.refreshHighlights();
            }
        }

        // Repair Mode
        if (this.selectedUnit && this.selectedUnit.type === 'builder' && this.builderMode === 'repair') {
            const tile = document.querySelector(`.tile[data-index="${i}"]`);
            if (tile.classList.contains('repair-target-player')) {
                const target = this.getUnitAt(i);
                this.executeRepair(target);
                return;
            } else {
                this.builderMode = null;
                this.refreshHighlights();
            }
        }

        const u = this.getUnitAt(i);
        const tile = document.querySelector(`.tile[data-index="${i}"]`);

        // Attack
        if (this.selectedUnit && this.selectedUnit.owner === 'player' && u && u.owner !== 'player' && tile.classList.contains('valid-attack')) {
            this.combat(this.selectedUnit, u);
            return;
        }

        // Move
        if (this.selectedUnit && this.selectedUnit.owner === 'player' && !u && tile.classList.contains('valid-move')) {
            this.moveUnit(this.selectedUnit, i);
            return;
        }

        // Select
        // Select
        if (u) {
            // Se clicco la stessa unità, non riavviare il loop
            if (this.selectedUnit === u) return;

            this.selectedUnit = u;
            this.builderMode = null;

            // AUDIO: Play Selection Loop
            if (u.type === 'harvester' && this.grid.board[u.index].tiberium) {
                this.audio.playSelectionLoop('harvesting');
            } else {
                this.audio.playSelectionLoop(u.type);
            }

            this.ui.updateInfo(u, this.grid.board);
            this.ui.toggleMenus(u); // Restore menu update
            this.refreshHighlights();
        } else {
            // Deselect (Clicked empty space)
            if (this.selectedUnit) {
                this.selectedUnit = null;
                this.builderMode = null;

                // AUDIO: Stop Loop
                this.audio.stopSelectionLoop();

                this.ui.toggleMenus(null);
                this.ui.infoPanel.style.opacity = '0';
                this.refreshHighlights();
            }
        }
    }

    handleTileRightClick(index, event) {
        if (this.gameOver) return;

        // Show context menu at mouse position with unit info
        const u = this.getUnitAt(index);
        console.log('Right Click at', index, 'Unit found:', u);
        this.ui.showContextMenu(event.clientX, event.clientY, u);
    }

    requestAbandonSession() {
        this.ui.showConfirmExit();
    }

    confirmAbandonSession() {
        this.resetGame();
    }

    resetGame() {
        // 1. Reset Game State
        this.gameStarted = false;
        this.gameOver = false;
        this.playerTurn = true;
        this.turn = 1;
        this.selectedUnit = null;
        this.builderMode = null;
        this.isCombat = false;
        this.units = [];
        this.resources = { player: 150, enemy: 150 };
        this.stats = { tiberiumMined: 0, unitsDestroyed: 0, unitsLost: 0, startTime: 0 };

        // 2. Stop Audio and Switch to Menu Music
        this.audio.stopSelectionLoop();
        this.audio.stopMoveLoop();
        this.audio.playMusic('bgm_menu', 0.4);

        // 3. UI Reset
        this.ui.hideConfirmExit();
        this.ui.hideContextMenu();
        this.ui.toggleMenus(null);
        this.ui.infoPanel.style.opacity = '0';
        this.ui.renderGrid([]); // Clear grid visual

        // Hide Game Over Modal if active
        document.getElementById('modal-gameover').classList.remove('active');

        // 4. Show Cover
        this.showCover();
    }

    refreshHighlights() {
        let moves = [];
        let attacks = [];
        let rangeTiles = [];

        if (this.selectedUnit && this.selectedUnit.owner === 'player' && !this.isMoving) {
            moves = this.getValidMoves(this.selectedUnit);
            attacks = this.getValidAttacks(this.selectedUnit);
        }

        // Show range for Turrets (Player or Enemy)
        if (this.selectedUnit && (this.selectedUnit.type === 'turret' || this.selectedUnit.type === 'deep_drill' || this.selectedUnit.type === 'missile_turret')) {
            rangeTiles = this.getTilesInRange(this.selectedUnit);
        }

        this.ui.refreshHighlights(this.selectedUnit, moves, attacks, this.builderMode, this.grid.board, this.units, rangeTiles);
    }

    getTilesInRange(unit) {
        let res = [];
        const sx = unit.index % this.mapSize;
        const sy = Math.floor(unit.index / this.mapSize);
        const r = Math.ceil(unit.range);
        const minR = unit.minRange || 0; // Support Min Range
        const mSize = this.mapSize;

        for (let y = -r; y <= r; y++) {
            for (let x = -r; x <= r; x++) {
                if (x === 0 && y === 0) continue;
                const dist = Math.sqrt(x * x + y * y);
                if (dist <= unit.range && dist >= minR) { // Check Min Range
                    const tx = sx + x;
                    const ty = sy + y;
                    if (tx >= 0 && tx < mSize && ty >= 0 && ty < mSize) {
                        res.push(ty * mSize + tx);
                    }
                }
            }
        }
        return res;
    }

    getValidMoves(unit) {
        if (unit.currentMove <= 0) return [];
        let dist = {};
        let validMoves = [];
        let queue = [{ idx: unit.index, cost: 0 }];
        dist[unit.index] = 0;

        while (queue.length > 0) {
            queue.sort((a, b) => a.cost - b.cost);
            let u = queue.shift();
            if (u.cost > unit.currentMove) continue;
            const neighbors = this.grid.getNeighbors(u.idx);
            for (let v of neighbors) {
                if (this.grid.board[v].type === 'obstacle') continue;
                if (this.getUnitAt(v)) continue;
                const stepCost = this.grid.getStepCost(u.idx, v);
                const newCost = u.cost + stepCost;
                if (newCost <= unit.currentMove) {
                    if (dist[v] === undefined || newCost < dist[v]) {
                        dist[v] = newCost;
                        queue.push({ idx: v, cost: newCost });
                        if (!validMoves.includes(v)) validMoves.push(v);
                    }
                }
            }
        }
        return validMoves;
    }

    getValidAttacks(unit) {
        if (unit.attacksLeft <= 0 || unit.constructionTime > 0) return [];
        let res = [];
        const sx = unit.index % this.mapSize;
        const sy = Math.floor(unit.index / this.mapSize);
        const r = Math.ceil(unit.range);
        for (let y = -r; y <= r; y++) {
            for (let x = -r; x <= r; x++) {
                if (x === 0 && y === 0) continue;
                const dist = Math.sqrt(x * x + y * y);
                const minR = unit.minRange || 0;
                if (dist <= unit.range && dist >= minR) {
                    const tx = sx + x;
                    const ty = sy + y;
                    if (tx >= 0 && tx < this.mapSize && ty >= 0 && ty < this.mapSize) {
                        const idx = ty * this.mapSize + tx;
                        const t = this.getUnitAt(idx);
                        if (t && t.owner !== unit.owner) res.push(idx);
                    }
                }
            }
        }
        return res;
    }

    async moveUnit(unit, targetIdx) {
        const path = this.grid.findPath(unit.index, targetIdx, this.units);
        if (!path || path.length < 2) return;
        this.isMoving = true;
        // this.ui.toggleMenus(null); // REMOVED: Keep menu open during move

        // AUDIO: Start Move Loop
        this.audio.playMoveLoop(unit.type);

        for (let i = 1; i < path.length; i++) {
            const nextIdx = path[i];
            const cost = this.grid.getStepCost(unit.index, nextIdx);
            if (unit.currentMove < cost) break;

            const curX = unit.index % this.mapSize;
            const curY = Math.floor(unit.index / this.mapSize);
            const tarX = nextIdx % this.mapSize;
            const tarY = Math.floor(nextIdx / this.mapSize);
            unit.rotation = Math.atan2(tarY - curY, tarX - curX) * (180 / Math.PI);

            unit.index = nextIdx;
            unit.currentMove -= cost;
            this.ui.syncUnits(this.units);
            this.ui.updateInfo(unit, this.grid.board);

            // Check overwatch for everyone (Player moves -> Enemy shoots; Enemy moves -> Player shoots)
            const killed = await this.checkOverwatch(unit);
            if (killed) break;
            await this.sleep(200);
        }

        // AUDIO: Stop Move Loop
        this.audio.stopMoveLoop();

        this.isMoving = false;
        this.refreshHighlights();
    }

    async fireProjectile(startIdx, endIdx, type) {
        return new Promise(resolve => {
            const world = document.getElementById('game-world');
            const p = document.createElement('div');
            p.className = `projectile-missile`;

            // Calculate positions
            const sx = (startIdx % this.mapSize) * 64 + 32;
            const sy = Math.floor(startIdx / this.mapSize) * 64 + 32;
            const ex = (endIdx % this.mapSize) * 64 + 32;
            const ey = Math.floor(endIdx / this.mapSize) * 64 + 32;

            // Start position
            p.style.left = `${sx}px`;
            p.style.top = `${sy}px`;

            // Rotation
            const angle = Math.atan2(ey - sy, ex - sx) * (180 / Math.PI);
            p.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;

            world.appendChild(p);

            // Animate
            // Duration based on distance? Let's say fixed speed.
            const dist = Math.sqrt(Math.pow(ex - sx, 2) + Math.pow(ey - sy, 2));
            const duration = Math.max(300, dist * 5.0); // Slower for visibility

            p.animate([
                { left: `${sx}px`, top: `${sy}px` },
                { left: `${ex}px`, top: `${ey}px` }
            ], {
                duration: duration,
                easing: 'linear',
                fill: 'forwards'
            }).onfinish = () => {
                p.remove();
                resolve();
            };
        });
    }

    async combat(atk, def, isAutomated = false) {
        // PER-UNIT LOCK: Check if unit has actions and consume immediately
        if (atk.attacksLeft <= 0) return;
        atk.attacksLeft--;

        // AUDIO: Attack Sound (Trigger IMMEDIATELY)
        this.audio.playOneShot(`atk_${atk.type}`);

        if (!isAutomated) {
            this.ui.updateInfo(atk, this.grid.board); // Update UI immediately to show consumed ACT

            const curX = atk.index % this.mapSize;
            const curY = Math.floor(atk.index / this.mapSize);
            const tarX = def.index % this.mapSize;
            const tarY = Math.floor(def.index / this.mapSize);

            // Force rotation for EVERY unit attacking manually, including turrets
            atk.rotation = Math.atan2(tarY - curY, tarX - curX) * (180 / Math.PI);
            this.ui.syncUnits(this.units);
        }

        const atkEl = document.querySelector(`[data-uid="${atk.id}"]`);

        // Animation Logic
        if (atkEl) {
            const sx = atk.index % this.mapSize, sy = Math.floor(atk.index / this.mapSize);
            const tx = def.index % this.mapSize, ty = Math.floor(def.index / this.mapSize);

            // ARTILLERY RECOIL & MISSILE
            if (atk.type === 'artillery' || atk.type === 'missile_turret') {
                if (atk.type === 'artillery') {
                    // Recoil Logic for Artillery
                    const dx = (tx - sx) * 8;
                    const dy = (ty - sy) * 8;
                    atkEl.classList.add('unit-lunge');
                    atkEl.style.transform = `translate(${-dx}%, ${-dy}%)`;

                    // Fire projectile (Async - distinct from animation)
                    const missileFlight = this.fireProjectile(atk.index, def.index, 'missile');

                    // Animation proceeds independently
                    await this.sleep(150);
                    atkEl.style.transform = `translate(0, 0)`;
                    await this.sleep(150);
                    atkEl.classList.remove('unit-lunge');

                    // Wait for impact
                    await missileFlight;
                    this.audio.playOneShot('explode', 0.8);
                } else {
                    // Just Fire for Turret (no recoil)
                    await this.fireProjectile(atk.index, def.index, 'missile');
                    this.audio.playOneShot('explode', 0.8);
                }
            }
            // MELEE / SHORT RANGE LUNGE
            else if (atk.range <= 2) {
                const dx = (tx - sx) * 25;
                const dy = (ty - sy) * 25;
                atkEl.classList.add('unit-lunge');
                atkEl.style.transform = `translate(${dx}%, ${dy}%)`;
                await this.sleep(100);
                atkEl.style.transform = `translate(0, 0)`;
                await this.sleep(100);
                atkEl.classList.remove('unit-lunge');
            }
        }

        const dmg = Math.max(1, atk.atk + Math.floor(Math.random() * 4) - 2);
        def.hp -= dmg;
        // atk.attacksLeft--; // REMOVED: Consumed at start

        this.ui.showFloat(def.index, `-${dmg}`, '#ef4444');

        const defEl = document.querySelector(`[data-uid="${def.id}"]`);
        if (defEl) {
            defEl.style.transform = "translate(2px, 2px)";
            setTimeout(() => defEl.style.transform = "translate(0,0)", 100);
        }

        if (def.hp <= 0) {
            // AUDIO: Explosion
            this.audio.playOneShot('explode');

            if (def.owner === 'enemy') this.stats.unitsDestroyed++; // STATS
            if (def.owner === 'player') this.stats.unitsLost++;     // STATS

            if (def.type === 'deep_drill') {
                this.grid.board[def.index].type = 'tiberium';
                this.grid.board[def.index].tiberium = { max: 500, current: 500, yield: 50, class: 'tib-large' };
                this.ui.renderGrid(this.grid.board);
                this.ui.showFloat(def.index, "DEBRIS FIELD", "#10b981");
            }

            this.units = this.units.filter(u => u !== def);

            // Se muore l'unità selezionata, ferma il loop audio
            if (this.selectedUnit === def) {
                this.selectedUnit = null;
                this.audio.stopSelectionLoop();
                this.ui.toggleMenus(null);
            }

            if (def.type === 'base') this.endGame(def.owner === 'enemy');
        }

        if (!isAutomated) {
            this.ui.updateInfo(atk, this.grid.board);
            this.ui.toggleMenus(atk);
            this.refreshHighlights();
        }
        this.ui.syncUnits(this.units);

        if (atk.owner === 'enemy' && atk.hp > 0 && (def.type === 'turret' || def.type === 'deep_drill')) {
            await this.triggerRetaliation(atk);
        }
    }

    async triggerRetaliation(enemyAttacker) {
        const defenders = this.units.filter(u =>
            u.owner === 'player' &&
            (u.type === 'turret' || u.type === 'deep_drill') &&
            u.attacksLeft > 0
        );

        for (const turret of defenders) {
            if (enemyAttacker.hp <= 0) break;
            if (this.isTargetInRange(turret, enemyAttacker)) {
                this.ui.showFloat(turret.index, "RETALIATION!", "#fbbf24");
                const curX = turret.index % this.mapSize; const curY = Math.floor(turret.index / this.mapSize);
                const tarX = enemyAttacker.index % this.mapSize; const tarY = Math.floor(enemyAttacker.index / this.mapSize);
                turret.rotation = Math.atan2(tarY - curY, tarX - curX) * (180 / Math.PI);
                this.ui.syncUnits(this.units);
                await this.sleep(200);
                await this.combat(turret, enemyAttacker, true);
            }
        }
    }

    // --- BUILDER LOGIC ---
    activateBuilderMode(mode) {
        if (this.isMoving) return; // Guard logic
        if (!this.selectedUnit || this.selectedUnit.type !== 'builder') return;
        if (this.selectedUnit.attacksLeft <= 0) { this.ui.showFloat(this.selectedUnit.index, "NO ACTIONS", "#ef4444"); return; }

        if (mode === 'wall') {
            if (this.resources.player < 5) { this.ui.showFloat(this.selectedUnit.index, "NEED 5 RES", "#ef4444"); return; }
            this.builderMode = 'wall';
        } else if (mode === 'repair') {
            this.builderMode = 'repair';
        }
        this.refreshHighlights();
    }

    executeRepair(targetUnit) {
        if (!targetUnit) return;
        if (targetUnit.owner !== this.selectedUnit.owner) {
            this.ui.showFloat(targetUnit.index, "CAN'T REPAIR ENEMY", "#ef4444");
            return;
        }

        const repairCost = Math.min(this.resources.player, targetUnit.maxHp - targetUnit.hp);

        if (repairCost <= 0) {
            this.ui.showFloat(targetUnit.index, "FULL HP", "#10b981");
            return;
        }

        // Apply Repair
        this.resources.player -= repairCost;
        targetUnit.hp += repairCost;

        // Cost Action? Maybe minimal cost or full action
        // For now, let's say it consumes action
        this.selectedUnit.attacksLeft = 0;
        // this.selectedUnit.currentMove = 0; // ALLOW MOVEMENT after repair
        this.builderMode = null;

        // Visuals
        this.ui.showFloat(targetUnit.index, `+${repairCost} HP`, "#00ffff");
        this.audio.playOneShot('transform', 1.5); // Reuse mechanic sound

        this.ui.syncUnits(this.units);
        this.ui.updateResources(this.resources.player, this.resources.enemy, this.turn);
        this.ui.toggleMenus(this.selectedUnit); // Keep menu open
        this.refreshHighlights();
    }

    executeBuildWall(targetIdx) {
        this.resources.player -= 5;
        const u = this.addUnit('pending_wall', targetIdx, 'player');
        u.constructionTime = 1;
        this.selectedUnit.attacksLeft = 0;
        this.selectedUnit.currentMove = 0;
        this.builderMode = null;

        // AUDIO: Transform/Build
        this.audio.playOneShot('transform');

        this.ui.syncUnits(this.units);
        this.ui.updateResources(this.resources.player, this.resources.enemy, this.turn);
        this.ui.showFloat(targetIdx, "BUILDING...", "#fbbf24");
        this.ui.toggleMenus(null);
        this.refreshHighlights();
    }

    transformBuilder(targetType = 'turret') {
        if (this.isMoving) return;
        if (!this.selectedUnit || this.selectedUnit.type !== 'builder') return;

        let cost = UNIT_TYPES[targetType].cost;
        let time = targetType === 'missile_turret' ? 3 : 2; // Auto-detect time based on type

        if (this.resources.player < cost) { this.ui.showFloat(this.selectedUnit.index, `NEED ${cost} RES`, "#ef4444"); return; }
        if (this.selectedUnit.attacksLeft <= 0) { this.ui.showFloat(this.selectedUnit.index, "NO ACTIONS", "#ef4444"); return; }

        this.resources.player -= cost;
        const u = this.selectedUnit;
        u.type = 'transformer';
        u.maxHp = UNIT_TYPES[targetType].hp;
        u.hp = u.maxHp;
        u.maxMove = 0; u.currentMove = 0; u.attacksLeft = 0;
        u.constructionTime = time;
        u.transformTarget = targetType;

        // AUDIO: Transform
        this.audio.playOneShot('transform');
        // Switch loop to construction loop
        this.audio.playSelectionLoop('transformer');

        this.ui.showFloat(u.index, "TRANSFORMING...", "#ef4444");
        this.ui.syncUnits(this.units);
        this.ui.updateResources(this.resources.player, this.resources.enemy, this.turn);
        this.ui.updateInfo(u, this.grid.board);
        this.ui.toggleMenus(null);
        this.refreshHighlights();
    }

    // --- HARVESTER LOGIC ---
    transformHarvester() {
        if (this.isMoving) return; // Guard logic
        if (!this.selectedUnit || this.selectedUnit.type !== 'harvester') return;

        let cost = UNIT_TYPES.deep_drill.cost;
        let time = 5;
        let targetType = 'deep_drill';

        if (this.resources.player < cost) { this.ui.showFloat(this.selectedUnit.index, `NEED ${cost} RES`, "#ef4444"); return; }

        this.resources.player -= cost;
        const u = this.selectedUnit;

        u.type = 'transformer';
        u.maxHp = UNIT_TYPES[targetType].hp;
        u.hp = u.maxHp;
        u.maxMove = 0; u.currentMove = 0; u.attacksLeft = 0;
        u.constructionTime = time;
        u.transformTarget = targetType;

        // AUDIO: Transform
        this.audio.playOneShot('transform');
        this.audio.playSelectionLoop('transformer');

        this.ui.showFloat(u.index, "DRILLING...", "#a855f7");
        this.ui.syncUnits(this.units);
        this.ui.updateResources(this.resources.player, this.resources.enemy, this.turn);
        this.ui.updateInfo(u, this.grid.board);
        this.ui.toggleMenus(null);
        this.refreshHighlights();
    }

    buildUnit(type) {
        if (this.isMoving) return; // Guard logic
        if (!this.selectedUnit || this.selectedUnit.type !== 'base') return;
        const cost = UNIT_TYPES[type].cost;
        if (this.resources.player < cost) { this.ui.showFloat(this.selectedUnit.index, "NO FUNDS", "#ef4444"); return; }
        const idx = this.findSpawnSpot(this.selectedUnit.index);
        if (idx !== -1) {
            this.resources.player -= cost;
            const u = this.addUnit(type, idx, 'player');
            u.currentMove = 0; u.attacksLeft = 0;
            // this.selectedUnit = null; // REMOVED: Keep base selected

            // AUDIO: Build/Spawn sound (using transform for now)
            this.audio.playOneShot('transform');
            // this.audio.stopSelectionLoop(); // REMOVED: Keep loop playing

            this.ui.toggleMenus(this.selectedUnit); // Keep menus open
            this.ui.syncUnits(this.units);
            this.ui.updateResources(this.resources.player, this.resources.enemy, this.turn);
        } else { this.ui.showFloat(this.selectedUnit.index, "BLOCKED", "#ef4444"); }
    }

    findSpawnSpot(baseIdx) {
        const bx = baseIdx % this.mapSize;
        const by = Math.floor(baseIdx / this.mapSize);
        for (let r = 1; r <= 2; r++) {
            for (let y = -r; y <= r; y++) {
                for (let x = -r; x <= r; x++) {
                    if (x === 0 && y === 0) continue;
                    const tx = bx + x;
                    const ty = by + y;
                    if (tx >= 0 && tx < this.mapSize && ty >= 0 && ty < this.mapSize) {
                        const idx = ty * this.mapSize + tx;
                        if (this.grid.board[idx].type !== 'obstacle' && !this.getUnitAt(idx)) {
                            return idx;
                        }
                    }
                }
            }
        }
        return -1;
    }

    // --- AI & TURNS ---
    // --- AI & TURNS ---
    async endTurn() {
        // AUDIO: End Turn (specific)
        this.audio.playOneShot('btn_end_turn');

        this.playerTurn = false;
        this.builderMode = null;
        this.ui.toggleMenus(null);
        this.ui.endTurnBtn.disabled = true;
        this.selectedUnit = null;

        // AUDIO: Stop loops on turn end
        this.audio.stopSelectionLoop();

        this.refreshHighlights();
        this.ui.indicator.innerText = "ENEMY TURN";
        this.ui.indicator.className = "text-xs font-bold text-red-500 animate-pulse";

        await this.sleep(800);
        this.processResources('enemy');
        this.ui.updateResources(this.resources.player, this.resources.enemy, this.turn);

        this.units.filter(u => u.owner === 'enemy').forEach(u => {
            u.currentMove = u.maxMove; u.attacksLeft = u.maxAttacks;
        });

        await this.runAITurn();

        this.units.filter(u => u.owner === 'player').forEach(u => {
            if (u.type === 'turret' || u.type === 'deep_drill') u.attacksLeft = u.maxAttacks;
            else { u.currentMove = u.maxMove; u.attacksLeft = u.maxAttacks; }
        });

        this.turn++;
        this.playerTurn = true;
        this.processResources('player');
        this.processConstruction();

        this.ui.indicator.innerText = "YOUR TURN";
        this.ui.indicator.className = "text-xs font-bold text-blue-400 animate-pulse";
        this.ui.endTurnBtn.disabled = false;
        this.ui.updateResources(this.resources.player, this.resources.enemy, this.turn);
    }

    processResources(owner) {
        const base = this.units.find(u => u.owner === owner && u.type === 'base');
        if (base) {
            this.resources[owner] += 20;
            if (owner === 'player') this.stats.tiberiumMined += 20; // STATS
            this.ui.showFloat(base.index, "+20", owner === 'player' ? '#4ade80' : '#f87171');
        }

        this.units.filter(u => u.owner === owner && u.type === 'deep_drill').forEach(u => {
            this.resources[owner] += 30;
            if (owner === 'player') this.stats.tiberiumMined += 30; // STATS
            this.ui.showFloat(u.index, "+30", owner === 'player' ? '#4ade80' : '#f87171');
        });

        this.units.filter(u => u.owner === owner && u.type === 'harvester').forEach(u => {
            const tile = this.grid.board[u.index];
            if (tile.tiberium) {
                const amount = Math.min(tile.tiberium.yield, tile.tiberium.current);
                this.resources[owner] += amount;
                if (owner === 'player') this.stats.tiberiumMined += amount; // STATS
                tile.tiberium.current -= amount;
                this.ui.showFloat(u.index, `+${amount}`, owner === 'player' ? '#4ade80' : '#f87171');
                if (tile.tiberium.current <= 0) {
                    tile.tiberium = null;
                    tile.type = 'ground';
                    this.ui.renderGrid(this.grid.board);
                }
            }
        });
    }

    processConstruction() {
        this.units.forEach(u => {
            if (u.constructionTime > 0) {
                u.constructionTime--;
                if (u.constructionTime <= 0) {
                    // AUDIO: Construction Complete
                    this.audio.playOneShot('transform');

                    if (u.type === 'pending_wall') {
                        u.type = 'wall';
                        u.name = UNIT_TYPES.wall.name;
                        u.desc = UNIT_TYPES.wall.desc;
                        u.maxHp = UNIT_TYPES.wall.hp;
                        u.hp = u.maxHp;
                        this.ui.showFloat(u.index, "WALL READY", "#10b981");
                    } else if (u.type === 'transformer') {
                        const targetType = u.transformTarget || 'turret';
                        u.type = targetType;
                        const t = UNIT_TYPES[targetType];
                        u.name = t.name;
                        u.desc = t.desc;
                        u.range = t.range;
                        u.minRange = t.minRange || 0; // Copy Min Range
                        u.atk = t.atk;
                        u.maxAttacks = t.maxAttacks;
                        u.attacksLeft = u.maxAttacks;
                        this.ui.showFloat(u.index, "READY", "#10b981");
                    }
                }
            }
        });
        this.ui.syncUnits(this.units);
    }

    async checkOverwatch(movingUnit) {
        // Defines who is shooting (The opposite of who is moving)
        const attackerOwner = movingUnit.owner === 'player' ? 'enemy' : 'player';
        const defendingOwner = movingUnit.owner;

        const turrets = this.units.filter(u => u.owner === attackerOwner && (u.type === 'turret' || u.type === 'deep_drill') && u.attacksLeft > 0);

        for (let t of turrets) {
            if (this.isTargetInRange(t, movingUnit)) {
                this.ui.showFloat(t.index, "OVERWATCH!", "#fbbf24");
                await this.sleep(200);
                const curX = t.index % this.mapSize; const curY = Math.floor(t.index / this.mapSize);
                const tarX = movingUnit.index % this.mapSize; const tarY = Math.floor(movingUnit.index / this.mapSize);
                t.rotation = Math.atan2(tarY - curY, tarX - curX) * (180 / Math.PI);
                this.ui.syncUnits(this.units);

                // Smart Firing Loop
                while (t.attacksLeft > 0) {
                    const potentialTargets = this.units.filter(u => u.owner === defendingOwner);
                    const validTargets = potentialTargets.filter(u => this.isTargetInRange(t, u));

                    if (validTargets.length === 0) break;

                    // Helper: Sort by HP (weakest first)
                    validTargets.sort((a, b) => a.hp - b.hp);
                    const target = validTargets[0];

                    await this.combat(t, target, true);
                    await this.sleep(250);

                    if (movingUnit.hp <= 0) return true;
                }
            }
        }
        return false;
    }

    isTargetInRange(attacker, target) {
        const sx = attacker.index % this.mapSize; const sy = Math.floor(attacker.index / this.mapSize);
        const tx = target.index % this.mapSize; const ty = Math.floor(target.index / this.mapSize);
        const dx = sx - tx; const dy = sy - ty;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minR = attacker.minRange || 0;
        return dist <= attacker.range && dist >= minR;
    }

    async runAITurn() {
        const aiUnits = this.units.filter(u => u.owner === 'enemy');
        const base = aiUnits.find(u => u.type === 'base');

        if (base) {
            const harvesters = aiUnits.filter(u => u.type === 'harvester').length;
            let buildChoice = null;
            if (harvesters === 0 && this.resources.enemy >= 100) buildChoice = 'harvester';
            else if (this.resources.enemy >= 150 && Math.random() > 0.5) buildChoice = 'tank';
            else if (this.resources.enemy >= 120 && Math.random() > 0.6) buildChoice = 'artillery'; // AI Artillery
            else if (this.resources.enemy >= 50 && Math.random() > 0.6) buildChoice = 'scout';
            else if (this.resources.enemy >= 25 && Math.random() > 0.7) buildChoice = 'builder';

            if (buildChoice && this.resources.enemy >= UNIT_TYPES[buildChoice].cost) {
                const spawnIdx = this.findSpawnSpot(base.index);
                if (spawnIdx !== -1) {
                    this.resources.enemy -= UNIT_TYPES[buildChoice].cost;
                    const u = this.addUnit(buildChoice, spawnIdx, 'enemy');
                    this.ui.syncUnits(this.units);
                    this.ui.updateResources(this.resources.player, this.resources.enemy, this.turn);
                    await this.checkOverwatch(u);
                    await this.sleep(400);
                }
            }
        }

        const aliveAiUnits = this.units.filter(u => u.owner === 'enemy' && u.type !== 'base');
        for (const unit of aliveAiUnits) {
            if (!this.units.includes(unit)) continue;

            // --- AI BUILDER LOGIC ---
            if (unit.type === 'builder') {
                // 1. Check for Repair Targets
                const neighbors = this.grid.getNeighbors(unit.index);
                let repaired = false;
                for (let n of neighbors) {
                    const target = this.getUnitAt(n);
                    if (target && target.owner === 'enemy' && target.hp < target.maxHp) {
                        const repairCost = Math.min(this.resources.enemy, target.maxHp - target.hp);
                        if (repairCost > 0) {
                            this.resources.enemy -= repairCost;
                            target.hp += repairCost;
                            unit.attacksLeft = 0; // Consume action
                            this.ui.showFloat(target.index, `+${repairCost} HP`, "#10b981");
                            this.ui.showFloat(unit.index, "REPAIRING", "#10b981");
                            this.audio.playOneShot('transform', 1.5);
                            this.ui.syncUnits(this.units);
                            this.ui.updateResources(this.resources.player, this.resources.enemy, this.turn);
                            await this.sleep(400);
                            repaired = true;
                            break;
                        }
                    }
                }
                if (repaired) continue;

                const nearestPlayer = this.findNearestEnemy(unit.index);
                if (nearestPlayer) {
                    const d = this.dist(unit.index, nearestPlayer.index);
                    // AI Logic: Build Missile Turret if rich and enemy is far
                    if (d >= 4 && this.resources.enemy >= 100 && Math.random() > 0.4) {
                        this.resources.enemy -= 100;
                        unit.type = 'transformer';
                        unit.maxHp = UNIT_TYPES.missile_turret.hp;
                        unit.hp = unit.maxHp;
                        unit.maxMove = 0; unit.currentMove = 0; unit.attacksLeft = 0;
                        unit.constructionTime = 3;
                        unit.transformTarget = 'missile_turret';
                        this.ui.showFloat(unit.index, "MISSILE SYS...", "#ef4444");
                        this.ui.syncUnits(this.units);
                        await this.sleep(400);
                        continue;
                    }
                    // AI Logic: Standard Turret
                    if (d <= 5 && d >= 2 && this.resources.enemy >= 30) {
                        this.resources.enemy -= 30;
                        unit.type = 'transformer';
                        unit.maxHp = UNIT_TYPES.turret.hp;
                        unit.hp = unit.maxHp;
                        unit.maxMove = 0; unit.currentMove = 0; unit.attacksLeft = 0;
                        unit.constructionTime = 2;
                        unit.transformTarget = 'turret';
                        this.ui.showFloat(unit.index, "BUILDING...", "#ef4444");
                        this.ui.syncUnits(this.units);
                        await this.sleep(400);
                        continue;
                    }
                }
            }
            // ------------------------

            if (unit.type === 'harvester') {
                if (!this.grid.board[unit.index].tiberium) {
                    const target = this.findNearestTiberium(unit.index);
                    if (target !== -1) await this.moveUnit(unit, target);
                }
                continue;
            }
            let actionsTaken = true;
            while (actionsTaken && (unit.currentMove > 0 || unit.attacksLeft > 0)) {
                if (!this.units.includes(unit)) break;
                actionsTaken = false;
                if (unit.attacksLeft > 0) {
                    const attacks = this.getValidAttacks(unit);
                    if (attacks.length > 0) {
                        const targetIdx = attacks.sort((a, b) => this.getUnitAt(a).hp - this.getUnitAt(b).hp)[0];
                        await this.combat(unit, this.getUnitAt(targetIdx));
                        actionsTaken = true;
                        await this.sleep(500);
                        continue;
                    }
                }
                if (unit.currentMove > 0) {
                    const nearestEnemy = this.findNearestEnemy(unit.index);
                    if (nearestEnemy) {
                        const dist = this.dist(unit.index, nearestEnemy.index);
                        if (dist > unit.range) {
                            const path = this.grid.findPath(unit.index, nearestEnemy.index, this.units);
                            if (path && path.length > 1) {
                                let targetStepIdx = -1;
                                let simulatedMP = unit.currentMove;
                                for (let i = 1; i < path.length; i++) {
                                    const cost = this.grid.getStepCost(path[i - 1], path[i]);
                                    if (simulatedMP < cost) break;
                                    if (this.getUnitAt(path[i])) break;
                                    simulatedMP -= cost;
                                    targetStepIdx = path[i];
                                }
                                if (targetStepIdx !== -1 && targetStepIdx !== unit.index) {
                                    await this.moveUnit(unit, targetStepIdx);
                                    actionsTaken = true;
                                }
                            }
                        }
                    }
                }
                if (!actionsTaken) break;
            }
        }
    }

    findNearestTiberium(startIdx) {
        let best = -1, minD = 999;
        this.grid.board.forEach(t => {
            if (t.tiberium && !this.getUnitAt(t.id)) {
                const d = this.dist(startIdx, t.id);
                if (d < minD) { minD = d; best = t.id; }
            }
        });
        return best;
    }
    findNearestEnemy(startIdx) {
        let best = null, minD = 999;
        this.units.filter(u => u.owner === 'player' && u.type !== 'wall').forEach(u => {
            const d = this.dist(startIdx, u.index);
            if (d < minD) { minD = d; best = u; }
        });
        return best;
    }

    endGame(win) {
        this.gameOver = true;
        this.audio.stopSelectionLoop();
        this.audio.stopMoveLoop();

        const durationMs = Date.now() - this.stats.startTime;
        const minutes = Math.floor(durationMs / 60000);
        const seconds = Math.floor((durationMs % 60000) / 1000);
        const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        const m = document.getElementById('modal-gameover');
        const title = document.getElementById('modal-title');
        const img = document.getElementById('modal-img');
        const stats = document.getElementById('modal-stats');

        title.innerText = win ? "VICTORY" : "DEFEAT";
        title.className = win ? "text-4xl font-black mb-4 text-blue-400 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]" : "text-4xl font-black mb-4 text-red-500 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]";

        // Show Image
        img.src = win ? 'assets/images/Neo-Tactics-Victory.png' : 'assets/images/Neo-Tactics-Defeat.png';
        img.classList.remove('hidden');

        // Populate Stats
        stats.innerHTML = `
            <div class="font-bold">TIBERIUM MINED</div><div class="text-right text-green-400 font-mono">${this.stats.tiberiumMined}</div>
            <div class="font-bold">UNITS DESTROYED</div><div class="text-right text-orange-400 font-mono">${this.stats.unitsDestroyed}</div>
            <div class="font-bold">UNITS LOST</div><div class="text-right text-red-400 font-mono">${this.stats.unitsLost}</div>
            <div class="font-bold">TOTAL TURNS</div><div class="text-right text-white font-mono">${this.turn}</div>
            <div class="font-bold">MISSION TIME</div><div class="text-right text-blue-300 font-mono">${timeStr}</div>
        `;

        m.classList.add('active');
    }
}