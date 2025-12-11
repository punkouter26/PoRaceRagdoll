// src/utils/audio.js

class AudioManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playTone(freq, type, duration, vol = 0.1) {
        if (!this.enabled) return;
        this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playCoin() {
        // High pitched coin sound (two tones)
        this.playTone(1200, 'sine', 0.1, 0.1);
        setTimeout(() => this.playTone(1600, 'sine', 0.2, 0.1), 50);
    }

    playBlip() {
        // Short UI blip
        this.playTone(600, 'square', 0.05, 0.05);
    }

    playStart() {
        // Race start sequence
        this.playTone(400, 'square', 0.1, 0.1);
        setTimeout(() => this.playTone(400, 'square', 0.1, 0.1), 1000);
        setTimeout(() => this.playTone(400, 'square', 0.1, 0.1), 2000);
        setTimeout(() => {
            this.playTone(800, 'sawtooth', 0.5, 0.1);
            this.playTone(1200, 'square', 0.5, 0.1); // Harmony
        }, 3000); // GO!
    }

    playWin() {
        // Victory jingle (Arcade style arpeggio)
        const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50, 1318.51, 1567.98];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 'square', 0.1, 0.1), i * 100);
        });
    }

    playLose() {
        // Sad trombone-ish
        this.playTone(300, 'sawtooth', 0.3, 0.1);
        setTimeout(() => this.playTone(280, 'sawtooth', 0.3, 0.1), 300);
        setTimeout(() => this.playTone(260, 'sawtooth', 0.6, 0.1), 600);
    }
}

export const audioManager = new AudioManager();
