// assets/js/security-loader.js
// محمل أنظمة الأمان - يتم تضمينه في كل الصفحات

import EnhancedSecurity from './enhanced-security.js';

class SecurityLoader {
    constructor() {
        this.enhancedSecurity = null;
        this.init();
    }

    init() {
        // انتظار تحميل الصفحة
        document.addEventListener('DOMContentLoaded', () => {
            this.loadSecurity();
        });
    }

    loadSecurity() {
        try {
            // الحصول على المستخدم الحالي
            const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
            
            // تهيئة نظام الأمان المتكامل
            this.enhancedSecurity = new EnhancedSecurity(currentUser);
            
            // جعله متاحاً عالمياً
            window.enhancedSecurity = this.enhancedSecurity;
            
            // التحقق من الجلسة كل دقيقة
            setInterval(() => {
                this.enhancedSecurity.validateSession();
            }, 60000);
            
            console.log('✅ Security systems loaded successfully');
        } catch (error) {
            console.error('❌ Failed to load security systems:', error);
        }
    }

    // الحصول على نظام الأمان
    getSecurity() {
        return this.enhancedSecurity;
    }
}

// إنشاء وتشغيل محمل الأمان
const securityLoader = new SecurityLoader();

export default securityLoader;
