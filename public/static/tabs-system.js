/**
 * نظام علامات التبويب (Tabs System)
 * تم تصميمه بدقة عالية لتقسيم الصفحة إلى أقسام مستقلة
 * دون التأثير على الوظائف البرمجية الموجودة
 */

// تهيئة نظام التبويبات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔖 [Tabs System] Initializing tabs system...');
    
    // التحقق من وجود التبويبات
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    if (tabButtons.length > 0 && tabContents.length > 0) {
        console.log(`✅ [Tabs System] Found ${tabButtons.length} tabs and ${tabContents.length} content panels`);
        
        // تفعيل التبويب الأول (معلومات المشروع) افتراضياً
        const firstTab = document.getElementById('tab-project');
        const firstButton = document.getElementById('btn-tab-project');
        
        if (firstTab && firstButton) {
            firstTab.classList.add('tab-active');
            firstButton.classList.add('tab-active');
            console.log('✅ [Tabs System] First tab activated (Project Information)');
        }
    } else {
        console.warn('⚠️ [Tabs System] No tabs found on page');
    }
});

/**
 * دالة تبديل التبويبات
 * @param {string} tabId - معرف التبويب المراد عرضه
 */
function switchTab(tabId) {
    console.log(`🔄 [Tabs System] Switching to tab: ${tabId}`);
    
    try {
        // إخفاء جميع محتويات التبويبات
        const allTabs = document.querySelectorAll('.tab-content');
        allTabs.forEach(tab => {
            tab.classList.remove('tab-active');
            tab.style.display = 'none';
        });
        
        // إزالة التنشيط من جميع أزرار التبويبات
        const allButtons = document.querySelectorAll('.tab-button');
        allButtons.forEach(button => {
            button.classList.remove('tab-active');
        });
        
        // عرض التبويب المحدد
        const targetTab = document.getElementById(tabId);
        if (targetTab) {
            targetTab.classList.add('tab-active');
            targetTab.style.display = 'block';
            console.log(`✅ [Tabs System] Tab activated: ${tabId}`);
        } else {
            console.error(`❌ [Tabs System] Tab not found: ${tabId}`);
        }
        
        // تنشيط زر التبويب المحدد
        const targetButton = document.getElementById('btn-' + tabId);
        if (targetButton) {
            targetButton.classList.add('tab-active');
        }
        
        // حفظ التبويب النشط في localStorage للرجوع إليه
        localStorage.setItem('activeTab', tabId);
        
        // التمرير إلى أعلى الصفحة بشكل سلس
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        
    } catch (error) {
        console.error('❌ [Tabs System] Error switching tabs:', error);
    }
}

/**
 * استعادة التبويب النشط عند تحميل الصفحة
 */
window.addEventListener('load', function() {
    const savedTab = localStorage.getItem('activeTab');
    if (savedTab) {
        console.log(`🔖 [Tabs System] Restoring saved tab: ${savedTab}`);
        setTimeout(() => {
            switchTab(savedTab);
        }, 500); // تأخير قصير لضمان تحميل جميع العناصر
    }
});

// تصدير الدالة للاستخدام العام
window.switchTab = switchTab;

console.log('✅ [Tabs System] Tabs system loaded successfully');
