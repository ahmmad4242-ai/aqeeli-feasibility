/**
 * ============================================================================
 * Validation Rules Utilities
 * نظام التحقق من صحة البيانات - المرحلة 1
 * ============================================================================
 * 
 * يوفر validation شامل قبل حساب المؤشرات المالية
 * 
 * @version 1.0.0
 * @date 2025-10-25
 */

/**
 * التحقق من صحة جميع بيانات الاستثمار
 * @param {object} investmentData - بيانات الاستثمار
 * @returns {object} نتائج التحقق
 */
function validateInvestmentData(investmentData) {
    const errors = [];
    const warnings = [];
    
    console.log('🔍 [Validation] بدء التحقق من صحة البيانات...');
    
    // 1. تحقق من بيانات الأرض
    const landAcq = investmentData.landAcquisition;
    if (landAcq.mode === 'purchase' && landAcq.purchasePrice <= 0) {
        errors.push('❌ سعر شراء الأرض يجب أن يكون أكبر من صفر');
    }
    if (landAcq.mode === 'lease') {
        if (landAcq.annualRent <= 0) {
            errors.push('❌ الإيجار السنوي يجب أن يكون أكبر من صفر');
        }
        if (landAcq.leaseTerm <= 0) {
            warnings.push('⚠️ مدة الإيجار يجب أن تكون محددة');
        }
    }
    if (landAcq.mode === 'partnership') {
        if (landAcq.landValuePerSqm <= 0) {
            errors.push('❌ قيمة الأرض للشريك يجب أن تكون أكبر من صفر');
        }
        if (landAcq.partnershipShare <= 0 || landAcq.partnershipShare >= 100) {
            errors.push('❌ حصة الشريك يجب أن تكون بين 0% و 100%');
        }
        if (!landAcq.profitSharingModel) {
            warnings.push('⚠️ نموذج تقاسم الأرباح غير محدد، سيتم استخدام "revenue" افتراضياً');
        }
    }
    
    // 2. تحقق من فترات المشروع
    const financing = investmentData.financing;
    if (financing.constructionPeriod < 1 || financing.constructionPeriod > 10) {
        errors.push('❌ فترة البناء يجب أن تكون بين 1-10 سنوات');
    }
    if (financing.operatingPeriod < 1 || financing.operatingPeriod > 50) {
        errors.push('❌ فترة التشغيل يجب أن تكون بين 1-50 سنة');
    }
    
    // 3. تحقق من التمويل بالدين
    const debtFinancing = investmentData.debtFinancing;
    if (debtFinancing.enabled) {
        if (debtFinancing.loanAmount <= 0) {
            errors.push('❌ مبلغ القرض يجب أن يكون أكبر من صفر');
        }
        if (debtFinancing.interestRate <= 0 || debtFinancing.interestRate > 20) {
            warnings.push('⚠️ معدل الفائدة يبدو غير معتاد: ' + debtFinancing.interestRate + '% (يجب أن يكون بين 0-20%)');
        }
        if (debtFinancing.loanPeriod > financing.operatingPeriod) {
            errors.push('❌ فترة القرض (' + debtFinancing.loanPeriod + ' سنة) لا يمكن أن تتجاوز فترة التشغيل (' + financing.operatingPeriod + ' سنة)');
        }
        if (debtFinancing.loanPeriod <= 0) {
            errors.push('❌ فترة القرض يجب أن تكون أكبر من صفر');
        }
    }
    
    // 4. تحقق من WACC
    const wacc = investmentData.discounting.calculatedWACC;
    if (wacc <= 0 || wacc > 30) {
        warnings.push('⚠️ معدل الخصم (WACC) يبدو غير معتاد: ' + wacc + '%');
    }
    
    const costOfEquity = investmentData.discounting.costOfEquity;
    if (costOfEquity <= 0 || costOfEquity > 30) {
        warnings.push('⚠️ تكلفة حقوق الملكية تبدو غير معتادة: ' + costOfEquity + '%');
    }
    
    // 5. تحقق من Exit Strategy
    const exit = investmentData.exit;
    if (exit.year > financing.operatingPeriod) {
        errors.push('❌ سنة الخروج (' + exit.year + ') لا يمكن أن تتجاوز فترة التشغيل (' + financing.operatingPeriod + ')');
    }
    if (exit.year <= 0) {
        errors.push('❌ سنة الخروج يجب أن تكون أكبر من صفر');
    }
    
    // تحقق خاص بطريقة Gordon Growth
    if (exit.method === 'gordon') {
        const gordonGrowthRate = exit.gordonGrowthRate || 0;
        if (wacc <= gordonGrowthRate) {
            errors.push('❌ في نموذج Gordon Growth، WACC (' + wacc + '%) يجب أن يكون أكبر من معدل النمو (' + gordonGrowthRate + '%)');
        }
        if (gordonGrowthRate > 5) {
            warnings.push('⚠️ معدل النمو الدائم (' + gordonGrowthRate + '%) يبدو مرتفعاً جداً. القيم المعتادة: 2-3%');
        }
    }
    
    // تحقق من Cap Rate
    if (exit.method === 'capRate') {
        const capRate = exit.capRate || 0;
        if (capRate < 4 || capRate > 12) {
            warnings.push('⚠️ Cap Rate (' + capRate + '%) خارج النطاق المعتاد (4-12%)');
        }
    }
    
    // تحقق من تكاليف البيع
    if (exit.sellingCosts > 10) {
        warnings.push('⚠️ تكاليف البيع (' + exit.sellingCosts + '%) مرتفعة جداً. القيم المعتادة: 2-5%');
    }
    
    // 6. تحقق من الترابط بين المكونات
    const integration = investmentData.integration;
    if (!integration.landArea || integration.landArea <= 0) {
        errors.push('❌ يجب إدخال مساحة الأرض في المكون الثاني (Land & Site)');
    }
    if (!integration.constructionCost || integration.constructionCost <= 0) {
        errors.push('❌ يجب إدخال تكلفة البناء في المكون الثالث (Construction)');
    }
    if (!integration.annualRevenue || integration.annualRevenue <= 0) {
        warnings.push('⚠️ يجب إدخال الإيرادات في المكون الرابع (Revenue)');
    }
    
    // 7. تحقق من Assumptions
    const assumptions = investmentData.assumptions;
    if (assumptions.inflationEnabled && (assumptions.inflationRate < 0 || assumptions.inflationRate > 10)) {
        warnings.push('⚠️ معدل التضخم (' + assumptions.inflationRate + '%) خارج النطاق المعتاد (0-10%)');
    }
    if (assumptions.revenueGrowthEnabled && (assumptions.revenueGrowthRate < 0 || assumptions.revenueGrowthRate > 15)) {
        warnings.push('⚠️ معدل نمو الإيرادات (' + assumptions.revenueGrowthRate + '%) خارج النطاق المعتاد (0-15%)');
    }
    
    // 8. تحقق من CAPEX
    const capex = investmentData.capitalExpenditure;
    if (capex.calculated) {
        const totalCapitalRequired = capex.totalCapitalRequired || 0;
        const loanAmount = capex.loanAmount || 0;
        const equityRequired = capex.equityRequired || 0;
        
        if (loanAmount > totalCapitalRequired) {
            errors.push('❌ مبلغ القرض (' + loanAmount.toLocaleString() + ') يتجاوز رأس المال المطلوب (' + totalCapitalRequired.toLocaleString() + ')');
        }
        
        if (Math.abs(equityRequired - (totalCapitalRequired - loanAmount)) > 1) {
            warnings.push('⚠️ حساب حقوق الملكية المطلوبة قد يكون غير دقيق');
        }
    }
    
    console.log('🔍 [Validation] النتائج:', {
        errors: errors.length,
        warnings: warnings.length
    });
    
    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        summary: {
            totalErrors: errors.length,
            totalWarnings: warnings.length,
            criticalIssues: errors.filter(e => e.includes('❌')).length,
            minorIssues: warnings.filter(w => w.includes('⚠️')).length
        }
    };
}

/**
 * عرض نتائج Validation في modal
 * @param {object} validation - نتائج التحقق
 */
function showValidationResults(validation) {
    let modalHTML = '<div class="validation-modal">';
    modalHTML += '<div class="validation-content">';
    
    // العنوان
    if (validation.isValid) {
        modalHTML += '<h3 style="color: #10b981;"><i class="fas fa-check-circle"></i> التحقق ناجح</h3>';
        modalHTML += '<p>جميع البيانات صحيحة ويمكن المتابعة بالحسابات.</p>';
    } else {
        modalHTML += '<h3 style="color: #ef4444;"><i class="fas fa-exclamation-circle"></i> يوجد أخطاء</h3>';
        modalHTML += '<p>يجب إصلاح الأخطاء التالية قبل المتابعة:</p>';
    }
    
    // الأخطاء
    if (validation.errors.length > 0) {
        modalHTML += '<div class="validation-errors">';
        modalHTML += '<h4>الأخطاء (' + validation.errors.length + '):</h4>';
        modalHTML += '<ul>';
        validation.errors.forEach(error => {
            modalHTML += '<li style="color: #ef4444;">' + error + '</li>';
        });
        modalHTML += '</ul>';
        modalHTML += '</div>';
    }
    
    // التحذيرات
    if (validation.warnings.length > 0) {
        modalHTML += '<div class="validation-warnings">';
        modalHTML += '<h4>التحذيرات (' + validation.warnings.length + '):</h4>';
        modalHTML += '<ul>';
        validation.warnings.forEach(warning => {
            modalHTML += '<li style="color: #f59e0b;">' + warning + '</li>';
        });
        modalHTML += '</ul>';
        modalHTML += '</div>';
    }
    
    modalHTML += '<button onclick="closeValidationModal()" class="btn btn-primary mt-4">إغلاق</button>';
    modalHTML += '</div>';
    modalHTML += '</div>';
    
    // إنشاء وعرض Modal
    let modal = document.getElementById('validationModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'validationModal';
        modal.className = 'modal';
        modal.style.display = 'flex';
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = modalHTML;
    modal.style.display = 'flex';
}

/**
 * إغلاق modal التحقق
 */
function closeValidationModal() {
    const modal = document.getElementById('validationModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// تصدير
if (typeof window !== 'undefined') {
    window.validateInvestmentData = validateInvestmentData;
    window.showValidationResults = showValidationResults;
    window.closeValidationModal = closeValidationModal;
    
    console.log('✅ Validation utilities loaded successfully');
}
