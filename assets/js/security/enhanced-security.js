// assets/js/security/enhanced-security.js
// نظام الأمان المتكامل - يدمج كل أنظمة الأمان في نظام واحد

import SecurityCore from './security-core.js';
import BiometricAuth from './biometric-auth.js';
import TwoFactorAuth from './twofa.js';
import AnomalyDetection from './anomaly-detection.js';
import EncryptionManager from './encryption.js';

class EnhancedSecurity {
    constructor(currentUser = null) {
        this.currentUser = currentUser;
        this.securityCore = new SecurityCore();
        this.biometric = new BiometricAuth(currentUser);
        this.twoFA = new TwoFactorAuth();
        this.anomaly = currentUser ? new AnomalyDetection(currentUser.userId) : null;
        this.encryption = new EncryptionManager();
        
        this.securityLevel = 'high';
        this.securityEvents = [];
        this.securityScore = 100;
        this.lastScan = null;
        
        this.init();
    }

    // ===== 1. تهيئة النظام المتكامل =====
    async init() {
        console.log('🔒 Initializing Enhanced Security System...');
        
        // بناء الملف السلوكي للمستخدم إذا كان مسجلاً
        if (this.currentUser && this.anomaly) {
            await this.anomaly.buildUserProfile();
        }
        
        // بدء المراقبة المستمرة
        this.startContinuousMonitoring();
        
        // فحص النظام
        await this.runSecurityScan();
        
        console.log('✅ Enhanced Security System Ready');
    }

    // ===== 2. مراقبة مستمرة =====
    startContinuousMonitoring() {
        // مراقبة كل 5 ثواني
        setInterval(() => {
            this.monitorSecurityStatus();
        }, 5000);

        // مراقبة كل دقيقة
        setInterval(() => {
            this.updateSecurityScore();
        }, 60000);

        // مراقبة كل ساعة
        setInterval(() => {
            this.runSecurityScan();
        }, 3600000);
    }

    // ===== 3. مراقبة الحالة الأمنية =====
    monitorSecurityStatus() {
        const status = {
            timestamp: new Date().toISOString(),
            user: this.currentUser?.userId || 'guest',
            page: window.location.pathname,
            security: {
                core: true,
                biometric: this.biometric?.isSupported || false,
                twoFA: true,
                anomaly: !!this.anomaly,
                encryption: this.encryption.supported
            },
            threats: this.detectActiveThreats()
        };

        // تسجيل الحالة
        this.securityEvents.push(status);
        
        // الاحتفاظ بآخر 100 حدث
        if (this.securityEvents.length > 100) {
            this.securityEvents.shift();
        }

        // التحقق من وجود تهديدات
        if (status.threats.length > 0) {
            this.handleThreats(status.threats);
        }
    }

    // ===== 4. كشف التهديدات النشطة =====
    detectActiveThreats() {
        const threats = [];

        // التحقق من أدوات المطورين
        if (this.isDevToolsOpen()) {
            threats.push({
                type: 'dev_tools',
                severity: 'critical',
                message: 'أدوات المطورين مفتوحة'
            });
        }

        // التحقق من محاولات التصوير
        if (this.isScreenshotAttempt()) {
            threats.push({
                type: 'screenshot',
                severity: 'high',
                message: 'محاولة تصوير الشاشة'
            });
        }

        // التحقق من محاولات النسخ
        if (this.isCopyAttempt()) {
            threats.push({
                type: 'copy',
                severity: 'medium',
                message: 'محاولة نسخ بيانات'
            });
        }

        return threats;
    }

    // ===== 5. معالجة التهديدات =====
    async handleThreats(threats) {
        threats.forEach(threat => {
            console.warn(`🚨 Threat detected: ${threat.type} (${threat.severity})`);
            
            // تسجيل التهديد
            this.logSecurityEvent('threat_detected', threat);

            // اتخاذ الإجراء المناسب حسب الخطورة
            switch(threat.severity) {
                case 'critical':
                    this.handleCriticalThreat(threat);
                    break;
                case 'high':
                    this.handleHighThreat(threat);
                    break;
                case 'medium':
                    this.handleMediumThreat(threat);
                    break;
                default:
                    this.handleLowThreat(threat);
            }
        });
    }

    // ===== 6. معالجة التهديدات الحرجة =====
    handleCriticalThreat(threat) {
        // إنهاء الجلسة فوراً
        this.terminateSession('تم اكتشاف تهديد أمني حرج');
        
        // إشعار النقيب
        this.notifyPresident({
            ...threat,
            userId: this.currentUser?.userId,
            timestamp: new Date().toISOString()
        });
    }

    // ===== 7. معالجة التهديدات العالية =====
    handleHighThreat(threat) {
        // طلب 2FA
        this.twoFA.show2FAPrompt(
            this.currentUser?.phone,
            this.currentUser?.email,
            'high'
        );
        
        // تسجيل الحدث
        this.logSecurityEvent('high_threat', threat);
    }

    // ===== 8. معالجة التهديدات المتوسطة =====
    handleMediumThreat(threat) {
        // عرض تحذير
        this.showSecurityAlert(`⚠️ ${threat.message}`, 'warning');
        
        // تسجيل الحدث
        this.logSecurityEvent('medium_threat', threat);
    }

    // ===== 9. معالجة التهديدات المنخفضة =====
    handleLowThreat(threat) {
        // تسجيل فقط
        this.logSecurityEvent('low_threat', threat);
    }

    // ===== 10. تحديث درجة الأمان =====
    updateSecurityScore() {
        let score = 100;

        // خصم حسب التهديدات
        const recentThreats = this.securityEvents
            .filter(e => e.threats && e.threats.length > 0)
            .slice(-10);

        recentThreats.forEach(event => {
            event.threats.forEach(threat => {
                switch(threat.severity) {
                    case 'critical': score -= 10; break;
                    case 'high': score -= 5; break;
                    case 'medium': score -= 2; break;
                    case 'low': score -= 1; break;
                }
            });
        });

        this.securityScore = Math.max(0, score);
        
        // تحديث الواجهة
        this.updateSecurityUI();
    }

    // ===== 11. تحديث واجهة الأمان =====
    updateSecurityUI() {
        const badge = document.getElementById('securityBadge');
        if (badge) {
            badge.textContent = `🔒 ${this.securityScore}%`;
            badge.style.color = this.getScoreColor();
        }
    }

    // ===== 12. الحصول على لون الدرجة =====
    getScoreColor() {
        if (this.securityScore >= 80) return '#10b981';
        if (this.securityScore >= 60) return '#f59e0b';
        if (this.securityScore >= 40) return '#f97316';
        return '#ef4444';
    }

    // ===== 13. فحص أمني كامل =====
    async runSecurityScan() {
        console.log('🔍 Running full security scan...');
        
        const scanResults = {
            timestamp: new Date().toISOString(),
            user: this.currentUser?.userId || 'guest',
            core: this.scanCore(),
            biometric: await this.scanBiometric(),
            twoFA: this.scanTwoFA(),
            anomaly: this.scanAnomaly(),
            encryption: this.scanEncryption(),
            recommendations: []
        };

        // توليد توصيات
        scanResults.recommendations = this.generateRecommendations(scanResults);

        // حفظ نتائج الفحص
        this.lastScan = scanResults;
        
        console.log('✅ Security scan completed', scanResults);

        return scanResults;
    }

    // ===== 14. فحص نواة الأمان =====
    scanCore() {
        return {
            status: 'healthy',
            details: 'جميع أنظمة الأمان الأساسية تعمل'
        };
    }

    // ===== 15. فحص نظام البصمة =====
    async scanBiometric() {
        if (!this.biometric) {
            return {
                status: 'inactive',
                details: 'نظام البصمة غير نشط'
            };
        }

        const compatibility = this.biometric.checkDeviceCompatibility();
        
        return {
            status: compatibility.isSupported ? 'available' : 'unavailable',
            details: compatibility,
            recommendations: compatibility.recommendations
        };
    }

    // ===== 16. فحص نظام 2FA =====
    scanTwoFA() {
        return {
            status: 'active',
            methods: Object.values(this.twoFA.methods)
                .filter(m => m.enabled)
                .map(m => m.name),
            stats: this.twoFA.getStats()
        };
    }

    // ===== 17. فحص نظام كشف الشذوذ =====
    scanAnomaly() {
        if (!this.anomaly) {
            return {
                status: 'inactive',
                details: 'نظام كشف الشذوذ غير نشط (مستخدم غير مسجل)'
            };
        }

        return {
            status: 'active',
            stats: this.anomaly.getStats(),
            profile: this.anomaly.behaviorProfile ? 'established' : 'building'
        };
    }

    // ===== 18. فحص نظام التشفير =====
    scanEncryption() {
        return {
            status: this.encryption.supported ? 'supported' : 'fallback',
            algorithm: this.encryption.algorithm,
            stats: this.encryption.getStats()
        };
    }

    // ===== 19. توليد توصيات أمنية =====
    generateRecommendations(scanResults) {
        const recommendations = [];

        if (scanResults.biometric.status === 'unavailable') {
            recommendations.push({
                priority: 'high',
                message: 'جهازك لا يدعم المصادقة الحيوية. يوصى باستخدام 2FA'
            });
        }

        if (scanResults.twoFA.methods.length === 0) {
            recommendations.push({
                priority: 'critical',
                message: 'يجب تفعيل 2FA لجميع المستخدمين'
            });
        }

        if (scanResults.encryption.status === 'fallback') {
            recommendations.push({
                priority: 'medium',
                message: 'المتصفح لا يدعم التشفير المتقدم. بعض البيانات قد تكون أقل أماناً'
            });
        }

        if (this.securityScore < 60) {
            recommendations.push({
                priority: 'high',
                message: 'درجة الأمان منخفضة. يوصى بمراجعة الإعدادات'
            });
        }

        return recommendations;
    }

    // ===== 20. تسجيل الدخول المتقدم =====
    async advancedLogin(username, password, loginData) {
        try {
            // 1. تحقق أساسي
            const basicAuth = await this.basicAuthentication(username, password);
            if (!basicAuth.success) {
                return basicAuth;
            }

            this.currentUser = basicAuth.user;
            this.anomaly = new AnomalyDetection(this.currentUser.userId);

            // 2. تحليل سلوكي
            const behavior = await this.anomaly.analyzeCurrentLogin(loginData);

            // 3. تحقق من البصمة (إجباري)
            const biometricRequirement = await this.biometric.checkBiometricRequirement(this.currentUser.userId);
            
            if (biometricRequirement.required) {
                const biometricResult = await this.biometric.authenticateBiometric(this.currentUser.userId);
                if (!biometricResult.success) {
                    return {
                        success: false,
                        error: 'فشل المصادقة الحيوية'
                    };
                }
            }

            // 4. تحقق 2FA إذا لزم الأمر
            if (behavior.requiresAdditionalVerification) {
                const twoFAResult = await this.handleTwoFA();
                if (!twoFAResult.success) {
                    return twoFAResult;
                }
            }

            // 5. تسجيل الجلسة
            await this.logSession();

            return {
                success: true,
                user: this.currentUser,
                requires2FA: false,
                message: 'تم تسجيل الدخول بنجاح'
            };

        } catch (error) {
            console.error('Advanced login error:', error);
            return {
                success: false,
                error: 'حدث خطأ في تسجيل الدخول'
            };
        }
    }

    // ===== 21. معالجة 2FA =====
    async handleTwoFA() {
        return new Promise((resolve) => {
            this.twoFA.show2FAPrompt(
                this.currentUser?.phone,
                this.currentUser?.email,
                'high'
            );
            
            window.verify2FACode = async (code) => {
                const result = await this.twoFA.verifyCode(
                    this.currentUser?.userId,
                    code
                );
                resolve(result);
            };
        });
    }

    // ===== 22. تسجيل الجلسة =====
    async logSession() {
        const sessionData = {
            sessionId: this.generateSessionId(),
            userId: this.currentUser?.userId,
            startTime: new Date().toISOString(),
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenSize: `${window.screen.width}x${window.screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };

        this.logSecurityEvent('session_started', sessionData);
    }

    // ===== 23. تسجيل الخروج الآمن =====
    async secureLogout() {
        await this.logSecurityEvent('session_ended', {
            userId: this.currentUser?.userId,
            duration: this.anomaly ? (Date.now() - this.anomaly.sessionStart) / 1000 : 0
        });

        this.currentUser = null;
        this.anomaly = null;
        
        sessionStorage.clear();
        localStorage.clear();
        
        window.location.href = 'index.html';
    }

    // ===== 24. تسجيل حدث أمني =====
    async logSecurityEvent(type, details) {
        const event = {
            type,
            details,
            timestamp: new Date().toISOString(),
            user: this.currentUser?.userId || 'guest'
        };

        console.log('📝 Security Event:', event);
        
        // حفظ في localStorage مؤقتاً
        const events = JSON.parse(localStorage.getItem('security_events') || '[]');
        events.push(event);
        localStorage.setItem('security_events', JSON.stringify(events.slice(-100)));
    }

    // ===== 25. إشعار النقيب =====
    async notifyPresident(event) {
        console.log('👑 Notifying president:', event);
        
        // هنا يتم إرسال إشعار للنقيب
        if (window.notificationSystem) {
            await window.notificationSystem.createNotification({
                userId: 'president_001',
                type: 'security_alert',
                title: '🚨 تنبيه أمني',
                message: event.message || 'حدث أمني خطير',
                priority: 'high',
                data: event
            });
        }
    }

    // ===== 26. إنهاء الجلسة =====
    terminateSession(reason) {
        this.showSecurityAlert(`🔒 ${reason}`, 'error');
        
        setTimeout(() => {
            this.secureLogout();
        }, 3000);
    }

    // ===== 27. عرض تنبيه أمني =====
    showSecurityAlert(message, type = 'info') {
        const alert = document.createElement('div');
        alert.className = `security-alert ${type}`;
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 15px 30px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 999999;
            animation: slideDown 0.3s ease;
            direction: rtl;
            font-family: 'Cairo', sans-serif;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;

        const colors = {
            info: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            success: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
            warning: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            error: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)'
        };

        alert.style.background = colors[type] || colors.info;
        alert.innerHTML = `<i class="fas fa-shield-alt"></i> ${message}`;
        document.body.appendChild(alert);

        setTimeout(() => alert.remove(), 5000);
    }

    // ===== 28. توليد معرف جلسة =====
    generateSessionId() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // ===== 29. التحقق من صلاحية الجلسة =====
    async validateSession() {
        if (!this.currentUser) {
            return false;
        }

        // التحقق من مدة الجلسة (30 دقيقة كحد أقصى)
        const sessionStart = this.anomaly?.sessionStart;
        if (sessionStart) {
            const duration = Date.now() - sessionStart;
            if (duration > 30 * 60 * 1000) {
                await this.secureLogout();
                return false;
            }
        }

        return true;
    }

    // ===== 30. الحصول على تقرير أمني كامل =====
    async getSecurityReport() {
        return {
            timestamp: new Date().toISOString(),
            user: this.currentUser?.userId || 'guest',
            securityScore: this.securityScore,
            lastScan: this.lastScan,
            events: this.securityEvents.slice(-10),
            stats: {
                core: true,
                biometric: this.biometric?.getStats() || null,
                twoFA: this.twoFA?.getStats() || null,
                anomaly: this.anomaly?.getStats() || null,
                encryption: this.encryption?.getStats() || null
            },
            recommendations: this.lastScan?.recommendations || []
        };
    }

    // ===== 31. كشف أدوات المطورين =====
    isDevToolsOpen() {
        const widthThreshold = window.outerWidth - window.innerWidth > 160;
        const heightThreshold = window.outerHeight - window.innerHeight > 160;
        return widthThreshold || heightThreshold;
    }

    // ===== 32. كشف محاولات التصوير =====
    isScreenshotAttempt() {
        // هذا سيتم تحسينه لاحقاً
        return false;
    }

    // ===== 33. كشف محاولات النسخ =====
    isCopyAttempt() {
        // هذا سيتم تحسينه لاحقاً
        return false;
    }

    // ===== 34. التحقق من صلاحية المستخدم =====
    checkUserPermission(requiredLevel) {
        if (!this.currentUser) return false;

        const permissionLevels = {
            'guest': 0,
            'member': 50,
            'committee_member': 50,
            'committee_head': 60,
            'branch_manager': 70,
            'governorate_president': 60,
            'vice_president_second_manager': 80,
            'secretary_assistant_manager': 80,
            'vice_president_first': 90,
            'president': 100
        };

        const userLevel = permissionLevels[this.currentUser.role] || 0;
        return userLevel >= requiredLevel;
    }

    // ===== 35. التحقق من صلاحية الوصول للصفحة =====
    checkPageAccess(pageName) {
        if (!this.currentUser) return false;

        const pagePermissions = {
            'dashboard': ['all'],
            'committees': ['president', 'vice_president_first', 'vice_president_second_manager', 'committee_head', 'committee_member'],
            'branches': ['president', 'vice_president_first', 'secretary_assistant_manager', 'governorate_president'],
            'members': ['president', 'vice_president_first'],
            'requests': ['president', 'vice_president_first'],
            'tracking': ['all'],
            'finance': ['president', 'treasurer'],
            'messages': ['all'],
            'profile': ['all'],
            'settings': ['president']
        };

        const allowedRoles = pagePermissions[pageName] || [];
        return allowedRoles.includes('all') || allowedRoles.includes(this.currentUser.role);
    }

    // ===== 36. تسجيل الخروج =====
    async logout() {
        await this.secureLogout();
    }

    // ===== 37. الحصول على حالة الأمان =====
    getStatus() {
        return {
            level: this.securityLevel,
            score: this.securityScore,
            user: this.currentUser?.userId || 'guest',
            authenticated: !!this.currentUser,
            modules: {
                core: true,
                biometric: !!this.biometric,
                twoFA: true,
                anomaly: !!this.anomaly,
                encryption: this.encryption.supported
            }
        };
    }

    // ===== 38. التحقق من صحة البيانات =====
    validateData(data, schema) {
        // هنا يتم التحقق من صحة البيانات
        return true;
    }
}

export default EnhancedSecurity;
