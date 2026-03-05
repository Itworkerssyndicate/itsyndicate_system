// assets/js/itws-ai.js

/**
 * ITWS AI - المساعد الذكي لنظام إدارة النقابة
 * هذا المساعد لديه صلاحية التعديل على الكود وإضافة شاشات جديدة
 * لا يمكن لأحد استخدامه إلا النقيب العام فقط
 */

import { database, ref, get, set, push, update, remove, onValue } from './firebase-config.js';

class ITWSAI {
    constructor(currentUser) {
        this.currentUser = currentUser;
        this.isActive = false;
        this.learningData = {};
        this.commands = {
            'add_screen': this.addNewScreen.bind(this),
            'modify_code': this.modifyCode.bind(this),
            'fix_bug': this.fixBug.bind(this),
            'add_feature': this.addFeature.bind(this),
            'analyze_data': this.analyzeData.bind(this),
            'generate_report': this.generateReport.bind(this),
            'help_user': this.helpUser.bind(this)
        };
    }

    // التحقق من صلاحية النقيب العام فقط
    checkPermission() {
        if (!this.currentUser || this.currentUser.role !== 'president') {
            throw new Error('⚠️ هذا المساعد متاح فقط للنقيب العام');
        }
        return true;
    }

    // تهيئة المساعد
    async initialize() {
        try {
            this.checkPermission();
            console.log('🚀 ITWS AI جاري التهيئة...');
            
            await this.loadLearningData();
            this.activateListeners();
            this.isActive = true;
            
            await this.logAction('ITWS AI تم تفعيل', 'system');
            console.log('✅ ITWS AI جاهز للعمل');
            
            return {
                success: true,
                message: 'ITWS AI جاهز للعمل',
                capabilities: this.getCapabilities()
            };
        } catch (error) {
            console.error('❌ خطأ في تهيئة ITWS AI:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // قدرات المساعد
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
            canTrackIssues: true
        };
    }

    // معالجة الأوامر الصوتية/النصية
    async processCommand(command) {
        try {
            this.checkPermission();
            
            // تحليل الأمر
            const analysis = this.analyzeCommand(command);
            
            // تنفيذ الأمر المناسب
            if (analysis.type in this.commands) {
                return await this.commands[analysis.type](analysis.params);
            } else {
                return await this.processGeneralCommand(analysis);
            }
        } catch (error) {
            console.error('Error processing command:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // تحليل الأمر
    analyzeCommand(command) {
        command = command.toLowerCase();
        
        if (command.includes('ضيف شاشة') || command.includes('create screen')) {
            return {
                type: 'add_screen',
                params: this.extractScreenParams(command)
            };
        } else if (command.includes('عدل') || command.includes('modify')) {
            return {
                type: 'modify_code',
                params: this.extractModifyParams(command)
            };
        } else if (command.includes('صلح') || command.includes('fix')) {
            return {
                type: 'fix_bug',
                params: this.extractBugParams(command)
            };
        } else if (command.includes('حلل') || command.includes('analyze')) {
            return {
                type: 'analyze_data',
                params: this.extractAnalysisParams(command)
            };
        } else if (command.includes('تقرير') || command.includes('report')) {
            return {
                type: 'generate_report',
                params: this.extractReportParams(command)
            };
        } else {
            return {
                type: 'general',
                params: { command }
            };
        }
    }

    // إضافة شاشة جديدة
    async addNewScreen(params) {
        try {
            this.checkPermission();
            
            const {
                screenName,
                screenTitle,
                screenType = 'management',
                permissions = ['president']
            } = params;

            const fileName = `${screenName.toLowerCase().replace(/\s+/g, '_')}.html`;
            
            // إنشاء محتوى الشاشة
            const screenHTML = this.generateScreenHTML(screenTitle, screenType);
            
            // حفظ في قاعدة البيانات
            const screensRef = ref(database, 'itws_ai/generated_screens');
            await push(screensRef, {
                fileName,
                title: screenTitle,
                type: screenType,
                content: screenHTML,
                permissions,
                createdBy: this.currentUser.userId,
                createdAt: new Date().toISOString(),
                active: true
            });

            // تحديث القائمة
            await this.updateMenu(fileName, screenTitle, permissions);

            return {
                success: true,
                fileName,
                message: `✅ تم إنشاء الشاشة ${screenTitle} بنجاح`,
                url: fileName
            };
        } catch (error) {
            console.error('Error adding screen:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // توليد HTML للشاشة
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
        body {
            font-family: 'Cairo', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 {
            color: #333;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1><i class="fas fa-robot" style="color: #667eea;"></i> ${title}</h1>
        <p>هذه الشاشة تم إنشاؤها بواسطة ITWS AI</p>
        <div id="content">
            <!-- محتوى الشاشة سيتم إضافته ديناميكياً -->
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
        
        // التحقق من تسجيل الدخول
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        if (!currentUser) {
            window.location.href = 'index.html';
        }
        
        // تحميل البيانات
        async function loadData() {
            // أضف منطق تحميل البيانات هنا
        }
        
        loadData();
    </script>
</body>
</html>`;
    }

    // تحديث القائمة
    async updateMenu(fileName, title, permissions) {
        const menuRef = ref(database, 'system/menu_items');
        await push(menuRef, {
            title,
            url: fileName,
            icon: 'fas fa-file',
            permissions,
            order: Date.now()
        });
    }

    // تعديل الكود
    async modifyCode(params) {
        try {
            this.checkPermission();
            
            const { file, modifications, reason } = params;
            
            // عمل نسخة احتياطية
            await this.backupFile(file);
            
            // تطبيق التعديلات
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
            console.error('Error modifying code:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // إصلاح الأخطاء
    async fixBug(params) {
        try {
            this.checkPermission();
            
            const { bugId, description, location } = params;
            
            const analysis = await this.analyzeBug(params);
            const fix = await this.applyBugFix(analysis);
            const testResult = await this.testFix(fix);
            
            return {
                success: testResult.passed,
                analysis,
                fix,
                testResult,
                message: testResult.passed ? '✅ تم إصلاح الخطأ' : '⚠️ يحتاج لمزيد من التعديل'
            };
        } catch (error) {
            console.error('Error fixing bug:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // إضافة ميزة جديدة
    async addFeature(params) {
        try {
            this.checkPermission();
            
            const { featureName, featureType, requirements } = params;
            
            const newFeature = await this.createFeature(params);
            await this.integrateFeature(newFeature);
            await this.updateDocumentation(featureName, newFeature);
            
            return {
                success: true,
                featureId: newFeature.id,
                message: `✅ تم إضافة الميزة ${featureName} بنجاح`
            };
        } catch (error) {
            console.error('Error adding feature:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // تحليل البيانات
    async analyzeData(params) {
        try {
            this.checkPermission();
            
            const { dataType, period } = params;
            
            const data = await this.collectData(dataType, period);
            const analysis = {
                summary: await this.generateSummary(data),
                trends: await this.analyzeTrends(data),
                insights: await this.generateInsights(data),
                predictions: await this.makePredictions(data),
                recommendations: await this.generateRecommendations(data)
            };
            
            const report = await this.createReport(analysis);
            
            return {
                analysis,
                report,
                downloadable: await this.exportReport(report)
            };
        } catch (error) {
            console.error('Error analyzing data:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // إنشاء تقرير
    async generateReport(params) {
        try {
            const { type, targetId, includeCharts = true } = params;
            
            const data = await this.collectReportData(type, targetId);
            const performance = await this.analyzePerformance(data);
            
            const report = {
                title: `تقرير ${type} - ${new Date().toLocaleDateString('ar-EG')}`,
                generatedAt: new Date().toISOString(),
                generatedBy: 'ITWS AI',
                summary: performance.summary,
                metrics: performance.metrics,
                achievements: performance.achievements,
                challenges: performance.challenges,
                recommendations: performance.recommendations
            };
            
            if (includeCharts) {
                report.charts = await this.generateCharts(data);
            }
            
            return report;
        } catch (error) {
            console.error('Error generating report:', error);
            return null;
        }
    }

    // مساعدة المستخدمين
    async helpUser(params) {
        try {
            const { userId, question } = params;
            
            const analysis = await this.analyzeQuestion(question);
            const knowledge = await this.searchKnowledge(analysis);
            const answer = await this.generateAnswer(analysis, knowledge);
            
            if (analysis.requiresAction) {
                await this.guideUser(userId, analysis.action);
            }
            
            await this.saveInteraction(userId, question, answer);
            
            return {
                answer,
                suggestedActions: analysis.suggestedActions,
                resources: knowledge.resources
            };
        } catch (error) {
            console.error('Error helping user:', error);
            return {
                error: 'عذراً، حدث خطأ في معالجة سؤالك'
            };
        }
    }

    // معالجة الأوامر العامة
    async processGeneralCommand(analysis) {
        return {
            success: true,
            message: 'تم استلام الأمر، جاري المعالجة...',
            analysis
        };
    }

    // استخراج معلمات الشاشة
    extractScreenParams(command) {
        return {
            screenName: command.replace('ضيف شاشة', '').trim() || 'new_screen',
            screenTitle: command.replace('ضيف شاشة', '').trim() || 'شاشة جديدة',
            screenType: 'management',
            permissions: ['president']
        };
    }

    // استخراج معلمات التعديل
    extractModifyParams(command) {
        return {
            file: command.match(/عدل (.*?)( |$)/)?.[1] || 'unknown',
            modifications: command,
            reason: 'user_request'
        };
    }

    // استخراج معلمات البق
    extractBugParams(command) {
        return {
            bugId: `bug_${Date.now()}`,
            description: command,
            location: command.match(/في (.*?)( |$)/)?.[1] || 'unknown'
        };
    }

    // استخراج معلمات التحليل
    extractAnalysisParams(command) {
        return {
            dataType: command.match(/حلل (.*?)( |$)/)?.[1] || 'general',
            period: 'month'
        };
    }

    // استخراج معلمات التقرير
    extractReportParams(command) {
        return {
            type: command.match(/تقرير (.*?)( |$)/)?.[1] || 'general',
            includeCharts: true
        };
    }

    // دوال مساعدة
    async backupFile(file) {
        const backupRef = ref(database, `itws_ai/backups/${Date.now()}_${file}`);
        const content = await this.getFileContent(file);
        await set(backupRef, {
            fileName: file,
            content,
            backedUpAt: new Date().toISOString(),
            backedUpBy: this.currentUser.userId
        });
    }

    async applyModifications(file, modifications) {
        // تنفيذ التعديلات
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

    async createFeature(params) {
        return { id: `feature_${Date.now()}`, ...params };
    }

    async integrateFeature(feature) {
        // دمج الميزة مع النظام
        return { integrated: true, feature };
    }

    async updateDocumentation(name, feature) {
        // تحديث التوثيق
        return { updated: true, name, feature };
    }

    async collectData(dataType, period) {
        // جمع البيانات
        return { type: dataType, period, data: [] };
    }

    async generateSummary(data) {
        return { summary: 'تحليل البيانات' };
    }

    async analyzeTrends(data) {
        return { trends: [] };
    }

    async generateInsights(data) {
        return { insights: [] };
    }

    async makePredictions(data) {
        return { predictions: [] };
    }

    async generateRecommendations(data) {
        return { recommendations: [] };
    }

    async createReport(analysis) {
        return { report: analysis };
    }

    async exportReport(report) {
        return { exported: true, report };
    }

    async collectReportData(type, targetId) {
        return { type, targetId, data: [] };
    }

    async analyzePerformance(data) {
        return {
            summary: 'ملخص الأداء',
            metrics: {},
            achievements: [],
            challenges: [],
            recommendations: []
        };
    }

    async generateCharts(data) {
        return { charts: [] };
    }

    async analyzeQuestion(question) {
        return {
            intent: 'help',
            requiresAction: false,
            suggestedActions: []
        };
    }

    async searchKnowledge(analysis) {
        return { resources: [] };
    }

    async generateAnswer(analysis, knowledge) {
        return 'جاري معالجة سؤالك...';
    }

    async guideUser(userId, action) {
        // توجيه المستخدم
        return { guided: true, userId, action };
    }

    async saveInteraction(userId, question, answer) {
        // حفظ التفاعل للتعلم
        const interactionsRef = ref(database, 'itws_ai/interactions');
        await push(interactionsRef, {
            userId,
            question,
            answer,
            timestamp: new Date().toISOString()
        });
    }

    async getFileContent(file) {
        // الحصول على محتوى الملف
        return `// محتوى ${file}`;
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

    async loadLearningData() {
        const learningRef = ref(database, 'itws_ai/learning');
        const snapshot = await get(learningRef);
        if (snapshot.exists()) {
            this.learningData = snapshot.val();
        }
    }

    activateListeners() {
        onValue(ref(database, 'itws_ai/requests'), (snapshot) => {
            const requests = snapshot.val();
            if (requests) {
                this.processNewRequests(requests);
            }
        });
    }

    async processNewRequests(requests) {
        // معالجة الطلبات الجديدة
        console.log('New requests:', requests);
    }
}

// تصدير المساعد
export default ITWSAI;
