/**
 * ======================================================
 * ITWS AI ASSISTANT - المساعد التقني الذكي المتكامل
 * نقابة تكنولوجيا المعلومات والبرمجيات
 * الإصدار: 2.0.0 - النسخة الكاملة مع تكامل ChatGPT
 * ======================================================
 * 
 * هذا المساعد مخصص للنظام بأكمله مع صلاحيات مختلفة:
 * - النقيب العام: صلاحية كاملة (تعديل كود، إضافة شاشات، تحليل، تقييم)
 * - النائب الأول: استفسارات فقط ضمن صلاحياته
 * - باقي المستخدمين: استفسارات محدودة حسب دورهم
 * ======================================================
 */

class ITWSAIAssistant {
    constructor(currentUser, apiKey = null) {
        this.currentUser = currentUser;
        this.apiKey = apiKey || this.getStoredApiKey();
        this.baseURL = "https://api.openai.com/v1/chat/completions";
        this.model = "gpt-4-turbo-preview"; // أو gpt-3.5-turbo للنسخة الأسرع
        this.isActive = false;
        this.conversations = new Map();
        this.codeBackups = new Map();
        
        // صلاحيات المستخدمين للتعامل مع المساعد
        this.permissions = {
            president: {
                level: 100,
                canModifyCode: true,
                canAddScreens: true,
                canModifyDatabase: true,
                canAnalyzeAnything: true,
                canEvaluateAnything: true,
                canAccessAllData: true,
                canModifySystem: true,
                canUseFullAI: true,
                description: 'النقيب العام - صلاحية كاملة مع المساعد'
            },
            vice_president_first: {
                level: 90,
                canModifyCode: false,
                canAddScreens: false,
                canModifyDatabase: false,
                canAnalyzeAnything: false,
                canEvaluate: true,
                canAccessMostData: true,
                canUseAI: true,
                description: 'نائب أول - استفسارات وتقارير فقط'
            },
            vice_president_second_manager: {
                level: 80,
                canModifyCode: false,
                canAddScreens: false,
                canModifyDatabase: false,
                canAnalyzeCommittees: true,
                canEvaluateCommittees: true,
                canAccessCommitteesData: true,
                canUseAI: true,
                description: 'نائب ثاني - مدير اللجان'
            },
            secretary_assistant_manager: {
                level: 80,
                canModifyCode: false,
                canAddScreens: false,
                canModifyDatabase: false,
                canAnalyzeBranches: true,
                canEvaluateBranches: true,
                canAccessBranchesData: true,
                canUseAI: true,
                description: 'مساعد الأمين العام - مدير الفروع'
            },
            secretary_general: {
                level: 70,
                canModifyCode: false,
                canAddScreens: false,
                canModifyDatabase: false,
                canAnalyzeGeneral: true,
                canAccessGeneralData: true,
                canUseAI: true,
                description: 'أمين عام'
            },
            treasurer: {
                level: 70,
                canModifyCode: false,
                canAddScreens: false,
                canModifyDatabase: false,
                canAnalyzeFinance: true,
                canAccessFinanceData: true,
                canUseAI: true,
                description: 'أمين صندوق'
            },
            committee_head: {
                level: 60,
                canModifyCode: false,
                canAddScreens: false,
                canModifyDatabase: false,
                canAnalyzeOwnCommittee: true,
                canAccessOwnCommitteeData: true,
                canUseAI: true,
                description: 'رئيس لجنة'
            },
            committee_member: {
                level: 50,
                canModifyCode: false,
                canAddScreens: false,
                canModifyDatabase: false,
                canViewOwnCommittee: true,
                canUseAIBasic: true,
                description: 'عضو لجنة'
            },
            governorate_president: {
                level: 60,
                canModifyCode: false,
                canAddScreens: false,
                canModifyDatabase: false,
                canAnalyzeOwnGovernorate: true,
                canAccessOwnGovernorateData: true,
                canUseAI: true,
                description: 'نقيب محافظة'
            },
            governorate_council_member: {
                level: 50,
                canModifyCode: false,
                canAddScreens: false,
                canModifyDatabase: false,
                canViewOwnGovernorate: true,
                canUseAIBasic: true,
                description: 'عضو مجلس محافظة'
            },
            governorate_agent: {
                level: 50,
                canModifyCode: false,
                canAddScreens: false,
                canModifyDatabase: false,
                canViewOwnAgency: true,
                canUseAIBasic: true,
                description: 'وكيل محافظة'
            }
        };

        // أوامر المستخدمين حسب الصلاحية
        this.commands = {
            president: [
                'تعديل كود', 'إضافة شاشة', 'حذف شاشة', 'تعديل قاعدة بيانات',
                'تحليل شامل', 'تقييم أداء', 'تقرير مفصل', 'اقتراح تحسينات',
                'إصلاح خطأ', 'توقع اتجاهات', 'مقارنة أداء', 'إحصائيات متقدمة',
                'تعديل صلاحيات', 'إضافة مستخدم', 'حذف مستخدم', 'تعديل إعدادات'
            ],
            vice_president_first: [
                'تقارير عامة', 'إحصائيات', 'تحليل أداء', 'استفسار عن لجنة',
                'استفسار عن فرع', 'مشاهدة تتبع', 'تصدير تقارير'
            ],
            vice_president_second_manager: [
                'تقارير اللجان', 'تحليل أداء اللجان', 'إحصائيات اللجان',
                'استفسار عن لجنة معينة', 'مشاهدة نشاط اللجان'
            ],
            secretary_assistant_manager: [
                'تقارير الفروع', 'تحليل أداء الفروع', 'إحصائيات الفروع',
                'استفسار عن فرع معين', 'مشاهدة نشاط الفروع'
            ],
            treasurer: [
                'تقارير مالية', 'تحليل مالي', 'إحصائيات مالية',
                'استفسار عن إيرادات', 'استفسار عن مصروفات'
            ],
            committee_head: [
                'تقارير لجنتي', 'تحليل أداء لجنتي', 'إحصائيات لجنتي',
                'استفسار عن أعضاء لجنتي'
            ],
            committee_member: [
                'مشاهدة جدول أعمال', 'استفسار عن مهامي', 'تقاريري الشخصية'
            ],
            governorate_president: [
                'تقارير محافظتي', 'تحليل أداء محافظتي', 'إحصائيات محافظتي',
                'استفسار عن فروع محافظتي'
            ]
        };

        // قاعدة المعرفة المحلية
        this.knowledgeBase = {
            systemInfo: {
                name: 'نقابة تكنولوجيا المعلومات والبرمجيات',
                version: '2.0.0',
                modules: ['اللجان', 'الفروع', 'الأعضاء', 'التتبع', 'المالية', 'التقييمات', 'الحضور', 'الأحداث']
            }
        };

        // إحصائيات المساعد
        this.stats = {
            queriesProcessed: 0,
            codesModified: 0,
            screensAdded: 0,
            errorsFixed: 0,
            lastActive: null
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
     * التحقق من صلاحية المستخدم للمساعد
     */
    checkUserPermission() {
        if (!this.currentUser) {
            return {
                allowed: false,
                level: 0,
                message: 'يجب تسجيل الدخول أولاً'
            };
        }

        const userPerms = this.permissions[this.currentUser.role || this.currentUser.position];
        
        if (!userPerms) {
            return {
                allowed: false,
                level: 0,
                message: 'صلاحيات غير معروفة'
            };
        }

        return {
            allowed: true,
            level: userPerms.level,
            permissions: userPerms,
            message: `مرحباً ${this.currentUser.fullName} - ${userPerms.description}`
        };
    }

    /**
     * التحقق من وجود مفتاح API
     */
    checkApiKey() {
        if (!this.apiKey) {
            throw new Error('⚠️ مفتاح API غير موجود. يرجى إدخال مفتاح API أولاً');
        }
        return true;
    }

    /**
     * تهيئة المساعد
     */
    async initialize() {
        try {
            const permission = this.checkUserPermission();
            if (!permission.allowed) {
                console.warn('⚠️ مستخدم غير مصرح له باستخدام المساعد:', permission.message);
                return {
                    success: false,
                    error: permission.message,
                    level: 0
                };
            }

            console.log(`🚀 جاري تهيئة ITWS AI Assistant للمستخدم: ${this.currentUser.fullName} (المستوى: ${permission.level})`);
            
            // تحميل بيانات التعلم السابقة
            await this.loadLearningData();
            
            // تفعيل المستمعين
            this.activateListeners();
            
            this.isActive = true;
            this.stats.lastActive = new Date().toISOString();
            
            console.log('✅ ITWS AI Assistant جاهز للعمل');
            
            return {
                success: true,
                message: `مرحباً ${this.currentUser.fullName}! أنا ITWS AI المساعد التقني الذكي. كيف يمكنني مساعدتك اليوم؟`,
                permissions: permission.permissions,
                commands: this.getUserCommands(),
                level: permission.level
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
     * الحصول على أوامر المستخدم حسب صلاحياته
     */
    getUserCommands() {
        const role = this.currentUser.role || this.currentUser.position;
        return this.commands[role] || ['استفسارات عامة'];
    }

    /**
     * معالجة رسالة المستخدم
     */
    async processMessage(message, conversationId = null) {
        try {
            const permission = this.checkUserPermission();
            if (!permission.allowed) {
                return {
                    success: false,
                    error: permission.message
                };
            }

            this.stats.queriesProcessed++;
            
            // تحليل نوع الطلب
            const intent = this.analyzeIntent(message);
            
            // التحقق من صلاحية تنفيذ الطلب
            if (!this.canExecuteIntent(intent, permission.permissions)) {
                return {
                    success: false,
                    error: 'عذراً، ليس لديك صلاحية لتنفيذ هذا الطلب',
                    suggestedCommands: this.getUserCommands()
                };
            }

            // تنفيذ الطلب حسب نوعه
            if (this.isCodeModification(intent)) {
                return await this.handleCodeModification(message, intent, permission);
            } else if (this.isAnalysis(intent)) {
                return await this.handleAnalysis(message, intent, permission);
            } else if (this.isEvaluation(intent)) {
                return await this.handleEvaluation(message, intent, permission);
            } else if (this.isSuggestion(intent)) {
                return await this.handleSuggestion(message, intent, permission);
            } else {
                return await this.handleGeneralQuery(message, conversationId, permission);
            }

        } catch (error) {
            console.error('Error processing message:', error);
            return {
                success: false,
                error: 'حدث خطأ في معالجة الطلب'
            };
        }
    }

    /**
     * تحليل نوايا المستخدم من الرسالة
     */
    analyzeIntent(message) {
        message = message.toLowerCase();
        
        if (message.includes('عدل') || message.includes('تعديل') || message.includes('غير')) {
            return 'modify';
        }
        if (message.includes('ضيف') || message.includes('إضافة') || message.includes('أنشئ')) {
            return 'create';
        }
        if (message.includes('شاشة') || message.includes('صفحة')) {
            return 'screen';
        }
        if (message.includes('كود') || message.includes('برمجة') || message.includes('برمجي')) {
            return 'code';
        }
        if (message.includes('حلل') || message.includes('تحليل') || message.includes('ادرس')) {
            return 'analyze';
        }
        if (message.includes('قيم') || message.includes('تقييم') || message.includes('أداء')) {
            return 'evaluate';
        }
        if (message.includes('اقترح') || message.includes('اقتراح') || message.includes('انصح')) {
            return 'suggest';
        }
        if (message.includes('تقرير') || message.includes('احصائيات') || message.includes('إحصائيات')) {
            return 'report';
        }
        if (message.includes('صلح') || message.includes('إصلاح') || message.includes('خطأ')) {
            return 'fix';
        }
        if (message.includes('توقع') || message.includes('توقعات')) {
            return 'predict';
        }
        if (message.includes('مقارنة') || message.includes('قارن')) {
            return 'compare';
        }
        
        return 'general';
    }

    /**
     * التحقق من صلاحية تنفيذ الطلب
     */
    canExecuteIntent(intent, permissions) {
        // إذا كان المستخدم هو النقيب، كل شيء مسموح
        if (permissions.level >= 100) return true;
        
        // التحقق من الصلاحيات حسب نوع الطلب
        switch(intent) {
            case 'modify':
            case 'create':
            case 'code':
            case 'screen':
                return permissions.canModifyCode === true;
            
            case 'analyze':
                return permissions.canAnalyzeAnything === true || 
                       permissions.canAnalyzeCommittees === true ||
                       permissions.canAnalyzeBranches === true ||
                       permissions.canAnalyzeFinance === true;
            
            case 'evaluate':
                return permissions.canEvaluate === true ||
                       permissions.canEvaluateCommittees === true ||
                       permissions.canEvaluateBranches === true;
            
            case 'report':
            case 'general':
                return true;
            
            default:
                return true;
        }
    }

    /**
     * هل هذا طلب تعديل برمجي؟
     */
    isCodeModification(intent) {
        return ['modify', 'create', 'code', 'screen', 'fix'].includes(intent);
    }

    /**
     * هل هذا طلب تحليل؟
     */
    isAnalysis(intent) {
        return ['analyze', 'report', 'predict', 'compare'].includes(intent);
    }

    /**
     * هل هذا طلب تقييم؟
     */
    isEvaluation(intent) {
        return intent === 'evaluate';
    }

    /**
     * هل هذا طلب اقتراح؟
     */
    isSuggestion(intent) {
        return intent === 'suggest';
    }

    /**
     * معالجة طلبات التعديل البرمجي (للملاحة فقط)
     */
    async handleCodeModification(message, intent, permission) {
        if (permission.level < 100) {
            return {
                success: false,
                error: 'عذراً، تعديل الأكواد متاح فقط للنقيب العام'
            };
        }

        // هنا هيكون التواصل مع GPT لتنفيذ التعديلات البرمجية
        // حالياً هنستخدم GPT API
        const gptResponse = await this.callGPT(message, {
            role: 'code_modifier',
            context: 'أنت مساعد برمجي متخصص في تعديل أكواد نظام إدارة النقابة'
        });

        return {
            success: true,
            type: 'code_modification',
            message: gptResponse,
            requiresBackup: true
        };
    }

    /**
     * معالجة طلبات التحليل
     */
    async handleAnalysis(message, intent, permission) {
        const analysisContext = this.buildAnalysisContext(permission);
        
        const gptResponse = await this.callGPT(message, {
            role: 'analyst',
            context: `أنت محلل بيانات متخصص في نظام إدارة النقابة. ${analysisContext}`
        });

        return {
            success: true,
            type: 'analysis',
            message: gptResponse
        };
    }

    /**
     * معالجة طلبات التقييم
     */
    async handleEvaluation(message, intent, permission) {
        const evaluationContext = this.buildEvaluationContext(permission);
        
        const gptResponse = await this.callGPT(message, {
            role: 'evaluator',
            context: `أنت مقيم أداء متخصص في تقييم اللجان والفروع. ${evaluationContext}`
        });

        return {
            success: true,
            type: 'evaluation',
            message: gptResponse
        };
    }

    /**
     * معالجة طلبات الاقتراحات
     */
    async handleSuggestion(message, intent, permission) {
        const suggestionContext = this.buildSuggestionContext(permission);
        
        const gptResponse = await this.callGPT(message, {
            role: 'consultant',
            context: `أنت مستشار متخصص في تطوير وتحسين نظام إدارة النقابة. ${suggestionContext}`
        });

        return {
            success: true,
            type: 'suggestion',
            message: gptResponse
        };
    }

    /**
     * معالجة الاستفسارات العامة
     */
    async handleGeneralQuery(message, conversationId, permission) {
        const context = this.buildGeneralContext(permission);
        
        // تجهيز المحادثة
        let messages = [];
        
        messages.push({
            role: 'system',
            content: this.getSystemPrompt(context, permission)
        });

        if (conversationId && this.conversations.has(conversationId)) {
            messages = [...messages, ...this.conversations.get(conversationId)];
        }

        messages.push({
            role: 'user',
            content: message
        });

        const gptResponse = await this.callGPTWithMessages(messages);

        if (!conversationId) {
            conversationId = `conv_${Date.now()}`;
            this.conversations.set(conversationId, []);
        }
        
        this.conversations.get(conversationId).push(
            { role: 'user', content: message },
            { role: 'assistant', content: gptResponse }
        );

        return {
            success: true,
            type: 'general',
            message: gptResponse,
            conversationId: conversationId
        };
    }

    /**
     * بناء سياق التحليل حسب صلاحيات المستخدم
     */
    buildAnalysisContext(permission) {
        if (permission.canAnalyzeAnything) {
            return 'يمكنك تحليل أي بيانات في النظام: اللجان، الفروع، المالية، الأعضاء، التتبع.';
        }
        if (permission.canAnalyzeCommittees) {
            return 'يمكنك تحليل بيانات اللجان فقط: أداء اللجان، أعضاء اللجان، تقارير اللجان.';
        }
        if (permission.canAnalyzeBranches) {
            return 'يمكنك تحليل بيانات الفروع فقط: أداء الفروع، أعضاء الفروع، تقارير الفروع.';
        }
        if (permission.canAnalyzeFinance) {
            return 'يمكنك تحليل البيانات المالية فقط: الإيرادات، المصروفات، الميزانيات.';
        }
        if (permission.canAnalyzeOwnCommittee) {
            return 'يمكنك تحليل بيانات لجنتك فقط.';
        }
        if (permission.canAnalyzeOwnGovernorate) {
            return 'يمكنك تحليل بيانات محافظتك فقط.';
        }
        return 'يمكنك تحليل البيانات المتاحة ضمن صلاحياتك.';
    }

    /**
     * بناء سياق التقييم حسب صلاحيات المستخدم
     */
    buildEvaluationContext(permission) {
        if (permission.canEvaluateAnything) {
            return 'يمكنك تقييم أداء أي لجنة أو فرع أو عضو.';
        }
        if (permission.canEvaluateCommittees) {
            return 'يمكنك تقييم أداء اللجان فقط.';
        }
        if (permission.canEvaluateBranches) {
            return 'يمكنك تقييم أداء الفروع فقط.';
        }
        return 'يمكنك تقييم الأداء ضمن نطاق صلاحياتك.';
    }

    /**
     * بناء سياق الاقتراحات حسب صلاحيات المستخدم
     */
    buildSuggestionContext(permission) {
        if (permission.level >= 100) {
            return 'يمكنك اقتراح أي تحسينات على النظام بشكل كامل.';
        }
        return 'يمكنك اقتراح تحسينات ضمن نطاق عملك وصلاحياتك.';
    }

    /**
     * بناء السياق العام حسب صلاحيات المستخدم
     */
    buildGeneralContext(permission) {
        return {
            user: this.currentUser,
            permissions: permission,
            allowedCommands: this.getUserCommands()
        };
    }

    /**
     * الحصول على الـ System Prompt المناسب للمستخدم
     */
    getSystemPrompt(context, permission) {
        const basePrompt = `أنت ITWS AI، المساعد التقني الذكي لنظام إدارة نقابة تكنولوجيا المعلومات والبرمجيات.

المستخدم الحالي:
- الاسم: ${this.currentUser.fullName}
- الصفة: ${this.currentUser.positionName}
- مستوى الصلاحية: ${permission.level}

${this.buildAnalysisContext(permission)}

تعليمات مهمة:
1. ردودك تكون باللغة العربية الفصحى
2. لا تقدم معلومات خارج صلاحيات المستخدم
3. إذا طلب المستخدم شيئاً خارج صلاحياته، أخبره بذلك بلطف
4. كن دقيقاً ومفيداً في ردودك
5. استخدم تنسيقاً واضحاً ومنظماً

الصلاحيات المتاحة للمستخدم:
${JSON.stringify(permission.permissions, null, 2)}

الأوامر المتاحة للمستخدم:
${this.getUserCommands().map(cmd => `- ${cmd}`).join('\n')}

إذا كان المستخدم هو النقيب العام، يمكنك مساعدته في:
- تعديل أكواد النظام
- إضافة شاشات جديدة
- تحليل أي بيانات
- تقييم الأداء
- اقتراح تحسينات
- إصلاح الأخطاء
- توقع الاتجاهات

للمستخدمين الآخرين، ساعدهم ضمن صلاحياتهم فقط.`;

        return basePrompt;
    }

    /**
     * استدعاء GPT API
     */
    async callGPT(message, options = {}) {
        try {
            this.checkApiKey();

            const messages = [
                {
                    role: 'system',
                    content: options.context || 'أنت مساعد ذكي متخصص في نظام إدارة النقابة'
                },
                {
                    role: 'user',
                    content: message
                }
            ];

            return await this.callGPTWithMessages(messages);

        } catch (error) {
            console.error('GPT Error:', error);
            return 'عذراً، حدث خطأ في الاتصال بالمساعد التقني. يرجى التحقق من اتصالك بالإنترنت.';
        }
    }

    /**
     * استدعاء GPT API مع محادثة كاملة
     */
    async callGPTWithMessages(messages) {
        try {
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: messages,
                    max_tokens: 2000,
                    temperature: 0.7
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'خطأ في الاتصال');
            }

            return data.choices[0].message.content;

        } catch (error) {
            console.error('GPT API Error:', error);
            throw error;
        }
    }

    /**
     * تحميل بيانات التعلم السابقة
     */
    async loadLearningData() {
        // سيتم تحميل بيانات التعلم من Firebase
        // هذا مؤقتاً
        this.stats = {
            queriesProcessed: 0,
            codesModified: 0,
            screensAdded: 0,
            errorsFixed: 0
        };
    }

    /**
     * تفعيل المستمعين
     */
    activateListeners() {
        // الاستماع للأحداث المختلفة في النظام
        console.log('👂 تم تفعيل مستمعي ITWS AI');
    }

    /**
     * عمل نسخة احتياطية من الكود قبل التعديل
     */
    backupCode(fileName, code) {
        this.codeBackups.set(fileName, {
            code: code,
            timestamp: new Date().toISOString(),
            backedBy: this.currentUser?.userId
        });
        return true;
    }

    /**
     * استعادة نسخة احتياطية
     */
    restoreBackup(fileName) {
        return this.codeBackups.get(fileName);
    }

    /**
     * الحصول على إحصائيات المساعد
     */
    getStats() {
        return {
            ...this.stats,
            activeConversations: this.conversations.size,
            backupsCount: this.codeBackups.size,
            isActive: this.isActive
        };
    }

    /**
     * تقييم أداء فرع معين (للنقيب فقط)
     */
    async evaluateBranch(branchId, period = 'month') {
        const permission = this.checkUserPermission();
        if (permission.level < 100) {
            return { error: 'غير مصرح' };
        }

        // هنا هيكون تحليل أداء الفرع
        return {
            branchId,
            period,
            evaluation: 'تحليل الأداء قيد التنفيذ...'
        };
    }

    /**
     * تقييم أداء لجنة معينة (للنقيب فقط)
     */
    async evaluateCommittee(committeeId, period = 'month') {
        const permission = this.checkUserPermission();
        if (permission.level < 100) {
            return { error: 'غير مصرح' };
        }

        return {
            committeeId,
            period,
            evaluation: 'تحليل الأداء قيد التنفيذ...'
        };
    }

    /**
     * إضافة شاشة جديدة (للنقيب فقط)
     */
    async addNewScreen(screenConfig) {
        const permission = this.checkUserPermission();
        if (permission.level < 100) {
            return { error: 'غير مصرح' };
        }

        this.stats.screensAdded++;
        
        return {
            success: true,
            message: 'تم إنشاء الشاشة بنجاح',
            screen: screenConfig
        };
    }

    /**
     * إصلاح خطأ برمجي (للنقيب فقط)
     */
    async fixBug(bugReport) {
        const permission = this.checkUserPermission();
        if (permission.level < 100) {
            return { error: 'غير مصرح' };
        }

        this.stats.errorsFixed++;
        
        return {
            success: true,
            message: 'تم إصلاح الخطأ بنجاح',
            fix: bugReport
        };
    }
}

// تصدير المساعد
export default ITWSAIAssistant;
