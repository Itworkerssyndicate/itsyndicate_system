// assets/js/itws-ai-core.js
// ITWS AI - النواة الأساسية للمساعد الذكي

class ITWSAICore {
    constructor(currentUser = null) {
        this.currentUser = currentUser;
        this.apiKey = this.getStoredApiKey();
        this.baseURL = "https://api.openai.com/v1/chat/completions";
        this.model = "gpt-3.5-turbo"; // أو gpt-4-turbo-preview للنسخة المتقدمة
        this.isActive = false;
        this.conversations = new Map();
        this.commands = [];
        
        // تعريف المستخدمين والصلاحيات
        this.userTypes = {
            guest: {
                level: 0,
                name: 'زائر',
                description: 'مستخدم غير مسجل الدخول',
                capabilities: ['مساعدة في تسجيل الدخول', 'مساعدة في استعادة كلمة المرور'],
                icon: 'fa-user'
            },
            president: {
                level: 100,
                name: 'نقيب عام',
                description: 'كامل الصلاحيات - تعديل وإضافة وتحليل',
                capabilities: ['تعديل النظام', 'إضافة شاشات', 'تحليل كامل', 'تقييم أداء', 'إصلاح أخطاء', 'اقتراحات تطوير'],
                icon: 'fa-crown'
            },
            vice_president_first: {
                level: 90,
                name: 'نائب أول',
                description: 'إشراف عام - تقارير ومتابعة',
                capabilities: ['تقارير عامة', 'متابعة أداء', 'استفسارات عن اللجان والفروع', 'تحليل إحصائي'],
                icon: 'fa-star'
            },
            vice_president_second_manager: {
                level: 80,
                name: 'نائب ثاني - مدير اللجان',
                description: 'إدارة اللجان - متابعة أداء اللجان',
                capabilities: ['تقارير اللجان', 'تحليل أداء اللجان', 'اقتراحات تطوير اللجان', 'إحصاءات اللجان'],
                icon: 'fa-users-cog'
            },
            secretary_assistant_manager: {
                level: 80,
                name: 'مساعد الأمين العام - مدير الفروع',
                description: 'إدارة الفروع - متابعة أداء الفروع',
                capabilities: ['تقارير الفروع', 'تحليل أداء الفروع', 'اقتراحات تطوير الفروع', 'إحصاءات الفروع'],
                icon: 'fa-building'
            },
            secretary_general: {
                level: 70,
                name: 'أمين عام',
                description: 'إدارة عامة - تنظيم ومتابعة',
                capabilities: ['تقارير عامة', 'متابعة إدارية', 'تنظيم اجتماعات', 'جدولة مهام'],
                icon: 'fa-file-signature'
            },
            treasurer: {
                level: 70,
                name: 'أمين صندوق',
                description: 'إدارة مالية - متابعة حسابات',
                capabilities: ['تقارير مالية', 'تحليل مالي', 'متابعة إيرادات ومصروفات', 'توقعات مالية'],
                icon: 'fa-coins'
            },
            committee_head: {
                level: 60,
                name: 'رئيس لجنة',
                description: 'إدارة لجنة محددة - متابعة أعضاء اللجنة',
                capabilities: ['تقارير لجنته', 'تحليل أداء لجنته', 'اقتراحات تطوير للجنته', 'متابعة مهام'],
                icon: 'fa-user-tie'
            },
            committee_member: {
                level: 50,
                name: 'عضو لجنة',
                description: 'عضو في لجنة - مشاركة في المهام',
                capabilities: ['استفسارات عن مهامه', 'متابعة جدول أعمال', 'تقديم اقتراحات', 'تسجيل حضور'],
                icon: 'fa-user'
            },
            governorate_president: {
                level: 60,
                name: 'نقيب محافظة',
                description: 'إدارة محافظة - متابعة فروع المحافظة',
                capabilities: ['تقارير محافظته', 'تحليل أداء محافظته', 'متابعة فروع محافظته', 'إحصاءات محلية'],
                icon: 'fa-city'
            },
            governorate_council_member: {
                level: 50,
                name: 'عضو مجلس محافظة',
                description: 'عضو مجلس محافظة - مشاركة في القرارات',
                capabilities: ['استفسارات عن محافظته', 'متابعة قرارات المجلس', 'تقديم مقترحات'],
                icon: 'fa-user-friends'
            },
            governorate_agent: {
                level: 50,
                name: 'وكيل محافظة',
                description: 'إدارة وكالة - متابعة أعمال الوكالة',
                capabilities: ['استفسارات عن وكالته', 'متابعة أعمال الوكالة', 'تقارير دورية'],
                icon: 'fa-user-cog'
            }
        };
    }

    /**
     * الحصول على مفتاح API المخزن
     */
    getStoredApiKey() {
        const stored = localStorage.getItem('itws_ai_api_key');
        if (stored) return stored;
        return sessionStorage.getItem('itws_ai_api_key');
    }

    /**
     * تخزين مفتاح API بشكل آمن
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
        localStorage.setItem('itws_ai_api_key', apiKey);
        sessionStorage.setItem('itws_ai_api_key', apiKey);
    }

    /**
     * الحصول على معلومات المستخدم الحالي
     */
    getUserInfo() {
        if (!this.currentUser) {
            return {
                type: 'guest',
                level: 0,
                name: 'زائر',
                description: 'مستخدم غير مسجل',
                capabilities: ['مساعدة في تسجيل الدخول', 'مساعدة في استعادة كلمة المرور'],
                icon: 'fa-user'
            };
        }

        const userRole = this.currentUser.role || this.currentUser.position || 'guest';
        return this.userTypes[userRole] || this.userTypes.guest;
    }

    /**
     * تهيئة المساعد
     */
    async initialize() {
        try {
            const userInfo = this.getUserInfo();
            console.log(`🚀 جاري تهيئة ITWS AI للمستخدم: ${userInfo.name}`);
            
            this.isActive = true;
            
            return {
                success: true,
                userType: userInfo.type,
                userInfo: userInfo,
                message: this.getWelcomeMessage(userInfo),
                capabilities: userInfo.capabilities,
                icon: userInfo.icon
            };
        } catch (error) {
            console.error('❌ خطأ في تهيئة المساعد:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * الحصول على رسالة ترحيب مناسبة للمستخدم
     */
    getWelcomeMessage(userInfo) {
        const messages = {
            guest: 'مرحباً! أنا ITWS AI المساعد الذكي. كيف يمكنني مساعدتك في تسجيل الدخول أو استعادة كلمة المرور؟',
            president: 'مرحباً سيدي النقيب! أنا ITWS AI تحت أمرك. ماذا تريد أن نعدل أو نطور اليوم؟',
            vice_president_first: 'مرحباً سيدي النائب الأول. أنا جاهز لمساعدتك في متابعة أداء النظام وتقارير الأداء.',
            vice_president_second_manager: 'مرحباً سيدي مدير اللجان. كيف يمكنني مساعدتك في تطوير أداء اللجان وتحليل إحصاءاتها؟',
            secretary_assistant_manager: 'مرحباً سيدي مدير الفروع. أنا جاهز لمساعدتك في تحسين أداء الفروع ومتابعة أنشطتها.',
            secretary_general: 'مرحباً سيدي الأمين العام. كيف يمكنني مساعدتك في التنظيم والمتابعة الإدارية؟',
            treasurer: 'مرحباً سيدي أمين الصندوق. أنا جاهز لمساعدتك في التحليل المالي والمتابعة المالية.',
            committee_head: 'مرحباً سيدي رئيس اللجنة. أنا جاهز لمساعدتك في تطوير لجنتك وزيادة إنتاجيتها.',
            committee_member: 'مرحباً! كيف يمكنني مساعدتك في مهامك كلجنة ومتابعة أعمالك؟',
            governorate_president: 'مرحباً سيدي نقيب المحافظة. أنا جاهز لمساعدتك في إدارة محافظتك ومتابعة فروعها.',
            default: `مرحباً! أنا ITWS AI المساعد الذكي. كيف يمكنني مساعدتك اليوم؟`
        };

        return messages[userInfo.type] || messages.default;
    }

    /**
     * معالجة رسالة المستخدم
     */
    async processMessage(message, conversationId = null) {
        try {
            const userInfo = this.getUserInfo();
            
            // تحليل نوع الطلب
            const intent = this.analyzeIntent(message, userInfo);
            
            // التحقق من صلاحية الطلب
            if (!this.canExecuteIntent(intent, userInfo)) {
                return {
                    success: false,
                    error: 'عذراً، هذا الطلب خارج نطاق صلاحياتك.',
                    suggestions: this.getSuggestionsForUser(userInfo)
                };
            }

            // تنفيذ الطلب حسب نوعه
            let response;
            if (userInfo.type === 'guest') {
                response = await this.handleGuestQuery(message, intent);
            } else {
                response = await this.handleUserQuery(message, intent, userInfo);
            }

            // حفظ المحادثة
            if (!conversationId) {
                conversationId = `conv_${Date.now()}`;
                this.conversations.set(conversationId, []);
            }
            
            this.conversations.get(conversationId).push(
                { role: 'user', content: message },
                { role: 'assistant', content: response }
            );

            return {
                success: true,
                message: response,
                conversationId: conversationId,
                suggestions: this.getSuggestionsForUser(userInfo)
            };

        } catch (error) {
            console.error('Error processing message:', error);
            return {
                success: false,
                error: 'حدث خطأ في معالجة الطلب'
            };
        }
    }

    /**
     * تحليل نية المستخدم
     */
    analyzeIntent(message, userInfo) {
        message = message.toLowerCase();
        
        // للزوار - مساعدة في تسجيل الدخول
        if (userInfo.type === 'guest') {
            if (message.includes('دخول') || message.includes('login') || message.includes('تسجيل')) {
                return 'login_help';
            }
            if (message.includes('كلمة المرور') || message.includes('password') || message.includes('نسيت')) {
                return 'password_help';
            }
            if (message.includes('حساب') || message.includes('account') || message.includes('تسجيل')) {
                return 'account_help';
            }
            return 'general_guest';
        }

        // للمستخدمين المسجلين
        if (message.includes('تقرير') || message.includes('report') || message.includes('إحصائيات')) {
            return 'report';
        }
        if (message.includes('تحليل') || message.includes('analyze') || message.includes('ادرس')) {
            return 'analyze';
        }
        if (message.includes('اقتراح') || message.includes('suggest') || message.includes('فكرة')) {
            return 'suggestion';
        }
        if (message.includes('إنتاج') || message.includes('productivity') || message.includes('كفاءة')) {
            return 'productivity';
        }
        if (message.includes('مشكلة') || message.includes('problem') || message.includes('خطأ')) {
            return 'problem';
        }
        if (message.includes('تطوير') || message.includes('تحسين') || message.includes('زيادة')) {
            return 'improvement';
        }
        
        return 'general';
    }

    /**
     * التحقق من صلاحية تنفيذ الطلب
     */
    canExecuteIntent(intent, userInfo) {
        // الزوار مسموح لهم فقط بالمساعدة في تسجيل الدخول
        if (userInfo.type === 'guest') {
            return ['login_help', 'password_help', 'account_help', 'general_guest'].includes(intent);
        }

        // باقي المستخدمين مسموح لهم بكل شيء عدا التعديلات البرمجية
        if (userInfo.level < 100 && ['code_modification', 'screen_creation', 'system_modify'].includes(intent)) {
            return false;
        }

        return true;
    }

    /**
     * معالجة استفسارات الزوار
     */
    async handleGuestQuery(message, intent) {
        const context = `أنت مساعد ذكي لموقع نقابة تكنولوجيا المعلومات والبرمجيات.
المستخدم حالياً: زائر (غير مسجل)
مهمتك: مساعدة الزوار في مشاكل تسجيل الدخول فقط.
لا تقدم أي معلومات عن النظام الداخلي أو الصلاحيات.`;

        const prompts = {
            login_help: 'للمساعدة في تسجيل الدخول، يرجى التأكد من: 1. إدخال اسم المستخدم الصحيح 2. إدخال كلمة المرور الصحيحة (الرقم القومي) 3. إذا نسيت كلمة المرور، يمكنك طلب المساعدة في استعادتها.',
            password_help: 'إذا نسيت كلمة المرور، يرجى التواصل مع النقيب العام أو النائب الأول للمساعدة في استعادتها.',
            account_help: 'إذا لم يكن لديك حساب، يمكنك الضغط على "تسجيل جديد" وملء البيانات المطلوبة. سيتم مراجعة طلبك من قبل النقيب العام.',
            general_guest: 'كيف يمكنني مساعدتك في عملية تسجيل الدخول؟'
        };

        if (intent === 'general_guest') {
            return await this.callGPT(message, context);
        }

        return prompts[intent] || prompts.general_guest;
    }

    /**
     * معالجة استفسارات المستخدمين المسجلين
     */
    async handleUserQuery(message, intent, userInfo) {
        const context = `أنت ITWS AI، المساعد الذكي لنظام إدارة نقابة تكنولوجيا المعلومات والبرمجيات.

المستخدم الحالي:
- الاسم: ${this.currentUser?.fullName || 'مستخدم'}
- الصفة: ${userInfo.name}
- الصلاحيات: ${userInfo.capabilities.join('، ')}

مهمتك:
1. مساعدة المستخدم في مهامه حسب صلاحياته
2. تقديم اقتراحات لتحسين الإنتاجية والعمل
3. المساعدة في حل المشكلات ضمن صلاحيات المستخدم
4. توجيه المستخدم لأفضل الممارسات في مجاله

تعليمات مهمة:
- ردودك تكون باللغة العربية
- قدم اقتراحات مفيدة وعملية
- لا تقدم معلومات خارج صلاحيات المستخدم
- ركز على تحسين الإنتاجية وجودة العمل`;

        return await this.callGPT(message, context);
    }

    /**
     * الحصول على اقتراحات مناسبة للمستخدم
     */
    getSuggestionsForUser(userInfo) {
        const suggestions = {
            guest: [
                'كيف أسجل دخول؟',
                'نسيت كلمة المرور',
                'ليس لدي حساب',
                'مشكلة في تسجيل الدخول'
            ],
            president: [
                'اقترح تحسينات للنظام',
                'كيف أطور أداء اللجان؟',
                'تحليل أداء الفروع',
                'تقرير شامل عن النقابة',
                'أضف شاشة جديدة',
                'عدل صلاحيات عضو'
            ],
            vice_president_first: [
                'تقرير أداء عام',
                'إحصائيات اللجان',
                'متابعة طلبات',
                'تحليل نشاط'
            ],
            vice_president_second_manager: [
                'اقتراحات لتطوير اللجان',
                'تحسين أداء لجنة معينة',
                'تقرير أداء اللجان',
                'إحصاءات اللجان'
            ],
            secretary_assistant_manager: [
                'تطوير أداء الفروع',
                'تحسين التواصل بين الفروع',
                'تقرير أداء الفروع',
                'إحصاءات الفروع'
            ],
            treasurer: [
                'تحسين الإدارة المالية',
                'ترشيد المصروفات',
                'تقرير مالي',
                'تحليل إيرادات'
            ],
            committee_head: [
                'تطوير لجنتي',
                'تحفيز أعضاء اللجنة',
                'تقرير أداء اللجنة',
                'متابعة مهام'
            ],
            committee_member: [
                'زيادة إنتاجيتي',
                'تقديم اقتراحات',
                'متابعة المهام',
                'جدول أعمالي'
            ]
        };

        return suggestions[userInfo.type] || [
            'كيف أطور عملي؟',
            'زيادة الإنتاجية',
            'تقديم اقتراح',
            'مساعدة في مهمة'
        ];
    }

    /**
     * استدعاء GPT API
     */
    async callGPT(message, context) {
        try {
            if (!this.apiKey) {
                return this.getOfflineResponse(message);
            }

            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: 'system', content: context },
                        { role: 'user', content: message }
                    ],
                    max_tokens: 500,
                    temperature: 0.7
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'خطأ في الاتصال');
            }

            return data.choices[0].message.content;

        } catch (error) {
            console.error('GPT Error:', error);
            return this.getOfflineResponse(message);
        }
    }

    /**
     * ردود بدون اتصال (Offline)
     */
    getOfflineResponse(message) {
        const responses = [
            'أقترح التركيز على تحديد أهداف واضحة ومتابعتها بشكل دوري.',
            'يمكن تحسين الإنتاجية بتنظيم الوقت وتحديد أولويات العمل.',
            'التواصل المستمر مع الفريق يساعد في تحسين الأداء.',
            'تقييم الأداء بشكل دوري يساعد في تحديد نقاط القوة والضعف.',
            'استخدام التكنولوجيا بشكل أفضل يمكن أن يزيد الإنتاجية.',
            'حاول تقسيم المهام الكبيرة إلى مهام صغيرة قابلة للتنفيذ.',
            'الاجتماعات الدورية مع الفريق تساعد في متابعة التقدم.'
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }
}

export default ITWSAICore;
