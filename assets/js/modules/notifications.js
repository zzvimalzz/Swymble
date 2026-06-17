
import { CONFIG } from '../config.js';

class NotificationsManager {
    constructor() {
        this.queue = [];
        this.isShowing = false;
        this.elements = {
            container: null,
            icon: null,
            title: null,
            name: null
        };
    }

    init() {
        this.elements = {
            container: document.getElementById('unlockNotification'),
            icon: document.getElementById('unlockIcon'),
            title: document.getElementById('unlockTitle'),
            name: document.getElementById('unlockName')
        };
    }

    show(icon, title, name) {
        this.queue.push({ icon, title, name });

        if (!this.isShowing) {
            this.processQueue();
        }
    }

    processQueue() {
        if (this.queue.length === 0) {
            this.isShowing = false;
            return;
        }

        this.isShowing = true;
        const { icon, title, name } = this.queue.shift();

        this.elements.icon.textContent = icon;
        this.elements.title.textContent = title;
        this.elements.name.textContent = name;

        this.elements.container.classList.add('show');

        setTimeout(() => {
            this.elements.container.classList.remove('show');

            setTimeout(() => {
                this.processQueue();
            }, CONFIG.ANIMATION.NOTIFICATION_TRANSITION);
        }, CONFIG.ANIMATION.NOTIFICATION_DISPLAY);
    }

    clearQueue() {
        this.queue = [];
    }

    getIsShowing() {
        return this.isShowing;
    }
}

export const Notifications = new NotificationsManager();
export default Notifications;
