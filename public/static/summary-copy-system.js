/**
 * نظام نسخ الملخصات v5.0
 * إصلاح نهائي بدون أخطاء مزعجة + نسخ دقيق
 */

(function() {
    console.log('📋 [Summary Copy System v5.0] جاري التحميل...');

    // عداد للمحاولات الناجحة
    let successfulCopies = 0;

    /**
     * نسخ محتوى بأمان وبدون أخطاء console
     */
    function safeCopy(sourceId, targetId) {
        try {
            const source = document.getElementById(sourceId);
            const target = document.getElementById(targetId);
            
            // التحقق من وجود العناصر بصمت
            if (!source || !target) return false;
            
            // التحقق من وجود محتوى حقيقي
            const hasContent = source.innerHTML && 
                              source.innerHTML.trim() !== '' && 
                              !source.innerHTML.includes('جاري التحميل') &&
                              (source.children.length > 0 || source.textContent.trim().length > 10);
            
            if (!hasContent) return false;
            
            // نسخ المحتوى
            target.innerHTML = source.innerHTML;
            
            // نسخ canvas بدون أخطاء
            try {
                const sourceCanvases = source.querySelectorAll('canvas');
                const targetCanvases = target.querySelectorAll('canvas');
                
                sourceCanvases.forEach((sc, i) => {
                    if (targetCanvases[i] && sc.width > 0 && sc.height > 0) {
                        targetCanvases[i].width = sc.width;
                        targetCanvases[i].height = sc.height;
                        const ctx = targetCanvases[i].getContext('2d');
                        if (ctx) ctx.drawImage(sc, 0, 0);
                    }
                });
            } catch (e) {
                // تجاهل أخطاء canvas بصمت
            }
            
            return true;
        } catch (e) {
            // معالجة جميع الأخطاء بصمت
            return false;
        }
    }

    /**
     * نسخ قسم كامل باستخدام selector
     */
    function safeCopySection(selector, targetId) {
        try {
            const source = document.querySelector(selector);
            const target = document.getElementById(targetId);
            
            if (!source || !target) return false;
            
            // التحقق من وجود محتوى حقيقي
            const hasContent = source.children.length > 0 && 
                              !source.innerHTML.includes('جاري التحميل');
            
            if (!hasContent) return false;
            
            target.innerHTML = source.innerHTML;
            
            // نسخ canvas
            try {
                const sourceCanvases = source.querySelectorAll('canvas');
                const targetCanvases = target.querySelectorAll('canvas');
                
                sourceCanvases.forEach((sc, i) => {
                    if (targetCanvases[i] && sc.width > 0 && sc.height > 0) {
                        targetCanvases[i].width = sc.width;
                        targetCanvases[i].height = sc.height;
                        const ctx = targetCanvases[i].getContext('2d');
                        if (ctx) ctx.drawImage(sc, 0, 0);
                    }
                });
            } catch (e) {
                // تجاهل
            }
            
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * تحديث جميع الملخصات
     */
    window.updateAllSummariesCopy = function() {
        successfulCopies = 0;
        
        // الأدوار
        if (safeCopySection('.mt-8:has(#comprehensiveSummariesTitle)', 'summary-floors-copy')) {
            successfulCopies++;
        }
        
        // الاستخدامات
        if (safeCopy('usesSummary', 'summary-uses-copy')) {
            successfulCopies++;
        }
        
        // المواقف
        if (safeCopy('parkingSummary', 'summary-parking-copy')) {
            successfulCopies++;
        }
        
        // التكاليف
        if (safeCopy('costsSummary', 'summary-costs-copy')) {
            successfulCopies++;
        }
        
        // الإيرادات
        if (safeCopy('revenuesSummary', 'summary-revenue-copy')) {
            successfulCopies++;
        }
        
        // OPEX
        if (safeCopy('opexSummary', 'summary-opex-copy')) {
            successfulCopies++;
        }
        
        // إخفاء رسائل "جاري التحميل" إذا نجحت النسخة
        if (successfulCopies >= 3) {
            ['summary-floors-copy', 'summary-uses-copy', 'summary-parking-copy', 
             'summary-costs-copy', 'summary-revenue-copy', 'summary-opex-copy'].forEach(id => {
                const el = document.getElementById(id);
                if (el && el.innerHTML.includes('جاري التحميل')) {
                    el.innerHTML = '<div class="text-gray-500 text-center py-4">لا توجد بيانات متاحة حتى الآن</div>';
                }
            });
        }
        
        return successfulCopies;
    };

    /**
     * ربط مع switchTab
     */
    const originalSwitchTab = window.switchTab;
    if (originalSwitchTab) {
        window.switchTab = function(tabId) {
            originalSwitchTab(tabId);
            
            if (tabId === 'tab-summary') {
                // نسخ فورية
                setTimeout(() => window.updateAllSummariesCopy(), 300);
                // نسخ متأخرة للتأكد
                setTimeout(() => window.updateAllSummariesCopy(), 1500);
                setTimeout(() => window.updateAllSummariesCopy(), 3000);
            }
        };
    }

    /**
     * ربط مع زر الحساب
     */
    function hookCalculateButton() {
        const calculateBtn = document.querySelector('button[onclick="calculateFeasibility()"]');
        if (calculateBtn) {
            const originalOnClick = calculateBtn.onclick;
            calculateBtn.onclick = function(e) {
                if (originalOnClick) originalOnClick.call(this, e);
                // تحديث بعد 4 ثوانٍ من الحساب
                setTimeout(() => window.updateAllSummariesCopy(), 4000);
            };
        }
    }

    /**
     * مراقبة التغييرات في الملخصات الأصلية
     */
    function setupObservers() {
        const summaryIds = ['usesSummary', 'parkingSummary', 'costsSummary', 
                           'revenuesSummary', 'opexSummary'];
        
        const observer = new MutationObserver(() => {
            // تحديث بعد 500ms من أي تغيير
            setTimeout(() => window.updateAllSummariesCopy(), 500);
        });
        
        summaryIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                observer.observe(el, { 
                    childList: true, 
                    subtree: true,
                    characterData: true 
                });
            }
        });
    }

    /**
     * التحميل الأولي
     */
    setTimeout(() => {
        hookCalculateButton();
        setupObservers();
        // محاولة أولية
        window.updateAllSummariesCopy();
        // محاولة بعد 3 ثوانٍ
        setTimeout(() => window.updateAllSummariesCopy(), 3000);
    }, 1000);

    console.log('✅ [Summary Copy System v5.0] جاهز');
})();
