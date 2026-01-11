import { AUDIO_FILES } from './Constants.js';

export class AudioManager {
    constructor() {
        // Web Audio API Context
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.buffers = {};
        this.activeSources = {
            selection: null,
            move: null,
            music: null
        };
        this.initialized = false;

        // Preload sounds as ArrayBuffers
        // loadSounds() removed, called manually by Game
    }

    async loadAssets(onProgress) {
        const entries = Object.entries(AUDIO_FILES);
        const total = entries.length;
        let loaded = 0;

        for (const [key, path] of entries) {
            try {
                const response = await fetch(path);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
                this.buffers[key] = audioBuffer;
            } catch (e) {
                console.warn(`Failed to load sound: ${key}`, e);
            } finally {
                loaded++;
                if (onProgress) onProgress(loaded / total);
            }
        }
    }

    initContext() {
        if (this.initialized) return;

        // Resume context if suspended (browser autoplay policy)
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        // Play silent buffer to unlock
        const buffer = this.ctx.createBuffer(1, 1, 22050);
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.ctx.destination);
        source.start(0);

        this.initialized = true;
    }

    playOneShot(key, volume = 0.6) {
        if (!this.buffers[key]) return;

        const source = this.ctx.createBufferSource();
        source.buffer = this.buffers[key];

        const gainNode = this.ctx.createGain();
        gainNode.gain.value = volume;

        source.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        source.start(0);
    }

    playSelectionLoop(unitType) {
        this.stopSelectionLoop();

        let key = `select_${unitType}`;
        if (unitType === 'transformer' || unitType === 'pending_wall') {
            key = 'select_construction';
        }

        if (this.buffers[key]) {
            this.activeSources.selection = this.createLoopSource(key, 0.4);
        }
    }

    stopSelectionLoop() {
        if (this.activeSources.selection) {
            try { this.activeSources.selection.stop(); } catch (e) { }
            this.activeSources.selection = null;
        }
    }

    playMoveLoop(unitType) {
        this.stopMoveLoop();
        const key = `move_${unitType}`;

        if (this.buffers[key]) {
            this.activeSources.move = this.createLoopSource(key, 0.5);
        }
    }

    stopMoveLoop() {
        if (this.activeSources.move) {
            try { this.activeSources.move.stop(); } catch (e) { }
            this.activeSources.move = null;
        }
    }

    playMusic(key, volume = 0.2) {
        this.stopMusic();
        if (this.buffers[key]) {
            this.activeSources.music = this.createLoopSource(key, volume);
        }
    }

    stopMusic() {
        if (this.activeSources.music) {
            try { this.activeSources.music.stop(); } catch (e) { }
            this.activeSources.music = null;
        }
    }

    createLoopSource(key, volume) {
        if (!this.buffers[key]) return null;

        const source = this.ctx.createBufferSource();
        source.buffer = this.buffers[key];
        source.loop = true;

        const gainNode = this.ctx.createGain();
        gainNode.gain.value = volume;

        source.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        source.start(0);
        return source;
    }
}