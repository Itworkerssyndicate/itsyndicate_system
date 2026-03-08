// assets/js/encryption.js
// نظام التشفير المحلي للبيانات الحساسة

class LocalEncryption {
    constructor() {
        this.algorithm = 'AES-GCM';
        this.keyUsages = ['encrypt', 'decrypt'];
        this.keyCache = new Map();
    }

    // توليد مفتاح تشفير عشوائي
    async generateKey() {
        try {
            const key = await crypto.subtle.generateKey(
                {
                    name: this.algorithm,
                    length: 256
                },
                true,
                this.keyUsages
            );
            
            // تصدير المفتاح بتنسيق base64 للتخزين
            const exportedKey = await crypto.subtle.exportKey('raw', key);
            const exportedKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
            
            return {
                key: key,
                base64: exportedKeyBase64
            };
        } catch (error) {
            console.error('Error generating key:', error);
            throw new Error('فشل توليد مفتاح التشفير');
        }
    }

    // استيراد مفتاح من base64
    async importKey(base64Key) {
        try {
            // التحقق من وجود المفتاح في الكاش
            if (this.keyCache.has(base64Key)) {
                return this.keyCache.get(base64Key);
            }

            const keyData = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
            const key = await crypto.subtle.importKey(
                'raw',
                keyData,
                {
                    name: this.algorithm,
                    length: 256
                },
                true,
                this.keyUsages
            );

            // حفظ في الكاش
            this.keyCache.set(base64Key, key);
            
            return key;
        } catch (error) {
            console.error('Error importing key:', error);
            throw new Error('فشل استيراد مفتاح التشفير');
        }
    }

    // تشفير البيانات
    async encryptData(plaintext, key) {
        try {
            // توليد initialization vector عشوائي
            const iv = crypto.getRandomValues(new Uint8Array(12));
            
            // تحويل النص إلى Uint8Array
            const encodedPlaintext = new TextEncoder().encode(JSON.stringify(plaintext));
            
            // الحصول على المفتاح
            let cryptoKey;
            if (typeof key === 'string') {
                cryptoKey = await this.importKey(key);
            } else {
                cryptoKey = key;
            }
            
            // تشفير البيانات
            const ciphertext = await crypto.subtle.encrypt(
                {
                    name: this.algorithm,
                    iv: iv
                },
                cryptoKey,
                encodedPlaintext
            );
            
            // إرجاع النص المشفر مع IV
            return {
                ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
                iv: btoa(String.fromCharCode(...iv)),
                algorithm: this.algorithm
            };
        } catch (error) {
            console.error('Error encrypting data:', error);
            throw new Error('فشل تشفير البيانات');
        }
    }

    // فك تشفير البيانات
    async decryptData(encryptedData, key) {
        try {
            const { ciphertext, iv } = encryptedData;
            
            // تحويل من base64
            const ciphertextBytes = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
            const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
            
            // الحصول على المفتاح
            let cryptoKey;
            if (typeof key === 'string') {
                cryptoKey = await this.importKey(key);
            } else {
                cryptoKey = key;
            }
            
            // فك التشفير
            const decrypted = await crypto.subtle.decrypt(
                {
                    name: this.algorithm,
                    iv: ivBytes
                },
                cryptoKey,
                ciphertextBytes
            );
            
            // تحويل النص المفكوك
            const decoded = new TextDecoder().decode(decrypted);
            return JSON.parse(decoded);
        } catch (error) {
            console.error('Error decrypting data:', error);
            throw new Error('فشل فك تشفير البيانات');
        }
    }

    // تشفير ملف
    async encryptFile(file, key) {
        try {
            const fileData = await file.arrayBuffer();
            
            const iv = crypto.getRandomValues(new Uint8Array(12));
            
            let cryptoKey;
            if (typeof key === 'string') {
                cryptoKey = await this.importKey(key);
            } else {
                cryptoKey = key;
            }
            
            const encryptedFile = await crypto.subtle.encrypt(
                {
                    name: this.algorithm,
                    iv: iv
                },
                cryptoKey,
                fileData
            );
            
            return {
                encryptedData: encryptedFile,
                iv: iv,
                originalName: file.name,
                type: file.type,
                size: file.size
            };
        } catch (error) {
            console.error('Error encrypting file:', error);
            throw new Error('فشل تشفير الملف');
        }
    }

    // فك تشفير ملف
    async decryptFile(encryptedFile, key) {
        try {
            const { encryptedData, iv, originalName, type } = encryptedFile;
            
            let cryptoKey;
            if (typeof key === 'string') {
                cryptoKey = await this.importKey(key);
            } else {
                cryptoKey = key;
            }
            
            const decryptedData = await crypto.subtle.decrypt(
                {
                    name: this.algorithm,
                    iv: iv
                },
                cryptoKey,
                encryptedData
            );
            
            // إنشاء ملف جديد
            const decryptedFile = new File(
                [decryptedData],
                originalName,
                { type: type }
            );
            
            return decryptedFile;
        } catch (error) {
            console.error('Error decrypting file:', error);
            throw new Error('فشل فك تشفير الملف');
        }
    }

    // تخزين آمن في localStorage
    async secureStore(key, value, encryptionKey) {
        try {
            const encrypted = await this.encryptData(value, encryptionKey);
            localStorage.setItem(`secure_${key}`, JSON.stringify({
                data: encrypted.ciphertext,
                iv: encrypted.iv,
                algorithm: encrypted.algorithm
            }));
            return true;
        } catch (error) {
            console.error('Error storing securely:', error);
            return false;
        }
    }

    // استرجاع آمن من localStorage
    async secureRetrieve(key, encryptionKey) {
        try {
            const stored = localStorage.getItem(`secure_${key}`);
            if (!stored) return null;
            
            const { data, iv, algorithm } = JSON.parse(stored);
            return await this.decryptData({
                ciphertext: data,
                iv: iv,
                algorithm: algorithm
            }, encryptionKey);
        } catch (error) {
            console.error('Error retrieving securely:', error);
            return null;
        }
    }

    // تشفير البيانات الحساسة للمستخدم
    async encryptUserData(userData, userKey) {
        const sensitiveFields = [
            'nationalId',
            'phone',
            'email',
            'address',
            'appointmentNumber',
            'bankAccount',
            'salary',
            'personalNotes'
        ];

        const encryptedData = {};
        
        for (const field of sensitiveFields) {
            if (userData[field]) {
                encryptedData[field] = await this.encryptData(userData[field], userKey);
            }
        }

        return encryptedData;
    }

    // فك تشفير بيانات المستخدم
    async decryptUserData(encryptedData, userKey) {
        const decryptedData = {};
        
        for (const [field, encrypted] of Object.entries(encryptedData)) {
            decryptedData[field] = await this.decryptData(encrypted, userKey);
        }

        return decryptedData;
    }

    // توليد مفتاح للمستخدم بناءً على كلمة المرور
    async generateUserKey(password, salt) {
        const encoder = new TextEncoder();
        const passwordData = encoder.encode(password);
        const saltData = encoder.encode(salt);
        
        // استخدام PBKDF2 لتوليد مفتاح من كلمة المرور
        const baseKey = await crypto.subtle.importKey(
            'raw',
            passwordData,
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );
        
        const key = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: saltData,
                iterations: 100000,
                hash: 'SHA-256'
            },
            baseKey,
            {
                name: this.algorithm,
                length: 256
            },
            true,
            this.keyUsages
        );
        
        return key;
    }

    // توليد ملح عشوائي
    generateSalt() {
        return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
    }

    // توقيع البيانات (للتأكد من عدم التلاعب)
    async signData(data, key) {
        try {
            const encoder = new TextEncoder();
            const dataBytes = encoder.encode(JSON.stringify(data));
            
            const signature = await crypto.subtle.sign(
                {
                    name: 'HMAC',
                    hash: 'SHA-256'
                },
                key,
                dataBytes
            );
            
            return btoa(String.fromCharCode(...new Uint8Array(signature)));
        } catch (error) {
            console.error('Error signing data:', error);
            throw new Error('فشل توقيع البيانات');
        }
    }

    // التحقق من التوقيع
    async verifySignature(data, signature, key) {
        try {
            const encoder = new TextEncoder();
            const dataBytes = encoder.encode(JSON.stringify(data));
            const signatureBytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
            
            return await crypto.subtle.verify(
                {
                    name: 'HMAC',
                    hash: 'SHA-256'
                },
                key,
                signatureBytes,
                dataBytes
            );
        } catch (error) {
            console.error('Error verifying signature:', error);
            return false;
        }
    }
}

export default LocalEncryption;
