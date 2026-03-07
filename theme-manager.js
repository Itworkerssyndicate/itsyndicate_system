// assets/js/theme-manager.js
// نظام إدارة الثيمات لكل مستخدم على حدة

import { database, ref, get, update } from './firebase-config.js';

class ThemeManager {
    constructor(currentUser) {
        this.currentUser = currentUser;
        this.availableThemes = [
            { id: 'light', name: 'فاتح', icon: '☀️', preview: 'light' },
            { id: 'dark', name: 'داكن', icon: '🌙', preview: 'dark' },
            { id: 'navy', name: 'كحلي', icon: '⚓', preview: 'navy' },
            { id: 'forest', name: 'غابة', icon: '🌲', preview: 'forest' },
            { id: 'sunset', name: 'غروب', icon: '🌅', preview: 'sunset' }
        ];
        
        this.init();
    }

    async init() {
        await this.loadUserTheme();
        this.setupThemeListener();
    }

    async loadUserTheme() {
        if (!this.currentUser) return;
        
        try {
            const userRef = ref(database, `users/${this.currentUser.userId}/settings/theme`);
            const snapshot = await get(userRef);
            
            if (snapshot.exists()) {
                this.applyTheme(snapshot.val());
            } else {
                // الثيم الافتراضي
                this.applyTheme('light');
            }
        } catch (error) {
            console.error('خطأ في تحميل الثيم:', error);
        }
    }

    applyTheme(themeId) {
        document.documentElement.setAttribute('data-theme', themeId);
        localStorage.setItem('userTheme', themeId);
        
        // تحديث الأزرار النشطة
        document.querySelectorAll('.theme-preview').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === themeId);
        });
    }

    async saveUserTheme(themeId) {
        if (!this.currentUser) return;
        
        try {
            await update(ref(database, `users/${this.currentUser.userId}/settings`), {
                theme: themeId,
                updatedAt: new Date().toISOString()
            });
            
            this.applyTheme(themeId);
            this.showNotification('✅ تم تغيير الثيم بنجاح', 'success');
        } catch (error) {
            console.error('خطأ في حفظ الثيم:', error);
            this.showNotification('❌ حدث خطأ في حفظ الثيم', 'error');
        }
    }

    setupThemeListener() {
        // الاستماع لتغييرات الثيم من المستخدمين الآخرين (لنفس المستخدم)
        if (!this.currentUser) return;
        
        // لا حاجة لاستماع مباشر لأن التغيير يتم يدوياً
    }

    renderThemeSelector(container) {
        const selector = document.createElement('div');
        selector.className = 'theme-selector';
        selector.innerHTML = `
            <h3><i class="fas fa-palette"></i> اختر الثيم المناسب لك</h3>
            <div class="theme-grid">
                ${this.availableThemes.map(theme => `
                    <div class="theme-option" onclick="themeManager.saveUserTheme('${theme.id}')">
                        <div class="theme-preview ${theme.preview}"></div>
                        <div class="theme-name">${theme.icon} ${theme.name}</div>
                    </div>
                `).join('')}
            </div>
        `;
        
        container.appendChild(selector);
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `theme-notification ${type}`;
        notification.innerHTML = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#48bb78' : '#f56565'};
            color: white;
            padding: 12px 24px;
            border-radius: 30px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 9999;
            animation: slideDown 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

export default ThemeManager;
