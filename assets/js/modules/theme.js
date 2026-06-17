
import { $ } from '../utils/helpers.js';

const STORAGE_KEY = 'wpd_theme';
const THEMES = {
    LIGHT: 'light',
    DARK: 'dark'
};

class ThemeManager {
    constructor() {
        this.currentTheme = THEMES.LIGHT;
        this.themeToggle = null;
    }

    init() {
        this.themeToggle = $('#themeToggle');
        this.loadSavedTheme();
        this.setupEventListeners();
    }

    loadSavedTheme() {
        const savedTheme = localStorage.getItem(STORAGE_KEY);
        
        if (savedTheme) {
            this.setTheme(savedTheme);
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.setTheme(prefersDark ? THEMES.DARK : THEMES.LIGHT);
        }
    }

    setupEventListeners() {
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => this.toggle());
        }

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(STORAGE_KEY)) {
                this.setTheme(e.matches ? THEMES.DARK : THEMES.LIGHT);
            }
        });
    }

    setTheme(theme) {
        this.currentTheme = theme;
        
        if (theme === THEMES.DARK) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }

        localStorage.setItem(STORAGE_KEY, theme);
    }

    toggle() {
        const newTheme = this.currentTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
        this.setTheme(newTheme);
    }

    getTheme() {
        return this.currentTheme;
    }

    isDark() {
        return this.currentTheme === THEMES.DARK;
    }
}

export const Theme = new ThemeManager();
export default Theme;
