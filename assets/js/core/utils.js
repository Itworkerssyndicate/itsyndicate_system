// assets/js/core/utils.js
// دوال مساعدة عامة مع تأثيرات بصرية وأنيميشنز

class Utils {
    constructor() {
        this.initAnimations();
        this.initCursor();
    }

    // تهيئة الأنيميشنز العامة
    initAnimations() {
        const style = document.createElement('style');
        style.textContent = `
            /* أنيميشنز عامة */
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateY(-30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes slideLeft {
                from {
                    opacity: 0;
                    transform: translateX(30px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }

            @keyframes slideRight {
                from {
                    opacity: 0;
                    transform: translateX(-30px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }

            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }

            @keyframes shimmer {
                0% { background-position: -1000px 0; }
                100% { background-position: 1000px 0; }
            }

            @keyframes rotate {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }

            @keyframes glow {
                0% { box-shadow: 0 0 5px rgba(102, 126, 234, 0.5); }
                50% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.8); }
                100% { box-shadow: 0 0 5px rgba(102, 126, 234, 0.5); }
            }

            @keyframes float {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-5px); }
                100% { transform: translateY(0px); }
            }

            @keyframes gradientBG {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }

            /* كلاسات الأنيميشن */
            .animate-fade-in { animation: fadeIn 0.5s ease; }
            .animate-slide-up { animation: slideUp 0.5s ease; }
            .animate-slide-down { animation: slideDown 0.5s ease; }
            .animate-slide-left { animation: slideLeft 0.5s ease; }
            .animate-slide-right { animation: slideRight 0.5s ease; }
            .animate-pulse { animation: pulse 2s infinite; }
            .animate-bounce { animation: bounce 2s infinite; }
            .animate-float { animation: float 3s infinite; }
            .animate-rotate { animation: rotate 1s linear infinite; }
            .animate-glow { animation: glow 2s infinite; }

            /* hover تأثيرات */
            .hover-scale {
                transition: transform 0.3s ease;
            }
            .hover-scale:hover {
                transform: scale(1.05);
            }

            .hover-lift {
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            .hover-lift:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            }

            .hover-glow {
                transition: box-shadow 0.3s ease;
            }
            .hover-glow:hover {
                box-shadow: 0 0 15px rgba(102, 126, 234, 0.5);
            }

            /* تأثيرات خاصة للكروت */
            .card-hover {
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .card-hover:hover {
                transform: translateY(-5px) scale(1.02);
                box-shadow: 0 20px 30px rgba(0,0,0,0.15);
            }

            /* تنسيق المؤشر المخصص */
            .custom-cursor {
                width: 20px;
                height: 20px;
                border: 2px solid #667eea;
                border-radius: 50%;
                position: fixed;
                pointer-events: none;
                z-index: 99999;
                transition: all 0.1s ease;
                transition-property: width, height, border, transform;
                transform: translate(-50%, -50%);
                mix-blend-mode: difference;
            }

            .custom-cursor.active {
                width: 40px;
                height: 40px;
                border-color: #764ba2;
                background: rgba(102, 126, 234, 0.1);
            }

            .custom-cursor.click {
                transform: translate(-50%, -50%) scale(0.8);
                background: rgba(102, 126, 234, 0.3);
            }

            /* تنسيق شريط التمرير */
            ::-webkit-scrollbar {
                width: 10px;
                height: 10px;
            }

            ::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 10px;
            }

            ::-webkit-scrollbar-thumb {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 10px;
                transition: all 0.3s;
            }

            ::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
            }

            /* تنسيق التحديد */
            ::selection {
                background: #667eea;
                color: white;
            }

            /* تنسيق الروابط */
            a {
                cursor: none;
                position: relative;
                text-decoration: none;
                color: #667eea;
                transition: color 0.3s;
            }

            a::after {
                content: '';
                position: absolute;
                bottom: -2px;
                left: 0;
                width: 0;
                height: 2px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                transition: width 0.3s ease;
            }

            a:hover::after {
                width: 100%;
            }

            a:hover {
                color: #764ba2;
            }

            /* تنسيق الأزرار */
            button {
                cursor: none;
                position: relative;
                overflow: hidden;
            }

            button::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 0;
                height: 0;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.3);
                transform: translate(-50%, -50%);
                transition: width 0.6s, height 0.6s;
            }

            button:active::after {
                width: 300px;
                height: 300px;
            }

            /* تنسيقات إضافية */
            .gradient-text {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }

            .glass-effect {
                background: rgba(255, 255, 255, 0.25);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.18);
            }

            .neon-border {
                border: 2px solid #667eea;
                box-shadow: 0 0 10px #667eea, inset 0 0 10px #667eea;
            }
        `;
        document.head.appendChild(style);
    }

    // تهيئة المؤشر المخصص
    initCursor() {
        const cursor = document.createElement('div');
        cursor.className = 'custom-cursor';
        document.body.appendChild(cursor);

        document.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        });

        document.addEventListener('mousedown', () => {
            cursor.classList.add('click');
        });

        document.addEventListener('mouseup', () => {
            cursor.classList.remove('click');
        });

        // تفعيل المؤشر على العناصر القابلة للنقر
        document.querySelectorAll('a, button, input, select, [onclick]').forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.classList.add('active');
            });
            el.addEventListener('mouseleave', () => {
                cursor.classList.remove('active');
            });
        });
    }

    // دوال مساعدة للتنسيق
    formatDate(date, format = 'ar-EG') {
        return new Date(date).toLocaleDateString(format, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    formatTime(date) {
        return new Date(date).toLocaleTimeString('ar-EG', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatDateTime(date) {
        return `${this.formatDate(date)} ${this.formatTime(date)}`;
    }

    formatNumber(number, digits = 2) {
        return number.toString().padStart(digits, '0');
    }

    formatCurrency(amount, currency = 'EGP') {
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // دوال مساعدة للتحقق
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    isValidPhone(phone) {
        return /^01[0125][0-9]{8}$/.test(phone);
    }

    isValidNationalId(id) {
        return /^[0-9]{14}$/.test(id);
    }

    // دوال مساعدة للتأخير
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // دوال مساعدة للتخزين المؤقت
    setCache(key, value, ttl = 3600) {
        const item = {
            value,
            expiry: Date.now() + (ttl * 1000)
        };
        localStorage.setItem(key, JSON.stringify(item));
    }

    getCache(key) {
        const item = localStorage.getItem(key);
        if (!item) return null;
        
        const parsed = JSON.parse(item);
        if (Date.now() > parsed.expiry) {
            localStorage.removeItem(key);
            return null;
        }
        
        return parsed.value;
    }

    // دوال مساعدة للتحميل
    showLoading(container, message = 'جاري التحميل...') {
        const loader = document.createElement('div');
        loader.className = 'loading-overlay';
        loader.innerHTML = `
            <div class="spinner"></div>
            <p>${message}</p>
        `;
        container.appendChild(loader);
    }

    hideLoading(container) {
        const loader = container.querySelector('.loading-overlay');
        if (loader) loader.remove();
    }

    // دوال مساعدة للإشعارات
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.innerHTML = `
            <i class="fas ${this.getToastIcon(type)}"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    getToastIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    // توليد ألوان عشوائية متناسقة
    generateColors(count) {
        const colors = [];
        for (let i = 0; i < count; i++) {
            const hue = (i * 137) % 360; // استخدام الزاوية الذهبية
            colors.push(`hsl(${hue}, 70%, 60%)`);
        }
        return colors;
    }

    // دوال مساعدة للتشفير البسيط
    encodeId(id) {
        return btoa(id).replace(/=/g, '');
    }

    decodeId(encoded) {
        return atob(encoded);
    }

    // توليد معرف فريد
    generateId(prefix = '') {
        return prefix + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // الحصول على معلومات الجهاز
    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenSize: `${window.screen.width}x${window.screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            cookies: navigator.cookieEnabled,
            online: navigator.onLine
        };
    }

    // دوال مساعدة للـ DOM
    createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            } else if (key.startsWith('on')) {
                element.addEventListener(key.slice(2), value);
            } else {
                element.setAttribute(key, value);
            }
        });

        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else {
                element.appendChild(child);
            }
        });

        return element;
    }

    // تصدير إلى CSV
    exportToCSV(data, filename = 'export.csv') {
        const csv = this.convertToCSV(data);
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    }

    convertToCSV(data) {
        if (!data || !data.length) return '';
        const headers = Object.keys(data[0]);
        const rows = data.map(obj => headers.map(header => JSON.stringify(obj[header] || '')).join(','));
        return [headers.join(','), ...rows].join('\n');
    }
}

// إنشاء نسخة عامة من الأدوات
const utils = new Utils();

// تصدير الدوال للاستخدام
export default utils;
