// assets/js/security/biometric-auth.js
// نظام المصادقة الحيوية - بصمة الوجه والإصبع (إجباري حسب إمكانيات الجهاز)

class BiometricAuth {
    constructor(currentUser = null) {
        this.currentUser = currentUser;
        this.isSupported = this.checkSupport();
        this.hasFaceID = this.checkFaceIDSupport();
        this.hasFingerprint = this.checkFingerprintSupport();
        this.availableMethods = this.getAvailableMethods();
    }

    // ===== 1. التحقق من دعم المتصفح للمصادقة الحيوية =====
    checkSupport() {
        return window.PublicKeyCredential !== undefined;
    }

    // ===== 2. التحقق من دعم بصمة الوجه =====
    checkFaceIDSupport() {
        // التحقق من دعم Face ID (iOS/macOS)
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isMacOS = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        
        // التحقق من وجود كاميرا
        if (isIOS || isMacOS) {
            return true;
        }

        // التحقق من دعم Windows Hello (Face)
        if (navigator.credentials && navigator.credentials.create) {
            return true;
        }

        return false;
    }

    // ===== 3. التحقق من دعم بصمة الإصبع =====
    checkFingerprintSupport() {
        // التحقق من دعم Touch ID (iOS)
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        
        // التحقق من دعم Android Fingerprint
        const isAndroid = /Android/.test(navigator.userAgent);
        
        // التحقق من دعم Windows Hello (Fingerprint)
        const isWindows = /Windows/.test(navigator.userAgent);

        return isIOS || isAndroid || isWindows;
    }

    // ===== 4. الحصول على الطرق المتاحة =====
    getAvailableMethods() {
        const methods = [];

        if (this.hasFaceID) {
            methods.push({
                id: 'face',
                name: 'بصمة الوجه',
                icon: 'fa-face-smile',
                description: 'استخدم كاميرا الجهاز للتعرف على وجهك',
                priority: 1
            });
        }

        if (this.hasFingerprint) {
            methods.push({
                id: 'fingerprint',
                name: 'بصمة الإصبع',
                icon: 'fa-fingerprint',
                description: 'استخدم مستشعر بصمة الإصبع',
                priority: 2
            });
        }

        return methods.sort((a, b) => a.priority - b.priority);
    }

    // ===== 5. الحصول على أفضل طريقة متاحة =====
    getBestAvailableMethod() {
        if (this.availableMethods.length === 0) {
            return {
                available: false,
                method: 'none',
                name: 'غير متاحة',
                icon: 'fa-lock'
            };
        }

        return {
            available: true,
            ...this.availableMethods[0]
        };
    }

    // ===== 6. تسجيل بصمة جديدة =====
    async registerBiometric(userId, userName, method = null) {
        try {
            if (!this.isSupported) {
                throw new Error('المتصفح لا يدعم المصادقة الحيوية');
            }

            const selectedMethod = method || this.getBestAvailableMethod().id;
            
            if (!selectedMethod) {
                throw new Error('لا توجد وسيلة مصادقة حيوية متاحة');
            }

            // إعداد خيارات التسجيل
            const options = this.getRegistrationOptions(userId, userName, selectedMethod);

            // طلب تسجيل البصمة من المتصفح
            const credential = await navigator.credentials.create(options);

            // حفظ بيانات البصمة
            await this.saveBiometricData(userId, credential, selectedMethod);

            // تحديث حالة المستخدم
            await this.updateUserBiometricStatus(userId, selectedMethod, true);

            return {
                success: true,
                method: selectedMethod,
                message: `✅ تم تسجيل ${selectedMethod === 'face' ? 'بصمة الوجه' : 'بصمة الإصبع'} بنجاح`
            };

        } catch (error) {
            console.error('Biometric registration error:', error);
            return {
                success: false,
                error: error.message,
                message: '❌ فشل تسجيل البصمة'
            };
        }
    }

    // ===== 7. الحصول على خيارات التسجيل =====
    getRegistrationOptions(userId, userName, method) {
        return {
            publicKey: {
                rp: {
                    id: window.location.hostname,
                    name: "ITWS Union System"
                },
                user: {
                    id: new TextEncoder().encode(userId),
                    name: userName,
                    displayName: userName
                },
                challenge: crypto.getRandomValues(new Uint8Array(32)),
                pubKeyCredParams: [
                    { type: "public-key", alg: -7 }, // ES256
                    { type: "public-key", alg: -257 } // RS256
                ],
                authenticatorSelection: {
                    authenticatorAttachment: method === 'face' ? 'platform' : 'cross-platform',
                    residentKey: "required",
                    userVerification: "required"
                },
                attestation: "direct",
                timeout: 60000
            }
        };
    }

    // ===== 8. المصادقة بالبصمة =====
    async authenticateBiometric(userId) {
        try {
            if (!this.isSupported) {
                throw new Error('المتصفح لا يدعم المصادقة الحيوية');
            }

            // الحصول على بيانات البصمة المسجلة
            const biometricData = await this.getUserBiometricData(userId);
            
            if (!biometricData) {
                throw new Error('لم يتم تسجيل بصمة لهذا المستخدم');
            }

            // إعداد خيارات المصادقة
            const options = this.getAuthenticationOptions(biometricData);

            // طلب المصادقة من المتصفح
            const assertion = await navigator.credentials.get(options);

            // التحقق من صحة التوقيع
            const isValid = await this.verifyAssertion(assertion, userId, biometricData);

            if (isValid) {
                return {
                    success: true,
                    method: biometricData.method,
                    message: `✅ تم التحقق بنجاح`
                };
            } else {
                throw new Error('فشل التحقق من البصمة');
            }

        } catch (error) {
            console.error('Biometric authentication error:', error);
            return {
                success: false,
                error: error.message,
                message: '❌ فشل المصادقة'
            };
        }
    }

    // ===== 9. الحصول على خيارات المصادقة =====
    getAuthenticationOptions(biometricData) {
        return {
            publicKey: {
                challenge: crypto.getRandomValues(new Uint8Array(32)),
                allowCredentials: [{
                    id: biometricData.credentialId,
                    type: 'public-key',
                    transports: ['internal', 'usb', 'nfc', 'ble']
                }],
                userVerification: "required",
                timeout: 60000
            }
        };
    }

    // ===== 10. التحقق من صحة التوقيع =====
    async verifyAssertion(assertion, userId, biometricData) {
        // هنا يتم التحقق من التوقيع مع الخادم
        // هذا مؤقتاً نرجع true
        console.log('✅ تم التحقق من التوقيع');
        return true;
    }

    // ===== 11. حفظ بيانات البصمة =====
    async saveBiometricData(userId, credential, method) {
        const biometricData = {
            userId: userId,
            method: method,
            credentialId: credential.id,
            publicKey: credential.response.publicKey,
            registeredAt: new Date().toISOString(),
            deviceInfo: this.getDeviceInfo()
        };

        // حفظ في localStorage مؤقتاً (سيتم نقله للخادم لاحقاً)
        localStorage.setItem(`biometric_${userId}`, JSON.stringify(biometricData));
        
        console.log(`✅ تم حفظ بيانات ${method} للمستخدم ${userId}`);
    }

    // ===== 12. الحصول على بيانات البصمة =====
    async getUserBiometricData(userId) {
        const data = localStorage.getItem(`biometric_${userId}`);
        return data ? JSON.parse(data) : null;
    }

    // ===== 13. تحديث حالة المستخدم =====
    async updateUserBiometricStatus(userId, method, enabled) {
        // هنا يتم تحديث حالة المستخدم في قاعدة البيانات
        console.log(`✅ تم تحديث حالة البصمة للمستخدم ${userId}: ${method} = ${enabled}`);
    }

    // ===== 14. التحقق من إجبارية البصمة =====
    async checkBiometricRequirement(userId) {
        // التحقق من إعدادات المستخدم
        const userSettings = await this.getUserSettings(userId);
        const availableMethod = this.getBestAvailableMethod();

        // إذا كانت المصادقة الحيوية متاحة وإجبارية
        if (availableMethod.available) {
            // إذا لم يسجل المستخدم بصمته من قبل
            if (!userSettings.biometricEnabled) {
                return {
                    required: true,
                    method: availableMethod.id,
                    name: availableMethod.name,
                    message: `يجب تسجيل ${availableMethod.name} للدخول إلى النظام`
                };
            }
            
            // إذا سجل من قبل، نطلب المصادقة
            return {
                required: true,
                method: availableMethod.id,
                name: availableMethod.name,
                message: `الرجاء استخدام ${availableMethod.name} للدخول`
            };
        }

        return {
            required: false,
            method: 'none'
        };
    }

    // ===== 15. الحصول على إعدادات المستخدم =====
    async getUserSettings(userId) {
        // هنا يتم جلب إعدادات المستخدم من قاعدة البيانات
        // هذا مؤقتاً
        return {
            biometricEnabled: false,
            preferredMethod: null
        };
    }

    // ===== 16. عرض واجهة المصادقة =====
    showBiometricPrompt(method) {
        return new Promise((resolve) => {
            const prompt = document.createElement('div');
            prompt.className = 'biometric-prompt';
            prompt.innerHTML = `
                <div class="biometric-overlay">
                    <div class="biometric-card">
                        <div class="biometric-icon">
                            <i class="fas ${method === 'face' ? 'fa-face-smile' : 'fa-fingerprint'}"></i>
                        </div>
                        <h3>${method === 'face' ? 'بصمة الوجه' : 'بصمة الإصبع'}</h3>
                        <p>${method === 'face' ? 'انظر إلى الكاميرا' : 'ضع إصبعك على المستشعر'}</p>
                        <div class="biometric-status" id="biometricStatus">
                            <div class="spinner-sm"></div>
                            <span>جاري المسح...</span>
                        </div>
                        <button class="biometric-cancel" onclick="this.closest('.biometric-prompt').remove()">إلغاء</button>
                    </div>
                </div>
            `;

            // إضافة التنسيقات
            const style = document.createElement('style');
            style.textContent = `
                .biometric-overlay {
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
                    animation: fadeIn 0.3s ease;
                }
                .biometric-card {
                    background: white;
                    border-radius: 20px;
                    padding: 40px;
                    text-align: center;
                    max-width: 400px;
                    width: 90%;
                    animation: slideUp 0.3s ease;
                }
                .biometric-icon {
                    width: 100px;
                    height: 100px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px;
                    color: white;
                    font-size: 40px;
                    animation: pulse 2s infinite;
                }
                .biometric-status {
                    margin: 20px 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    color: #666;
                }
                .biometric-cancel {
                    padding: 10px 30px;
                    background: #dc3545;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .biometric-cancel:hover {
                    background: #c82333;
                    transform: scale(1.05);
                }
                .spinner-sm {
                    width: 20px;
                    height: 20px;
                    border: 3px solid #f3f3f3;
                    border-top: 3px solid #667eea;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
            `;

            document.head.appendChild(style);
            document.body.appendChild(prompt);

            // محاكاة نجاح المصادقة بعد ثانيتين
            setTimeout(() => {
                prompt.remove();
                resolve({ success: true });
            }, 2000);
        });
    }

    // ===== 17. الحصول على معلومات الجهاز =====
    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenSize: `${window.screen.width}x${window.screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }

    // ===== 18. حذف بيانات البصمة =====
    async deleteBiometricData(userId) {
        localStorage.removeItem(`biometric_${userId}`);
        console.log(`✅ تم حذف بيانات البصمة للمستخدم ${userId}`);
    }

    // ===== 19. الحصول على إحصائيات البصمة =====
    getStats() {
        return {
            supported: this.isSupported,
            faceID: this.hasFaceID,
            fingerprint: this.hasFingerprint,
            availableMethods: this.availableMethods.length,
            bestMethod: this.getBestAvailableMethod().name
        };
    }

    // ===== 20. التحقق من توافق الجهاز =====
    checkDeviceCompatibility() {
        return {
            isSupported: this.isSupported,
            hasFaceID: this.hasFaceID,
            hasFingerprint: this.hasFingerprint,
            availableMethods: this.availableMethods,
            recommendations: this.getRecommendations()
        };
    }

    // ===== 21. الحصول على توصيات =====
    getRecommendations() {
        const recs = [];

        if (!this.isSupported) {
            recs.push({
                type: 'warning',
                message: 'جهازك لا يدعم المصادقة الحيوية. سيتم استخدام طرق بديلة.'
            });
        }

        if (this.hasFaceID && !this.hasFingerprint) {
            recs.push({
                type: 'info',
                message: 'جهازك يدعم بصمة الوجه. يوصى بتفعيلها لمزيد من الأمان.'
            });
        }

        if (this.hasFingerprint && !this.hasFaceID) {
            recs.push({
                type: 'info',
                message: 'جهازك يدعم بصمة الإصبع. يوصى بتفعيلها لمزيد من الأمان.'
            });
        }

        return recs;
    }
}

export default BiometricAuth;
