import test from 'node:test';
import assert from 'node:assert';

// Mocking the environment
class MockGainNode {
    constructor() {
        this.gain = {
            value: 1,
            setValueAtTime: (val, time) => { this.gain.value = val; }
        };
    }
    connect(target) {}
}

class MockAudioBufferSourceNode {
    constructor() {
        this.buffer = null;
        this.loop = false;
    }
    connect(target) {}
    start(time) {}
    stop(time) {}
}

class MockAudioContext {
    constructor() {
        this.state = 'suspended';
        this.destination = {};
        this.currentTime = 0;
    }
    createGain() { return new MockGainNode(); }
    resume() { this.state = 'running'; return Promise.resolve(); }
    createBuffer(channels, length, sampleRate) { return {}; }
    createBufferSource() { return new MockAudioBufferSourceNode(); }
    decodeAudioData(arrayBuffer) { return Promise.resolve({}); }
}

global.window = {
    AudioContext: MockAudioContext
};

global.fetch = (url) => Promise.resolve({
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
});

import { AudioManager } from '../JS/AudioManager.js';

test('AudioManager initialization', async (t) => {
    const audioManager = new AudioManager();
    assert.strictEqual(audioManager.initialized, false);
    assert.ok(audioManager.musicGain);
    assert.ok(audioManager.sfxGain);
    assert.strictEqual(audioManager.musicGain.gain.value, 0.5);
    assert.strictEqual(audioManager.sfxGain.gain.value, 1.0);
});

test('AudioManager.setMusicVolume', async (t) => {
    const audioManager = new AudioManager();

    // Normal case
    audioManager.setMusicVolume(0.8);
    assert.strictEqual(audioManager.musicGain.gain.value, 0.8);

    // Muted case
    audioManager.toggleMusicMute(); // isMusicMuted = true
    audioManager.setMusicVolume(0.3);
    assert.strictEqual(audioManager.musicGain.gain.value, 0); // Should stay 0
    assert.strictEqual(audioManager.preMuteMusicVol, 0.3); // Should update preMuteMusicVol
});

test('AudioManager.toggleMusicMute', async (t) => {
    const audioManager = new AudioManager();
    audioManager.musicGain.gain.value = 0.5;

    // Mute
    const isMuted = audioManager.toggleMusicMute();
    assert.strictEqual(isMuted, true);
    assert.strictEqual(audioManager.isMusicMuted, true);
    assert.strictEqual(audioManager.musicGain.gain.value, 0);
    assert.strictEqual(audioManager.preMuteMusicVol, 0.5);

    // Unmute
    const isMuted2 = audioManager.toggleMusicMute();
    assert.strictEqual(isMuted2, false);
    assert.strictEqual(audioManager.isMusicMuted, false);
    assert.strictEqual(audioManager.musicGain.gain.value, 0.5);
});

test('AudioManager.loadAssets', async (t) => {
    const audioManager = new AudioManager();
    let progressValue = 0;
    await audioManager.loadAssets((p) => { progressValue = p; });

    assert.ok(Object.keys(audioManager.buffers).length > 0);
    assert.strictEqual(progressValue, 1);
});

test('AudioManager.initContext', async (t) => {
    const audioManager = new AudioManager();
    audioManager.initContext();
    assert.strictEqual(audioManager.initialized, true);
    assert.strictEqual(audioManager.ctx.state, 'running');
});

test('AudioManager.playOneShot', async (t) => {
    const audioManager = new AudioManager();
    await audioManager.loadAssets();

    // Should not throw even if key doesn't exist
    audioManager.playOneShot('non_existent');

    // Should play if key exists
    const key = Object.keys(audioManager.buffers)[0];
    audioManager.playOneShot(key);
});

test('AudioManager loops', async (t) => {
    const audioManager = new AudioManager();
    await audioManager.loadAssets();

    // Selection loop
    audioManager.playSelectionLoop('base');
    assert.ok(audioManager.activeSources.selection);
    audioManager.stopSelectionLoop();
    assert.strictEqual(audioManager.activeSources.selection, null);

    // Move loop
    audioManager.playMoveLoop('scout');
    assert.ok(audioManager.activeSources.move);
    audioManager.stopMoveLoop();
    assert.strictEqual(audioManager.activeSources.move, null);

    // Music
    const musicKey = 'bgm_game';
    audioManager.playMusic(musicKey);
    assert.ok(audioManager.activeSources.music);
    audioManager.stopMusic();
    assert.strictEqual(audioManager.activeSources.music, null);
});
