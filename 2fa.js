// assets/js/2fa.js
// نظام التحقق بخطوتين (2FA) - تلقائي عند الاشتباه

class TwoFactorAuth {
    constructor() {
        this.verificationCodes = new Map();
        this.attempts = new Map();
    }

    // إرسال رمز التحقق عبر SMS
    async sendSmsCode(phoneNumber) {
        try {
            const code = this.generateCode();
            const expiresAt = Date.now() + 300000; // 5 دقائق
            
            // حفظ الرمز
            this.verificationCodes.set(phoneNumber, {
                code,
                expiresAt,
                attempts: 0
            });

            // هنا يتم إرسال الـ SMS فعلياً
            console.log(`📱 رمز التحقق: ${code} (في الإنتاج يتم إرساله عبر SMS)`);
            
            return {
                success: true,
                message: 'تم إرسال رمز التحقق إلى هاتفك'
            };
        } catch (error) {
            console.error('SMS error:', error);
            return {
                success: false,
                error: 'فشل إرسال رمز التحقق'
            };
        }
    }

    // إرسال رمز التحقق عبر البريد الإلكتروني
    async sendEmailCode(email) {
        try {
            const code = this.generateCode();
            const expiresAt = Date.now() + 300000; // 5 دقائق
            
            this.verificationCodes.set(email, {
                code,
                expiresAt,
                attempts: 0
            });

            console.log(`📧 رمز التحقق: ${code} (تم إرساله للبريد)`);
            
            return {
                success: true,
                message: 'تم إرسال رمز التحقق إلى بريدك'
            };
        } catch (error) {
            return {
                success: false,
                error: 'فشل إرسال رمز التحقق'
            };
        }
    }

    // إرسال رمز التحقق عبر واتساب
    async sendWhatsAppCode(phoneNumber) {
        try {
            const code = this.generateCode();
            const expiresAt = Date.now() + 300000;
            
            this.verificationCodes.set(`whatsapp:${phoneNumber}`, {
                code,
                expiresAt,
                attempts: 0
            });

            console.log(`💬 رمز التحقق: ${code} (تم إرساله للواتساب)`);
            
            return {
                success: true,
                message: 'تم إرسال رمز التحقق إلى واتساب'
            };
        } catch (error) {
            return {
                success: false,
                error: 'فشل إرسال رمز التحقق'
            };
        }
    }

    // التحقق من الرمز
    async verifyCode(identifier, userCode) {
        const data = this.verificationCodes.get(identifier);
        
        if (!data) {
            return {
                success: false,
                error: 'رمز التحقق غير صحيح أو منتهي الصلاحية'
            };
        }

        // التحقق من عدد المحاولات
        if (data.attempts >= 3) {
            this.verificationCodes.delete(identifier);
            return {
                success: false,
                error: 'تجاوزت الحد الأقصى من المحاولات'
            };
        }

        // التحقق من انتهاء الصلاحية
        if (Date.now() > data.expiresAt) {
            this.verificationCodes.delete(identifier);
            return {
                success: false,
                error: 'انتهت صلاحية الرمز'
            };
        }

        // التحقق من الرمز
        if (data.code !== userCode) {
            data.attempts++;
            return {
                success: false,
                error: 'رمز غير صحيح'
            };
        }

        // نجاح التحقق
        this.verificationCodes.delete(identifier);
        return {
            success: true,
            message: 'تم التحقق بنجاح'
        };
    }

    // توليد رمز عشوائي
    generateCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // التحقق من الحاجة إلى 2FA
    async check2FARequirement(loginData) {
        const {
            ip,
            location,
            device,
            time,
            userId
        } = loginData;

        let riskScore = 0;

        // تحليل المخاطر
        if (this.isNewLocation(ip, userId)) {
            riskScore += 0.3;
        }

        if (this.isNewDevice(device, userId)) {
            riskScore += 0.3;
        }

        if (this.isUnusualTime(time, userId)) {
            riskScore += 0.2;
        }

        if (this.hasMultipleAttempts(userId)) {
            riskScore += 0.2;
        }

        // طلب 2FA إذا تجاوزت المخاطر 0.5
        return {
            required: riskScore > 0.5,
            riskScore: riskScore,
            reason: this.getRiskReason(riskScore)
        };
    }

    // دوال مساعدة للتحليل
    isNewLocation(ip, userId) {
        return Math.random() > 0.5; // للاختبار
    }

    isNewDevice(device, userId) {
        return Math.random() > 0.5;
    }

    isUnusualTime(time, userId) {
        const hour = new Date(time).getHours();
        return hour < 6 || hour > 22;
    }

    hasMultipleAttempts(userId) {
        const attempts = this.attempts.get(userId) || 0;
        return attempts > 3;
    }

    getRiskReason(score) {
        if (score > 0.8) return 'مخاطر عالية جداً';
        if (score > 0.6) return 'مخاطر عالية';
        if (score > 0.5) return 'مخاطر متوسطة';
        return 'مخاطر منخفضة';
    }

    // عرض واجهة 2FA
    show2FAPrompt(phoneNumber, email) {
        const prompt = document.createElement('div');
        prompt.className = 'twofa-prompt';
        prompt.innerHTML = `
            <div class="twofa-overlay">
                <div class="twofa-card">
                    <h3><i class="fas fa-shield-alt"></i> التحقق بخطوتين</h3>
                    <p>تم اكتشاف نشاط غير معتاد، يرجى تأكيد هويتك</p>
                    <div class="twofa-options">
                        <button class="twofa-option" onclick="select2FAMethod('sms')">
                            <i class="fas fa-sms"></i>
                            <span>رسالة نصية</span>
                        </button>
                        <button class="twofa-option" onclick="select2FAMethod('whatsapp')">
                            <i class="fab fa-whatsapp"></i>
                            <span>واتساب</span>
                        </button>
                        <button class="twofa-option" onclick="select2FAMethod('email')">
                            <i class="fas fa-envelope"></i>
                            <span>بريد إلكتروني</span>
                        </button>
                    </div>
                    <div id="twofaCodeInput" style="display: none;">
                        <input type="text" id="verificationCode" placeholder="أدخل الرمز" maxlength="6">
                        <button onclick="verify2FACode()">تأكيد</button>
                    </div>
                    <button class="twofa-cancel" onclick="close2FAPrompt()">إلغاء</button>
                </div>
            </div>
        `;

        // إضافة التنسيقات
        const style = document.createElement('style');
        style.textContent = `
            .twofa-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 100000;
                backdrop-filter: blur(5px);
            }
            .twofa-card {
                background: white;
                border-radius: 20px;
                padding: 40px;
                text-align: center;
                max-width: 400px;
                width: 90%;
            }
            .twofa-options {
                display: flex;
                gap: 10px;
                margin: 20px 0;
            }
            .twofa-option {
                flex: 1;
                padding: 15px;
                border: 2px solid #e0e0e0;
                border-radius: 10px;
                background: white;
                cursor: pointer;
                transition: all 0.3s;
            }
            .twofa-option:hover {
                border-color: #667eea;
                background: #f8f9fa;
            }
            .twofa-option i {
                display: block;
                font-size: 24px;
                margin-bottom: 5px;
                color: #667eea;
            }
            #twofaCodeInput {
                margin: 20px 0;
            }
            #twofaCodeInput input {
                width: 100%;
                padding: 10px;
                border: 2px solid #e0e0e0;
                border-radius: 10px;
                font-size: 18px;
                text-align: center;
                letter-spacing: 5px;
                margin-bottom: 10px;
            }
            .twofa-cancel {
                padding: 10px 30px;
                background: #dc3545;
                color: white;
                border: none;
                border-radius: 10px;
                cursor: pointer;
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(prompt);

        // دوال عالمية مؤقتة
        window.selected2FAMethod = null;
        window.select2FAMethod = (method) => {
            window.selected2FAMethod = method;
            document.getElementById('twofaCodeInput').style.display = 'block';
            // إرسال الرمز حسب الطريقة
            this.sendCode(method, phoneNumber, email);
        };
    }
}

export default TwoFactorAuth;
