
import { CONFIG } from '../config.js';
import { formatTime, $ } from '../utils/helpers.js';
import { Storage } from '../utils/storage.js';
import { Timer } from './timer.js';
import { PatienceLevels } from './patience-levels.js';

class PanelsManager {
    constructor() {
        this.elements = {
            menuToggle: null,
            sidePanel: null,
            sidePanelOverlay: null,
            closePanelBtn: null,
            
            longestSession: null,
            totalVisits: null,
            totalClicks: null,
            patienceLevel: null
        };

        this.drawerHeaders = [];
        this.drawerBodies = [];
    }

    init() {
        this.cacheElements();
        this.setupSidePanel();
        this.setupDrawers();
        this.updateVisitCount();
    }

    cacheElements() {
        this.elements = {
            menuToggle: $('#menuToggle'),
            sidePanel: $('#sidePanel'),
            sidePanelOverlay: $('#sidePanelOverlay'),
            closePanelBtn: $('#closeSidePanel'),
            longestSession: $('#longestSession'),
            totalVisits: $('#totalVisits'),
            totalClicks: $('#totalClicks'),
            patienceLevel: $('#patienceLevel')
        };

        this.drawerHeaders = document.querySelectorAll('.drawer-header');
        this.drawerBodies = document.querySelectorAll('.drawer-body');
    }

    setupSidePanel() {
        const { menuToggle, sidePanel, sidePanelOverlay, closePanelBtn } = this.elements;
        if (!menuToggle || !sidePanel) return;

        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openSidePanel();
        });

        if (closePanelBtn) {
            closePanelBtn.addEventListener('click', () => {
                this.closeSidePanel();
            });
        }

        if (sidePanelOverlay) {
            sidePanelOverlay.addEventListener('click', () => {
                this.closeSidePanel();
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidePanel.classList.contains('open')) {
                this.closeSidePanel();
            }
        });
    }

    openSidePanel() {
        const { sidePanel, sidePanelOverlay, menuToggle } = this.elements;
        if (sidePanel) {
            sidePanel.classList.add('open');
            this.updateStats();
        }
        if (sidePanelOverlay) {
            sidePanelOverlay.classList.add('active');
        }
        if (menuToggle) {
            menuToggle.classList.add('active');
        }
    }

    closeSidePanel() {
        const { sidePanel, sidePanelOverlay, menuToggle } = this.elements;
        if (sidePanel) {
            sidePanel.classList.remove('open');
        }
        if (sidePanelOverlay) {
            sidePanelOverlay.classList.remove('active');
        }
        if (menuToggle) {
            menuToggle.classList.remove('active');
        }
        this.closeAllDrawers();
    }

    setupDrawers() {
        this.drawerHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const drawerBody = header.nextElementSibling;
                const isActive = header.classList.contains('active');

                this.drawerHeaders.forEach(h => {
                    if (h !== header) {
                        h.classList.remove('active');
                        h.nextElementSibling.classList.remove('active');
                    }
                });

                header.classList.toggle('active');
                drawerBody.classList.toggle('active');
            });
        });
    }

    closeAllDrawers() {
        this.drawerHeaders.forEach(header => header.classList.remove('active'));
        this.drawerBodies.forEach(body => body.classList.remove('active'));
    }

    updateStats() {
        const currentSessionTime = Timer.getElapsed();
        const longestSession = Storage.getLongestSession();
        const displayLongest = Math.max(longestSession, currentSessionTime);
        const sessionMinutes = Timer.getElapsedMinutes();
        const clicks = Storage.getClicks();

        if (this.elements.longestSession) {
            this.elements.longestSession.textContent = formatTime(displayLongest);
        }

        if (this.elements.totalClicks) {
            this.elements.totalClicks.textContent = clicks;
        }

        if (this.elements.patienceLevel) {
            this.elements.patienceLevel.textContent = PatienceLevels.getCurrentLevelFormatted(sessionMinutes);
        }
    }

    updateVisitCount() {
        const visits = Storage.incrementVisits();
        if (this.elements.totalVisits) {
            this.elements.totalVisits.textContent = visits;
        }
    }

    getVisitCount() {
        return Storage.getVisits();
    }

    isPanelOpen() {
        return this.elements.sidePanel?.classList.contains('open') ?? false;
    }

    toggleSidePanel() {
        if (this.isPanelOpen()) {
            this.closeSidePanel();
        } else {
            this.openSidePanel();
        }
    }
}

export const Panels = new PanelsManager();
export default Panels;
