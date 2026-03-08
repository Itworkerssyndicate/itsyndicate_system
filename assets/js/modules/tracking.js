// assets/js/modules/tracking.js
// نظام التتبع المتكامل - تتبع المراسلات والطلبات بين اللجان والفروع

class TrackingSystem {
    constructor(currentUser = null) {
        this.currentUser = currentUser;
        this.trackingItems = [];
        this.statuses = {
            pending: 'في الانتظار',
            received: 'تم الاستلام',
            viewed: 'تم المشاهدة',
            processing: 'قيد المعالجة',
            completed: 'مكتمل',
            rejected: 'مرفوض',
            cancelled: 'ملغي',
            archived: 'مؤرشف'
        };
        this.priorities = {
            low: 'منخفضة',
            normal: 'عادية',
            high: 'عالية',
            urgent: 'عاجلة'
        };
        this.init();
    }

    // ===== 1. تهيئة النظام =====
    async init() {
        await this.loadTracking();
        this.setupAutoSave();
        this.setupDeadlineChecker();
    }

    // ===== 2. تحميل بيانات التتبع =====
    async loadTracking() {
        try {
            const saved = localStorage.getItem('tracking_items');
            if (saved) {
                this.trackingItems = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading tracking data:', error);
        }
    }

    // ===== 3. حفظ بيانات التتبع =====
    saveTracking() {
        try {
            localStorage.setItem('tracking_items', JSON.stringify(this.trackingItems));
        } catch (error) {
            console.error('Error saving tracking data:', error);
        }
    }

    // ===== 4. إعداد الحفظ التلقائي =====
    setupAutoSave() {
        setInterval(() => {
            this.saveTracking();
        }, 60000); // كل دقيقة
    }

    // ===== 5. إعداد فحص المواعيد النهائية =====
    setupDeadlineChecker() {
        setInterval(() => {
            this.checkDeadlines();
        }, 3600000); // كل ساعة
    }

    // ===== 6. إنشاء عنصر تتبع جديد =====
    createTracking(data) {
        const tracking = {
            id: this.generateId(),
            number: this.generateTrackingNumber(data),
            type: data.type, // 'request', 'report', 'complaint', 'suggestion', 'decision'
            title: data.title,
            description: data.description,
            priority: data.priority || 'normal',
            status: 'pending',
            fromType: data.fromType, // 'committee', 'branch', 'president', 'vice'
            fromId: data.fromId,
            fromName: data.fromName,
            toType: data.toType,
            toId: data.toId,
            toName: data.toName,
            cc: data.cc || [], // نسخة إلى
            bcc: data.bcc || [], // نسخة مخفية
            attachments: data.attachments || [],
            tags: data.tags || [],
            deadline: data.deadline || null,
            completedAt: null,
            history: [{
                status: 'pending',
                action: 'created',
                userId: this.currentUser?.userId,
                userName: this.currentUser?.fullName,
                timestamp: new Date().toISOString(),
                note: 'تم إنشاء المراسلة'
            }],
            comments: [],
            metadata: data.metadata || {},
            createdAt: new Date().toISOString(),
            createdBy: this.currentUser?.userId,
            updatedAt: new Date().toISOString(),
            updatedBy: this.currentUser?.userId
        };

        this.trackingItems.unshift(tracking);
        this.saveTracking();

        // إرسال إشعار للمستلم
        this.notifyRecipient(tracking);

        return tracking;
    }

    // ===== 7. تحديث حالة عنصر التتبع =====
    updateStatus(id, newStatus, note = '') {
        const tracking = this.trackingItems.find(t => t.id === id);
        if (!tracking) return false;

        const oldStatus = tracking.status;
        tracking.status = newStatus;
        tracking.updatedAt = new Date().toISOString();
        tracking.updatedBy = this.currentUser?.userId;

        tracking.history.push({
            status: newStatus,
            action: 'status_changed',
            userId: this.currentUser?.userId,
            userName: this.currentUser?.fullName,
            timestamp: new Date().toISOString(),
            note: note,
            oldStatus: oldStatus
        });

        if (newStatus === 'completed') {
            tracking.completedAt = new Date().toISOString();
        }

        this.saveTracking();

        // إشعار بالأطراف المعنية
        this.notifyStatusChange(tracking, oldStatus, newStatus);

        return true;
    }

    // ===== 8. إضافة تعليق =====
    addComment(id, comment) {
        const tracking = this.trackingItems.find(t => t.id === id);
        if (!tracking) return false;

        const newComment = {
            id: this.generateId('CMT'),
            userId: this.currentUser?.userId,
            userName: this.currentUser?.fullName,
            content: comment,
            attachments: [],
            createdAt: new Date().toISOString()
        };

        tracking.comments.push(newComment);
        tracking.updatedAt = new Date().toISOString();

        tracking.history.push({
            status: tracking.status,
            action: 'comment_added',
            userId: this.currentUser?.userId,
            userName: this.currentUser?.fullName,
            timestamp: new Date().toISOString(),
            note: 'تم إضافة تعليق'
        });

        this.saveTracking();

        // إشعار بالأطراف المعنية
        this.notifyNewComment(tracking, newComment);

        return newComment;
    }

    // ===== 9. إضافة مرفق =====
    addAttachment(id, attachment) {
        const tracking = this.trackingItems.find(t => t.id === id);
        if (!tracking) return false;

        const newAttachment = {
            id: this.generateId('ATT'),
            name: attachment.name,
            url: attachment.url,
            type: attachment.type,
            size: attachment.size,
            uploadedBy: this.currentUser?.userId,
            uploadedByName: this.currentUser?.fullName,
            uploadedAt: new Date().toISOString()
        };

        tracking.attachments.push(newAttachment);
        tracking.updatedAt = new Date().toISOString();

        this.saveTracking();

        return newAttachment;
    }

    // ===== 10. إعادة توجيه =====
    forward(id, toType, toId, toName, note = '') {
        const tracking = this.trackingItems.find(t => t.id === id);
        if (!tracking) return false;

        const oldTo = {
            type: tracking.toType,
            id: tracking.toId,
            name: tracking.toName
        };

        tracking.toType = toType;
        tracking.toId = toId;
        tracking.toName = toName;
        tracking.updatedAt = new Date().toISOString();

        tracking.history.push({
            status: tracking.status,
            action: 'forwarded',
            userId: this.currentUser?.userId,
            userName: this.currentUser?.fullName,
            timestamp: new Date().toISOString(),
            note: note,
            from: oldTo,
            to: { type: toType, id: toId, name: toName }
        });

        this.saveTracking();

        // إشعار بالمستلم الجديد
        this.notifyRecipient(tracking, true);

        return true;
    }

    // ===== 11. البحث في التتبع =====
    searchTracking(query, filters = {}) {
        return this.trackingItems.filter(item => {
            // البحث في النص
            const matchesQuery = !query || 
                item.title?.toLowerCase().includes(query.toLowerCase()) ||
                item.description?.toLowerCase().includes(query.toLowerCase()) ||
                item.number?.toLowerCase().includes(query.toLowerCase()) ||
                item.fromName?.toLowerCase().includes(query.toLowerCase()) ||
                item.toName?.toLowerCase().includes(query.toLowerCase());

            if (!matchesQuery) return false;

            // تطبيق الفلاتر
            if (filters.type && item.type !== filters.type) return false;
            if (filters.status && item.status !== filters.status) return false;
            if (filters.priority && item.priority !== filters.priority) return false;
            if (filters.fromType && item.fromType !== filters.fromType) return false;
            if (filters.toType && item.toType !== filters.toType) return false;
            if (filters.fromId && item.fromId !== filters.fromId) return false;
            if (filters.toId && item.toId !== filters.toId) return false;

            // تصفية حسب التاريخ
            if (filters.startDate && new Date(item.createdAt) < new Date(filters.startDate)) return false;
            if (filters.endDate && new Date(item.createdAt) > new Date(filters.endDate)) return false;

            return true;
        });
    }

    // ===== 12. الحصول على عناصر التتبع للمستخدم =====
    getUserTracking(userId, role = null) {
        return this.trackingItems.filter(item => 
            item.fromId === userId || 
            item.toId === userId ||
            (role === 'president' && (item.toType === 'president' || item.fromType === 'president'))
        );
    }

    // ===== 13. الحصول على إحصائيات التتبع =====
    getStats() {
        const stats = {
            total: this.trackingItems.length,
            byStatus: {},
            byType: {},
            byPriority: {},
            overdue: 0,
            completedToday: 0,
            createdToday: 0
        };

        const today = new Date().toDateString();

        this.trackingItems.forEach(item => {
            // حسب الحالة
            stats.byStatus[item.status] = (stats.byStatus[item.status] || 0) + 1;

            // حسب النوع
            stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;

            // حسب الأولوية
            stats.byPriority[item.priority] = (stats.byPriority[item.priority] || 0) + 1;

            // متأخرة
            if (item.deadline && new Date(item.deadline) < new Date() && item.status !== 'completed') {
                stats.overdue++;
            }

            // مكتملة اليوم
            if (item.completedAt && new Date(item.completedAt).toDateString() === today) {
                stats.completedToday++;
            }

            // منشأة اليوم
            if (new Date(item.createdAt).toDateString() === today) {
                stats.createdToday++;
            }
        });

        return stats;
    }

    // ===== 14. الحصول على تقرير التتبع =====
    getTrackingReport(period = 'month') {
        const filtered = this.filterByPeriod(this.trackingItems, period);
        
        const report = {
            period,
            total: filtered.length,
            byStatus: {},
            byType: {},
            byPriority: {},
            averageCompletionTime: 0,
            items: filtered.slice(0, 100) // آخر 100 عنصر
        };

        let totalCompletionTime = 0;
        let completedCount = 0;

        filtered.forEach(item => {
            report.byStatus[item.status] = (report.byStatus[item.status] || 0) + 1;
            report.byType[item.type] = (report.byType[item.type] || 0) + 1;
            report.byPriority[item.priority] = (report.byPriority[item.priority] || 0) + 1;

            if (item.completedAt) {
                const created = new Date(item.createdAt);
                const completed = new Date(item.completedAt);
                const days = (completed - created) / (1000 * 60 * 60 * 24);
                totalCompletionTime += days;
                completedCount++;
            }
        });

        report.averageCompletionTime = completedCount ? totalCompletionTime / completedCount : 0;

        return report;
    }

    // ===== 15. تصفية حسب الفترة =====
    filterByPeriod(items, period) {
        const now = new Date();
        let startDate;

        switch (period) {
            case 'today':
                startDate = new Date(now.setHours(0, 0, 0, 0));
                break;
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'month':
                startDate = new Date(now.setMonth(now.getMonth() - 1));
                break;
            case 'quarter':
                startDate = new Date(now.setMonth(now.getMonth() - 3));
                break;
            case 'year':
                startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                break;
            default:
                return items;
        }

        return items.filter(item => new Date(item.createdAt) >= startDate);
    }

    // ===== 16. فحص المواعيد النهائية =====
    checkDeadlines() {
        const now = new Date();
        
        this.trackingItems.forEach(item => {
            if (item.deadline && item.status !== 'completed') {
                const deadline = new Date(item.deadline);
                const diff = deadline - now;
                const hoursLeft = diff / (1000 * 60 * 60);

                // تنبيه قبل 24 ساعة
                if (hoursLeft <= 24 && hoursLeft > 23) {
                    this.sendDeadlineAlert(item, '24 ساعة');
                }
                // تنبيه قبل 6 ساعات
                else if (hoursLeft <= 6 && hoursLeft > 5) {
                    this.sendDeadlineAlert(item, '6 ساعات');
                }
                // تنبيه قبل ساعة
                else if (hoursLeft <= 1 && hoursLeft > 0) {
                    this.sendDeadlineAlert(item, 'ساعة');
                }
                // انتهى الموعد
                else if (hoursLeft <= 0) {
                    this.updateStatus(item.id, 'overdue', 'انتهى الموعد النهائي');
                    this.sendDeadlineAlert(item, 'انتهى الموعد');
                }
            }
        });
    }

    // ===== 17. إرسال تنبيه موعد نهائي =====
    sendDeadlineAlert(item, timeLeft) {
        // سيتم تنفيذها مع نظام الإشعارات
        console.log(`⚠️ Deadline alert for ${item.number}: ${timeLeft} left`);
    }

    // ===== 18. إشعار المستلم =====
    notifyRecipient(item, forwarded = false) {
        // سيتم تنفيذها مع نظام الإشعارات
        console.log(`📨 Notification sent to ${item.toName}`, item);
    }

    // ===== 19. إشعار بتغيير الحالة =====
    notifyStatusChange(item, oldStatus, newStatus) {
        // سيتم تنفيذها مع نظام الإشعارات
        console.log(`🔄 Status changed for ${item.number}: ${oldStatus} → ${newStatus}`);
    }

    // ===== 20. إشعار بتعليق جديد =====
    notifyNewComment(item, comment) {
        // سيتم تنفيذها مع نظام الإشعارات
        console.log(`💬 New comment on ${item.number}`, comment);
    }

    // ===== 21. توليد رقم تتبع =====
    generateTrackingNumber(data) {
        const prefix = data.type === 'request' ? 'REQ' :
                      data.type === 'report' ? 'REP' :
                      data.type === 'complaint' ? 'CMP' :
                      data.type === 'suggestion' ? 'SUG' :
                      data.type === 'decision' ? 'DEC' : 'TRK';
        
        const fromPrefix = data.fromType === 'committee' ? 'C' :
                          data.fromType === 'branch' ? 'B' :
                          data.fromType === 'president' ? 'P' :
                          data.fromType === 'vice' ? 'V' : 'X';
        
        const toPrefix = data.toType === 'committee' ? 'C' :
                        data.toType === 'branch' ? 'B' :
                        data.toType === 'president' ? 'P' :
                        data.toType === 'vice' ? 'V' : 'X';
        
        const year = new Date().getFullYear();
        const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
        const day = new Date().getDate().toString().padStart(2, '0');
        const count = (this.trackingItems.length + 1).toString().padStart(4, '0');
        
        return `${prefix}-${fromPrefix}${toPrefix}-${year}${month}${day}-${count}`;
    }

    // ===== 22. توليد معرف فريد =====
    generateId() {
        return 'trk_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // ===== 23. التحقق من صلاحية المستخدم =====
    canAccessItem(item) {
        if (!this.currentUser) return false;
        
        // النقيب يصل للكل
        if (this.currentUser.role === 'president') return true;
        
        // النائب الأول يصل للكل
        if (this.currentUser.role === 'vice_president_first') return true;
        
        // مدير اللجان يصل لمراسلات اللجان
        if (this.currentUser.role === 'vice_president_second_manager') {
            return item.fromType === 'committee' || item.toType === 'committee';
        }
        
        // مدير الفروع يصل لمراسلات الفروع
        if (this.currentUser.role === 'secretary_assistant_manager') {
            return item.fromType === 'branch' || item.toType === 'branch';
        }
        
        // المستخدم العادي يصل لمراسلاته فقط
        return item.fromId === this.currentUser.userId || 
               item.toId === this.currentUser.userId;
    }

    // ===== 24. أرشفة عنصر =====
    archiveItem(id) {
        return this.updateStatus(id, 'archived', 'تمت الأرشفة');
    }

    // ===== 25. حذف عنصر =====
    deleteItem(id) {
        const index = this.trackingItems.findIndex(t => t.id === id);
        if (index !== -1) {
            this.trackingItems.splice(index, 1);
            this.saveTracking();
            return true;
        }
        return false;
    }

    // ===== 26. تصدير التقرير =====
    exportReport(report, format = 'json') {
        if (format === 'json') {
            return JSON.stringify(report, null, 2);
        } else if (format === 'csv') {
            const headers = ['number', 'type', 'title', 'status', 'priority', 'fromName', 'toName', 'createdAt'];
            const rows = report.items.map(item => 
                headers.map(h => item[h] || '').join(',')
            );
            return [headers.join(','), ...rows].join('\n');
        }
    }

    // ===== 27. مزامنة مع الخادم =====
    async syncWithServer() {
        // سيتم تنفيذها عند الاتصال بالخادم
    }
}

export default TrackingSystem;
