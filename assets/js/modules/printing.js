// assets/js/modules/printing.js
// نظام الطباعة المتقدم - يدعم طباعة التقارير والمستندات بتصميم احترافي

class PrintingSystem {
    constructor() {
        this.printQueue = [];
        this.printHistory = [];
        this.defaultSettings = {
            paperSize: 'A4',
            orientation: 'portrait',
            margins: '20mm',
            fontSize: 12,
            fontFamily: 'Cairo',
            header: true,
            footer: true,
            pageNumbers: true,
            qrCode: false,
            barcode: false,
            logo: true,
            watermark: false
        };
        this.settings = { ...this.defaultSettings };
        this.init();
    }

    // ===== 1. تهيئة النظام =====
    init() {
        this.loadSettings();
        this.injectPrintStyles();
    }

    // ===== 2. تحميل الإعدادات المحفوظة =====
    loadSettings() {
        try {
            const saved = localStorage.getItem('print_settings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('Error loading print settings:', error);
        }
    }

    // ===== 3. حفظ الإعدادات =====
    saveSettings() {
        try {
            localStorage.setItem('print_settings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Error saving print settings:', error);
        }
    }

    // ===== 4. حقن تنسيقات الطباعة =====
    injectPrintStyles() {
        const style = document.createElement('style');
        style.id = 'print-styles';
        style.textContent = `
            @media print {
                @page {
                    size: ${this.settings.paperSize} ${this.settings.orientation};
                    margin: ${this.settings.margins};
                }

                body * {
                    visibility: hidden;
                }

                .print-area,
                .print-area * {
                    visibility: visible;
                }

                .print-area {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    font-family: ${this.settings.fontFamily}, sans-serif;
                    font-size: ${this.settings.fontSize}pt;
                    line-height: 1.6;
                    color: #000;
                    background: #fff;
                }

                .print-header {
                    text-align: center;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #000;
                }

                .print-footer {
                    text-align: center;
                    margin-top: 20px;
                    padding-top: 10px;
                    border-top: 2px solid #000;
                    font-size: 10pt;
                    color: #666;
                }

                .print-logo {
                    max-width: 100px;
                    margin-bottom: 10px;
                }

                .print-title {
                    font-size: 18pt;
                    font-weight: bold;
                    margin: 10px 0;
                }

                .print-subtitle {
                    font-size: 14pt;
                    color: #333;
                    margin: 5px 0;
                }

                .print-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 15px 0;
                }

                .print-table th {
                    background: #f0f0f0;
                    font-weight: bold;
                    padding: 8px;
                    border: 1px solid #ddd;
                }

                .print-table td {
                    padding: 6px;
                    border: 1px solid #ddd;
                }

                .print-signature {
                    margin-top: 30px;
                    display: flex;
                    justify-content: space-between;
                }

                .print-signature-line {
                    width: 200px;
                    border-top: 1px solid #000;
                    margin-top: 30px;
                    text-align: center;
                    padding-top: 5px;
                }

                .print-watermark {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) rotate(-45deg);
                    font-size: 60pt;
                    opacity: 0.1;
                    color: #999;
                    white-space: nowrap;
                    pointer-events: none;
                }

                .print-qrcode {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 100px;
                    height: 100px;
                }

                .print-barcode {
                    text-align: center;
                    margin: 10px 0;
                    font-family: monospace;
                }

                .page-number:after {
                    content: counter(page);
                }
            }
        `;
        document.head.appendChild(style);
    }

    // ===== 5. طباعة تقرير =====
    printReport(reportData, options = {}) {
        const printOptions = { ...this.settings, ...options };
        
        // إنشاء محتوى الطباعة
        const content = this.generateReportHTML(reportData, printOptions);
        
        // إضافة إلى قائمة الانتظار
        const printJob = {
            id: this.generateId(),
            type: 'report',
            data: reportData,
            options: printOptions,
            content: content,
            createdAt: new Date().toISOString()
        };

        this.printQueue.push(printJob);
        this.executePrint(printJob);
        
        return printJob.id;
    }

    // ===== 6. طباعة مستند =====
    printDocument(documentData, options = {}) {
        const printOptions = { ...this.settings, ...options };
        
        // إنشاء محتوى الطباعة
        const content = this.generateDocumentHTML(documentData, printOptions);
        
        const printJob = {
            id: this.generateId(),
            type: 'document',
            data: documentData,
            options: printOptions,
            content: content,
            createdAt: new Date().toISOString()
        };

        this.printQueue.push(printJob);
        this.executePrint(printJob);
        
        return printJob.id;
    }

    // ===== 7. طباعة فاتورة =====
    printInvoice(invoiceData, options = {}) {
        const printOptions = { ...this.settings, ...options };
        
        // إنشاء محتوى الطباعة
        const content = this.generateInvoiceHTML(invoiceData, printOptions);
        
        const printJob = {
            id: this.generateId(),
            type: 'invoice',
            data: invoiceData,
            options: printOptions,
            content: content,
            createdAt: new Date().toISOString()
        };

        this.printQueue.push(printJob);
        this.executePrint(printJob);
        
        return printJob.id;
    }

    // ===== 8. طباعة بطاقة عضوية =====
    printMemberCard(memberData, options = {}) {
        const printOptions = { ...this.settings, ...options };
        
        // إنشاء محتوى الطباعة
        const content = this.generateCardHTML(memberData, printOptions);
        
        const printJob = {
            id: this.generateId(),
            type: 'card',
            data: memberData,
            options: printOptions,
            content: content,
            createdAt: new Date().toISOString()
        };

        this.printQueue.push(printJob);
        this.executePrint(printJob);
        
        return printJob.id;
    }

    // ===== 9. تنفيذ الطباعة =====
    executePrint(printJob) {
        // إنشاء iframe للطباعة
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentWindow.document;
        
        // كتابة المحتوى
        iframeDoc.open();
        iframeDoc.write(`
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>طباعة - ${printJob.type}</title>
                <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                ${this.getPrintStyles(printJob.options)}
            </head>
            <body>
                <div class="print-area">
                    ${printJob.content}
                </div>
            </body>
            </html>
        `);
        iframeDoc.close();

        // انتظار تحميل المحتوى ثم الطباعة
        setTimeout(() => {
            try {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
                
                // إضافة إلى سجل الطباعة
                this.printHistory.push({
                    ...printJob,
                    printedAt: new Date().toISOString(),
                    success: true
                });
            } catch (error) {
                console.error('Print error:', error);
                
                this.printHistory.push({
                    ...printJob,
                    printedAt: new Date().toISOString(),
                    success: false,
                    error: error.message
                });
            }

            // إزالة iframe بعد الطباعة
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);
        }, 500);
    }

    // ===== 10. توليد HTML للتقرير =====
    generateReportHTML(data, options) {
        return `
            <div class="print-header">
                ${options.logo ? '<img src="/assets/images/logo.png" class="print-logo" alt="شعار النقابة">' : ''}
                <h1 class="print-title">${data.title || 'تقرير'}</h1>
                <div class="print-subtitle">
                    تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}
                </div>
            </div>

            <div class="print-content">
                ${this.generateReportContent(data, options)}
            </div>

            ${options.qrCode ? this.generateQRCode(data.id) : ''}
            ${options.barcode ? this.generateBarcode(data.id) : ''}

            <div class="print-footer">
                ${options.pageNumbers ? '<span class="page-number">صفحة <span class="page-number"></span></span>' : ''}
                <div>نقابة تكنولوجيا المعلومات والبرمجيات - ITWS Union</div>
            </div>

            ${options.watermark ? '<div class="print-watermark">ITWS Union</div>' : ''}
        `;
    }

    // ===== 11. توليد HTML للمستند =====
    generateDocumentHTML(data, options) {
        return `
            <div class="print-header">
                ${options.logo ? '<img src="/assets/images/logo.png" class="print-logo" alt="شعار النقابة">' : ''}
                <h1 class="print-title">${data.title}</h1>
                <div class="print-subtitle">
                    رقم المستند: ${data.documentNumber || 'غير محدد'}
                </div>
            </div>

            <div class="print-content">
                ${this.generateDocumentContent(data, options)}
            </div>

            <div class="print-signature">
                <div class="print-signature-line">
                    <div>توقيع</div>
                </div>
                <div class="print-signature-line">
                    <div>الختم</div>
                </div>
            </div>

            ${options.qrCode ? this.generateQRCode(data.documentNumber) : ''}
            ${options.barcode ? this.generateBarcode(data.documentNumber) : ''}

            <div class="print-footer">
                ${options.pageNumbers ? '<span class="page-number">صفحة <span class="page-number"></span></span>' : ''}
                <div>نقابة تكنولوجيا المعلومات والبرمجيات - ITWS Union</div>
            </div>

            ${options.watermark ? '<div class="print-watermark">ITWS Union</div>' : ''}
        `;
    }

    // ===== 12. توليد HTML للفاتورة =====
    generateInvoiceHTML(data, options) {
        return `
            <div class="print-header">
                ${options.logo ? '<img src="/assets/images/logo.png" class="print-logo" alt="شعار النقابة">' : ''}
                <h1 class="print-title">فاتورة</h1>
                <div class="print-subtitle">
                    رقم الفاتورة: ${data.invoiceNumber}<br>
                    التاريخ: ${new Date(data.date).toLocaleDateString('ar-EG')}
                </div>
            </div>

            <div class="print-content">
                <div style="margin-bottom: 20px;">
                    <strong>العميل:</strong> ${data.customerName}<br>
                    <strong>الجهة:</strong> ${data.customerEntity}
                </div>

                ${this.generateInvoiceItems(data.items)}

                <div style="margin-top: 20px; text-align: left;">
                    <div><strong>المجموع:</strong> ${data.subtotal} ج.م</div>
                    <div><strong>الضريبة:</strong> ${data.tax} ج.م</div>
                    <div><strong>الإجمالي:</strong> ${data.total} ج.م</div>
                </div>
            </div>

            ${options.qrCode ? this.generateQRCode(data.invoiceNumber) : ''}
            ${options.barcode ? this.generateBarcode(data.invoiceNumber) : ''}

            <div class="print-signature">
                <div class="print-signature-line">
                    <div>المستلم</div>
                </div>
                <div class="print-signature-line">
                    <div>المحاسب</div>
                </div>
            </div>

            <div class="print-footer">
                ${options.pageNumbers ? '<span class="page-number">صفحة <span class="page-number"></span></span>' : ''}
                <div>نقابة تكنولوجيا المعلومات والبرمجيات - ITWS Union</div>
            </div>

            ${options.watermark ? '<div class="print-watermark">ITWS Union</div>' : ''}
        `;
    }

    // ===== 13. توليد HTML للبطاقة =====
    generateCardHTML(data, options) {
        return `
            <div style="width: ${options.cardWidth || '85mm'}; height: ${options.cardHeight || '54mm'}; border: 1px solid #ccc; padding: 10px; margin: 0 auto; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 10px;">
                    ${options.logo ? '<img src="/assets/images/logo.png" style="width: 50px; height: 50px;">' : ''}
                    <h3 style="margin: 5px 0;">نقابة تكنولوجيا المعلومات</h3>
                </div>

                <div style="display: flex; gap: 10px;">
                    <div style="width: 70px; height: 70px; background: #f0f0f0; border-radius: 5px; overflow: hidden;">
                        ${data.photo ? `<img src="${data.photo}" style="width: 100%; height: 100%; object-fit: cover;">` : ''}
                    </div>
                    <div style="flex: 1;">
                        <div><strong>الاسم:</strong> ${data.name}</div>
                        <div><strong>الرقم:</strong> ${data.memberNumber}</div>
                        <div><strong>الدرجة:</strong> ${data.rank}</div>
                        <div><strong>الجهة:</strong> ${data.entity}</div>
                    </div>
                </div>

                ${options.barcode ? this.generateBarcode(data.memberNumber) : ''}

                <div style="text-align: center; margin-top: 10px; font-size: 8pt;">
                    ${data.validUntil ? `صالح حتى: ${new Date(data.validUntil).toLocaleDateString('ar-EG')}` : ''}
                </div>
            </div>
        `;
    }

    // ===== 14. توليد محتوى التقرير =====
    generateReportContent(data, options) {
        if (data.type === 'table') {
            return this.generateTable(data.columns, data.rows);
        } else if (data.type === 'chart') {
            return this.generateChart(data);
        } else {
            return data.content || '';
        }
    }

    // ===== 15. توليد جدول =====
    generateTable(columns, rows) {
        return `
            <table class="print-table">
                <thead>
                    <tr>
                        ${columns.map(col => `<th>${col}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(row => `
                        <tr>
                            ${row.map(cell => `<td>${cell}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    // ===== 16. توليد محتوى المستند =====
    generateDocumentContent(data, options) {
        return data.content || '';
    }

    // ===== 17. توليد بنود الفاتورة =====
    generateInvoiceItems(items) {
        return `
            <table class="print-table">
                <thead>
                    <tr>
                        <th>البيان</th>
                        <th>الكمية</th>
                        <th>السعر</th>
                        <th>الإجمالي</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                        <tr>
                            <td>${item.description}</td>
                            <td>${item.quantity}</td>
                            <td>${item.price} ج.م</td>
                            <td>${item.total} ج.م</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    // ===== 18. توليد QR Code =====
    generateQRCode(data) {
        // سيتم استبداله بمكتبة QR Code حقيقية
        return `
            <div class="print-qrcode" style="text-align: center;">
                <div style="width: 100px; height: 100px; background: #f0f0f0; display: inline-block;">
                    QR: ${data}
                </div>
            </div>
        `;
    }

    // ===== 19. توليد Barcode =====
    generateBarcode(data) {
        // سيتم استبداله بمكتبة Barcode حقيقية
        return `
            <div class="print-barcode">
                <div style="font-family: monospace;">|||||||||| ${data} ||||||||||</div>
            </div>
        `;
    }

    // ===== 20. توليد رسم بياني =====
    generateChart(data) {
        // سيتم استبداله بمكتبة Charts حقيقية
        return '<div>الرسم البياني</div>';
    }

    // ===== 21. الحصول على تنسيقات الطباعة =====
    getPrintStyles(options) {
        return `
            <style>
                @page {
                    size: ${options.paperSize} ${options.orientation};
                    margin: ${options.margins};
                }

                body {
                    font-family: ${options.fontFamily}, sans-serif;
                    font-size: ${options.fontSize}pt;
                    line-height: 1.6;
                    margin: 0;
                    padding: 0;
                }

                .print-area {
                    padding: 20px;
                }

                @media print {
                    .no-print {
                        display: none;
                    }
                }
            </style>
        `;
    }

    // ===== 22. تحديث الإعدادات =====
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveSettings();
        this.injectPrintStyles();
    }

    // ===== 23. إعادة تعيين الإعدادات =====
    resetSettings() {
        this.settings = { ...this.defaultSettings };
        this.saveSettings();
        this.injectPrintStyles();
    }

    // ===== 24. الحصول على سجل الطباعة =====
    getPrintHistory(limit = 10) {
        return this.printHistory.slice(-limit);
    }

    // ===== 25. إلغاء مهمة طباعة =====
    cancelPrintJob(jobId) {
        const index = this.printQueue.findIndex(job => job.id === jobId);
        if (index !== -1) {
            this.printQueue.splice(index, 1);
            return true;
        }
        return false;
    }

    // ===== 26. معاينة قبل الطباعة =====
    previewPrint(jobId) {
        const job = this.printQueue.find(j => j.id === jobId);
        if (!job) return null;

        const previewWindow = window.open('', '_blank');
        previewWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>معاينة الطباعة</title>
                <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                ${this.getPrintStyles(job.options)}
            </head>
            <body>
                <div class="print-area">
                    ${job.content}
                </div>
                <div style="text-align: center; margin-top: 20px;" class="no-print">
                    <button onclick="window.print()">طباعة</button>
                    <button onclick="window.close()">إغلاق</button>
                </div>
            </body>
            </html>
        `);
        previewWindow.document.close();

        return previewWindow;
    }

    // ===== 27. توليد معرف فريد =====
    generateId() {
        return 'print_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // ===== 28. تصدير بصيغة PDF =====
    async exportToPDF(jobId) {
        // سيتم تنفيذها مع مكتبة PDF
        console.log('Exporting to PDF:', jobId);
    }

    // ===== 29. تصدير بصيغة Excel =====
    async exportToExcel(data) {
        // سيتم تنفيذها مع مكتبة Excel
        console.log('Exporting to Excel:', data);
    }

    // ===== 30. الحصول على إحصائيات =====
    getStats() {
        return {
            queueLength: this.printQueue.length,
            totalPrinted: this.printHistory.length,
            successfulPrints: this.printHistory.filter(j => j.success).length,
            failedPrints: this.printHistory.filter(j => !j.success).length,
            settings: this.settings
        };
    }
}

export default PrintingSystem;
