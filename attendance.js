// assets/js/attendance.js
// نظام تسجيل الحضور والانصراف المتقدم

import { database, ref, push, get, update, query, orderByChild, equalTo } from './firebase-config.js';

class AttendanceSystem {
    constructor(currentUser) {
        this.currentUser = currentUser;
        this.today = new Date().toDateString();
    }

    // تسجيل حضور
    async checkIn() {
        try {
            if (!this.currentUser) {
                throw new Error('يجب تسجيل الدخول أولاً');
            }

            // التحقق من عدم تسجيل حضور مسبق اليوم
            const existingAttendance = await this.getTodayAttendance();
            if (existingAttendance) {
                throw new Error('تم تسجيل الحضور مسبقاً اليوم');
            }

            const attendanceData = {
                userId: this.currentUser.userId,
                userName: this.currentUser.fullName || this.currentUser.username,
                date: this.today,
                checkIn: new Date().toISOString(),
                checkOut: null,
                status: 'present',
                location: await this.getUserLocation(),
                device: this.getDeviceInfo(),
                notes: '',
                trackingNumber: await this.generateTrackingNumber('ATT')
            };

            const attendanceRef = ref(database, 'attendance');
            await push(attendanceRef, attendanceData);

            // تحديث حالة المستخدم
            await update(ref(database, `users/${this.currentUser.userId}`), {
                lastAttendance: attendanceData.checkIn,
                attendanceStatus: 'checked-in'
            });

            // تسجيل النشاط
            await this.logActivity('تسجيل حضور', attendanceData);

            return {
                success: true,
                data: attendanceData
            };

        } catch (error) {
            console.error('Error checking in:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // تسجيل انصراف
    async checkOut() {
        try {
            if (!this.currentUser) {
                throw new Error('يجب تسجيل الدخول أولاً');
            }

            // البحث عن تسجيل الحضور اليوم
            const attendanceRef = ref(database, 'attendance');
            const attendanceQuery = query(
                attendanceRef,
                orderByChild('userId'),
                equalTo(this.currentUser.userId)
            );
            
            const snapshot = await get(attendanceQuery);
            let attendanceId = null;
            let attendanceData = null;

            if (snapshot.exists()) {
                const records = snapshot.val();
                for (const [id, record] of Object.entries(records)) {
                    if (record.date === this.today && !record.checkOut) {
                        attendanceId = id;
                        attendanceData = record;
                        break;
                    }
                }
            }

            if (!attendanceId) {
                throw new Error('لا يوجد تسجيل حضور اليوم');
            }

            // تحديث وقت الانصراف
            await update(ref(database, `attendance/${attendanceId}`), {
                checkOut: new Date().toISOString(),
                duration: this.calculateDuration(attendanceData.checkIn)
            });

            // تحديث حالة المستخدم
            await update(ref(database, `users/${this.currentUser.userId}`), {
                attendanceStatus: 'checked-out'
            });

            // تسجيل النشاط
            await this.logActivity('تسجيل انصراف', { userId: this.currentUser.userId });

            return {
                success: true,
                message: 'تم تسجيل الانصراف بنجاح'
            };

        } catch (error) {
            console.error('Error checking out:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // الحصول على تسجيل اليوم
    async getTodayAttendance() {
        if (!this.currentUser) return null;

        const attendanceRef = ref(database, 'attendance');
        const attendanceQuery = query(
            attendanceRef,
            orderByChild('userId'),
            equalTo(this.currentUser.userId)
        );
        
        const snapshot = await get(attendanceQuery);
        
        if (snapshot.exists()) {
            const records = snapshot.val();
            for (const [id, record] of Object.entries(records)) {
                if (record.date === this.today) {
                    return { id, ...record };
                }
            }
        }
        
        return null;
    }

    // الحصول على تقرير حضور لشهر
    async getMonthlyReport(year, month) {
        const startDate = new Date(year, month - 1, 1).toDateString();
        const endDate = new Date(year, month, 0).toDateString();

        const attendanceRef = ref(database, 'attendance');
        const snapshot = await get(attendanceRef);
        
        if (!snapshot.exists()) return [];

        const records = [];
        snapshot.forEach(child => {
            const record = child.val();
            if (record.userId === this.currentUser?.userId && 
                record.date >= startDate && 
                record.date <= endDate) {
                records.push({ id: child.key, ...record });
            }
        });

        return records;
    }

    // الحصول على موقع المستخدم
    async getUserLocation() {
        return new Promise((resolve) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        });
                    },
                    () => resolve(null)
                );
            } else {
                resolve(null);
            }
        });
    }

    // الحصول على معلومات الجهاز
    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenSize: `${window.screen.width}x${window.screen.height}`
        };
    }

    // حساب مدة الحضور
    calculateDuration(checkInTime) {
        const checkIn = new Date(checkInTime);
        const now = new Date();
        const diff = now - checkIn;
        
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        
        return `${hours} ساعة و ${minutes} دقيقة`;
    }

    // توليد رقم تتبع
    async generateTrackingNumber(prefix) {
        const year = new Date().getFullYear();
        const counterRef = ref(database, `counters/${prefix}_${year}`);
        const snapshot = await get(counterRef);
        const currentCount = snapshot.exists() ? snapshot.val() : 0;
        const newCount = currentCount + 1;
        await set(counterRef, newCount);
        
        const paddedNumber = newCount.toString().padStart(4, '0');
        return `${prefix}-${paddedNumber}-${year}`;
    }

    // تسجيل النشاط
    async logActivity(action, data) {
        const activityRef = ref(database, 'activities');
        await push(activityRef, {
            type: 'attendance',
            action,
            userId: this.currentUser?.userId,
            userName: this.currentUser?.fullName,
            data,
            timestamp: new Date().toISOString()
        });
    }

    // إحصائيات الحضور
    async getAttendanceStats(userId, period = 'month') {
        const attendanceRef = ref(database, 'attendance');
        const snapshot = await get(attendanceRef);
        
        if (!snapshot.exists()) return null;

        let records = [];
        snapshot.forEach(child => {
            const record = child.val();
            if (record.userId === userId) {
                records.push(record);
            }
        });

        // تصفية حسب الفترة
        const now = new Date();
        if (period === 'month') {
            const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
            records = records.filter(r => new Date(r.checkIn) > monthAgo);
        } else if (period === 'week') {
            const weekAgo = new Date(now.setDate(now.getDate() - 7));
            records = records.filter(r => new Date(r.checkIn) > weekAgo);
        }

        const total = records.length;
        const present = records.filter(r => r.status === 'present').length;
        const late = records.filter(r => r.status === 'late').length;
        const absent = records.filter(r => r.status === 'absent').length;

        return {
            total,
            present,
            late,
            absent,
            attendanceRate: total ? ((present / total) * 100).toFixed(1) : 0
        };
    }
}

export default AttendanceSystem;
