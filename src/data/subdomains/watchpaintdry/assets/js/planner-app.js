
import { PAINTS } from './config.js';
import { Storage } from './utils/storage.js';
import { Theme } from './modules/theme.js';
import { Audio } from './modules/audio.js';
import { Planner } from './modules/planner.js';
import { Panels } from './modules/panels.js';
import { Achievements } from './modules/achievements.js';
import { PatienceLevels } from './modules/patience-levels.js';

class PlannerApp {
    constructor() {
        this.isInitialized = false;
        this.audio = null;
    }

    async init() {
        if (this.isInitialized) return;

        try {
            Theme.init();

            this.initAudio();

            await Promise.all([
                Achievements.init(),
                PatienceLevels.init()
            ]);

            Panels.init();
            
            Planner.init();
            Planner.show();

            this.setupMiniOverlay();
            
            this.updateStats();

            this.isInitialized = true;
            console.log('📅 Planner page initialized successfully!');
        } catch (error) {
            console.error('Failed to initialize planner page:', error);
        }
    }

    initAudio() {
        this.audio = document.getElementById('ambienceAudio');
        if (!this.audio) return;

        const wasMuted = Storage.isAudioMuted();
        
        if (!wasMuted) {
            const tryResume = async () => {
                try {
                    await this.audio.play();
                    console.log('🎵 Audio resumed');
                } catch (error) {
                    console.log('Audio resume failed, waiting for interaction');
                }
            };
            
            tryResume();
            document.addEventListener('click', tryResume, { once: true });
            document.addEventListener('touchstart', tryResume, { once: true });
        }
    }

    setupMiniOverlay() {
        const miniOverlay = document.getElementById('miniOverlay');
        const miniExpandBtn = document.getElementById('miniExpandBtn');
        const miniMuteBtn = document.getElementById('miniMuteBtn');

        if (miniOverlay) {
            miniOverlay.addEventListener('click', (e) => {
                if (e.target.closest('.mini-overlay-controls')) return;
                this.goToPaintWall();
            });
        }

        if (miniExpandBtn) {
            miniExpandBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.goToPaintWall();
            });
        }

        if (miniMuteBtn) {
            miniMuteBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const isMuted = Storage.isAudioMuted();
                
                if (isMuted) {
                    try {
                        if (this.audio) {
                            await this.audio.play();
                        }
                        Storage.setAudioMuted(false);
                        this.updateMuteButton(false);
                    } catch (error) {
                        console.log('Audio play failed');
                    }
                } else {
                    if (this.audio) {
                        this.audio.pause();
                    }
                    Storage.setAudioMuted(true);
                    this.updateMuteButton(true);
                }
            });
            
            const isMuted = Storage.isAudioMuted();
            this.updateMuteButton(isMuted);
        }

        this.syncPaintColor();
    }

    updateMuteButton(isMuted) {
        const miniMuteBtn = document.getElementById('miniMuteBtn');
        if (miniMuteBtn) {
            const icon = miniMuteBtn.querySelector('.material-symbols-outlined');
            if (icon) {
                icon.textContent = isMuted ? 'volume_off' : 'volume_up';
            }
        }
    }

    syncPaintColor() {
        const miniPaintWall = document.querySelector('.mini-paint-wall');
        if (miniPaintWall) {
            const currentPaintId = Storage.getCurrentPaint();
            const paint = PAINTS.find(p => p.id === currentPaintId);
            if (paint && paint.color) {
                miniPaintWall.style.background = paint.color;
            } else {
                miniPaintWall.style.background = 'linear-gradient(135deg, #ffd6e8 0%, #ffe5f0 50%, #ffdde7 100%)';
            }
        }
    }

    goToPaintWall() {
        window.location.href = 'index.html';
    }

    updateStats() {
        const longestSession = document.getElementById('longestSession');
        if (longestSession) {
            longestSession.textContent = Storage.get('longestSession', '00:00:00');
        }

        const totalVisits = document.getElementById('totalVisits');
        if (totalVisits) {
            totalVisits.textContent = Storage.getVisits();
        }

        const totalClicks = document.getElementById('totalClicks');
        if (totalClicks) {
            totalClicks.textContent = Storage.getClicks();
        }

        const patienceLevel = document.getElementById('patienceLevel');
        if (patienceLevel) {
            const level = Storage.get('patienceLevel', { icon: '🎨', name: 'Beginner' });
            patienceLevel.textContent = `${level.icon} ${level.name}`;
        }
    }
}

const plannerApp = new PlannerApp();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => plannerApp.init());
} else {
    plannerApp.init();
}

window.PlannerApp = plannerApp;

export default plannerApp;
