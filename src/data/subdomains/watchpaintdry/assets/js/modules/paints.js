
import { PAINTS } from '../config.js';
import { Storage } from '../utils/storage.js';
import { $ } from '../utils/helpers.js';

class PaintsManager {
    constructor() {
        this.paints = PAINTS;
        this.unlockedPaints = [];
        this.currentPaint = 'default';
        this.elements = {
            wall: null,
            grid: null,
            redeemInput: null,
            redeemButton: null
        };
    }

    init() {
        this.elements = {
            wall: $('.paint-wall'),
            grid: $('#paintsGrid'),
            redeemInput: $('#redeemInput'),
            redeemButton: $('#redeemButton')
        };

        this.unlockedPaints = Storage.getUnlockedPaints();
        this.currentPaint = Storage.getCurrentPaint();

        this.setupEventListeners();
        this.applyPaint(this.currentPaint);
        this.render();
    }

    setupEventListeners() {
        if (this.elements.redeemButton) {
            this.elements.redeemButton.addEventListener('click', () => this.redeemCode());
        }

        if (this.elements.redeemInput) {
            this.elements.redeemInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.redeemCode();
            });
        }
    }

    isUnlocked(paintId) {
        const paint = this.paints.find(p => p.id === paintId);
        if (!paint) return false;
        return !paint.locked || this.unlockedPaints.includes(paintId);
    }

    getById(paintId) {
        return this.paints.find(p => p.id === paintId) || null;
    }

    applyPaint(paintId) {
        const paint = this.getById(paintId);
        if (!paint || !this.isUnlocked(paintId)) return;

        this.currentPaint = paintId;
        Storage.setCurrentPaint(paintId);

        if (this.elements.wall) {
            this.elements.wall.style.background = paint.color;
        }

        this.render();
    }

    unlock(paintId) {
        if (this.unlockedPaints.includes(paintId)) return false;

        this.unlockedPaints.push(paintId);
        Storage.setUnlockedPaints(this.unlockedPaints);
        this.render();
        return true;
    }

    redeemCode() {
        if (!this.elements.redeemInput) return;

        const code = this.elements.redeemInput.value.trim().toUpperCase();
        if (!code) return;

        const paintToUnlock = this.paints.find(p => p.code === code);

        if (!paintToUnlock) {
            alert('Invalid code. Try again!');
            return;
        }

        if (this.unlockedPaints.includes(paintToUnlock.id)) {
            alert('You already unlocked this paint!');
            return;
        }

        this.unlock(paintToUnlock.id);
        alert(`Unlocked: ${paintToUnlock.name}!`);
        this.applyPaint(paintToUnlock.id);
        this.elements.redeemInput.value = '';
    }

    render() {
        if (!this.elements.grid) return;

        this.elements.grid.innerHTML = '';

        this.paints.forEach(paint => {
            const isLocked = !this.isUnlocked(paint.id);
            const isActive = this.currentPaint === paint.id;

            const swatch = document.createElement('div');
            swatch.className = `paint-swatch ${isLocked ? 'locked' : ''} ${isActive ? 'active' : ''}`;
            swatch.style.background = paint.color;
            swatch.title = isLocked ? 'Locked (Redeem code to unlock)' : paint.name;

            swatch.addEventListener('click', () => {
                if (isLocked) {
                    alert('This paint is locked! Enter a code to unlock it.');
                } else {
                    this.applyPaint(paint.id);
                }
            });

            this.elements.grid.appendChild(swatch);
        });
    }

    /**
     * Get all paints
     * @returns {Array} All paints
     */
    getAll() {
        return this.paints;
    }

    /**
     * Get current paint ID
     * @returns {string} Current paint ID
     */
    getCurrentPaint() {
        return this.currentPaint;
    }
}

// Export singleton instance
export const Paints = new PaintsManager();
export default Paints;
