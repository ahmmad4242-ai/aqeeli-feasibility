// AI Report Generation Functions
// هذا الملف يحتوي على وظائف توليد التقرير الشامل بالذكاء الاصطناعي

window.currentAIReport = null;

async function generateAIReport() {
    console.log('🤖 بدء توليد التقرير الشامل بالذكاء الاصطناعي...');
    
    try {
        // 1. استدعاء دالة حساب بيانات التصدير
        if (typeof window.computeExportDataTable === 'function') {
            window.computeExportDataTable();
        } else {
            console.warn('⚠️ دالة computeExportDataTable غير موجودة');
        }
        
        // 2. قراءة بيانات التصدير من sessionStorage
        const exportDataStr = sessionStorage.getItem('exportData');
        if (!exportDataStr) {
            alert('⚠️ لا توجد بيانات للتصدير. يرجى حساب دراسة الجدوى أولاً.');
            return;
        }
        
        const exportData = JSON.parse(exportDataStr);
        console.log('📊 بيانات التصدير:', Object.keys(exportData).length, 'حقل');
        
        // 3. فتح modal وإظهار loading
        openAIReportModal();
        const generateBtn = document.querySelector('[onclick="generateAIReport()"]');
        if (generateBtn) {
            generateBtn.disabled = true;
            generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>جاري التوليد...';
        }
        
        const reportContent = document.getElementById('aiReportContent');
        if (reportContent) {
            reportContent.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-spinner fa-spin text-4xl text-blue-300 mb-4"></i>
                    <p class="text-gray-600 text-lg">جاري إنشاء التقرير الشامل بالذكاء الاصطناعي...</p>
                    <p class="text-gray-500 text-sm mt-2">قد يستغرق هذا بضع ثوانٍ</p>
                </div>
            `;
        }
        
        // 4. إرسال البيانات لـ API
        const response = await fetch('/api/generate-report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(exportData)
        });
        
        if (!response.ok) {
            throw new Error('فشل في إنشاء التقرير');
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'فشل في إنشاء التقرير');
        }
        
        console.log('✅ تم إنشاء التقرير بنجاح');
        
        // 5. عرض التقرير
        window.currentAIReport = result.report;
        displayAIReport(result.report, result.metadata);
        
    } catch (error) {
        console.error('❌ خطأ في توليد التقرير:', error);
        const reportContent = document.getElementById('aiReportContent');
        if (reportContent) {
            reportContent.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-exclamation-triangle text-4xl text-red-300 mb-4"></i>
                    <p class="text-gray-800 text-lg font-semibold mb-2">حدث خطأ في إنشاء التقرير</p>
                    <p class="text-gray-600">${error.message}</p>
                    <p class="text-gray-500 text-sm mt-4">يرجى التحقق من إعدادات API والمحاولة مرة أخرى</p>
                </div>
            `;
        }
    } finally {
        // إعادة تفعيل الزر
        const generateBtn = document.querySelector('[onclick="generateAIReport()"]');
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<i class="fas fa-robot mr-2"></i>إنشاء التقرير الشامل';
        }
    }
}

function displayAIReport(reportMarkdown, metadata) {
    const reportContent = document.getElementById('aiReportContent');
    if (!reportContent) return;
    
    // تحويل Markdown إلى HTML
    let html = reportMarkdown;
    
    // العناوين
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-gray-800 mt-6 mb-3">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-white mt-8 mb-4 pb-2 border-b-2 border-gray-300">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-white mt-8 mb-6">$1</h1>');
    
    // Bold و Italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    
    // القوائم
    html = html.replace(/^\- (.*$)/gim, '<li class="ml-6 mb-2">$1</li>');
    html = html.replace(/^\d+\. (.*$)/gim, '<li class="ml-6 mb-2">$1</li>');
    html = html.replace(/(<li[^]*?<\/li>)/g, '<ul class="list-disc space-y-1 mb-4">$1</ul>');
    
    // الفقرات
    html = html.replace(/\n\n/g, '</p><p class="mb-4 text-gray-700 leading-relaxed">');
    html = '<p class="mb-4 text-gray-700 leading-relaxed">' + html + '</p>';
    
    // Horizontal rules
    html = html.replace(/^---$/gim, '<hr class="my-6 border-gray-300">');
    
    // الجداول (دعم بسيط)
    html = html.replace(/\|(.+)\|/g, function(match) {
        const cells = match.split('|').filter(c => c.trim());
        return '<tr>' + cells.map(c => '<td class="border border-gray-300 px-4 py-2">' + c.trim() + '</td>').join('') + '</tr>';
    });
    
    // Wrap في prose container
    reportContent.innerHTML = `
        <div class="prose prose-lg max-w-none">
            ${html}
        </div>
        <div class="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-500">
            <p>تم إنشاء هذا التقرير بواسطة الذكاء الاصطناعي في ${new Date(metadata.generatedAt).toLocaleString('ar-SA')}</p>
            <p>النموذج المستخدم: ${metadata.model} | عدد الـTokens: ${metadata.tokensUsed}</p>
        </div>
    `;
}

function openAIReportModal() {
    const modal = document.getElementById('aiReportModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function closeAIReportModal() {
    const modal = document.getElementById('aiReportModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}

function printAIReport() {
    if (!window.currentAIReport) {
        alert('لا يوجد تقرير للطباعة');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <title>تقرير دراسة الجدوى الشامل</title>
            <style>
                body { font-family: 'Tajawal', sans-serif; padding: 20px; }
                h1 { font-size: 24px; margin-top: 20px; }
                h2 { font-size: 20px; margin-top: 15px; border-bottom: 2px solid #ccc; padding-bottom: 5px; }
                h3 { font-size: 18px; margin-top: 10px; }
                p { line-height: 1.8; margin-bottom: 10px; }
                ul { margin: 10px 0; padding-right: 20px; }
                li { margin-bottom: 5px; }
                table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                td { border: 1px solid #ccc; padding: 8px; }
            </style>
        </head>
        <body>
            ${document.getElementById('aiReportContent').innerHTML}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

function copyAIReport() {
    if (!window.currentAIReport) {
        alert('لا يوجد تقرير للنسخ');
        return;
    }
    
    navigator.clipboard.writeText(window.currentAIReport).then(() => {
        alert('✅ تم نسخ التقرير إلى الحافظة');
    }).catch(err => {
        console.error('فشل في نسخ التقرير:', err);
        alert('❌ فشل في نسخ التقرير');
    });
}

// Expose functions globally
window.generateAIReport = generateAIReport;
window.closeAIReportModal = closeAIReportModal;
window.printAIReport = printAIReport;
window.copyAIReport = copyAIReport;

console.log('✅ AI Report functions loaded');
