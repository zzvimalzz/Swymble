/**
 * Messages Module
 * Handles loading and displaying random messages on paint wall click
 */

import { CONFIG } from '../config.js';
import { safeFetch, getRandomItem } from '../utils/helpers.js';
import { Storage } from '../utils/storage.js';

class MessagesManager {
    constructor() {
        this.messages = [];
        this.isShowing = false;
        this.messageTimeout = null;
        this.elements = {
            wall: null,
            message: null
        };
        this.isLoaded = false;
    }

    /**
     * Initialize messages manager
     * @param {string} wallId - ID of the paint wall element
     * @param {string} messageId - ID of the message element
     */
    async init(wallId = 'paintWall', messageId = 'message') {
        this.elements = {
            wall: document.getElementById(wallId),
            message: document.getElementById(messageId)
        };

        await this.loadMessages();
        this.setupEventListeners();
    }

    /**
     * Load messages from JSON file
     */
    async loadMessages() {
        this.messages = await safeFetch(
            CONFIG.DATA_PATHS.MESSAGES, 
            CONFIG.FALLBACKS.MESSAGES
        );
        this.isLoaded = true;
    }

    /**
     * Setup event listeners for paint wall
     */
    setupEventListeners() {
        if (!this.elements.wall) return;

        // Click handler
        this.elements.wall.addEventListener('click', (e) => {
            // Don't trigger if clicking on panels or buttons
            if (e.target.closest('.stats-panel, .bottom-panel, button')) return;
            this.show();
        });

        // Touch handler (prevent double-fire with click)
        this.elements.wall.addEventListener('touchstart', (e) => {
            if (e.target.closest('.stats-panel, .bottom-panel, button')) return;
            e.preventDefault();
            this.show();
        });

        // Right-click handler
        this.elements.wall.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.show();
        });
    }

    /**
     * Show a random message
     */
    show() {
        if (this.isShowing || !this.isLoaded) return;

        this.isShowing = true;

        // Select and display random message
        const randomMessage = getRandomItem(this.messages);
        this.elements.message.textContent = randomMessage;
        this.elements.message.classList.add('show');

        // Increment click counter
        Storage.incrementClicks();

        // Hide after delay
        if (this.messageTimeout) clearTimeout(this.messageTimeout);
        
        this.messageTimeout = setTimeout(() => {
            this.elements.message.classList.remove('show');
            
            setTimeout(() => {
                this.isShowing = false;
            }, CONFIG.ANIMATION.MESSAGE_FADE);
        }, CONFIG.ANIMATION.MESSAGE_DISPLAY);
    }

    /**
     * Get current click count
     * @returns {number} Total clicks
     */
    getClickCount() {
        return Storage.getClicks();
    }

    /**
     * Check if messages are loaded
     * @returns {boolean} Whether messages are loaded
     */
    getIsLoaded() {
        return this.isLoaded;
    }
}

// Export singleton instance
export const Messages = new MessagesManager();
export default Messages;
