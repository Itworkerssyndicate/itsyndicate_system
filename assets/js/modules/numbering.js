// assets/js/modules/numbering.js
// نظام الترقيم المتقدم - لكل حركة في النظام رقم فريد

class NumberingSystem {
    constructor() {
        this.counters = {};
        this.prefixes = {
            // المستخدمين والعضوية
            USER: 'USR', // مستخدم
            MEM: 'MBR', // عضو
            PRE: 'PRD', // نقيب
            
            // اللجان
            COM: 'COM', // لجنة
            COM_REQ: 'CQR', // طلب لجنة
            COM_REP: 'CRP', // تقرير لجنة
            
            // الفروع
            BRN: 'BRN', // فرع
            BRN_REQ: 'BQR', // طلب فرع
            BRN_REP: 'BRP', // تقرير فرع
            
            // المراسلات
            TRK: 'TRK', // تتبع
            CTB: 'CTB', // من لجنة لفرع
            BTC: 'BTC', // من فرع للجنة
            MSG: 'MSG', // رسالة
            
            // المالية
            FIN: 'FIN', // مالي
            INV: 'INV', // فاتورة
            REC: 'REC', // إيصال
            EXP: 'EXP', // مصروف
            
            // الأحداث
            EVT: 'EVT', // حدث
            CONF: 'CNF', // مؤتمر
            MTG: 'MTG', // اجتماع
            
            // الحضور
            ATT: 'ATT', // حضور
            
            // التقييمات
            EVL: 'EVL', // تقييم
            
            // الطلبات
            REQ: 'REQ', // طلب
            SUG: 'SUG', // اقتراح
            CMP: 'CMP', // شكوى
            
            // القرارات
            DEC: 'DEC', // قرار
            
            // التصويت
            VOT: 'VOT', // تصويت
            POLL: 'POL', // استفتاء
            
            // الوثائق
            DOC: 'DOC', // مستند
            CON: 'CON', // عقد
            
            // النظام
            SYS: 'SYS', // نظام
            LOG: 'LOG', // سجل
            BKP: 'BKP' // نسخة احتياطية
        };
        
        this.formats = {
            default: '{PREFIX}-{NUMBER:4d}-{YEAR}',
            short: '{PREFIX}-{NUMBER:4d}',
            long: '{PREFIX}-{NUMBER:6d}-{YEAR}-{MONTH:2d}',
            withMonth: '{PREFIX}-{YEAR}{MONTH:2d}{NUMBER:4d}',
            withDay: '{PREFIX}-{YEAR}{MONTH:2d}{DAY:2d}{NUMBER:4d}'
        };
        
        this.init();
    }

    // ===== 1. تهيئة النظام =====
    async init() {
        await this.loadCounters();
        this.setupAutoSave();
    }

    // ===== 2. تحميل العدادات =====
    async loadCounters() {
        try {
            const saved = localStorage.getItem('numbering_counters');
            if (saved) {
                this.counters = JSON.parse(saved);
            } else {
                // تهيئة العدادات
                Object.keys(this.prefixes).forEach(prefix => {
                    this.counters[prefix] = {
                        current: 0,
                        year: new Date().getFullYear(),
                        month: new Date().getMonth() + 1
                    };
                });
            }
        } catch (error) {
            console.error('Error loading counters:', error);
        }
    }

    // ===== 3. حفظ العدادات =====
    saveCounters() {
        try {
            localStorage.setItem('numbering_counters', JSON.stringify(this.counters));
        } catch (error) {
            console.error('Error saving counters:', error);
        }
    }

    // ===== 4. إعداد الحفظ التلقائي =====
    setupAutoSave() {
        setInterval(() => {
            this.saveCounters();
        }, 60000); // كل دقيقة
    }

    // ===== 5. توليد رقم جديد =====
    generateNumber(prefixKey, format = 'default', customData = {}) {
        const prefix = this.prefixes[prefixKey] || prefixKey;
        
        if (!this.counters[prefixKey]) {
            this.counters[prefixKey] = {
                current: 0,
                year: new Date().getFullYear(),
                month: new Date().getMonth() + 1
            };
        }

        // التحقق من تغير السنة
        const currentYear = new Date().getFullYear();
        if (this.counters[prefixKey].year !== currentYear) {
            this.counters[prefixKey].current = 0;
            this.counters[prefixKey].year = currentYear;
        }

        // زيادة العداد
        this.counters[prefixKey].current++;
        
        const number = this.counters[prefixKey].current;
        const year = currentYear;
        const month = new Date().getMonth() + 1;
        const day = new Date().getDate();

        // تنسيق الرقم
        const formattedNumber = this.formatNumber(number, format, {
            PREFIX: prefix,
            NUMBER: number,
            YEAR: year,
            MONTH: month,
            DAY: day,
            ...customData
        });

        return {
            raw: number,
            formatted: formattedNumber,
            prefix: prefix,
            year: year,
            month: month,
            day: day
        };
    }

    // ===== 6. تنسيق الرقم =====
    formatNumber(number, format, data) {
        const formatString = this.formats[format] || this.formats.default;
        
        return formatString.replace(/{([^}]+)}/g, (match, key) => {
            const [field, formatSpec] = key.split(':');
            let value = data[field] || '';
            
            if (formatSpec) {
                const [type, width] = formatSpec.split('');
                if (type === 'd') {
                    value = value.toString().padStart(parseInt(width), '0');
                }
            }
            
            return value;
        });
    }

    // ===== 7. توليد رقم مستخدم =====
    generateUserNumber() {
        return this.generateNumber('USER', 'long');
    }

    // ===== 8. توليد رقم عضو =====
    generateMemberNumber() {
        return this.generateNumber('MEM', 'withMonth');
    }

    // ===== 9. توليد رقم لجنة =====
    generateCommitteeNumber() {
        return this.generateNumber('COM', 'short');
    }

    // ===== 10. توليد رقم فرع =====
    generateBranchNumber() {
        return this.generateNumber('BRN', 'short');
    }

    // ===== 11. توليد رقم طلب لجنة =====
    generateCommitteeRequestNumber() {
        return this.generateNumber('COM_REQ', 'withDay');
    }

    // ===== 12. توليد رقم طلب فرع =====
    generateBranchRequestNumber() {
        return this.generateNumber('BRN_REQ', 'withDay');
    }

    // ===== 13. توليد رقم تتبع =====
    generateTrackingNumber(from, to) {
        let prefixKey;
        if (from === 'committee' && to === 'branch') {
            prefixKey = 'CTB';
        } else if (from === 'branch' && to === 'committee') {
            prefixKey = 'BTC';
        } else {
            prefixKey = 'TRK';
        }
        
        return this.generateNumber(prefixKey, 'withDay', {
            FROM: from.substring(0, 3).toUpperCase(),
            TO: to.substring(0, 3).toUpperCase()
        });
    }

    // ===== 14. توليد رقم فاتورة =====
    generateInvoiceNumber() {
        return this.generateNumber('INV', 'long');
    }

    // ===== 15. توليد رقم إيصال =====
    generateReceiptNumber() {
        return this.generateNumber('REC', 'withDay');
    }

    // ===== 16. توليد رقم حدث =====
    generateEventNumber() {
        return this.generateNumber('EVT', 'long');
    }

    // ===== 17. توليد رقم اجتماع =====
    generateMeetingNumber() {
        return this.generateNumber('MTG', 'withMonth');
    }

    // ===== 18. توليد رقم حضور =====
    generateAttendanceNumber() {
        return this.generateNumber('ATT', 'withDay');
    }

    // ===== 19. توليد رقم تقييم =====
    generateEvaluationNumber() {
        return this.generateNumber('EVL', 'short');
    }

    // ===== 20. توليد رقم قرار =====
    generateDecisionNumber() {
        return this.generateNumber('DEC', 'long');
    }

    // ===== 21. توليد رقم تصويت =====
    generateVoteNumber() {
        return this.generateNumber('VOT', 'short');
    }

    // ===== 22. توليد رقم مستند =====
    generateDocumentNumber(type) {
        return this.generateNumber(type === 'contract' ? 'CON' : 'DOC', 'long');
    }

    // ===== 23. تحليل الرقم =====
    parseNumber(formattedNumber) {
        // محاولة استخراج المعلومات من الرقم المنسق
        const patterns = [
            /^([A-Z]+)-(\d{4})-(\d{4})$/, // PREFIX-NNNN-YYYY
            /^([A-Z]+)-(\d{4})$/, // PREFIX-NNNN
            /^([A-Z]+)-(\d{6})-(\d{4})-(\d{2})$/, // PREFIX-NNNNNN-YYYY-MM
            /^([A-Z]+)-(\d{4})(\d{2})(\d{2})(\d{4})$/, // PREFIX-YYYYMMDDNNNN
            /^([A-Z]+)-(\d{4})(\d{2})(\d{4})$/ // PREFIX-YYYYMMNNNN
        ];

        for (const pattern of patterns) {
            const match = formattedNumber.match(pattern);
            if (match) {
                return {
                    prefix: match[1],
                    number: match[2],
                    year: match[3],
                    month: match[4],
                    day: match[5]
                };
            }
        }

        return null;
    }

    // ===== 24. التحقق من صحة الرقم =====
    validateNumber(formattedNumber, expectedPrefix) {
        const parsed = this.parseNumber(formattedNumber);
        if (!parsed) return false;
        
        if (expectedPrefix && parsed.prefix !== expectedPrefix) return false;
        
        // التحقق من صحة السنة
        const year = parseInt(parsed.year);
        if (year && (year < 2000 || year > 2100)) return false;
        
        return true;
    }

    // ===== 25. الحصول على الرقم التالي =====
    getNextNumber(prefixKey) {
        const current = this.counters[prefixKey]?.current || 0;
        return current + 1;
    }

    // ===== 26. إعادة تعيين عداد =====
    resetCounter(prefixKey, startFrom = 0) {
        if (this.counters[prefixKey]) {
            this.counters[prefixKey].current = startFrom;
            this.counters[prefixKey].year = new Date().getFullYear();
            this.counters[prefixKey].month = new Date().getMonth() + 1;
            this.saveCounters();
            return true;
        }
        return false;
    }

    // ===== 27. إعادة تعيين جميع العدادات =====
    resetAllCounters() {
        Object.keys(this.counters).forEach(key => {
            this.counters[key] = {
                current: 0,
                year: new Date().getFullYear(),
                month: new Date().getMonth() + 1
            };
        });
        this.saveCounters();
    }

    // ===== 28. إضافة بادئة جديدة =====
    addPrefix(key, prefix) {
        if (!this.prefixes[key]) {
            this.prefixes[key] = prefix;
            this.counters[key] = {
                current: 0,
                year: new Date().getFullYear(),
                month: new Date().getMonth() + 1
            };
            return true;
        }
        return false;
    }

    // ===== 29. إضافة تنسيق جديد =====
    addFormat(name, formatString) {
        if (!this.formats[name]) {
            this.formats[name] = formatString;
            return true;
        }
        return false;
    }

    // ===== 30. الحصول على إحصائيات =====
    getStats() {
        const stats = {
            totalCounters: Object.keys(this.counters).length,
            totalPrefixes: Object.keys(this.prefixes).length,
            totalFormats: Object.keys(this.formats).length,
            counters: {}
        };

        Object.entries(this.counters).forEach(([key, value]) => {
            stats.counters[key] = {
                current: value.current,
                year: value.year,
                month: value.month,
                prefix: this.prefixes[key]
            };
        });

        return stats;
    }

    // ===== 31. تصدير العدادات =====
    exportCounters() {
        return {
            counters: this.counters,
            prefixes: this.prefixes,
            formats: this.formats,
            exportedAt: new Date().toISOString()
        };
    }

    // ===== 32. استيراد العدادات =====
    importCounters(data) {
        try {
            if (data.counters) {
                this.counters = { ...this.counters, ...data.counters };
            }
            if (data.prefixes) {
                this.prefixes = { ...this.prefixes, ...data.prefixes };
            }
            if (data.formats) {
                this.formats = { ...this.formats, ...data.formats };
            }
            this.saveCounters();
            return true;
        } catch (error) {
            console.error('Error importing counters:', error);
            return false;
        }
    }

    // ===== 33. مزامنة مع الخادم =====
    async syncWithServer() {
        // سيتم تنفيذها عند الاتصال بالخادم
    }

    // ===== 34. الحصول على بادئة حسب النوع =====
    getPrefixForType(type) {
        const typeMap = {
            user: 'USER',
            member: 'MEM',
            president: 'PRE',
            committee: 'COM',
            branch: 'BRN',
            tracking: 'TRK',
            invoice: 'INV',
            receipt: 'REC',
            expense: 'EXP',
            event: 'EVT',
            meeting: 'MTG',
            attendance: 'ATT',
            evaluation: 'EVL',
            request: 'REQ',
            suggestion: 'SUG',
            complaint: 'CMP',
            decision: 'DEC',
            vote: 'VOT',
            poll: 'POLL',
            document: 'DOC',
            contract: 'CON'
        };

        return typeMap[type] || 'SYS';
    }
}

export default NumberingSystem;
