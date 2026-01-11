import { Game } from './Game.js';

// Inizializza il gioco
const game = new Game();

// Espone l'istanza del gioco globalmente (window)
// Questo serve perché nel file HTML usiamo onclick="window.game.buildUnit(...)"
window.game = game;