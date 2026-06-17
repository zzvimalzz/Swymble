
import { CONFIG } from '../config.js';
import { formatTime } from '../utils/helpers.js';
import { Storage } from '../utils/storage.js';

class TimerManager {
    constructor() {
        this.startTime = Date.now();
        this.pausedTime = 0;
        this.isPaused = false;
        this.timerInterval = null;
        this.saveInterval = null;
        this.displayElement = null;
        this.onTickCallbacks = [];
    }

    init(displayElementId = 'timerDisplay') {
        this.displayElement = document.getElementById(displayElementId);
        this.setupVisibilityHandler();
        this.startTimer();
        this.startAutoSave();
        this.updateDisplay();
    }

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.timerInterval = setInterval(() => {
            if (!this.isPaused) {
                this.updateDisplay();
                this.notifyTick();
            }
        }, CONFIG.TIMER.UPDATE_INTERVAL);
    }

    setupVisibilityHandler() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });
    }

    pause() {
        if (!this.isPaused) {
            this.isPaused = true;
            this.pausedTime = this.getElapsed();
        }
    }

    resume() {
        if (this.isPaused) {
            this.startTime = Date.now() - this.pausedTime;
            this.isPaused = false;
        }
    }

    getElapsed() {
        return this.isPaused ? this.pausedTime : Date.now() - this.startTime;
    }

    getElapsedMinutes() {
        return Math.floor(this.getElapsed() / 60000);
    }

    getFormattedTime() {
        return formatTime(this.getElapsed());
    }

    updateDisplay() {
        if (this.displayElement) {
            this.displayElement.textContent = this.getFormattedTime();
        }
    }

    startAutoSave() {
        if (this.saveInterval) clearInterval(this.saveInterval);
        
        this.saveInterval = setInterval(() => {
            this.saveSession();
        }, CONFIG.TIMER.SAVE_INTERVAL);

        window.addEventListener('beforeunload', () => this.saveSession());
    }

    saveSession() {
        const elapsed = this.getElapsed();
        Storage.updateLongestSession(elapsed);
    }

    onTick(callback) {
        if (typeof callback === 'function') {
            this.onTickCallbacks.push(callback);
        }
    }

    notifyTick() {
        const elapsed = this.getElapsed();
        const minutes = this.getElapsedMinutes();
        this.onTickCallbacks.forEach(cb => cb(elapsed, minutes));
    }

    destroy() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (this.saveInterval) clearInterval(this.saveInterval);
        this.onTickCallbacks = [];
    }
}

export const Timer = new TimerManager();
export default Timer;
