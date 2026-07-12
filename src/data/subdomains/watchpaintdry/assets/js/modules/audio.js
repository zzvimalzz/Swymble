/**
 * Audio Module
 * Handles ambient audio playback and controls
 */

import { Storage } from '../utils/storage.js';

class AudioManager {
    constructor() {
        this.audio = null;
        this.toggleButton = null;
        this.isPlaying = false;
        this.isInitialized = false;
        this.boundTryPlay = null;
    }

    /**
     * Initialize audio manager
     * @param {string} audioId - ID of the audio element
     * @param {string} toggleId - ID of the toggle button
     */
    init(audioId = 'ambienceAudio', toggleId = 'audioToggle') {
        this.audio = document.getElementById(audioId);
        this.toggleButton = document.getElementById(toggleId);

        if (!this.audio || !this.toggleButton) {
            console.warn('Audio elements not found');
            return;
        }

        this.setupInitialState();
        this.setupEventListeners();
        this.setupAutoPlay();
    }

    /**
     * Setup initial state from storage
     */
    setupInitialState() {
        // Check if user previously had audio muted
        const wasMuted = Storage.isAudioMuted();
        if (wasMuted) {
            this.toggleButton.classList.add('muted');
        } else {
            this.toggleButton.classList.add('muted'); // Start muted, will auto-play if not muted
        }
    }

    /**
     * Setup audio event listeners
     */
    setupEventListeners() {
        // Audio state events
        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            this.isInitialized = true;
            this.toggleButton.classList.remove('muted');
            Storage.setAudioMuted(false);
        });

        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.toggleButton.classList.add('muted');
            Storage.setAudioMuted(true);
        });

        this.audio.addEventListener('error', () => {
            this.isPlaying = false;
            this.toggleButton.classList.add('muted');
        });

        // Toggle button click
        this.toggleButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });
    }

    /**
     * Setup auto-play on first user interaction (if not previously muted)
     */
    setupAutoPlay() {
        const wasMuted = Storage.isAudioMuted();
        if (wasMuted) return; // Don't auto-play if user previously muted
        
        this.boundTryPlay = () => this.tryPlay();
        
        document.addEventListener('click', this.boundTryPlay, { once: true });
        document.addEventListener('touchstart', this.boundTryPlay, { once: true });
    }

    /**
     * Try to play audio (respects autoplay policies)
     */
    async tryPlay() {
        if (this.isInitialized) return;

        try {
            await this.audio.play();
        } catch (error) {
            this.isPlaying = false;
            this.toggleButton.classList.add('muted');
        }
    }

    /**
     * Toggle audio playback
     */
    async toggle() {
        if (this.isPlaying) {
            this.pause();
        } else {
            await this.play();
        }
    }

    /**
     * Play audio
     */
    async play() {
        try {
            await this.audio.play();
            this.isPlaying = true;
            this.toggleButton.classList.remove('muted');
            Storage.setAudioMuted(false);
        } catch (error) {
            this.isPlaying = false;
            this.toggleButton.classList.add('muted');
        }
    }

    /**
     * Pause audio
     */
    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.toggleButton.classList.add('muted');
        Storage.setAudioMuted(true);
    }

    /**
     * Set volume
     * @param {number} volume - Volume level (0-1)
     */
    setVolume(volume) {
        if (this.audio) {
            this.audio.volume = Math.max(0, Math.min(1, volume));
        }
    }

    /**
     * Get current playback state
     * @returns {boolean} Whether audio is playing
     */
    getIsPlaying() {
        return this.isPlaying;
    }

    /**
     * Check if audio is muted/not playing
     * @returns {boolean} Whether audio is muted
     */
    isMuted() {
        return !this.isPlaying;
    }
}

// Export singleton instance
export const Audio = new AudioManager();
export default Audio;
