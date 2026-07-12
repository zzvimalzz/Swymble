
import { $ } from '../utils/helpers.js';
import { Timer } from './timer.js';
import { Audio } from './audio.js';
import { Planner } from './planner.js';

class RouterManager {
    constructor() {
        this.currentPage = 'landing';
        this.isMinimized = false;
        this.elements = {};
    }

    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.updateNavigation();
        
        console.log('🧭 Router initialized');
    }

    cacheElements() {
        this.elements = {
            canvasContainer: $('#canvasContainer') || document.querySelector('.canvas-container'),
            dayPlannerPage: $('#dayPlannerPage'),
            miniOverlay: $('#miniOverlay'),
            miniOverlayPreview: $('#miniOverlayPreview'),
            miniMuteBtn: $('#miniMuteBtn'),
            miniExpandBtn: $('#miniExpandBtn'),
            navItems: document.querySelectorAll('.nav-item'),
            sidePanel: $('#sidePanel'),
            sidePanelOverlay: $('#sidePanelOverlay')
        };
    }

    setupEventListeners() {
        this.elements.navItems.forEach(item => {
            item.addEventListener('click', () => {
                const page = item.getAttribute('data-page');
                this.navigateTo(page);
            });
        });

        if (this.elements.miniMuteBtn) {
            this.elements.miniMuteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMiniMute();
            });
        }

        if (this.elements.miniExpandBtn) {
            this.elements.miniExpandBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.expandFromMini();
            });
        }

        if (this.elements.miniOverlay) {
            this.elements.miniOverlay.addEventListener('click', () => {
                this.expandFromMini();
            });
        }
    }

    navigateTo(page) {
        if (page === this.currentPage && !this.isMinimized) return;

        this.closeSidePanel();

        if (page === 'landing') {
            this.showLandingPage();
        } else if (page === 'planner') {
            this.showPlannerPage();
        }

        this.currentPage = page;
        this.updateNavigation();
    }

    showLandingPage() {
        if (this.elements.miniOverlay) {
            this.elements.miniOverlay.classList.remove('active');
        }
        this.isMinimized = false;

        if (this.elements.canvasContainer) {
            this.elements.canvasContainer.classList.remove('minimized');
        }

        if (this.elements.dayPlannerPage) {
            this.elements.dayPlannerPage.classList.remove('active');
        }
        
        Planner.hide();

        Timer.resume();
    }

    
    showPlannerPage() {
        if (this.elements.canvasContainer) {
            this.elements.canvasContainer.classList.add('minimized');
        }

        if (this.elements.miniOverlay) {
            this.elements.miniOverlay.classList.add('active');
            this.updateMiniPreview();
        }
        this.isMinimized = true;

        Timer.pause();

        if (this.elements.dayPlannerPage) {
            this.elements.dayPlannerPage.classList.add('active');
        }

        Planner.show();
    }

    
    toggleMiniMute() {
        Audio.toggle();
        this.updateMiniMuteButton();
    }

    
    updateMiniMuteButton() {
        const btn = this.elements.miniMuteBtn;
        if (!btn) return;

        const icon = btn.querySelector('.material-symbols-outlined');
        if (icon) {
            icon.textContent = Audio.isMuted() ? 'volume_off' : 'volume_up';
        }
    }

    
    expandFromMini() {
        this.navigateTo('landing');
    }

    
    updateMiniPreview() {
        const preview = this.elements.miniOverlayPreview;
        const paintWall = document.querySelector('.paint-wall');
        
        if (preview && paintWall) {
            const miniWall = preview.querySelector('.mini-paint-wall');
            if (miniWall) {
                const wallStyle = window.getComputedStyle(paintWall);
                miniWall.style.background = wallStyle.background;
            }
        }
    }

    
    updateNavigation() {
        this.elements.navItems.forEach(item => {
            const page = item.getAttribute('data-page');
            if (page === this.currentPage) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    
    closeSidePanel() {
        if (this.elements.sidePanel) {
            this.elements.sidePanel.classList.remove('open');
        }
        if (this.elements.sidePanelOverlay) {
            this.elements.sidePanelOverlay.classList.remove('active');
        }
        const menuToggle = $('#menuToggle');
        if (menuToggle) {
            menuToggle.classList.remove('active');
        }
    }

    
    getCurrentPage() {
        return this.currentPage;
    }

    
    isPaintWallMinimized() {
        return this.isMinimized;
    }
}

export const Router = new RouterManager();
export default Router;
