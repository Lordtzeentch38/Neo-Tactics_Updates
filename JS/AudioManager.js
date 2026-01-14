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

        // Separate Gain Nodes
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.2; // Default Music Volume
        this.musicGain.connect(this.ctx.destination);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 1.0; // Default SFX Volume
        this.sfxGain.connect(this.ctx.destination);

        this.isMusicMuted = false;
        this.preMuteMusicVol = 0.2;
    }

    setMusicVolume(vol) {
        if (this.isMusicMuted) {
            this.preMuteMusicVol = vol;
        } else {
            this.musicGain.gain.setValueAtTime(vol, this.ctx.currentTime);
        }
    }

    toggleMusicMute() {
        this.isMusicMuted = !this.isMusicMuted;
        if (this.isMusicMuted) {
            this.preMuteMusicVol = this.musicGain.gain.value;
            this.musicGain.gain.setValueAtTime(0, this.ctx.currentTime);
        } else {
            this.musicGain.gain.setValueAtTime(this.preMuteMusicVol, this.ctx.currentTime);
        }
        return this.isMusicMuted;
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
        source.connect(this.sfxGain); // Connect to SFX (always enabled)
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
        gainNode.connect(this.sfxGain); // SFX Channel

        source.start(0);
    }

    playSelectionLoop(unitType) {
        this.stopSelectionLoop();

        let key = `select_${unitType}`;
        if (unitType === 'transformer' || unitType === 'pending_wall') {
            key = 'select_construction';
        }

        if (this.buffers[key]) {
            this.activeSources.selection = this.createLoopSource(key, 0.4, this.sfxGain);
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
            this.activeSources.move = this.createLoopSource(key, 0.5, this.sfxGain);
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
            // Volume is overridden by MusicGain, but individual track volume can still adjust relative mix
            // However, for simplicity, let's just use the musicGain for main control.
            // We pass 1.0 here so source->gain(1.0)->musicGain(controlled by slider)
            // Or we can pass the specific volume if we want track-specific leveling.
            this.activeSources.music = this.createLoopSource(key, 1.0, this.musicGain);
        }
        // Apply immediate volume set if needed, but setMusicVolume handles the gain node.
        if (!this.isMusicMuted) {
            // If we passed volume to createLoopSource, it's a local gain. 
            // The global volume is on musicGain.
            // If the user called playMusic with a specific volume, they might expect that track to be quieter.
            // But the request says "volume slider... only inherent to music".
            // So relying on musicGain is correct.
        }
    }

    stopMusic() {
        if (this.activeSources.music) {
            try { this.activeSources.music.stop(); } catch (e) { }
            this.activeSources.music = null;
        }
    }

    createLoopSource(key, volume, targetNode) {
        if (!this.buffers[key]) return null;

        const source = this.ctx.createBufferSource();
        source.buffer = this.buffers[key];
        source.loop = true;

        const gainNode = this.ctx.createGain();
        gainNode.gain.value = volume;

        source.connect(gainNode);
        gainNode.connect(targetNode); // Connect to specified channel (Music or SFX)

        source.start(0);
        return source;
    }
}