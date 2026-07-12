
import { $ } from '../utils/helpers.js';

class PlannerManager {
    constructor() {
        this.container = null;
        this.svg = null;
        this.timeIndicator = null;
        this.updateInterval = null;
        
        this.size = 420;
        this.center = this.size / 2;
        this.outerRadius = 130;
        this.ringWidth = 40;
        this.hourMarkRadius = 120;
        
        this.colors = {
            light: {
                background: '#faf7f2',
                ring: '#3a3633',
                ringStroke: '#eddcc9',
                hourMarks: '#9a948d',
                hourText: '#4a4543',
                currentTime: '#c45a3b',
                timeText: '#2d2926'
            },
            dark: {
                background: '#1e1b19',
                ring: '#3a3633',
                ringStroke: '#eddcc9',
                hourMarks: '#9a948d',
                hourText: '#c9c3bc',
                currentTime: '#d4a84b',
                timeText: '#f5f0eb'
            }
        };
    }

    init() {
        this.container = $('#circularPlanner');
        if (!this.container) return;
        
        this.createSVG();
        this.updateDateDisplay();
        this.startTimeUpdates();
        
        this.observeThemeChanges();
        
        console.log('🕐 Day Planner initialized');
    }

    createSVG() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const colors = isDark ? this.colors.dark : this.colors.light;
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', `0 0 ${this.size} ${this.size}`);
        svg.setAttribute('class', 'planner-svg');
        svg.id = 'plannerSvg';
        
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        
        const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
        filter.id = 'indicatorGlow';
        filter.innerHTML = `
            <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="${colors.currentTime}" flood-opacity="0.5"/>
        `;
        defs.appendChild(filter);
        
        svg.appendChild(defs);
        
        const outerRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        outerRing.setAttribute('cx', this.center);
        outerRing.setAttribute('cy', this.center);
        outerRing.setAttribute('r', this.outerRadius);
        outerRing.setAttribute('fill', 'none');
        outerRing.setAttribute('stroke', colors.ring);
        outerRing.setAttribute('stroke-width', this.ringWidth);
        outerRing.setAttribute('class', 'planner-ring');
        svg.appendChild(outerRing);
        
        for (let hour = 0; hour < 24; hour++) {
            const angle = (hour * 15) - 90; // 15 degrees per hour, start at top
            const radian = (angle * Math.PI) / 180;
            
            const markLength = hour % 6 === 0 ? 12 : 6;
            const markStart = this.outerRadius - this.ringWidth / 2 + 2;
            const markEnd = markStart + markLength;
            
            const x1 = this.center + markStart * Math.cos(radian);
            const y1 = this.center + markStart * Math.sin(radian);
            const x2 = this.center + markEnd * Math.cos(radian);
            const y2 = this.center + markEnd * Math.sin(radian);
            
            const mark = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            mark.setAttribute('x1', x1);
            mark.setAttribute('y1', y1);
            mark.setAttribute('x2', x2);
            mark.setAttribute('y2', y2);
            mark.setAttribute('stroke', colors.hourMarks);
            mark.setAttribute('stroke-width', hour % 6 === 0 ? 3 : 2);
            mark.setAttribute('class', 'hour-mark');
            svg.appendChild(mark);
            
            // Hour labels (every 6 hours) - outside the ring
            if (hour % 6 === 0) {
                const labelRadius = this.outerRadius + 50;
                const lx = this.center + labelRadius * Math.cos(radian);
                const ly = this.center + labelRadius * Math.sin(radian);
                
                const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                label.setAttribute('x', lx);
                label.setAttribute('y', ly);
                label.setAttribute('text-anchor', 'middle');
                label.setAttribute('dominant-baseline', 'middle');
                label.setAttribute('fill', colors.hourText);
                label.setAttribute('font-size', '16');
                label.setAttribute('font-family', 'Outfit, sans-serif');
                label.setAttribute('font-weight', '600');
                label.setAttribute('class', 'hour-label');
                label.textContent = hour === 0 ? '12am' : hour === 6 ? '6am' : hour === 12 ? '12pm' : '6pm';
                svg.appendChild(label);
            }
        }
        
        // Current time indicator - straight line through the ring with small overhang
        const indicatorLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        indicatorLine.id = 'timeIndicatorLine';
        indicatorLine.setAttribute('stroke', colors.currentTime);
        indicatorLine.setAttribute('stroke-width', '3');
        indicatorLine.setAttribute('stroke-linecap', 'round');
        indicatorLine.setAttribute('filter', 'url(#indicatorGlow)');
        indicatorLine.setAttribute('class', 'time-indicator-line');
        svg.appendChild(indicatorLine);
        
        // Small dot at the outer tip of the indicator
        const timeDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        timeDot.id = 'timeIndicatorDot';
        timeDot.setAttribute('r', '5');
        timeDot.setAttribute('fill', colors.currentTime);
        timeDot.setAttribute('filter', 'url(#indicatorGlow)');
        timeDot.setAttribute('class', 'time-dot');
        svg.appendChild(timeDot);
        
        // Current time text in center - bold and prominent
        const timeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        timeText.id = 'currentTimeText';
        timeText.setAttribute('x', this.center);
        timeText.setAttribute('y', this.center);
        timeText.setAttribute('text-anchor', 'middle');
        timeText.setAttribute('dominant-baseline', 'middle');
        timeText.setAttribute('fill', colors.timeText);
        timeText.setAttribute('font-size', '42');
        timeText.setAttribute('font-family', 'IBM Plex Mono, monospace');
        timeText.setAttribute('font-weight', '600');
        timeText.setAttribute('class', 'current-time-text');
        svg.appendChild(timeText);
        
        // AM/PM label below time
        const ampmText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        ampmText.id = 'ampmText';
        ampmText.setAttribute('x', this.center);
        ampmText.setAttribute('y', this.center + 30);
        ampmText.setAttribute('text-anchor', 'middle');
        ampmText.setAttribute('dominant-baseline', 'middle');
        ampmText.setAttribute('fill', colors.hourText);
        ampmText.setAttribute('font-size', '14');
        ampmText.setAttribute('font-family', 'Outfit, sans-serif');
        ampmText.setAttribute('font-weight', '500');
        ampmText.setAttribute('letter-spacing', '2px');
        ampmText.setAttribute('class', 'ampm-text');
        svg.appendChild(ampmText);
        
        this.container.innerHTML = '';
        this.container.appendChild(svg);
        this.svg = svg;
        
        // Initial time update
        this.updateTimeIndicator();
    }

    /**
     * Update the current time indicator position
     */
    updateTimeIndicator() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        
        // Calculate angle (0 = 12:00/top, goes clockwise)
        const totalMinutes = hours * 60 + minutes + seconds / 60;
        const currentAngle = (totalMinutes / (24 * 60)) * 360 - 90;
        const radian = (currentAngle * Math.PI) / 180;
        
        // Line indicator - starts inside ring, ends with small overhang outside
        const innerStart = this.outerRadius - this.ringWidth / 2 - 5; // Inside the ring
        const outerEnd = this.outerRadius + this.ringWidth / 2 + 8;   // Small overhang outside
        
        const x1 = this.center + innerStart * Math.cos(radian);
        const y1 = this.center + innerStart * Math.sin(radian);
        const x2 = this.center + outerEnd * Math.cos(radian);
        const y2 = this.center + outerEnd * Math.sin(radian);
        
        const indicatorLine = document.getElementById('timeIndicatorLine');
        if (indicatorLine) {
            indicatorLine.setAttribute('x1', x1);
            indicatorLine.setAttribute('y1', y1);
            indicatorLine.setAttribute('x2', x2);
            indicatorLine.setAttribute('y2', y2);
        }
        
        // Position the dot at the outer tip
        const timeDot = document.getElementById('timeIndicatorDot');
        if (timeDot) {
            timeDot.setAttribute('cx', x2);
            timeDot.setAttribute('cy', y2);
        }
        
        // Update time text in center
        const timeText = document.getElementById('currentTimeText');
        const ampmText = document.getElementById('ampmText');
        if (timeText) {
            const displayHours = hours % 12 || 12;
            const displayMinutes = minutes.toString().padStart(2, '0');
            timeText.textContent = `${displayHours}:${displayMinutes}`;
        }
        if (ampmText) {
            ampmText.textContent = hours < 12 ? 'AM' : 'PM';
        }
    }

    /**
     * Update the date display
     */
    updateDateDisplay() {
        const dateEl = $('#plannerDate');
        if (!dateEl) return;
        
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.textContent = now.toLocaleDateString('en-US', options);
    }

    /**
     * Start real-time updates
     */
    startTimeUpdates() {
        // Update every second
        this.updateInterval = setInterval(() => {
            this.updateTimeIndicator();
        }, 1000);
    }

    /**
     * Stop time updates
     */
    stopTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Observe theme changes and update colors
     */
    observeThemeChanges() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'data-theme') {
                    this.createSVG(); // Recreate with new colors
                }
            });
        });
        
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });
    }

    /**
     * Show the planner page - starts time updates
     */
    show() {
        this.startTimeUpdates();
    }

    /**
     * Hide the planner page - stops time updates
     */
    hide() {
        this.stopTimeUpdates();
    }
}

// Export singleton instance
export const Planner = new PlannerManager();
export default Planner;
