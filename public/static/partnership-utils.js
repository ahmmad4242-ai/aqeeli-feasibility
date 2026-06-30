/**
 * ============================================================================
 * Partnership Calculations Utilities
 * دوال حساب الشراكة - إصلاح حرج للمرحلة 1
 * ============================================================================
 * 
 * يحل هذه المشاكل:
 * 1. عدم خصم حصة الشريك من الأرباح السنوية
 * 2. عدم إضافة رسوم الإدارة للمطور
 * 3. عدم تقسيم عوائد الخروج (Exit Value) مع الشريك
 * 
 * @version 1.0.0
 * @date 2025-10-25
 */

/**
 * حساب التعديلات المحاسبية لوضع الشراكة (مع دعم الشركاء الإضافيين)
 * @param {number} noi - صافي الدخل التشغيلي
 * @param {number} revenue - الإيرادات الإجمالية
 * @param {object} landAcq - بيانات الحصول على الأرض
 * @returns {object} التعديلات المحاسبية
 */
function calculatePartnershipAdjustments(noi, revenue, landAcq) {
    // ✅ DEBUG: طباعة البيانات المدخلة
    console.log('🔍 [calculatePartnershipAdjustments] البيانات المدخلة:', {
        noi: noi.toLocaleString('en-US'),
        revenue: revenue.toLocaleString('en-US'),
        mode: landAcq?.mode,
        profitSharingModel: landAcq?.profitSharingModel,
        partnershipShare: landAcq?.partnershipShare,
        hasPartners: landAcq?.partners ? true : false,
        partnersCount: landAcq?.partners?.length || 0,
        partnersData: landAcq?.partners
    });
    
    // التحقق من وضع الشراكة
    if (!landAcq || landAcq.mode !== 'partnership') {
        return {
            noiToInvestor: noi,
            partnerShare: 0,
            additionalPartnersShare: 0,
            totalPartnersShare: 0,
            managementFee: 0,
            netAdjustment: 0,
            details: {
                model: 'N/A',
                calculation: 'لا يوجد شريك',
                additionalPartners: []
            }
        };
    }
    
    let mainPartnerShare = 0;
    let calculation = '';
    
    // حساب حصة الشريك الرئيسي حسب النموذج
    switch (landAcq.profitSharingModel) {
        case 'revenue':
            // حصة من الإيرادات الإجمالية
            mainPartnerShare = revenue * (landAcq.partnershipShare / 100);
            calculation = `${revenue.toLocaleString('en-US')} × ${landAcq.partnershipShare}%`;
            break;
            
        case 'profit':
            // حصة من صافي الربح (NOI)
            mainPartnerShare = noi * (landAcq.partnershipShare / 100);
            calculation = `${noi.toLocaleString('en-US')} × ${landAcq.partnershipShare}%`;
            break;
            
        case 'hybrid':
            // نموذج مختلط (نسب قابلة للتخصيص)
            const revenueWeight = (landAcq.hybridRevenueWeight || 50) / 100;
            const profitWeight = (landAcq.hybridProfitWeight || 50) / 100;
            const revenueShare = revenue * (landAcq.partnershipShare / 100) * revenueWeight;
            const profitShare = noi * (landAcq.partnershipShare / 100) * profitWeight;
            mainPartnerShare = revenueShare + profitShare;
            calculation = `(${revenue.toLocaleString('en-US')} × ${landAcq.partnershipShare}% × ${(landAcq.hybridRevenueWeight || 50)}%) + (${noi.toLocaleString('en-US')} × ${landAcq.partnershipShare}% × ${(landAcq.hybridProfitWeight || 50)}%)`;
            break;
            
        default:
            console.error('❌ نموذج تقاسم الأرباح غير معروف:', landAcq.profitSharingModel);
            mainPartnerShare = 0;
    }
    
    // حساب حصص الشركاء الإضافيين
    let additionalPartnersTotal = 0;
    const additionalPartnersDetails = [];
    
    if (landAcq.partners && landAcq.partners.length > 0) {
        landAcq.partners.forEach((partner, index) => {
            let partnerShare = 0;
            const partnerSharePercent = partner.share || 0;
            
            // حساب حصة الشريك الإضافي حسب نفس النموذج
            switch (landAcq.profitSharingModel) {
                case 'revenue':
                    partnerShare = revenue * (partnerSharePercent / 100);
                    break;
                case 'profit':
                    partnerShare = noi * (partnerSharePercent / 100);
                    break;
                case 'hybrid':
                    const revWeight = (landAcq.hybridRevenueWeight || 50) / 100;
                    const profWeight = (landAcq.hybridProfitWeight || 50) / 100;
                    partnerShare = (revenue * (partnerSharePercent / 100) * revWeight) + (noi * (partnerSharePercent / 100) * profWeight);
                    break;
            }
            
            additionalPartnersTotal += partnerShare;
            additionalPartnersDetails.push({
                name: partner.name || `شريك ${index + 2}`,
                sharePercent: partnerSharePercent,
                shareAmount: partnerShare
            });
        });
    }
    
    // إجمالي حصص جميع الشركاء
    const totalPartnersShare = mainPartnerShare + additionalPartnersTotal;
    
    // رسوم الإدارة للمطور
    const managementFee = revenue * (landAcq.managementFeePercentage / 100);
    
    // صافي التعديل = رسوم الإدارة - إجمالي حصص الشركاء
    const netAdjustment = managementFee - totalPartnersShare;
    
    // NOI الصافي للمستثمر/المطور
    const noiToInvestor = noi + netAdjustment;
    
    console.log('🤝 [Partnership] تعديلات الشراكة (مع الشركاء الإضافيين):', {
        originalNOI: noi.toLocaleString('en-US'),
        mainPartnerShare: mainPartnerShare.toLocaleString('en-US'),
        additionalPartnersShare: additionalPartnersTotal.toLocaleString('en-US'),
        totalPartnersShare: totalPartnersShare.toLocaleString('en-US'),
        managementFee: managementFee.toLocaleString('en-US'),
        netAdjustment: netAdjustment.toLocaleString('en-US'),
        noiToInvestor: noiToInvestor.toLocaleString('en-US'),
        additionalPartnersCount: additionalPartnersDetails.length
    });
    
    return {
        noiToInvestor,
        partnerShare: mainPartnerShare,
        additionalPartnersShare: additionalPartnersTotal,
        totalPartnersShare: totalPartnersShare,
        managementFee,
        netAdjustment,
        details: {
            model: landAcq.profitSharingModel,
            calculation,
            partnershipShare: landAcq.partnershipShare + '%',
            managementFeePercent: landAcq.managementFeePercentage + '%',
            additionalPartners: additionalPartnersDetails
        }
    };
}

/**
 * حساب تقسيم عوائد الخروج مع جميع الشركاء (بما في ذلك الإضافيين)
 * @param {number} exitNetProceeds - صافي عوائد البيع بعد سداد القرض
 * @param {object} landAcq - بيانات الحصول على الأرض
 * @param {object} capex - النفقات الرأسمالية
 * @returns {object} تقسيم العوائد
 */
function calculatePartnershipExitSplit(exitNetProceeds, landAcq, capex) {
    if (!landAcq || landAcq.mode !== 'partnership') {
        return {
            investorShare: exitNetProceeds,
            partnerShare: 0,
            additionalPartnersShares: [],
            totalPartnersShare: 0,
            splitRatio: '100% / 0%',
            method: 'N/A'
        };
    }
    
    let mainPartnerSharePercent;
    let investorSharePercent;
    let method;
    
    // حساب المساهمات الإجمالية بما في ذلك الشركاء الإضافيين
    let totalPartnerContributions = 0;
    let totalCapital = capex.totalCapitalRequired || 0;
    
    if (landAcq.autoCalculateProfitShare) {
        // حساب تلقائي بناءً على المساهمة الرأسمالية
        const landValue = capex.landCost || 0;
        
        // حساب مساهمة الشريك الرئيسي
        let mainPartnerContribution = 0;
        if (landAcq.partnerContribution === 'land') {
            mainPartnerContribution = landValue;
        } else if (landAcq.partnerContribution === 'cash') {
            mainPartnerContribution = landAcq.partnerCashContribution || 0;
        } else if (landAcq.partnerContribution === 'both') {
            mainPartnerContribution = landValue + (landAcq.partnerCashContribution || 0);
        }
        
        totalPartnerContributions = mainPartnerContribution;
        
        // حساب مساهمات الشركاء الإضافيين
        const additionalPartnersContributions = [];
        if (landAcq.partners && landAcq.partners.length > 0) {
            landAcq.partners.forEach((partner, index) => {
                let contribution = 0;
                if (partner.type === 'land') {
                    contribution = (partner.landArea || 0) * (landAcq.landValuePerSqm || 2000);
                } else if (partner.type === 'cash') {
                    contribution = partner.cashAmount || 0;
                } else if (partner.type === 'both') {
                    contribution = ((partner.landArea || 0) * (landAcq.landValuePerSqm || 2000)) + (partner.cashAmount || 0);
                }
                
                totalPartnerContributions += contribution;
                const sharePercent = totalCapital > 0 ? (contribution / totalCapital) * 100 : 0;
                
                additionalPartnersContributions.push({
                    name: partner.name || `شريك ${index + 2}`,
                    contribution: contribution,
                    sharePercent: sharePercent,
                    shareAmount: 0 // سيتم حسابه لاحقاً
                });
            });
        }
        
        // حساب النسب
        mainPartnerSharePercent = totalCapital > 0 ? (mainPartnerContribution / totalCapital) * 100 : 0;
        investorSharePercent = totalCapital > 0 ? ((totalCapital - totalPartnerContributions) / totalCapital) * 100 : 50;
        
        // حساب المبالغ الفعلية
        const mainPartnerShare = exitNetProceeds * (mainPartnerSharePercent / 100);
        const investorShare = exitNetProceeds * (investorSharePercent / 100);
        
        // حساب حصص الشركاء الإضافيين
        additionalPartnersContributions.forEach(partner => {
            partner.shareAmount = exitNetProceeds * (partner.sharePercent / 100);
        });
        
        method = 'حسب المساهمة الرأسمالية';
        
        console.log('🤝 [Exit Split - Auto] الحساب التلقائي مع الشركاء الإضافيين:', {
            totalCapital: totalCapital.toLocaleString('en-US'),
            mainPartnerContribution: mainPartnerContribution.toLocaleString('en-US'),
            totalPartnerContributions: totalPartnerContributions.toLocaleString('en-US'),
            investorShare: investorSharePercent.toFixed(1) + '%',
            mainPartnerShare: mainPartnerSharePercent.toFixed(1) + '%',
            additionalPartnersCount: additionalPartnersContributions.length
        });
        
        const totalPartnersShare = exitNetProceeds - investorShare;
        
        return {
            investorShare,
            investorSharePercent,
            partnerShare: mainPartnerShare,
            partnerSharePercent: mainPartnerSharePercent,
            additionalPartnersShares: additionalPartnersContributions,
            totalPartnersShare,
            splitRatio: `${investorSharePercent.toFixed(1)}% مطور / ${mainPartnerSharePercent.toFixed(1)}% شريك رئيسي${additionalPartnersContributions.length > 0 ? ` / ${additionalPartnersContributions.length} شركاء إضافيين` : ''}`,
            method
        };
        
    } else {
        // استخدام النسبة المدخلة يدوياً
        mainPartnerSharePercent = landAcq.partnershipShare;
        
        // حساب نسب الشركاء الإضافيين
        let additionalPartnersSharePercent = 0;
        const additionalPartnersShares = [];
        
        if (landAcq.partners && landAcq.partners.length > 0) {
            landAcq.partners.forEach((partner, index) => {
                const sharePercent = partner.share || 0;
                additionalPartnersSharePercent += sharePercent;
                const shareAmount = exitNetProceeds * (sharePercent / 100);
                
                additionalPartnersShares.push({
                    name: partner.name || `شريك ${index + 2}`,
                    sharePercent: sharePercent,
                    shareAmount: shareAmount
                });
            });
        }
        
        // نسبة المطور = 100% - نسبة الشريك الرئيسي - نسب الشركاء الإضافيين
        investorSharePercent = 100 - mainPartnerSharePercent - additionalPartnersSharePercent;
        
        // حساب المبالغ
        const investorShare = exitNetProceeds * (investorSharePercent / 100);
        const mainPartnerShare = exitNetProceeds * (mainPartnerSharePercent / 100);
        const totalPartnersShare = exitNetProceeds - investorShare;
        
        method = 'حسب النسبة المحددة';
        
        console.log('🤝 [Exit Split] تقسيم عوائد الخروج (يدوي) مع الشركاء الإضافيين:', {
            exitNetProceeds: exitNetProceeds.toLocaleString('en-US'),
            investorShare: investorShare.toLocaleString('en-US'),
            mainPartnerShare: mainPartnerShare.toLocaleString('en-US'),
            totalPartnersShare: totalPartnersShare.toLocaleString('en-US'),
            additionalPartnersCount: additionalPartnersShares.length
        });
        
        return {
            investorShare,
            investorSharePercent,
            partnerShare: mainPartnerShare,
            partnerSharePercent: mainPartnerSharePercent,
            additionalPartnersShares,
            totalPartnersShare,
            splitRatio: `${investorSharePercent.toFixed(1)}% / ${mainPartnerSharePercent.toFixed(1)}%${additionalPartnersShares.length > 0 ? ` / ${additionalPartnersShares.length} شركاء` : ''}`,
            method
        };
    }
}

/**
 * تحديث عرض ملخص الشراكة في الواجهة
 * @param {object} landAcq - بيانات الحصول على الأرض
 */
function updatePartnershipSummaryDisplay(landAcq) {
    if (!landAcq || landAcq.mode !== 'partnership') {
        // إخفاء ملخص الشراكة
        const summary = document.getElementById('partnershipSummary');
        if (summary) {
            summary.closest('.bg-blue-50').style.display = 'none';
        }
        return;
    }
    
    // عرض ملخص الشراكة
    const summary = document.getElementById('partnershipSummary');
    if (summary) {
        summary.closest('.bg-blue-50').style.display = 'block';
    }
    
    // تحديث القيم
    const modelNames = {
        'revenue': 'من الإيرادات',
        'profit': 'من الربح',
        'hybrid': 'مختلط'
    };
    
    const setDisplay = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };
    
    setDisplay('partnershipModelDisplay', modelNames[landAcq.profitSharingModel] || landAcq.profitSharingModel);
    setDisplay('partnerShareDisplay', landAcq.partnershipShare + '%');
    setDisplay('managementFeeDisplay', landAcq.managementFeePercentage + '%');
    
    // حساب مثال سنوي
    const exampleRevenue = 30000000; // مثال
    const exampleNOI = 20000000; // مثال
    
    const adj = calculatePartnershipAdjustments(exampleNOI, exampleRevenue, landAcq);
    
    setDisplay('netAdjustmentDisplay', 
        (adj.netAdjustment >= 0 ? '+' : '') + adj.netAdjustment.toLocaleString('en-US') + ' ريال');
    
    // تلوين حسب الإشارة
    const netAdjEl = document.getElementById('netAdjustmentDisplay');
    if (netAdjEl) {
        netAdjEl.style.color = adj.netAdjustment >= 0 ? '#10b981' : '#ef4444';
    }
    
    // عرض تقديري لعوائد الخروج
    setDisplay('investorExitShareDisplay', 
        landAcq.autoCalculateProfitShare ? 'تلقائي (حسب المساهمة)' : (100 - landAcq.partnershipShare) + '%');
    setDisplay('partnerExitShareDisplay', 
        landAcq.autoCalculateProfitShare ? 'تلقائي (حسب المساهمة)' : landAcq.partnershipShare + '%');
}

// تصدير الدوال
if (typeof window !== 'undefined') {
    window.calculatePartnershipAdjustments = calculatePartnershipAdjustments;
    window.calculatePartnershipExitSplit = calculatePartnershipExitSplit;
    window.updatePartnershipSummaryDisplay = updatePartnershipSummaryDisplay;
    
    console.log('✅ Partnership utilities loaded successfully');
}
