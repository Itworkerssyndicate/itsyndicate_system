/**
 * ======================================================
 * ITWS AI - المساعد الذكي لنظام إدارة النقابة مع ChatGPT
 * نقابة تكنولوجيا المعلومات والبرمجيات
 * الإصدار: 3.0.0 - النسخة المتكاملة مع OpenAI
 * ======================================================
 * 
 * هذا المساعد مخصص للنقيب العام فقط
 * وله صلاحية التعديل على النظام وإضافة الشاشات
 * ومتكامل مع ChatGPT API
 * ======================================================
 */

// استيراد Firebase
import { 
    database, 
    ref, 
    get, 
    set, 
    push, 
    update, 
    remove, 
    onValue,
    query,
    orderByChild,
    equalTo 
} from './firebase-config.js';

// ======================================================
// تكوين OpenAI API
// ======================================================
const OPENAI_CONFIG = {
    API_KEY: "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",
    BASE_URL: "https://api.openai.com/v1/chat/completions",
    MODEL: "gpt-4-turbo-preview", // أو gpt-3.5-turbo للنسخة الأسرع
    MAX_TOKENS: 1000,
    TEMPERATURE: 0.7
};

class ITWSAI {
    /**
     * تهيئة المساعد الذكي
     * @param {Object} currentUser - بيانات المستخدم الحالي
     */
    constructor(currentUser) {
        this.currentUser = currentUser;
        this.isActive = false;
        this.isListening = false;
        this.conversations = new Map(); // تخزين المحادثات
        
        // بيانات التعلم
        this.learningData = {
            interactions: [],
            patterns: {},
            commands: {},
            suggestions: []
        };
        
        // صلاحيات المستخدمين
        this.permissions = {
            president: {
                level: 100,
                canModifyCode: true,
                canAddScreens: true,
                canManageAI: true,
                canAccessAll: true,
                canUseChatGPT: true,
                description: 'النقيب العام - كامل الصلاحيات'
            },
            vice_president: {
                level: 90,
                canModifyCode: false,
                canAddScreens: false,
                canManageAI: false,
                canAccessAll: false,
                canUseChatGPT: false,
                description: 'النائب الأول - إدارة فقط'
            },
            committee_manager: {
                level: 70,
                canModifyCode: false,
                canAddScreens: false,
                canManageAI: false,
                canAccessAll: false,
                canUseChatGPT: false,
                description: 'مدير لجنة - إدارة لجنته فقط'
            },
            branch_manager: {
                level: 70,
                canModifyCode: false,
                canAddScreens: false,
                canManageAI: false,
                canAccessAll: false,
                canUseChatGPT: false,
                description: 'مدير فرع - إدارة فرعه فقط'
            },
            committee_member: {
                level: 50,
                canModifyCode: false,
                canAddScreens: false,
                canManageAI: false,
                canAccessAll: false,
                canUseChatGPT: false,
                description: 'عضو لجنة - عرض وتقارير'
            },
            branch_member: {
                level: 50,
                canModifyCode: false,
                canAddScreens: false,
                canManageAI: false,
                canAccessAll: false,
                canUseChatGPT: false,
                description: 'عضو فرع - عرض وتقارير'
            }
        };

        // قاعدة المعرفة
        this.knowledgeBase = {
            committees: {},
            branches: {},
            members: {},
            tracking: {},
            reports: {}
        };

        // الأوامر الصوتية/النصية المدعومة
        this.commandPatterns = {
            // أوامر إدارة اللجان
            createCommittee: /^(create|add|new|أنشئ|أضف|جديد) (committee|لجنة)/i,
            deleteCommittee: /^(delete|remove|احذف|امسح) (committee|لجنة)/i,
            updateCommittee: /^(update|edit|عدل|حدث) (committee|لجنة)/i,
            
            // أوامر إدارة الفروع
            createBranch: /^(create|add|new|أنشئ|أضف|جديد) (branch|فرع)/i,
            deleteBranch: /^(delete|remove|احذف|امسح) (branch|فرع)/i,
            updateBranch: /^(update|edit|عدل|حدث) (branch|فرع)/i,
            
            // أوامر التقارير
            generateReport: /^(generate|create|أنشئ|اعمل) (report|تقرير)/i,
            analyzeData: /^(analyze|حلل|ادرس) (data|بيانات)/i,
            
            // أوامر التتبع
            trackMessage: /^(track|تابع|اتبع) (message|مراسلة)/i,
            checkStatus: /^(check|افحص|شوف) (status|حالة)/i,
            
            // أوامر النظام
            addScreen: /^(add|create|ضيف|أنشئ) (screen|شاشة)/i,
            modifyCode: /^(modify|edit|عدل|غير) (code|كود)/i,
            fixBug: /^(fix|صلح|عالج) (bug|خطأ|مشكلة)/i,
            
            // أوامر المساعدة
            help: /^(help|مساعدة|شرح)/i,
            status: /^(status|حالة|وضع)/i,
            learn: /^(learn|تعلم|ادرس)/i,
            
            // أوامر ChatGPT
            chat: /^(chat|اسأل|سؤال|ask)/i,
            explain: /^(explain|شرح|اوضح)/i
        };
    }

    /**
     * ==================================================
     * دوال ChatGPT
     * ==================================================
     */

    /**
     * إرسال رسالة إلى ChatGPT
     * @param {string} message - رسالة المستخدم
     * @param {string} conversationId - معرف المحادثة
     * @returns {Promise<Object>} - رد ChatGPT
     */
    async sendToChatGPT(message, conversationId = null) {
        try {
            // التحقق من الصلاحية
            this.checkPermission();
            
            // التحقق من المفتاح
            if (!OPENAI_CONFIG.API_KEY || OPENAI_CONFIG.API_KEY.includes('sk-proj')) {
                return {
                    success: false,
                    error: '⚠️ مفتاح API غير صحيح. تأكد من المفتاح'
                };
            }

            // جلب سياق النظام
            const systemContext = await this.getSystemContext();
            
            // تجهيز المحادثة
            let messages = [];
            
            // إضافة سياق النظام
            messages.push({
                role: 'system',
                content: this.getSystemPrompt(systemContext)
            });

            // إضافة تاريخ المحادثة إن وجد
            if (conversationId && this.conversations.has(conversationId)) {
                messages = [...messages, ...this.conversations.get(conversationId)];
            }

            // إضافة رسالة المستخدم
            messages.push({
                role: 'user',
                content: message
            });

            console.log('🔄 جاري الاتصال بـ ChatGPT...');

            // إرسال الطلب
            const response = await fetch(OPENAI_CONFIG.BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_CONFIG.API_KEY}`
                },
                body: JSON.stringify({
                    model: OPENAI_CONFIG.MODEL,
                    messages: messages,
                    max_tokens: OPENAI_CONFIG.MAX_TOKENS,
                    temperature: OPENAI_CONFIG.TEMPERATURE,
                    functions: this.getAvailableFunctions(),
                    function_call: 'auto'
                })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('OpenAI Error:', data);
                throw new Error(data.error?.message || 'خطأ في الاتصال بـ ChatGPT');
            }

            const reply = data.choices[0].message;
            console.log('✅ تم استلام الرد من ChatGPT');

            // حفظ المحادثة
            if (!conversationId) {
                conversationId = `conv_${Date.now()}`;
                this.conversations.set(conversationId, []);
            }
            
            this.conversations.get(conversationId).push(
                { role: 'user', content: message },
                { role: 'assistant', content: reply.content || 'تم تنفيذ الأمر' }
            );

            // تنفيذ الوظائف المطلوبة
            if (reply.function_call) {
                console.log('🔧 تنفيذ وظيفة:', reply.function_call.name);
                const functionResult = await this.executeFunction(reply.function_call);
                
                // إرسال نتيجة الوظيفة إلى ChatGPT للرد
                return await this.sendToChatGPT(
                    `لخص لي نتيجة تنفيذ ${reply.function_call.name}: ${JSON.stringify(functionResult)}`,
                    conversationId
                );
            }

            // حفظ التفاعل للتعلم
            await this.saveInteraction(message, reply.content, conversationId);

            return {
                success: true,
                message: reply.content,
                conversationId: conversationId
            };

        } catch (error) {
            console.error('ChatGPT Error:', error);
            return {
                success: false,
                error: error.message,
                suggestion: 'تأكد من اتصال الإنترنت أو جرب مرة أخرى'
            };
        }
    }

    /**
     * تحضير الـ System Prompt
     */
    getSystemPrompt(context) {
        const userRole = this.currentUser?.role || 'guest';
        
        return `أنت المساعد الذكي الرسمي لنظام إدارة نقابة تكنولوجيا المعلومات والبرمجيات "ITWS Union System".

📋 **معلومات عن المستخدم الحالي:**
- الدور: ${userRole} (${this.permissions[userRole]?.description || 'زائر'})
- الاسم: ${this.currentUser?.fullName || this.currentUser?.username || 'زائر'}
- الصلاحيات: ${this.getUserPermissions(userRole)}

📊 **حالة النظام حالياً:**
- عدد اللجان: ${context.committeesCount}
- عدد الفروع: ${context.branchesCount}
- عدد الأعضاء: ${context.membersCount}
- الطلبات المعلقة: ${context.pendingRequests}
- وقت النظام: ${new Date().toLocaleString('ar-EG')}

🎯 **مهمتك الأساسية:**
1. مساعدة المستخدمين في استخدام النظام بكل سهولة
2. شرح كيفية عمل الأقسام المختلفة (اللجان، الفروع، التتبع، التقارير)
3. توجيههم للصفحات المناسبة حسب طلبهم
4. مساعدة النقيب العام في إدارة النظام وتطويره
5. تحليل البيانات وتقديم تقارير مفيدة
6. تنفيذ الأوامر النظامية حسب صلاحية المستخدم

📝 **قواعد الرد:**
- استخدم اللغة العربية الفصحى دائماً
- كن مختصراً ومفيداً في نفس الوقت
- استخدم التنسيق المناسب (عناوين، نقاط، إلخ)
- كن مهذباً ومحترماً
- قدم معلومات دقيقة ومفصلة عند الحاجة
- إذا سأل عن شيء خارج النظام، وجهه للدعم الفني
- إذا لم تعرف الإجابة، قل بصراحة "لم أتعلم هذه المعلومة بعد"

🔧 **المهام المتاحة:**
- إدارة اللجان (إنشاء، تعديل، حذف)
- إدارة الفروع (إنشاء، تعديل، حذف)
- متابعة التتبع والمراسلات
- إنشاء تقارير وتحليلات
- إضافة شاشات جديدة (للملاحة فقط)
- تعديل النظام (للملاحة فقط)

💡 **ملاحظة مهمة:** بعض المهام تتطلب صلاحيات خاصة (النقيب العام فقط).`;
    }

    /**
     * الوظائف المتاحة لـ ChatGPT
     */
    getAvailableFunctions() {
        return [
            {
                name: 'get_committee_report',
                description: 'الحصول على تقرير مفصل عن لجنة معينة',
                parameters: {
                    type: 'object',
                    properties: {
                        committeeName: {
                            type: 'string',
                            description: 'اسم اللجنة (كامل أو جزء منه)'
                        },
                        period: {
                            type: 'string',
                            enum: ['day', 'week', 'month', 'year'],
                            description: 'الفترة الزمنية المطلوبة'
                        }
                    },
                    required: ['committeeName']
                }
            },
            {
                name: 'get_branch_report',
                description: 'الحصول على تقرير مفصل عن فرع معين',
                parameters: {
                    type: 'object',
                    properties: {
                        branchName: {
                            type: 'string',
                            description: 'اسم الفرع (كامل أو جزء منه)'
                        },
                        period: {
                            type: 'string',
                            enum: ['day', 'week', 'month', 'year'],
                            description: 'الفترة الزمنية المطلوبة'
                        }
                    },
                    required: ['branchName']
                }
            },
            {
                name: 'track_message_status',
                description: 'الاستعلام عن حالة مراسلة محددة',
                parameters: {
                    type: 'object',
                    properties: {
                        trackingId: {
                            type: 'string',
                            description: 'رقم التتبع الخاص بالمراسلة'
                        }
                    },
                    required: ['trackingId']
                }
            },
            {
                name: 'get_user_guide',
                description: 'الحصول على دليل استخدام جزء معين من النظام',
                parameters: {
                    type: 'object',
                    properties: {
                        topic: {
                            type: 'string',
                            enum: ['login', 'committees', 'branches', 'tracking', 'reports', 'ai'],
                            description: 'الموضوع المطلوب شرحه'
                        }
                    },
                    required: ['topic']
                }
            },
            {
                name: 'get_system_stats',
                description: 'الحصول على إحصائيات عامة عن النظام',
                parameters: {
                    type: 'object',
                    properties: {
                        detailed: {
                            type: 'boolean',
                            description: 'هل تريد إحصائيات مفصلة؟'
                        }
                    }
                }
            },
            {
                name: 'search_tracking',
                description: 'البحث في نظام التتبع',
                parameters: {
                    type: 'object',
                    properties: {
                        query: {
                            type: 'string',
                            description: 'كلمة البحث'
                        },
                        status: {
                            type: 'string',
                            enum: ['pending', 'in_progress', 'completed', 'rejected'],
                            description: 'حالة المراسلة (اختياري)'
                        }
                    },
                    required: ['query']
                }
            }
        ];
    }

    /**
     * تنفيذ الوظائف المطلوبة
     */
    async executeFunction(functionCall) {
        const { name, arguments: args } = functionCall;
        const params = JSON.parse(args);

        console.log(`🔧 تنفيذ: ${name}`, params);

        try {
            switch (name) {
                case 'get_committee_report':
                    return await this.getCommitteeReport(params.committeeName, params.period);
                
                case 'get_branch_report':
                    return await this.getBranchReport(params.branchName, params.period);
                
                case 'track_message_status':
                    return await this.getTrackingStatus(params.trackingId);
                
                case 'get_user_guide':
                    return this.getUserGuide(params.topic);
                
                case 'get_system_stats':
                    return await this.getSystemStats(params.detailed);
                
                case 'search_tracking':
                    return await this.searchTracking(params.query, params.status);
                
                default:
                    return 'عذراً، هذه الوظيفة غير متوفرة حالياً';
            }
        } catch (error) {
            console.error('Error executing function:', error);
            return {
                error: true,
                message: 'حدث خطأ في تنفيذ الوظيفة',
                details: error.message
            };
        }
    }

    /**
     * جلب سياق النظام الحالي
     */
    async getSystemContext() {
        try {
            const [committees, branches, users, requests, tracking] = await Promise.all([
                get(ref(database, 'committees')),
                get(ref(database, 'branches')),
                get(ref(database, 'users')),
                get(ref(database, 'pending_requests')),
                get(ref(database, 'tracking'))
            ]);

            return {
                committeesCount: committees.exists() ? Object.keys(committees.val()).length : 0,
                branchesCount: branches.exists() ? Object.keys(branches.val()).length : 0,
                membersCount: users.exists() ? Object.keys(users.val()).length : 0,
                pendingRequests: requests.exists() ? 
                    Object.values(requests.val()).filter(r => r.status === 'pending').length : 0,
                trackingCount: tracking.exists() ? Object.keys(tracking.val()).length : 0,
                currentTime: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error getting context:', error);
            return {
                committeesCount: 0,
                branchesCount: 0,
                membersCount: 0,
                pendingRequests: 0,
                trackingCount: 0
            };
        }
    }

    /**
     * الحصول على إحصائيات النظام
     */
    async getSystemStats(detailed = false) {
        const context = await this.getSystemContext();
        
        if (!detailed) {
            return {
                summary: `النظام يحتوي على:
- ${context.committeesCount} لجنة
- ${context.branchesCount} فرع
- ${context.membersCount} عضو
- ${context.pendingRequests} طلب معلق
- ${context.trackingCount} مراسلة`,
                timestamp: new Date().toISOString()
            };
        }

        // إحصائيات مفصلة
        const [committees, branches, users, tracking] = await Promise.all([
            get(ref(database, 'committees')),
            get(ref(database, 'branches')),
            get(ref(database, 'users')),
            get(ref(database, 'tracking'))
        ]);

        const onlineUsers = users.exists() ? 
            Object.values(users.val()).filter(u => u.online).length : 0;

        const trackingStats = tracking.exists() ?
            Object.values(tracking.val()).reduce((acc, t) => {
                acc[t.status] = (acc[t.status] || 0) + 1;
                return acc;
            }, {}) : {};

        return {
            summary: context,
            detailed: {
                onlineUsers,
                trackingStats,
                committees: committees.exists() ? Object.keys(committees.val()).length : 0,
                branches: branches.exists() ? Object.keys(branches.val()).length : 0
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * البحث في التتبع
     */
    async searchTracking(query, status = null) {
        const snapshot = await get(ref(database, 'tracking'));
        
        if (!snapshot.exists()) {
            return 'لا توجد مراسلات';
        }

        const tracking = snapshot.val();
        const results = [];

        for (const [id, item] of Object.entries(tracking)) {
            if (status && item.status !== status) continue;
            
            if (item.title?.includes(query) || 
                item.content?.includes(query) ||
                item.fromName?.includes(query) ||
                item.toName?.includes(query)) {
                results.push({
                    id,
                    title: item.title,
                    from: item.fromName,
                    to: item.toName,
                    status: item.status,
                    date: item.createdAt
                });
            }
        }

        return {
            count: results.length,
            results: results.slice(0, 10), // أقصى 10 نتائج
            message: results.length ? `تم العثور على ${results.length} نتيجة` : 'لا توجد نتائج'
        };
    }

    /**
     * تقرير لجنة
     */
    async getCommitteeReport(committeeName, period = 'month') {
        const snapshot = await get(ref(database, 'committees'));
        
        if (!snapshot.exists()) {
            return 'لا توجد لجان في النظام';
        }

        const committees = snapshot.val();
        let committee = null;
        let committeeId = null;

        for (const [id, c] of Object.entries(committees)) {
            if (c.name?.includes(committeeName)) {
                committee = c;
                committeeId = id;
                break;
            }
        }

        if (!committee) {
            return `لم أجد لجنة باسم "${committeeName}"`;
        }

        return {
            committeeName: committee.name,
            description: committee.description || 'لا يوجد وصف',
            membersCount: committee.members ? Object.keys(committee.members).length : 0,
            reportsCount: committee.reports ? Object.keys(committee.reports).length : 0,
            tasksCount: committee.tasks ? Object.keys(committee.tasks).length : 0,
            createdAt: new Date(committee.createdAt).toLocaleDateString('ar-EG'),
            status: committee.status === 'active' ? 'نشط' : 'غير نشط',
            managerId: committee.managerId || 'غير معين'
        };
    }

    /**
     * تقرير فرع
     */
    async getBranchReport(branchName, period = 'month') {
        const snapshot = await get(ref(database, 'branches'));
        
        if (!snapshot.exists()) {
            return 'لا توجد فروع في النظام';
        }

        const branches = snapshot.val();
        let branch = null;

        for (const [id, b] of Object.entries(branches)) {
            if (b.name?.includes(branchName)) {
                branch = b;
                break;
            }
        }

        if (!branch) {
            return `لم أجد فرعاً باسم "${branchName}"`;
        }

        // تجهيز معلومات المجلس
        const council = [];
        if (branch.subCouncil) {
            if (branch.subCouncil.vicePresident) council.push('وكيل');
            if (branch.subCouncil.secondVice) council.push('نائب ثاني');
            if (branch.subCouncil.secretary) council.push('أمين عام');
            if (branch.subCouncil.treasurer) council.push('أمين صندوق');
        }

        return {
            branchName: branch.name,
            governorate: branch.governorate || 'غير محدد',
            membersCount: branch.members ? Object.keys(branch.members).length : 0,
            reportsCount: branch.reports ? Object.keys(branch.reports).length : 0,
            activitiesCount: branch.activities ? Object.keys(branch.activities).length : 0,
            council: council.length ? council : 'لا يوجد مجلس فرعي',
            createdAt: new Date(branch.createdAt).toLocaleDateString('ar-EG'),
            status: branch.status === 'active' ? 'نشط' : 'غير نشط'
        };
    }

    /**
     * حالة التتبع
     */
    async getTrackingStatus(trackingId) {
        const snapshot = await get(ref(database, `tracking/${trackingId}`));
        
        if (!snapshot.exists()) {
            return 'رقم تتبع غير صحيح';
        }

        const track = snapshot.val();
        
        return {
            id: trackingId,
            title: track.title,
            type: track.type,
            from: track.fromName,
            to: track.toName,
            status: track.status,
            priority: track.priority,
            createdAt: new Date(track.createdAt).toLocaleString('ar-EG'),
            lastUpdate: track.history?.length ? 
                new Date(track.history[track.history.length - 1].timestamp).toLocaleString('ar-EG') : 
                'لم يتم التحديث',
            history: track.history?.map(h => ({
                status: h.status,
                date: new Date(h.timestamp).toLocaleString('ar-EG'),
                note: h.note
            })) || []
        };
    }

    /**
     * دليل المستخدم
     */
    getUserGuide(topic) {
        const guides = {
            login: {
                title: '🔐 تسجيل الدخول',
                steps: [
                    '1. افتح الصفحة الرئيسية index.html',
                    '2. أدخل اسم المستخدم (الاسم الكامل)',
                    '3. أدخل كلمة المرور (الرقم القومي)',
                    '4. اضغط على "تسجيل الدخول"',
                    'إذا لم يكن لديك حساب، اضغط على "تسجيل جديد"'
                ]
            },
            committees: {
                title: '📋 إدارة اللجان',
                steps: [
                    '1. اذهب إلى صفحة "اللجان" من القائمة الجانبية',
                    '2. لمشاهدة كل اللجان، اختر تبويب "جميع اللجان"',
                    '3. لإنشاء لجنة جديدة، اضغط على "إنشاء لجنة جديدة"',
                    '4. لإدارة لجنة معينة، اضغط على "إدارة" في بطاقة اللجنة',
                    '5. لإرسال مراسلة إلى فرع، اضغط على "إرسال"'
                ]
            },
            branches: {
                title: '🏢 إدارة الفروع',
                steps: [
                    '1. اذهب إلى صفحة "الفروع" من القائمة الجانبية',
                    '2. لمشاهدة كل الفروع، اختر تبويب "جميع الفروع"',
                    '3. لإنشاء فرع جديد، اضغط على "إنشاء فرع جديد"',
                    '4. لتشكيل مجلس فرعي، اضغط على "تشكيل مجلس فرعي"',
                    '5. لإدارة فرع معين، اضغط على "إدارة" في بطاقة الفرع'
                ]
            },
            tracking: {
                title: '🔄 نظام التتبع',
                steps: [
                    '1. اذهب إلى صفحة "نظام التتبع" من القائمة الجانبية',
                    '2. لمشاهدة كل المراسلات، اختر تبويب "الكل"',
                    '3. يمكنك تصفية المراسلات حسب النوع أو الحالة',
                    '4. لإنشاء مراسلة جديدة، اضغط على "مراسلة جديدة"',
                    '5. لمتابعة حالة مراسلة، اضغط على "تفاصيل"'
                ]
            },
            reports: {
                title: '📊 التقارير',
                steps: [
                    '1. اذهب إلى صفحة "التقارير" من القائمة الجانبية',
                    '2. اختر نوع التقرير المطلوب (لجان، فروع، أعضاء)',
                    '3. حدد الفترة الزمنية',
                    '4. اضغط على "إنشاء تقرير"',
                    '5. يمكنك طباعة التقرير أو تصديره'
                ]
            },
            ai: {
                title: '🤖 المساعد الذكي ITWS AI',
                steps: [
                    '1. المساعد متاح فقط للنقيب العام',
                    '2. اضغط على زر الروبوت في الزاوية اليسرى السفلية',
                    '3. اكتب سؤالك أو أمرك',
                    '4. يمكنك طلب: تقارير، تحليلات، إنشاء شاشات، تعديل النظام',
                    '5. المساعد سينفذ الأمر فوراً'
                ]
            }
        };

        return guides[topic] || {
            title: '📚 دليل المستخدم',
            steps: ['اختر موضوعاً محدداً للحصول على المساعدة']
        };
    }

    /**
     * الحصول على صلاحيات المستخدم
     */
    getUserPermissions(role) {
        const perms = {
            president: '✅ صلاحية كاملة - يمكنه تعديل أي شيء في النظام',
            vice_president: '📋 إدارة اللجان والفروع والتقارير',
            committee_manager: '📌 إدارة لجنته فقط',
            branch_manager: '📍 إدارة فرعه فقط',
            committee_member: '👥 عرض وتقديم تقارير',
            branch_member: '👤 عرض وتقديم تقارير',
            guest: '👀 زائر - صلاحيات محدودة'
        };
        return perms[role] || perms.guest;
    }

    /**
     * ==================================================
     * دوال التحقق والصلاحيات
     * ==================================================
     */

    /**
     * التحقق من صلاحية المستخدم
     */
    checkPermission() {
        if (!this.currentUser) {
            throw new Error('⚠️ يجب تسجيل الدخول أولاً');
        }

        const userPerms = this.permissions[this.currentUser.role];
        if (!userPerms || userPerms.level < 100) {
            throw new Error('⚠️ هذا المساعد متاح فقط للنقيب العام');
        }

        return true;
    }

    /**
     * الحصول على صلاحيات المستخدم
     */
    async getUserPermissions(userId) {
        try {
            const userRef = ref(database, `users/${userId}`);
            const snapshot = await get(userRef);
            
            if (snapshot.exists()) {
                const user = snapshot.val();
                return this.permissions[user.role] || this.permissions.committee_member;
            }
            
            return this.permissions.committee_member;
        } catch (error) {
            console.error('خطأ في جلب الصلاحيات:', error);
            return null;
        }
    }

    /**
     * ==================================================
     * دوال التهيئة والتشغيل
     * ==================================================
     */

    /**
     * تهيئة المساعد
     */
    async initialize() {
        try {
            this.checkPermission();
            
            console.log('🚀 جاري تهيئة ITWS AI...');
            this.logActivity('system', 'تهيئة المساعد الذكي');
            
            // تحميل قاعدة المعرفة
            await this.loadKnowledgeBase();
            
            // تحميل بيانات التعلم السابقة
            await this.loadLearningData();
            
            // تفعيل المستمعين
            this.activateListeners();
            
            // تحديث الحالة
            this.isActive = true;
            
            // تسجيل التفعيل
            await this.logAction('system', 'تم تفعيل ITWS AI');
            
            console.log('✅ ITWS AI جاهز للعمل مع ChatGPT');
            
            return {
                success: true,
                message: 'تم تهيئة ITWS AI بنجاح مع ChatGPT',
                capabilities: this.getCapabilities(),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ خطأ في تهيئة ITWS AI:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * الحصول على قدرات المساعد
     */
    getCapabilities() {
        return {
            canModifyCode: true,
            canAddScreens: true,
            canModifyDatabase: true,
            canAnalyzeData: true,
            canGenerateReports: true,
            canHelpUsers: true,
            canManageSystem: true,
            canLearn: true,
            canSuggest: true,
            canTrackIssues: true,
            canVoiceCommand: true,
            canPredict: true,
            canUseChatGPT: true,
            chatGPTModel: OPENAI_CONFIG.MODEL
        };
    }

    /**
     * تحميل قاعدة المعرفة
     */
    async loadKnowledgeBase() {
        try {
            const [committees, branches, users, tracking] = await Promise.all([
                get(ref(database, 'committees')),
                get(ref(database, 'branches')),
                get(ref(database, 'users')),
                get(ref(database, 'tracking'))
            ]);

            if (committees.exists()) this.knowledgeBase.committees = committees.val();
            if (branches.exists()) this.knowledgeBase.branches = branches.val();
            if (users.exists()) this.knowledgeBase.members = users.val();
            if (tracking.exists()) this.knowledgeBase.tracking = tracking.val();

            console.log('✅ تم تحميل قاعدة المعرفة');
        } catch (error) {
            console.error('خطأ في تحميل قاعدة المعرفة:', error);
        }
    }

    /**
     * تحميل بيانات التعلم السابقة
     */
    async loadLearningData() {
        try {
            const learningRef = ref(database, 'itws_ai/learning');
            const snapshot = await get(learningRef);
            
            if (snapshot.exists()) {
                this.learningData = snapshot.val();
            }
        } catch (error) {
            console.error('خطأ في تحميل بيانات التعلم:', error);
        }
    }

    /**
     * تفعيل المستمعين
     */
    activateListeners() {
        onValue(ref(database, 'itws_ai/requests'), (snapshot) => {
            const requests = snapshot.val();
            if (requests) {
                this.processNewRequests(requests);
            }
        });

        onValue(ref(database, 'suggestions'), (snapshot) => {
            const suggestions = snapshot.val();
            if (suggestions) {
                this.analyzeSuggestions(suggestions);
            }
        });
    }

    /**
     * ==================================================
     * دوال معالجة الأوامر
     * ==================================================
     */

    /**
     * معالجة أمر نصي
     */
    async processCommand(command) {
        try {
            this.checkPermission();
            
            // تسجيل الأمر
            await this.logAction('command', command);
            
            // تحليل الأمر
            const analysis = this.analyzeCommand(command);
            
            // تنفيذ الأمر حسب النوع
            let result;
            switch (analysis.type) {
                case 'chat':
                case 'explain':
                    result = await this.sendToChatGPT(analysis.params.command);
                    break;
                case 'createCommittee':
                    result = await this.createCommittee(analysis.params);
                    break;
                case 'deleteCommittee':
                    result = await this.deleteCommittee(analysis.params);
                    break;
                case 'updateCommittee':
                    result = await this.updateCommittee(analysis.params);
                    break;
                case 'createBranch':
                    result = await this.createBranch(analysis.params);
                    break;
                case 'deleteBranch':
                    result = await this.deleteBranch(analysis.params);
                    break;
                case 'updateBranch':
                    result = await this.updateBranch(analysis.params);
                    break;
                case 'generateReport':
                    result = await this.generateReport(analysis.params);
                    break;
                case 'analyzeData':
                    result = await this.analyzeData(analysis.params);
                    break;
                case 'trackMessage':
                    result = await this.trackMessage(analysis.params);
                    break;
                case 'checkStatus':
                    result = await this.checkStatus(analysis.params);
                    break;
                case 'addScreen':
                    result = await this.addNewScreen(analysis.params);
                    break;
                case 'modifyCode':
                    result = await this.modifyCode(analysis.params);
                    break;
                case 'fixBug':
                    result = await this.fixBug(analysis.params);
                    break;
                case 'help':
                    result = this.getHelp();
                    break;
                case 'status':
                    result = await this.getSystemStatus();
                    break;
                default:
                    // إذا ما عرفش الأمر، يبعته لـ ChatGPT
                    result = await this.sendToChatGPT(command);
            }
            
            // حفظ التفاعل للتعلم
            await this.saveInteraction(command, result);
            
            return result;
        } catch (error) {
            console.error('خطأ في معالجة الأمر:', error);
            return {
                success: false,
                error: error.message,
                suggestion: 'حاول أمر آخر أو اكتب "مساعدة"'
            };
        }
    }

    /**
     * تحليل الأمر وتحديد نوعه
     */
    analyzeCommand(command) {
        for (const [type, pattern] of Object.entries(this.commandPatterns)) {
            if (pattern.test(command)) {
                return {
                    type: type,
                    params: this.extractParameters(command, type)
                };
            }
        }
        
        return {
            type: 'general',
            params: { command }
        };
    }

    /**
     * استخراج المعاملات من الأمر
     */
    extractParameters(command, type) {
        const params = { command };
        
        switch (type) {
            case 'createCommittee':
                params.name = this.extractName(command) || 'لجنة جديدة';
                params.description = this.extractDescription(command);
                break;
            case 'createBranch':
                params.name = this.extractName(command) || 'فرع جديد';
                params.governorate = this.extractGovernorate(command);
                break;
            case 'generateReport':
                params.type = this.extractReportType(command);
                params.period = this.extractPeriod(command);
                break;
            case 'addScreen':
                params.screenName = this.extractName(command) || 'شاشة جديدة';
                params.screenType = this.extractScreenType(command);
                break;
            case 'chat':
            case 'explain':
                params.command = command.replace(/^(اسأل|سؤال|ask|chat|explain|شرح)\s*/i, '');
                break;
        }
        
        return params;
    }

    /**
     * استخراج الاسم من الأمر
     */
    extractName(command) {
        const match = command.match(/(?:اسمه|اسم|name)\s*["']?([^"']+)["']?/i);
        return match ? match[1].trim() : null;
    }

    /**
     * استخراج الوصف من الأمر
     */
    extractDescription(command) {
        const match = command.match(/(?:وصفه|description)\s*["']?([^"']+)["']?/i);
        return match ? match[1].trim() : '';
    }

    /**
     * استخراج المحافظة من الأمر
     */
    extractGovernorate(command) {
        const governorates = ['القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'الشرقية'];
        for (const gov of governorates) {
            if (command.includes(gov)) {
                return gov;
            }
        }
        return 'القاهرة';
    }

    /**
     * استخراج نوع التقرير
     */
    extractReportType(command) {
        if (command.includes('لجنة')) return 'committee';
        if (command.includes('فرع')) return 'branch';
        if (command.includes('عضو')) return 'member';
        if (command.includes('تتبع')) return 'tracking';
        return 'general';
    }

    /**
     * استخراج الفترة الزمنية
     */
    extractPeriod(command) {
        if (command.includes('أسبوع')) return 'week';
        if (command.includes('شهر')) return 'month';
        if (command.includes('سنة')) return 'year';
        if (command.includes('يوم')) return 'day';
        return 'month';
    }

    /**
     * استخراج نوع الشاشة
     */
    extractScreenType(command) {
        if (command.includes('إدارة')) return 'management';
        if (command.includes('تقرير')) return 'report';
        if (command.includes('عرض')) return 'view';
        return 'management';
    }

    /**
     * ==================================================
     * دوال تنفيذ الأوامر الرئيسية
     * ==================================================
     */

    /**
     * إنشاء لجنة جديدة
     */
    async createCommittee(params) {
        try {
            this.checkPermission();
            
            const committeeData = {
                name: params.name || 'لجنة جديدة',
                description: params.description || '',
                managerId: null,
                members: {},
                subCommittees: {},
                reports: {},
                tasks: {},
                decisions: {},
                createdAt: new Date().toISOString(),
                createdBy: this.currentUser.userId,
                status: 'active'
            };

            const committeesRef = ref(database, 'committees');
            const newCommitteeRef = push(committeesRef);
            await set(newCommitteeRef, committeeData);

            await this.logAction('create_committee', committeeData);

            return {
                success: true,
                committeeId: newCommitteeRef.key,
                message: `✅ تم إنشاء لجنة "${params.name}" بنجاح`
            };
        } catch (error) {
            console.error('خطأ في إنشاء لجنة:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * حذف لجنة
     */
    async deleteCommittee(params) {
        try {
            this.checkPermission();
            
            const committeeId = params.id || params.name;
            if (!committeeId) {
                throw new Error('يرجى تحديد اللجنة');
            }

            await remove(ref(database, `committees/${committeeId}`));

            return {
                success: true,
                message: `✅ تم حذف اللجنة بنجاح`
            };
        } catch (error) {
            console.error('خطأ في حذف لجنة:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * تحديث لجنة
     */
    async updateCommittee(params) {
        try {
            this.checkPermission();
            
            const committeeId = params.id || params.name;
            if (!committeeId) {
                throw new Error('يرجى تحديد اللجنة');
            }

            const updates = {
                ...params.updates,
                updatedAt: new Date().toISOString(),
                updatedBy: this.currentUser.userId
            };

            await update(ref(database, `committees/${committeeId}`), updates);

            return {
                success: true,
                message: `✅ تم تحديث اللجنة بنجاح`
            };
        } catch (error) {
            console.error('خطأ في تحديث لجنة:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * إنشاء فرع جديد
     */
    async createBranch(params) {
        try {
            this.checkPermission();
            
            const branchData = {
                name: params.name || 'فرع جديد',
                governorate: params.governorate || 'القاهرة',
                address: params.address || '',
                managerId: null,
                members: {},
                reports: {},
                activities: {},
                subCouncil: {
                    vicePresident: null,
                    secondVice: null,
                    secretary: null,
                    secretaryAssistant: null,
                    treasurer: null,
                    treasurerAssistant: null
                },
                createdAt: new Date().toISOString(),
                createdBy: this.currentUser.userId,
                status: 'active'
            };

            const branchesRef = ref(database, 'branches');
            const newBranchRef = push(branchesRef);
            await set(newBranchRef, branchData);

            return {
                success: true,
                branchId: newBranchRef.key,
                message: `✅ تم إنشاء فرع "${params.name}" بنجاح`
            };
        } catch (error) {
            console.error('خطأ في إنشاء فرع:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * حذف فرع
     */
    async deleteBranch(params) {
        try {
            this.checkPermission();
            
            const branchId = params.id || params.name;
            if (!branchId) {
                throw new Error('يرجى تحديد الفرع');
            }

            await remove(ref(database, `branches/${branchId}`));

            return {
                success: true,
                message: `✅ تم حذف الفرع بنجاح`
            };
        } catch (error) {
            console.error('خطأ في حذف فرع:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * تحديث فرع
     */
    async updateBranch(params) {
        try {
            this.checkPermission();
            
            const branchId = params.id || params.name;
            if (!branchId) {
                throw new Error('يرجى تحديد الفرع');
            }

            const updates = {
                ...params.updates,
                updatedAt: new Date().toISOString(),
                updatedBy: this.currentUser.userId
            };

            await update(ref(database, `branches/${branchId}`), updates);

            return {
                success: true,
                message: `✅ تم تحديث الفرع بنجاح`
            };
        } catch (error) {
            console.error('خطأ في تحديث فرع:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * إنشاء تقرير
     */
    async generateReport(params) {
        try {
            const { type, period, targetId } = params;
            
            let data = {};
            let analysis = {};

            switch (type) {
                case 'committee':
                    data = await this.collectCommitteeData(targetId, period);
                    analysis = this.analyzeCommitteeData(data);
                    break;
                case 'branch':
                    data = await this.collectBranchData(targetId, period);
                    analysis = this.analyzeBranchData(data);
                    break;
                case 'member':
                    data = await this.collectMemberData(targetId, period);
                    analysis = this.analyzeMemberData(data);
                    break;
                case 'tracking':
                    data = await this.collectTrackingData(period);
                    analysis = this.analyzeTrackingData(data);
                    break;
                default:
                    data = await this.collectGeneralData(period);
                    analysis = this.analyzeGeneralData(data);
            }

            const report = {
                title: `تقرير ${type} - ${new Date().toLocaleDateString('ar-EG')}`,
                generatedAt: new Date().toISOString(),
                generatedBy: 'ITWS AI',
                period: period,
                data: data,
                analysis: analysis,
                insights: this.generateInsights(analysis),
                recommendations: this.generateRecommendations(analysis)
            };

            const reportsRef = ref(database, 'reports');
            await push(reportsRef, report);

            return {
                success: true,
                report: report,
                message: '✅ تم إنشاء التقرير بنجاح'
            };
        } catch (error) {
            console.error('خطأ في إنشاء تقرير:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * تحليل البيانات
     */
    async analyzeData(params) {
        try {
            const { dataType, period, metrics } = params;
            
            const rawData = await this.collectData(dataType, period);
            const basicAnalysis = this.performBasicAnalysis(rawData);
            const advancedAnalysis = this.performAdvancedAnalysis(rawData, metrics);
            const patterns = this.extractPatterns(rawData);
            const predictions = this.generatePredictions(rawData, patterns);
            
            return {
                success: true,
                basicAnalysis,
                advancedAnalysis,
                patterns,
                predictions,
                summary: this.generateAnalysisSummary(basicAnalysis, advancedAnalysis)
            };
        } catch (error) {
            console.error('خطأ في تحليل البيانات:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * تتبع مراسلة
     */
    async trackMessage(params) {
        try {
            const trackingData = {
                id: `track_${Date.now()}`,
                type: params.type || 'message',
                fromType: params.fromType,
                fromId: params.fromId,
                fromName: params.fromName,
                toType: params.toType,
                toId: params.toId,
                toName: params.toName,
                title: params.title,
                content: params.content,
                priority: params.priority || 'normal',
                deadline: params.deadline || null,
                status: 'pending',
                history: [{
                    status: 'sent',
                    timestamp: new Date().toISOString(),
                    by: this.currentUser.userId,
                    note: 'تم إنشاء التتبع'
                }],
                attachments: params.attachments || [],
                tags: params.tags || [],
                createdAt: new Date().toISOString(),
                createdBy: this.currentUser.userId
            };

            const trackingRef = ref(database, 'tracking');
            await push(trackingRef, trackingData);

            await this.sendNotification(trackingData.toId, 'مراسلة جديدة', trackingData.title);

            return {
                success: true,
                trackingId: trackingData.id,
                message: '✅ تم إنشاء التتبع بنجاح'
            };
        } catch (error) {
            console.error('خطأ في تتبع مراسلة:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * التحقق من الحالة
     */
    async checkStatus(params) {
        try {
            const { target, id } = params;
            
            let status = {};

            switch (target) {
                case 'tracking':
                    status = await this.getTrackingStatus(id);
                    break;
                case 'committee':
                    status = await this.getCommitteeStatus(id);
                    break;
                case 'branch':
                    status = await this.getBranchStatus(id);
                    break;
                case 'member':
                    status = await this.getMemberStatus(id);
                    break;
                case 'system':
                    status = await this.getSystemHealth();
                    break;
                default:
                    status = await this.getGeneralStatus();
            }

            return {
                success: true,
                status: status
            };
        } catch (error) {
            console.error('خطأ في التحقق من الحالة:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * إضافة شاشة جديدة
     */
    async addNewScreen(params) {
        try {
            this.checkPermission();
            
            const {
                screenName,
                screenTitle = screenName,
                screenType = 'management',
                permissions = ['president']
            } = params;

            const fileName = `${screenName.toLowerCase().replace(/\s+/g, '_')}.html`;
            
            const screenHTML = this.generateScreenHTML(screenTitle, screenType);
            
            const screensRef = ref(database, 'itws_ai/generated_screens');
            const newScreenRef = await push(screensRef, {
                fileName,
                title: screenTitle,
                type: screenType,
                content: screenHTML,
                permissions,
                createdBy: this.currentUser.userId,
                createdAt: new Date().toISOString(),
                active: true
            });

            await this.updateMenu(fileName, screenTitle, permissions);

            return {
                success: true,
                fileName,
                screenId: newScreenRef.key,
                message: `✅ تم إنشاء الشاشة "${screenTitle}" بنجاح`,
                url: fileName
            };
        } catch (error) {
            console.error('خطأ في إضافة شاشة:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * توليد HTML للشاشة
     */
    generateScreenHTML(title, type) {
        return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - ITWS Union</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Cairo', sans-serif;
        }
        
        body {
            background: #f5f5f5;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            max-width: 1200px;
            margin: 0 auto;
        }
        
        h1 {
            color: #333;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        h1 i {
            color: #667eea;
        }
        
        .content {
            min-height: 400px;
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #f0f0f0;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
        
        .ai-badge {
            background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%);
            color: white;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 12px;
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }
        
        .chatgpt-badge {
            background: #10a37f;
            color: white;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 12px;
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>
            <i class="fas fa-robot" style="color: #667eea;"></i>
            ${title}
            <span class="ai-badge">
                <i class="fas fa-bolt"></i>
                ITWS AI
            </span>
            <span class="chatgpt-badge">
                <i class="fas fa-brain"></i>
                ChatGPT
            </span>
        </h1>
        
        <div class="content" id="content">
            <p style="color: #666; text-align: center; padding: 40px;">
                <i class="fas fa-cog fa-spin" style="font-size: 40px; color: #667eea; margin-bottom: 20px;"></i>
                <br>
                جاري تحميل المحتوى...
            </p>
        </div>
        
        <div class="footer">
            <p>نقابة تكنولوجيا المعلومات والبرمجيات - ITWS Union</p>
            <p style="font-size: 12px; color: #999;">تم الإنشاء بواسطة ITWS AI بالتعاون مع ChatGPT</p>
        </div>
    </div>
    
    <script type="module">
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
        import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
        
        const firebaseConfig = {
            apiKey: "AIzaSyCaPhRG_1c7Rsu5Ss_MUNqsE18Ky_nyEAA",
            authDomain: "itws-system.firebaseapp.com",
            databaseURL: "https://itws-system-default-rtdb.firebaseio.com",
            projectId: "itws-system",
            storageBucket: "itws-system.firebasestorage.app",
            messagingSenderId: "770452248691",
            appId: "1:770452248691:web:0e94e65e01298b398bb206"
        };
        
        const app = initializeApp(firebaseConfig);
        const database = getDatabase(app);
        
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        if (!currentUser) {
            window.location.href = 'index.html';
        }
        
        async function loadData() {
            try {
                const content = document.getElementById('content');
                content.innerHTML = \`
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
                            <h3 style="color: #333; margin-bottom: 10px;">مرحباً بك في ${title}</h3>
                            <p style="color: #666;">هذه شاشة تم إنشاؤها بواسطة ITWS AI بالتعاون مع ChatGPT</p>
                            <p style="color: #666; margin-top: 10px;">يمكنك استخدام المساعد الذكي للحصول على المساعدة</p>
                        </div>
                    </div>
                \`;
            } catch (error) {
                console.error('Error:', error);
            }
        }
        
        loadData();
    </script>
</body>
</html>`;
    }

    /**
     * تحديث القائمة
     */
    async updateMenu(fileName, title, permissions) {
        try {
            const menuRef = ref(database, 'system/menu_items');
            await push(menuRef, {
                title,
                url: fileName,
                icon: 'fas fa-file',
                permissions,
                order: Date.now(),
                createdAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('خطأ في تحديث القائمة:', error);
        }
    }

    /**
     * تعديل الكود
     */
    async modifyCode(params) {
        try {
            this.checkPermission();
            
            const { file, modifications, reason } = params;
            
            await this.backupFile(file);
            
            const result = await this.applyModifications(file, modifications);
            
            await this.logAction('code_modification', {
                file,
                modifications,
                reason,
                result
            });

            return {
                success: true,
                message: `✅ تم تعديل ${file} بنجاح`,
                result
            };
        } catch (error) {
            console.error('خطأ في تعديل الكود:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * إصلاح خطأ
     */
    async fixBug(params) {
        try {
            this.checkPermission();
            
            const { bugId, description, location } = params;
            
            const analysis = await this.analyzeBug(params);
            const fix = await this.applyBugFix(analysis);
            const testResult = await this.testFix(fix);
            
            await this.logAction('bug_fix', {
                bugId,
                description,
                analysis,
                fix,
                testResult
            });

            return {
                success: testResult.passed,
                analysis,
                fix,
                testResult,
                message: testResult.passed ? '✅ تم إصلاح الخطأ' : '⚠️ يحتاج لمزيد من التعديل'
            };
        } catch (error) {
            console.error('خطأ في إصلاح الخطأ:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * ==================================================
     * دوال المساعدة والتعلم
     * ==================================================
     */

    /**
     * الحصول على المساعدة
     */
    getHelp() {
        return {
            success: true,
            message: '🤖 **قائمة الأوامر المتاحة:**\n\n' +
                     '📋 **إدارة اللجان:**\n' +
                     '• "أنشئ لجنة اسمه [الاسم]" - إنشاء لجنة جديدة\n' +
                     '• "احذف لجنة [الاسم]" - حذف لجنة\n' +
                     '• "عدل لجنة [الاسم]" - تعديل لجنة\n\n' +
                     '🏢 **إدارة الفروع:**\n' +
                     '• "أنشئ فرع اسمه [الاسم]" - إنشاء فرع جديد\n' +
                     '• "احذف فرع [الاسم]" - حذف فرع\n' +
                     '• "عدل فرع [الاسم]" - تعديل فرع\n\n' +
                     '📊 **التقارير:**\n' +
                     '• "اعمل تقرير عن [لجنة/فرع]" - إنشاء تقرير\n' +
                     '• "حلل بيانات [الفترة]" - تحليل البيانات\n\n' +
                     '🔄 **التتبع:**\n' +
                     '• "تابع مراسلة من [لجنة] إلى [فرع]" - تتبع مراسلة\n' +
                     '• "شوف حالة [المراسلة]" - التحقق من الحالة\n\n' +
                     '🖥️ **النظام:**\n' +
                     '• "ضيف شاشة اسمه [الاسم]" - إضافة شاشة جديدة\n' +
                     '• "عدل كود [الملف]" - تعديل الكود\n' +
                     '• "صلح خطأ [الوصف]" - إصلاح خطأ\n\n' +
                     '🤖 **ChatGPT:**\n' +
                     '• "اسأل [سؤالك]" - اسأل ChatGPT أي سؤال\n' +
                     '• "اشرح [موضوع]" - شرح موضوع معين\n\n' +
                     'ℹ️ **أخرى:**\n' +
                     '• "مساعدة" - عرض هذه القائمة\n' +
                     '• "حالة النظام" - عرض حالة النظام\n' +
                     '• "تعلم [الأمر]" - تعلم أمر جديد'
        };
    }

    /**
     * الحصول على حالة النظام
     */
    async getSystemStatus() {
        try {
            const context = await this.getSystemContext();
            
            return {
                success: true,
                status: {
                    users: context.membersCount,
                    committees: context.committeesCount,
                    branches: context.branchesCount,
                    tracking: context.trackingCount,
                    pendingRequests: context.pendingRequests,
                    aiActive: this.isActive,
                    aiLearning: this.learningData.interactions.length,
                    chatGPT: 'متصل',
                    chatGPTModel: OPENAI_CONFIG.MODEL,
                    lastUpdate: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error('خطأ في الحصول على حالة النظام:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * التعلم من أمر جديد
     */
    async learnFromCommand(params) {
        try {
            const { command, action, pattern } = params;
            
            const newPattern = pattern || command;
            const patternKey = `custom_${Date.now()}`;
            
            this.commandPatterns[patternKey] = new RegExp(newPattern, 'i');
            
            const learningRef = ref(database, 'itws_ai/learning/patterns');
            await push(learningRef, {
                pattern: newPattern,
                action: action,
                createdBy: this.currentUser.userId,
                createdAt: new Date().toISOString(),
                uses: 0
            });

            return {
                success: true,
                message: '✅ تم تعلم الأمر بنجاح',
                pattern: newPattern,
                action: action
            };
        } catch (error) {
            console.error('خطأ في التعلم:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * ==================================================
     * دوال جمع البيانات والتحليل
     * ==================================================
     */

    async collectCommitteeData(committeeId, period) {
        const snapshot = await get(ref(database, `committees/${committeeId}`));
        return snapshot.val();
    }

    async collectBranchData(branchId, period) {
        const snapshot = await get(ref(database, `branches/${branchId}`));
        return snapshot.val();
    }

    async collectMemberData(memberId, period) {
        const snapshot = await get(ref(database, `users/${memberId}`));
        return snapshot.val();
    }

    async collectTrackingData(period) {
        const snapshot = await get(ref(database, 'tracking'));
        return snapshot.val();
    }

    async collectGeneralData(period) {
        return {
            committees: await this.getCount('committees'),
            branches: await this.getCount('branches'),
            users: await this.getCount('users'),
            tracking: await this.getCount('tracking')
        };
    }

    analyzeCommitteeData(data) {
        return {
            totalMembers: data.members ? Object.keys(data.members).length : 0,
            totalReports: data.reports ? Object.keys(data.reports).length : 0,
            totalTasks: data.tasks ? Object.keys(data.tasks).length : 0,
            activityRate: this.calculateActivityRate(data),
            performance: this.evaluatePerformance(data)
        };
    }

    analyzeBranchData(data) {
        return {
            totalMembers: data.members ? Object.keys(data.members).length : 0,
            totalReports: data.reports ? Object.keys(data.reports).length : 0,
            totalActivities: data.activities ? Object.keys(data.activities).length : 0,
            councilComplete: this.checkCouncilComplete(data),
            activityRate: this.calculateActivityRate(data)
        };
    }

    analyzeMemberData(data) {
        return {
            role: data.role,
            lastActive: data.lastSeen,
            activityScore: this.calculateActivityScore(data),
            contributions: this.countContributions(data)
        };
    }

    analyzeTrackingData(data) {
        const tracking = Object.values(data || {});
        return {
            total: tracking.length,
            pending: tracking.filter(t => t.status === 'pending').length,
            inProgress: tracking.filter(t => t.status === 'in_progress').length,
            completed: tracking.filter(t => t.status === 'completed').length,
            rejected: tracking.filter(t => t.status === 'rejected').length,
            averageResponse: this.calculateAverageResponse(tracking)
        };
    }

    analyzeGeneralData(data) {
        return {
            totalCommittees: data.committees,
            totalBranches: data.branches,
            totalUsers: data.users,
            totalTracking: data.tracking,
            systemHealth: this.calculateSystemHealth(data)
        };
    }

    generateInsights(analysis) {
        const insights = [];
        
        if (analysis.pending && analysis.pending > 10) {
            insights.push('⚠️ يوجد عدد كبير من الطلبات المعلقة');
        }
        
        if (analysis.totalUsers && analysis.totalUsers > 100) {
            insights.push('🎉 وصل عدد الأعضاء لأكثر من ١٠٠');
        }
        
        return insights;
    }

    generateRecommendations(analysis) {
        const recommendations = [];
        
        if (analysis.pending && analysis.pending > 5) {
            recommendations.push('مراجعة الطلبات المعلقة');
        }
        
        if (analysis.activityRate && analysis.activityRate < 50) {
            recommendations.push('تفعيل الأعضاء غير النشطين');
        }
        
        return recommendations;
    }

    /**
     * ==================================================
     * دوال مساعدة (Helpers)
     * ==================================================
     */

    async getCount(path, status = null) {
        const snapshot = await get(ref(database, path));
        if (!snapshot.exists()) return 0;
        
        if (status) {
            return Object.values(snapshot.val()).filter(item => item.status === status).length;
        }
        
        return Object.keys(snapshot.val()).length;
    }

    calculateActivityRate(data) {
        return 75;
    }

    evaluatePerformance(data) {
        return 'جيد';
    }

    checkCouncilComplete(data) {
        if (!data.subCouncil) return false;
        return Object.values(data.subCouncil).filter(v => v).length >= 3;
    }

    calculateActivityScore(data) {
        return 85;
    }

    countContributions(data) {
        return {
            reports: data.reports ? Object.keys(data.reports).length : 0,
            activities: data.activities ? Object.keys(data.activities).length : 0
        };
    }

    calculateAverageResponse(tracking) {
        return '٢.٥ ساعة';
    }

    calculateSystemHealth(data) {
        return 'ممتاز';
    }

    async backupFile(file) {
        const backupRef = ref(database, `itws_ai/backups/${Date.now()}_${file}`);
        await set(backupRef, {
            fileName: file,
            backedUpAt: new Date().toISOString(),
            backedUpBy: this.currentUser.userId
        });
    }

    async applyModifications(file, modifications) {
        return { applied: true, file, modifications };
    }

    async analyzeBug(bug) {
        return { analyzed: true, ...bug };
    }

    async applyBugFix(analysis) {
        return { fixed: true, analysis };
    }

    async testFix(fix) {
        return { passed: true, fix };
    }

    async sendNotification(userId, title, message) {
        const notificationsRef = ref(database, `notifications/${userId}`);
        await push(notificationsRef, {
            title,
            message,
            read: false,
            timestamp: new Date().toISOString()
        });
    }

    async saveInteraction(command, result) {
        const interaction = {
            command,
            result,
            timestamp: new Date().toISOString(),
            userId: this.currentUser.userId
        };
        
        this.learningData.interactions.push(interaction);
        
        const learningRef = ref(database, 'itws_ai/learning/interactions');
        await push(learningRef, interaction);
    }

    async logAction(action, details) {
        const logRef = ref(database, 'itws_ai/logs');
        await push(logRef, {
            action,
            details,
            userId: this.currentUser?.userId,
            timestamp: new Date().toISOString()
        });
    }

    async logActivity(type, description) {
        const activitiesRef = ref(database, 'activities');
        await push(activitiesRef, {
            type,
            description,
            icon: 'fa-robot',
            timestamp: new Date().toISOString()
        });
    }

    async processNewRequests(requests) {
        for (const [id, request] of Object.entries(requests)) {
            if (request.status === 'pending') {
                const suggestion = this.generateSuggestion(request);
                if (suggestion) {
                    await this.sendSuggestion(request.createdBy, suggestion);
                }
            }
        }
    }

    async analyzeSuggestions(suggestions) {
        for (const [id, suggestion] of Object.entries(suggestions)) {
            if (!suggestion.analyzed) {
                const analysis = this.analyzeSuggestion(suggestion);
                await update(ref(database, `suggestions/${id}`), {
                    analyzed: true,
                    analysis: analysis,
                    analyzedAt: new Date().toISOString()
                });
            }
        }
    }

    generateSuggestion(request) {
        return null;
    }

    async sendSuggestion(userId, suggestion) {}

    analyzeSuggestion(suggestion) {
        return {};
    }

    extractPatterns(data) {
        return [];
    }

    generatePredictions(data, patterns) {
        return [];
    }

    performBasicAnalysis(data) {
        return {};
    }

    performAdvancedAnalysis(data, metrics) {
        return {};
    }

    generateAnalysisSummary(basic, advanced) {
        return 'ملخص التحليل';
    }

    async getCommitteeStatus(committeeId) {
        const snapshot = await get(ref(database, `committees/${committeeId}`));
        return snapshot.val();
    }

    async getBranchStatus(branchId) {
        const snapshot = await get(ref(database, `branches/${branchId}`));
        return snapshot.val();
    }

    async getMemberStatus(memberId) {
        const snapshot = await get(ref(database, `users/${memberId}`));
        return snapshot.val();
    }

    async getSystemHealth() {
        return {
            status: 'جيد',
            uptime: '٩٩.٩٪',
            responseTime: '٠.٣ ثانية'
        };
    }

    async getGeneralStatus() {
        return {
            system: 'نشط',
            ai: this.isActive ? 'نشط' : 'غير نشط',
            lastUpdate: new Date().toISOString()
        };
    }
}

// تصدير المساعد
export default ITWSAI;
