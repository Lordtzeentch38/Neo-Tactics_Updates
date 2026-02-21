import { ICONS } from './Constants.js';

export class UI {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.gridLayer = document.getElementById('grid-layer');
        this.unitLayer = document.getElementById('unit-layer');
        this.resPlayer = document.getElementById('res-player');
        this.resEnemy = document.getElementById('res-enemy');
        this.turn = document.getElementById('turn-display');
        this.indicator = document.getElementById('turn-indicator');
        this.infoPanel = document.getElementById('info-panel');

        // Menus
        this.buildMenu = document.getElementById('build-menu');
        this.actionMenu = document.getElementById('action-menu');
        this.harvesterMenu = document.getElementById('harvester-menu');
        this.barracksMenu = document.getElementById('barracks-menu');
        this.droneFactoryMenu = document.getElementById('drone-factory-menu');

        this.endTurnBtn = document.getElementById('btn-end-turn');
        this.endTurnBtn.addEventListener('click', () => this.game.endTurn());

        // Global Button Click Sound
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (btn && !btn.disabled && !btn.classList.contains('disabled')) {
                // Ensure audio is initialized/playing
                if (this.game.audio) this.game.audio.playOneShot('btn_click', 0.5);
            }
        });

        // --- CONTEXT MENU & MODALS ---
        this.ctxMenu = document.getElementById('context-menu');
        this.modalConfirm = document.getElementById('modal-confirm-exit');

        // Create Info Container for Context Menu (Dynamic)
        this.ctxInfo = document.createElement('div');
        this.ctxInfo.className = 'flex flex-col gap-2 mb-2 hidden border-b border-gray-700 pb-2';
        this.ctxMenu.insertBefore(this.ctxInfo, this.ctxMenu.firstChild);

        // Context Menu Buttons
        document.getElementById('ctx-options').onclick = () => console.log('Options clicked');
        document.getElementById('ctx-abandon').onclick = () => {
            this.hideContextMenu();
            this.game.requestAbandonSession();
        };

        // Modal Buttons
        document.getElementById('btn-cancel-exit').onclick = () => this.hideConfirmExit();
        document.getElementById('btn-confirm-exit').onclick = () => this.game.confirmAbandonSession();

        // Close context menu on global click
        document.addEventListener('click', () => this.hideContextMenu());
    }

    renderGrid(board) {
        this.gridLayer.innerHTML = '';
        board.forEach(t => {
            const el = document.createElement('div');
            el.className = 'tile';
            el.dataset.index = t.id;
            if (t.type === 'obstacle') el.innerHTML = '<div class="obstacle"></div>';
            else if (t.tiberium) el.innerHTML = `<div class="tiberium ${t.tiberium.class}"><div class="tib-crystal"></div></div>`;
            el.onclick = () => this.game.handleTileClick(t.id);
            el.onmouseenter = () => this.game.handleTileMouseEnter(t.id);
            el.oncontextmenu = (e) => {
                e.preventDefault();
                this.game.handleTileRightClick(t.id, e);
            };
            this.gridLayer.appendChild(el);
        });
    }

    syncUnits(units) {
        // 1. Rimuovi unità morte
        const existingEls = Array.from(this.unitLayer.children);
        existingEls.forEach(el => {
            const uid = el.dataset.uid;
            if (!units.find(u => u.id === uid)) el.remove();
        });

        // 2. Aggiorna o Crea unità
        units.forEach(u => {
            let el = this.unitLayer.querySelector(`[data-uid="${u.id}"]`);
            let isNew = false;

            // Se non esiste, crealo (STRUTTURA FISSA)
            if (!el) {
                el = document.createElement('div');
                el.className = 'unit-element';
                el.dataset.uid = u.id;
                el.onclick = (e) => { e.stopPropagation(); this.game.handleTileClick(u.index); };
                el.oncontextmenu = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.game.handleTileRightClick(u.index, e);
                };

                // Creiamo la struttura interna una volta sola
                el.innerHTML = `
                    <div class="mining-aura hidden"></div>
                    <div class="unit-inner"></div>
                    <div class="construction-light hidden"></div>
                    <div class="status-dots"></div>
                    <div class="hp-bar-container">
                        <div class="hp-bar"><div class="hp-fill"></div></div>
                    </div>
                    <div class="pending-bar-container hidden">
                        <div class="pending-bar"><div class="pending-fill"></div></div>
                    </div>
                `;
                this.unitLayer.appendChild(el);
                isNew = true;
            }

            // --- AGGIORNAMENTO PROPRIETÀ (Senza toccare innerHTML se non serve) ---

            // 1. Posizione
            const mapSize = this.game.mapSize || 10;
            const x = (u.index % mapSize) * 64;
            const y = Math.floor(u.index / mapSize) * 64;
            el.style.left = `${x}px`;
            el.style.top = `${y}px`;

            // Dimensione (Supporto 2x2)
            if (u.size === 2) {
                el.style.width = '128px';
                el.style.height = '128px';
                el.classList.add('unit-2x2');
            } else {
                el.style.width = '64px';
                el.style.height = '64px';
                el.classList.remove('unit-2x2');
            }

            // 2. Icona (Solo se cambia tipo o è nuovo)
            const inner = el.querySelector('.unit-inner');
            if (isNew || el.dataset.type !== u.type) {
                inner.innerHTML = ICONS[u.type];
                el.dataset.type = u.type;
            }

            // 3. Classi e Rotazione
            // Rimuovi vecchie classi di stato
            inner.classList.remove('unit-player', 'unit-enemy', 'unit-base', 'unit-wall', 'unit-pending');

            // Aggiungi nuove
            inner.classList.add(`unit-${u.owner}`);
            if (u.type === 'base') inner.classList.add('unit-base');
            if (u.type === 'wall') inner.classList.add('unit-wall');
            if (u.type === 'pending_wall' || u.type === 'transformer') inner.classList.add('unit-pending');

            inner.style.transform = `rotate(${u.rotation}deg)`;

            // 4. Mining Aura (Gestione visibilità)
            const aura = el.querySelector('.mining-aura');
            let isMining = false;
            if (u.type === 'harvester') {
                const tile = this.game.grid.board[u.index];
                if (tile && tile.tiberium) isMining = true;
            }
            if (isMining) aura.classList.remove('hidden');
            else aura.classList.add('hidden');

            // 5. Construction Light & Bars
            const light = el.querySelector('.construction-light');
            const hpContainer = el.querySelector('.hp-bar-container');
            const pendingContainer = el.querySelector('.pending-bar-container');
            const dotsContainer = el.querySelector('.status-dots');

            if (u.constructionTime > 0) {
                // Modalità Costruzione
                light.classList.remove('hidden');
                hpContainer.classList.add('hidden');
                dotsContainer.classList.add('hidden');
                pendingContainer.classList.remove('hidden');

                let maxTime = 1;
                if (u.type === 'transformer') {
                    if (u.transformTarget === 'deep_drill') maxTime = 5;
                    else if (u.transformTarget === 'barracks' || u.transformTarget === 'drone_factory') maxTime = 3;
                    else maxTime = 2;
                }
                const prog = ((maxTime - u.constructionTime) / maxTime) * 100;
                el.querySelector('.pending-fill').style.width = `${prog}%`;

            } else {
                // Modalità Normale
                light.classList.add('hidden');
                hpContainer.classList.remove('hidden');
                pendingContainer.classList.add('hidden');

                if (u.type !== 'wall') dotsContainer.classList.remove('hidden');
                else dotsContainer.classList.add('hidden');

                // HP Update
                const hpPct = (u.hp / u.maxHp) * 100;
                const hpColor = hpPct < 30 ? '#ef4444' : '#10b981';
                const hpFill = el.querySelector('.hp-fill');
                hpFill.style.width = `${hpPct}%`;
                hpFill.style.background = hpColor;

                // Dots Update (Ricostruiamo solo se cambia il numero per efficienza, o sempre per semplicità)
                let dotsHtml = '';
                for (let i = 0; i < u.attacksLeft; i++) dotsHtml += '<div class="dot"></div>';
                if (dotsContainer.innerHTML !== dotsHtml) dotsContainer.innerHTML = dotsHtml;
            }
        });
    }

    refreshHighlights(selectedUnit, validMoves, validAttacks, builderMode, board, units, rangeTiles = [], areaPreview = null) {
        document.querySelectorAll('.tile').forEach(el => {
            el.classList.remove('selected', 'selected-enemy', 'valid-move', 'valid-attack', 'build-target', 'range-highlight', 'repair-target-player', 'repair-target-enemy', 'area-preview-valid', 'area-preview-invalid');
            const i = parseInt(el.dataset.index);

            if (selectedUnit && selectedUnit.index === i) {
                el.classList.add('selected');
                if (selectedUnit.owner === 'enemy') el.classList.add('selected-enemy');
            }
        });

        // Apply Range Highlights
        if (rangeTiles && rangeTiles.length > 0) {
            rangeTiles.forEach(i => {
                const el = document.querySelector(`.tile[data-index="${i}"]`);
                if (el) el.classList.add('range-highlight');
            });
        }

        if (selectedUnit && selectedUnit.owner === 'player') {
            if (selectedUnit.constructionTime > 0) return;

            if (builderMode === 'wall') {
                const neighbors = this.game.grid.getNeighbors(selectedUnit.index);
                neighbors.forEach(n => {
                    if (!units.find(u => u.index === n) && board[n].type !== 'obstacle') {
                        document.querySelector(`.tile[data-index="${n}"]`).classList.add('build-target');
                    }
                });
                return;
            }

            if (builderMode === 'repair') {
                const neighbors = this.game.grid.getNeighbors(selectedUnit.index);
                neighbors.forEach(n => {
                    const target = units.find(u => u.index === n);
                    // RESTRICTION: Can only repair own units
                    if (target && target.hp < target.maxHp && target.owner === selectedUnit.owner) {
                        const el = document.querySelector(`.tile[data-index="${n}"]`);
                        el.classList.add('repair-target-player');
                    }
                });
                return;
            }

            validMoves.forEach(m => document.querySelector(`.tile[data-index="${m}"]`).classList.add('valid-move'));
            validAttacks.forEach(i => {
                const el = document.querySelector(`.tile[data-index="${i}"]`);
                if (el) {
                    el.classList.add('valid-attack');
                    el.classList.remove('range-highlight'); // Target overrides range
                }
            });
        }

        if (areaPreview) {
            areaPreview.indices.forEach(idx => {
                const el = this.gridLayer.querySelector(`.tile[data-index="${idx}"]`);
                if (el) {
                    el.classList.add(areaPreview.valid ? 'area-preview-valid' : 'area-preview-invalid');
                }
            });
        }
    }

    updateInfo(u, board) {
        this.infoPanel.style.opacity = '1';
        const nameEl = this.infoPanel.querySelector('#unit-name');
        nameEl.innerText = u.name;

        if (u.type === 'wall' || u.type === 'pending_wall') nameEl.className = "font-bold text-sm text-gray-400";
        else nameEl.className = u.owner === 'player' ? "font-bold text-sm text-blue-300" : "font-bold text-sm text-red-400";

        let description = u.desc;
        if (u.type === 'harvester') {
            const tile = board[u.index];
            if (tile.tiberium) {
                description = `TIBERIUM: ${Math.floor(tile.tiberium.current)} / ${tile.tiberium.max}`;
            }
        }
        this.infoPanel.querySelector('#unit-desc').innerText = description;
        this.infoPanel.querySelector('#unit-hp').innerText = `${u.hp}/${u.maxHp}`;
        this.infoPanel.querySelector('#unit-atk').innerText = `${u.attacksLeft}/${u.maxAttacks}`;
        this.infoPanel.querySelector('#unit-mov').innerText = `${u.currentMove}/${u.maxMove}`;
        this.infoPanel.querySelector('#unit-dmg').innerText = u.atk;
    }

    updateResources(resPlayer, resEnemy, turn) {
        this.resPlayer.innerText = Math.floor(resPlayer);
        this.resEnemy.innerText = Math.floor(resEnemy);
        this.turn.innerText = turn;
    }

    showFloat(idx, txt, col) {
        const el = document.querySelector(`.tile[data-index="${idx}"]`);
        if (el) {
            const f = document.createElement('div');
            f.className = 'float-text'; f.innerText = txt; f.style.color = col;
            el.appendChild(f); setTimeout(() => f.remove(), 1200);
        }
    }

    toggleMenus(u) {
        this.buildMenu.classList.add('hidden');
        this.actionMenu.classList.add('hidden');
        this.harvesterMenu.classList.add('hidden');
        this.barracksMenu.classList.add('hidden');
        this.droneFactoryMenu.classList.add('hidden');
        this.hideContextMenu(); // Ensure context menu is closed when selecting units

        if (u && u.owner === 'player') {
            if (u.type === 'base') {
                this.buildMenu.classList.remove('hidden');
            }
            else if (u.type === 'builder' && u.constructionTime === 0) {
                this.actionMenu.classList.remove('hidden');
            }
            else if (u.type === 'harvester' && u.constructionTime === 0) {
                this.harvesterMenu.classList.remove('hidden');
            }
            else if (u.type === 'barracks' && u.constructionTime === 0) {
                this.barracksMenu.classList.remove('hidden');
            }
            else if (u.type === 'drone_factory' && u.constructionTime === 0) {
                this.droneFactoryMenu.classList.remove('hidden');
            }
        }
    }

    showContextMenu(x, y, unit = null) {
        // Prevent menu from going off-screen
        const w = 220; // Corrected width for content
        const h = unit ? 250 : 80;  // Approx height
        if (x + w > window.innerWidth) x = window.innerWidth - w;
        if (y + h > window.innerHeight) y = window.innerHeight - h;

        // Populate Info if Unit exists
        if (unit) {
            const colorClass = unit.owner === 'player' ? 'text-blue-300' : 'text-red-400';
            this.ctxInfo.innerHTML = `
                <div class="flex items-center gap-2">
                    <img src="assets/images/units/${unit.type}.png" class="w-10 h-10 object-contain rounded border border-white/10 bg-black/40">
                    <div class="leading-none">
                        <div class="font-bold text-xs ${colorClass}">${unit.name.toUpperCase()}</div>
                        <div class="text-[9px] text-gray-400 italic">${unit.desc}</div>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] bg-black/20 p-1 rounded">
                    <div class="flex justify-between"><span class="text-gray-500">HP</span> <span class="text-white">${unit.hp}/${unit.maxHp}</span></div>
                    <div class="flex justify-between"><span class="text-gray-500">ATK</span> <span class="text-white">${unit.atk}x${unit.maxAttacks}</span></div>
                    <div class="flex justify-between"><span class="text-gray-500">MOV</span> <span class="text-white">${unit.maxMove}</span></div>
                    <div class="flex justify-between"><span class="text-gray-500">RNG</span> <span class="text-white">${unit.range}</span></div>
                </div>
            `;
            this.ctxInfo.classList.remove('hidden');
        } else {
            this.ctxInfo.classList.add('hidden');
        }

        this.ctxMenu.style.left = `${x}px`;
        this.ctxMenu.style.top = `${y}px`;
        this.ctxMenu.classList.remove('hidden');
        this.ctxMenu.classList.add('flex');
    }

    hideContextMenu() {
        if (this.ctxMenu) {
            this.ctxMenu.classList.add('hidden');
            this.ctxMenu.classList.remove('flex');
        }
    }

    showConfirmExit() {
        this.modalConfirm.classList.add('active');
    }

    hideConfirmExit() {
        this.modalConfirm.classList.remove('active');
    }
}