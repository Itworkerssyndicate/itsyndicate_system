// assets/js/modules/notifications.js
// نظام الإشعارات المتقدم - يدعم الإشعارات الفورية والمسجلة

class NotificationSystem {
    constructor(currentUser = null) {
        this.currentUser = currentUser;
        this.notifications = [];
        this.unreadCount = 0;
        this.listeners = [];
        this.soundEnabled = true;
        this.desktopEnabled = this.checkDesktopSupport();
        this.init();
    }

    // ===== 1. تهيئة النظام =====
    init() {
        this.loadNotifications();
        this.setupRealtimeListener();
        this.requestPermissions();
    }

    // ===== 2. التحقق من دعم إشعارات سطح المكتب =====
    checkDesktopSupport() {
        return 'Notification' in window;
    }

    // ===== 3. طلب الأذونات =====
    async requestPermissions() {
        if (this.desktopEnabled && Notification.permission !== 'granted') {
            await Notification.requestPermission();
        }
    }

    // ===== 4. تحميل الإشعارات المحفوظة =====
    loadNotifications() {
        try {
            const saved = localStorage.getItem(`notifications_${this.currentUser?.userId || 'guest'}`);
            if (saved) {
                this.notifications = JSON.parse(saved);
                this.updateUnreadCount();
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    // ===== 5. حفظ الإشعارات =====
    saveNotifications() {
        try {
            localStorage.setItem(
                `notifications_${this.currentUser?.userId || 'guest'}`,
                JSON.stringify(this.notifications)
            );
        } catch (error) {
            console.error('Error saving notifications:', error);
        }
    }

    // ===== 6. إعداد المستمع المباشر =====
    setupRealtimeListener() {
        // هنا سيتم إعداد WebSocket أو Firebase listener
        setInterval(() => {
            this.checkForNewNotifications();
        }, 30000); // كل 30 ثانية
    }

    // ===== 7. التحقق من الإشعارات الجديدة =====
    checkForNewNotifications() {
        // سيتم تنفيذها عند الاتصال بالخادم
    }

    // ===== 8. إنشاء إشعار جديد =====
    async createNotification(notification) {
        const newNotification = {
            id: this.generateId(),
            userId: this.currentUser?.userId || 'system',
            title: notification.title,
            message: notification.message,
            type: notification.type || 'info',
            priority: notification.priority || 'normal',
            link: notification.link || null,
            image: notification.image || null,
            actions: notification.actions || [],
            data: notification.data || {},
            read: false,
            seen: false,
            createdAt: new Date().toISOString(),
            expiresAt: notification.expiresAt || null
        };

        this.notifications.unshift(newNotification);
        
        // تحديث العداد
        this.updateUnreadCount();
        
        // حفظ
        this.saveNotifications();
        
        // إشعار سطح المكتب
        if (notification.priority !== 'low') {
            this.showDesktopNotification(newNotification);
        }

        // إشعار صوتي
        if (notification.sound !== false) {
            this.playSound(notification.type);
        }

        // إشعار المستمعين
        this.notifyListeners('new', newNotification);

        return newNotification;
    }

    // ===== 9. إنشاء إشعار جماعي =====
    async broadcastNotification(notification, userIds) {
        const results = [];
        
        for (const userId of userIds) {
            const result = await this.createNotification({
                ...notification,
                userId
            });
            results.push(result);
        }

        return results;
    }

    // ===== 10. إنشاء إشعار للمجموعة =====
    async notifyGroup(groupType, groupId, notification) {
        // سيتم تنفيذها عند الاتصال بالخادم
        // ترسل إشعار لكل أعضاء المجموعة
    }

    // ===== 11. عرض إشعار سطح المكتب =====
    showDesktopNotification(notification) {
        if (!this.desktopEnabled || Notification.permission !== 'granted') {
            return;
        }

        const options = {
            body: notification.message,
            icon: notification.image || '/assets/images/logo.png',
            badge: '/assets/images/badge.png',
            tag: notification.id,
            renotify: true,
            silent: !this.soundEnabled,
            data: notification.data,
            actions: notification.actions.map(action => ({
                action: action.id,
                title: action.title,
                icon: action.icon
            }))
        };

        const desktopNotif = new Notification(notification.title, options);

        desktopNotif.onclick = (event) => {
            event.preventDefault();
            this.handleNotificationClick(notification);
            desktopNotif.close();
        };

        desktopNotif.onclose = () => {
            this.markAsSeen(notification.id);
        };
    }

    // ===== 12. معالجة نقرة الإشعار =====
    handleNotificationClick(notification) {
        this.markAsRead(notification.id);
        
        if (notification.link) {
            window.location.href = notification.link;
        }
    }

    // ===== 13. تشغيل صوت الإشعار =====
    playSound(type) {
        if (!this.soundEnabled) return;

        const sounds = {
            success: '/assets/sounds/success.mp3',
            error: '/assets/sounds/error.mp3',
            warning: '/assets/sounds/warning.mp3',
            info: '/assets/sounds/info.mp3',
            message: '/assets/sounds/message.mp3',
            alert: '/assets/sounds/alert.mp3'
        };

        const sound = sounds[type] || sounds.info;
        
        // سيتم تشغيل الصوت عند توفر الملفات
        // const audio = new Audio(sound);
        // audio.play();
    }

    // ===== 14. تحديث عداد الإشعارات غير المقروءة =====
    updateUnreadCount() {
        this.unreadCount = this.notifications.filter(n => !n.read).length;
        
        // تحديث الواجهة
        this.updateBadge();
        
        // تحديث عنوان الصفحة
        this.updateTitle();
    }

    // ===== 15. تحديث الشارة =====
    updateBadge() {
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            if (this.unreadCount > 0) {
                badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    // ===== 16. تحديث عنوان الصفحة =====
    updateTitle() {
        if (this.unreadCount > 0) {
            document.title = `(${this.unreadCount}) ${document.title.replace(/^\(\d+\) /, '')}`;
        } else {
            document.title = document.title.replace(/^\(\d+\) /, '');
        }
    }

    // ===== 17. تحديد إشعار كمقروء =====
    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification && !notification.read) {
            notification.read = true;
            notification.readAt = new Date().toISOString();
            
            this.updateUnreadCount();
            this.saveNotifications();
            this.notifyListeners('read', notification);
        }
    }

    // ===== 18. تحديد جميع الإشعارات كمقروءة =====
    markAllAsRead() {
        this.notifications.forEach(n => {
            if (!n.read) {
                n.read = true;
                n.readAt = new Date().toISOString();
            }
        });
        
        this.updateUnreadCount();
        this.saveNotifications();
        this.notifyListeners('all_read', null);
    }

    // ===== 19. تحديد إشعار كمشاهد =====
    markAsSeen(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification && !notification.seen) {
            notification.seen = true;
            notification.seenAt = new Date().toISOString();
            
            this.saveNotifications();
        }
    }

    // ===== 20. حذف إشعار =====
    deleteNotification(notificationId) {
        const index = this.notifications.findIndex(n => n.id === notificationId);
        if (index !== -1) {
            const deleted = this.notifications.splice(index, 1)[0];
            
            this.updateUnreadCount();
            this.saveNotifications();
            this.notifyListeners('delete', deleted);
            
            return true;
        }
        
        return false;
    }

    // ===== 21. حذف جميع الإشعارات =====
    clearAllNotifications() {
        this.notifications = [];
        this.unreadCount = 0;
        
        this.updateBadge();
        this.updateTitle();
        this.saveNotifications();
        this.notifyListeners('clear', null);
    }

    // ===== 22. حذف الإشعارات القديمة =====
    cleanOldNotifications(days = 30) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        
        this.notifications = this.notifications.filter(n => {
            const createdAt = new Date(n.createdAt);
            return createdAt > cutoff || !n.read;
        });
        
        this.updateUnreadCount();
        this.saveNotifications();
    }

    // ===== 23. الحصول على الإشعارات غير المقروءة =====
    getUnreadNotifications() {
        return this.notifications.filter(n => !n.read);
    }

    // ===== 24. الحصول على الإشعارات حسب النوع =====
    getNotificationsByType(type) {
        return this.notifications.filter(n => n.type === type);
    }

    // ===== 25. الحصول على الإشعارات حسب الأولوية =====
    getNotificationsByPriority(priority) {
        return this.notifications.filter(n => n.priority === priority);
    }

    // ===== 26. البحث في الإشعارات =====
    searchNotifications(query) {
        const lowercaseQuery = query.toLowerCase();
        return this.notifications.filter(n => 
            n.title.toLowerCase().includes(lowercaseQuery) ||
            n.message.toLowerCase().includes(lowercaseQuery)
        );
    }

    // ===== 27. تصدير الإشعارات =====
    exportNotifications(format = 'json') {
        const data = this.notifications.map(n => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type,
            priority: n.priority,
            read: n.read,
            createdAt: n.createdAt
        }));

        if (format === 'json') {
            return JSON.stringify(data, null, 2);
        } else if (format === 'csv') {
            const headers = ['id', 'title', 'message', 'type', 'priority', 'read', 'createdAt'];
            const rows = data.map(n => headers.map(h => n[h]).join(','));
            return [headers.join(','), ...rows].join('\n');
        }
    }

    // ===== 28. إضافة مستمع =====
    addListener(callback) {
        this.listeners.push(callback);
    }

    // ===== 29. إزالة مستمع =====
    removeListener(callback) {
        const index = this.listeners.indexOf(callback);
        if (index !== -1) {
            this.listeners.splice(index, 1);
        }
    }

    // ===== 30. إشعار المستمعين =====
    notifyListeners(event, data) {
        this.listeners.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('Error in notification listener:', error);
            }
        });
    }

    // ===== 31. عرض الإشعارات في الواجهة =====
    renderNotifications(container, options = {}) {
        if (!container) return;

        const {
            showRead = true,
            maxItems = 50,
            groupByDate = true
        } = options;

        let notifications = this.notifications
            .filter(n => showRead || !n.read)
            .slice(0, maxItems);

        if (groupByDate) {
            const grouped = this.groupNotificationsByDate(notifications);
            container.innerHTML = this.renderGroupedNotifications(grouped);
        } else {
            container.innerHTML = this.renderNotificationList(notifications);
        }

        // إضافة مستمعات الأحداث
        this.attachNotificationListeners(container);
    }

    // ===== 32. تجميع الإشعارات حسب التاريخ =====
    groupNotificationsByDate(notifications) {
        const groups = {
            today: [],
            yesterday: [],
            thisWeek: [],
            thisMonth: [],
            older: []
        };

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        notifications.forEach(n => {
            const date = new Date(n.createdAt);
            
            if (this.isSameDay(date, today)) {
                groups.today.push(n);
            } else if (this.isSameDay(date, yesterday)) {
                groups.yesterday.push(n);
            } else if (date > weekAgo) {
                groups.thisWeek.push(n);
            } else if (date > monthAgo) {
                groups.thisMonth.push(n);
            } else {
                groups.older.push(n);
            }
        });

        return groups;
    }

    // ===== 33. التحقق من نفس اليوم =====
    isSameDay(date1, date2) {
        return date1.toDateString() === date2.toDateString();
    }

    // ===== 34. عرض الإشعارات المجمعة =====
    renderGroupedNotifications(groups) {
        const groupNames = {
            today: 'اليوم',
            yesterday: 'أمس',
            thisWeek: 'هذا الأسبوع',
            thisMonth: 'هذا الشهر',
            older: 'أقدم'
        };

        let html = '';

        for (const [key, notifications] of Object.entries(groups)) {
            if (notifications.length > 0) {
                html += `
                    <div class="notification-group">
                        <div class="notification-group-header">
                            ${groupNames[key]} (${notifications.length})
                        </div>
                        ${this.renderNotificationList(notifications)}
                    </div>
                `;
            }
        }

        return html || '<div class="no-notifications">لا توجد إشعارات</div>';
    }

    // ===== 35. عرض قائمة الإشعارات =====
    renderNotificationList(notifications) {
        return notifications.map(n => `
            <div class="notification-item ${n.read ? 'read' : 'unread'} ${n.priority}" 
                 data-id="${n.id}"
                 onclick="notificationSystem.handleNotificationClick(${JSON.stringify(n)})">
                <div class="notification-icon ${n.type}">
                    <i class="fas ${this.getIconForType(n.type)}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${n.title}</div>
                    <div class="notification-message">${n.message}</div>
                    <div class="notification-meta">
                        <span class="notification-time">
                            ${this.formatTime(n.createdAt)}
                        </span>
                        ${n.priority === 'high' ? '<span class="priority-badge">مهم</span>' : ''}
                    </div>
                </div>
                ${!n.read ? '<span class="unread-dot"></span>' : ''}
            </div>
        `).join('');
    }

    // ===== 36. الحصول على أيقونة حسب النوع =====
    getIconForType(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle',
            message: 'fa-envelope',
            alert: 'fa-bell',
            reminder: 'fa-clock',
            achievement: 'fa-trophy'
        };
        return icons[type] || 'fa-bell';
    }

    // ===== 37. تنسيق الوقت =====
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) {
            return 'الآن';
        } else if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `منذ ${minutes} دقيقة`;
        } else if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `منذ ${hours} ساعة`;
        } else {
            return date.toLocaleDateString('ar-EG');
        }
    }

    // ===== 38. إضافة مستمعات الأحداث =====
    attachNotificationListeners(container) {
        // سيتم إضافة مستمعات النقر
    }

    // ===== 39. توليد معرف فريد =====
    generateId() {
        return 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // ===== 40. الحصول على إحصائيات =====
    getStats() {
        return {
            total: this.notifications.length,
            unread: this.unreadCount,
            byType: this.getStatsByType(),
            byPriority: this.getStatsByPriority(),
            oldest: this.notifications[this.notifications.length - 1]?.createdAt,
            newest: this.notifications[0]?.createdAt
        };
    }

    // ===== 41. إحصائيات حسب النوع =====
    getStatsByType() {
        const stats = {};
        this.notifications.forEach(n => {
            stats[n.type] = (stats[n.type] || 0) + 1;
        });
        return stats;
    }

    // ===== 42. إحصائيات حسب الأولوية =====
    getStatsByPriority() {
        const stats = {};
        this.notifications.forEach(n => {
            stats[n.priority] = (stats[n.priority] || 0) + 1;
        });
        return stats;
    }

    // ===== 43. تفعيل/تعطيل الصوت =====
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        return this.soundEnabled;
    }

    // ===== 44. تفعيل/تعطيل إشعارات سطح المكتب =====
    toggleDesktop() {
        if (this.desktopEnabled) {
            this.desktopEnabled = !this.desktopEnabled;
        }
        return this.desktopEnabled;
    }

    // ===== 45. إعادة تعيين النظام =====
    reset() {
        this.notifications = [];
        this.unreadCount = 0;
        this.saveNotifications();
        this.updateBadge();
        this.updateTitle();
    }
}

export default NotificationSystem;
