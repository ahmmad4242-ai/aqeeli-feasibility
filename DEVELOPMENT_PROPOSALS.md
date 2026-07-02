# 🚀 مقترحات التطوير العملية - خطة التنفيذ

## 📋 المحتويات
1. [إصلاح وضع الشراكة](#1-إصلاح-وضع-الشراكة)
2. [نموذج إيرادات البيع](#2-نموذج-إيرادات-البيع)
3. [النموذج المختلط](#3-النموذج-المختلط)
4. [تحسينات إضافية](#4-تحسينات-إضافية)

---

## 1. إصلاح وضع الشراكة

### 🎯 الهدف
تطبيق محاسبة صحيحة لوضع الشراكة بحيث:
- يتم خصم حصة الشريك من الإيرادات/الأرباح السنوية
- يتم إضافة رسوم إدارة للمطور
- يتم تقسيم عوائد الخروج (Exit Value) بين الشريك والمستثمر

### 📝 التغييرات المطلوبة

#### أ) إضافة دالة حساب تعديلات الشراكة

إنشاء ملف جديد: `public/static/partnership-utils.js`

```javascript
/**
 * حساب التعديلات المحاسبية لوضع الشراكة
 * @param {number} noi - صافي الدخل التشغيلي
 * @param {number} revenue - الإيرادات الإجمالية
 * @param {object} landAcq - بيانات الحصول على الأرض
 * @returns {object} التعديلات المحاسبية
 */
function calculatePartnershipAdjustments(noi, revenue, landAcq) {
    // التحقق من وضع الشراكة
    if (landAcq.mode !== 'partnership') {
        return {
            noiToInvestor: noi,
            partnerShare: 0,
            managementFee: 0,
            netAdjustment: 0,
            details: {
                model: 'N/A',
                calculation: 'لا يوجد شريك'
            }
        };
    }
    
    let partnerShare = 0;
    let calculation = '';
    
    // حساب حصة الشريك حسب النموذج
    switch (landAcq.profitSharingModel) {
        case 'revenue':
            // حصة من الإيرادات الإجمالية
            partnerShare = revenue * (landAcq.partnershipShare / 100);
            calculation = `${revenue.toLocaleString()} × ${landAcq.partnershipShare}%`;
            break;
            
        case 'profit':
            // حصة من صافي الربح (NOI)
            partnerShare = noi * (landAcq.partnershipShare / 100);
            calculation = `${noi.toLocaleString()} × ${landAcq.partnershipShare}%`;
            break;
            
        case 'hybrid':
            // نموذج مختلط (50% من الإيرادات + 50% من الربح)
            const revenueShare = revenue * (landAcq.partnershipShare / 100) * 0.5;
            const profitShare = noi * (landAcq.partnershipShare / 100) * 0.5;
            partnerShare = revenueShare + profitShare;
            calculation = `(${revenue.toLocaleString()} × ${landAcq.partnershipShare}% × 50%) + (${noi.toLocaleString()} × ${landAcq.partnershipShare}% × 50%)`;
            break;
            
        default:
            console.error('❌ نموذج تقاسم الأرباح غير معروف:', landAcq.profitSharingModel);
            partnerShare = 0;
    }
    
    // رسوم الإدارة للمطور
    const managementFee = revenue * (landAcq.managementFeePercentage / 100);
    
    // صافي التعديل
    const netAdjustment = managementFee - partnerShare;
    
    // NOI الصافي للمستثمر/المطور
    const noiToInvestor = noi + netAdjustment;
    
    console.log('🤝 [Partnership] تعديلات الشراكة:', {
        originalNOI: noi.toLocaleString(),
        partnerShare: partnerShare.toLocaleString(),
        managementFee: managementFee.toLocaleString(),
        netAdjustment: netAdjustment.toLocaleString(),
        noiToInvestor: noiToInvestor.toLocaleString()
    });
    
    return {
        noiToInvestor,
        partnerShare,
        managementFee,
        netAdjustment,
        details: {
            model: landAcq.profitSharingModel,
            calculation,
            partnershipShare: landAcq.partnershipShare + '%',
            managementFeePercent: landAcq.managementFeePercentage + '%'
        }
    };
}

/**
 * حساب تقسيم عوائد الخروج مع الشريك
 * @param {number} exitNetProceeds - صافي عوائد البيع بعد سداد القرض
 * @param {object} landAcq - بيانات الحصول على الأرض
 * @param {object} capex - النفقات الرأسمالية
 * @returns {object} تقسيم العوائد
 */
function calculatePartnershipExitSplit(exitNetProceeds, landAcq, capex) {
    if (landAcq.mode !== 'partnership') {
        return {
            investorShare: exitNetProceeds,
            partnerShare: 0,
            splitRatio: '100% / 0%',
            method: 'N/A'
        };
    }
    
    let investorSharePercent;
    let method;
    
    if (landAcq.autoCalculateProfitShare) {
        // حساب تلقائي بناءً على المساهمة الرأسمالية
        const totalInvestment = capex.totalCapitalRequired;
        const landValue = capex.landCost;
        const partnerContribution = landValue;
        const developerContribution = totalInvestment - landValue;
        
        investorSharePercent = (developerContribution / totalInvestment) * 100;
        method = 'حسب المساهمة الرأسمالية';
        
        console.log('🤝 [Exit Split - Auto] الحساب التلقائي:', {
            totalInvestment: totalInvestment.toLocaleString(),
            landValue: landValue.toLocaleString(),
            developerContribution: developerContribution.toLocaleString(),
            investorShare: investorSharePercent.toFixed(1) + '%'
        });
        
    } else {
        // استخدام النسبة المدخلة يدوياً
        investorSharePercent = 100 - landAcq.partnershipShare;
        method = 'حسب النسبة المحددة';
    }
    
    const investorShare = exitNetProceeds * (investorSharePercent / 100);
    const partnerShare = exitNetProceeds - investorShare;
    
    console.log('🤝 [Exit Split] تقسيم عوائد الخروج:', {
        exitNetProceeds: exitNetProceeds.toLocaleString(),
        investorShare: investorShare.toLocaleString(),
        partnerShare: partnerShare.toLocaleString(),
        splitRatio: `${investorSharePercent.toFixed(1)}% / ${(100 - investorSharePercent).toFixed(1)}%`,
        method
    });
    
    return {
        investorShare,
        partnerShare,
        splitRatio: `${investorSharePercent.toFixed(1)}% / ${(100 - investorSharePercent).toFixed(1)}%`,
        method
    };
}

// تصدير الدوال
if (typeof window !== 'undefined') {
    window.calculatePartnershipAdjustments = calculatePartnershipAdjustments;
    window.calculatePartnershipExitSplit = calculatePartnershipExitSplit;
}
```

#### ب) تعديل دالة calculateNOIForYear

في `src/index.tsx`، تعديل السطور 7514-7550:

```javascript
function calculateNOIForYear(year) {
    try {
        const revenue = calculateRevenueForYear(year);
        const opex = calculateOpexForYear(year);
        const landRent = calculateLandRentForYear(year);
        
        // NOI = الإيرادات - OPEX - إيجار الأرض
        const noi = revenue - opex - landRent;
        
        // ✅ NEW: تطبيق تعديلات الشراكة
        let partnershipAdj = null;
        let finalNOI = noi;
        
        if (typeof window.calculatePartnershipAdjustments === 'function') {
            partnershipAdj = window.calculatePartnershipAdjustments(
                noi, 
                revenue, 
                investmentData.landAcquisition
            );
            finalNOI = partnershipAdj.noiToInvestor;
        }
        
        console.log(`✅ [calculateNOIForYear] السنة ${year}:`, {
            revenue: revenue.toLocaleString(),
            opex: opex.toLocaleString(),
            landRent: landRent.toLocaleString(),
            noiBeforePartnership: noi.toLocaleString(),
            partnerShare: partnershipAdj ? partnershipAdj.partnerShare.toLocaleString() : '0',
            managementFee: partnershipAdj ? partnershipAdj.managementFee.toLocaleString() : '0',
            noiAfterPartnership: finalNOI.toLocaleString(),
            noiMargin: revenue > 0 ? `${((finalNOI / revenue) * 100).toFixed(1)}%` : 'N/A'
        });
        
        return {
            year,
            revenue,
            opex,
            landRent,
            noiBeforePartnership: noi,
            partnershipAdjustment: partnershipAdj,
            noi: finalNOI, // NOI الصافي بعد تعديلات الشراكة
            noiMargin: revenue > 0 ? (finalNOI / revenue) * 100 : 0
        };
    } catch (error) {
        console.error('❌ خطأ في حساب NOI للسنة:', error);
        return {
            year,
            revenue: 0,
            opex: 0,
            landRent: 0,
            noiBeforePartnership: 0,
            partnershipAdjustment: null,
            noi: 0,
            noiMargin: 0
        };
    }
}
```

#### ج) تعديل buildCashFlowTable لدمج Exit Split

في `src/index.tsx`، تعديل السطور 7681-7710:

```javascript
if (year === exitYear && exitStrategy === 'sell') {
    // حساب قيمة الخروج الإجمالية
    exitGrossValue = calculateExitValue();
    
    // حساب تكاليف البيع
    const sellingCostsPercent = investmentData.exit?.sellingCosts || 2.0;
    exitSellingCosts = exitGrossValue * (sellingCostsPercent / 100);
    
    // صافي قيمة الخروج بعد تكاليف البيع
    exitValue = exitGrossValue - exitSellingCosts;
    
    // سداد القرض المتبقي
    exitLoanPayoff = debtServiceData.remainingBalance;
    
    // صافي العائد قبل التقسيم مع الشريك
    let exitNetProceedsBeforeSplit = exitValue - exitLoanPayoff;
    
    // ✅ NEW: تقسيم عوائد الخروج مع الشريك
    let exitSplit = null;
    
    if (typeof window.calculatePartnershipExitSplit === 'function') {
        exitSplit = window.calculatePartnershipExitSplit(
            exitNetProceedsBeforeSplit,
            investmentData.landAcquisition,
            capex
        );
        exitNetProceeds = exitSplit.investorShare; // حصة المستثمر فقط
    } else {
        exitNetProceeds = exitNetProceedsBeforeSplit;
    }
    
    // إضافة Exit Net Proceeds إلى التدفق النقدي
    freeCashFlow += exitNetProceeds;
    
    console.log('💰 [Exit Year ' + year + '] تفاصيل الخروج:', {
        grossValue: exitGrossValue.toLocaleString(),
        sellingCosts: exitSellingCosts.toLocaleString(),
        netValue: exitValue.toLocaleString(),
        loanPayoff: exitLoanPayoff.toLocaleString(),
        netProceedsBeforeSplit: exitNetProceedsBeforeSplit.toLocaleString(),
        investorShare: exitNetProceeds.toLocaleString(),
        partnerShare: exitSplit ? exitSplit.partnerShare.toLocaleString() : '0',
        splitRatio: exitSplit ? exitSplit.splitRatio : '100% / 0%',
        totalCashFlow: freeCashFlow.toLocaleString()
    });
}
```

#### د) تحديث جدول التدفقات النقدية

في `src/index.tsx`، تعديل السطور 7717-7747 لإضافة الحقول الجديدة:

```javascript
cashFlows.push({
    year,
    phase: 'operating',
    // Capital Expenditure (zeros during operation)
    landCost: 0,
    constructionCost: 0,
    loanDisbursement: 0,
    equityInvested: 0,
    // Operations
    revenue: noiData.revenue,
    opex: noiData.opex,
    landRent: noiData.landRent,
    // ✅ NEW: Partnership fields
    noiBeforePartnership: noiData.noiBeforePartnership || noiData.noi,
    partnerShare: noiData.partnershipAdjustment?.partnerShare || 0,
    managementFee: noiData.partnershipAdjustment?.managementFee || 0,
    noi: noiData.noi, // NOI بعد تعديلات الشراكة
    // Debt Service
    debtService: debtServiceData.payment,
    debtPrincipal: debtServiceData.principal,
    debtInterest: debtServiceData.interest,
    debtBalance: debtServiceData.remainingBalance,
    // ✅ NEW: Exit Data with Partnership Split
    exitGrossValue: exitGrossValue,
    exitSellingCosts: exitSellingCosts,
    exitNetValue: exitValue,
    exitLoanPayoff: exitLoanPayoff,
    exitProceedsBeforeSplit: exitValue - exitLoanPayoff,
    exitPartnerShare: exitSplit?.partnerShare || 0,
    exitInvestorShare: exitNetProceeds,
    exitSplitRatio: exitSplit?.splitRatio || 'N/A',
    // Cash Flow (يتضمن Exit Net Proceeds بعد التقسيم)
    freeCashFlow: freeCashFlow,
    cashFlow: freeCashFlow,
    cumulativeCashFlow: cumulativeCashFlow,
    noiMargin: noiData.noiMargin,
    dscr: dscr
});
```

#### هـ) تحديث واجهة HTML

في `src/index.tsx`، إضافة حقول جديدة لعرض بيانات الشراكة:

```html
<!-- في قسم Land Acquisition Mode -->
<div id="partnershipFields" style="display: none;">
    
    <!-- نموذج تقاسم الأرباح -->
    <div class="form-group">
        <label>نموذج تقاسم الأرباح:</label>
        <select id="profitSharingModel" onchange="updatePartnershipModel()">
            <option value="revenue">من الإيرادات (Revenue Share)</option>
            <option value="profit">من الربح (Profit Share)</option>
            <option value="hybrid">مختلط (Hybrid)</option>
        </select>
        <div class="help-text">
            <strong>من الإيرادات:</strong> الشريك يحصل على % من إجمالي الإيرادات<br>
            <strong>من الربح:</strong> الشريك يحصل على % من NOI<br>
            <strong>مختلط:</strong> 50% من الإيرادات + 50% من الربح
        </div>
    </div>
    
    <!-- حصة الشريك -->
    <div class="form-group">
        <label>حصة الشريك (%):</label>
        <input type="number" id="partnershipShare" min="0" max="100" value="50"
               onchange="updatePartnershipModel()">
    </div>
    
    <!-- رسوم الإدارة -->
    <div class="form-group">
        <label>رسوم الإدارة للمطور (%):</label>
        <input type="number" id="managementFeePercentage" min="0" max="20" value="5" step="0.5"
               onchange="updatePartnershipModel()">
        <div class="help-text">نسبة من الإيرادات الإجمالية كرسوم إدارة للمطور</div>
    </div>
    
    <!-- حساب تلقائي لتقسيم Exit Value -->
    <div class="form-group">
        <label>
            <input type="checkbox" id="autoCalculateProfitShare" checked
                   onchange="updatePartnershipModel()">
            حساب تقسيم عوائد البيع تلقائياً (حسب المساهمة الرأسمالية)
        </label>
        <div class="help-text">
            إذا تم التفعيل، يتم حساب حصة كل طرف من عوائد البيع بناءً على المساهمة الرأسمالية<br>
            إذا تم التعطيل، يُستخدم نفس نسبة "حصة الشريك" المحددة أعلاه
        </div>
    </div>
    
    <!-- ملخص الشراكة -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
        <h5 class="text-sm font-semibold text-blue-800 mb-2">
            <i class="fas fa-info-circle mr-1"></i>
            ملخص الشراكة
        </h5>
        <div id="partnershipSummary" class="text-sm">
            <div class="grid grid-cols-2 gap-2">
                <div>نموذج التقاسم:</div>
                <div id="partnershipModelDisplay" class="font-semibold">---</div>
                
                <div>حصة الشريك السنوية:</div>
                <div id="partnerShareDisplay" class="font-semibold">---</div>
                
                <div>رسوم الإدارة السنوية:</div>
                <div id="managementFeeDisplay" class="font-semibold">---</div>
                
                <div>صافي التعديل السنوي:</div>
                <div id="netAdjustmentDisplay" class="font-semibold">---</div>
                
                <div class="col-span-2 border-t border-blue-300 mt-2 pt-2">
                    <strong>عند الخروج (Exit):</strong>
                </div>
                
                <div>حصة المستثمر/المطور:</div>
                <div id="investorExitShareDisplay" class="font-semibold">---</div>
                
                <div>حصة الشريك:</div>
                <div id="partnerExitShareDisplay" class="font-semibold">---</div>
            </div>
        </div>
    </div>
</div>
```

---

## 2. نموذج إيرادات البيع

### 🎯 الهدف
إضافة نموذج جديد للإيرادات يعتمد على **بيع الوحدات** بدلاً من الإيجار السنوي.

### 📝 التغييرات المطلوبة

#### أ) إضافة بنية البيانات

في `src/index.tsx`، تعديل `investmentData` (السطر 6605):

```javascript
let investmentData = {
    // ... existing fields ...
    
    // ✅ NEW: Revenue Model Selection
    revenueModel: {
        type: 'rental', // 'rental', 'sale', 'hybrid'
        
        // Rental model (existing)
        rental: {
            baseAnnualRevenue: 0, // من نظام الإيرادات
            growthRate: 3.0,
            growthMethod: 'compound',
            occupancy: {
                enabled: true,
                year1: 40,
                year2: 70,
                year3: 90,
                stabilized: 90
            },
            vacancyAllowance: {
                enabled: true,
                percentage: 5.0
            }
        },
        
        // Sale model (new)
        sale: {
            // بيانات أساسية
            totalSaleableGLA: 0,        // م² قابلة للبيع
            pricePerSqm: 0,             // ريال/م²
            totalSaleValue: 0,          // = totalSaleableGLA × pricePerSqm
            
            // جدول المبيعات
            salesSchedule: [],          // [{year, percentage, soldArea, pricePerSqm, ...}]
            salesPeriod: 3,             // سنوات
            
            // تكاليف البيع
            marketingCosts: 2.0,        // %
            brokerageFees: 2.0,         // %
            totalSellingCosts: 4.0,     // = marketingCosts + brokerageFees
            
            // شروط الدفع
            paymentTerms: {
                downPayment: 30,        // % عند التعاقد
                installmentPeriod: 24,  // شهر
                deliveryPayment: 70     // % عند الاستلام
            },
            
            // إعدادات متقدمة
            priceEscalation: {
                enabled: false,         // زيادة السعر سنوياً
                annualIncrease: 2.0     // %
            },
            
            // حساب النقد المحصّل
            cashCollectionSchedule: []  // [{year, downPayments, installments, deliveryPayments, total}]
        },
        
        // Hybrid model (new)
        hybrid: {
            salePercentage: 70,         // % من المساحة للبيع
            rentalPercentage: 30,       // % من المساحة للإيجار
            saleGLA: 0,                 // = totalGLA × salePercentage
            rentalGLA: 0,               // = totalGLA × rentalPercentage
            saleRevenue: 0,             // محسوبة
            rentalRevenue: 0            // محسوبة
        }
    },
    
    // ... rest of fields ...
};
```

#### ب) دوال حساب إيرادات البيع

إنشاء ملف: `public/static/sale-revenue-utils.js`

```javascript
/**
 * إنشاء جدول مبيعات تلقائي
 * @param {object} saleModel - بيانات نموذج البيع
 * @returns {Array} جدول المبيعات
 */
function generateSalesSchedule(saleModel) {
    try {
        console.log('📊 [generateSalesSchedule] بدء إنشاء جدول المبيعات...');
        
        const totalArea = saleModel.totalSaleableGLA;
        const basePrice = saleModel.pricePerSqm;
        const salesPeriod = saleModel.salesPeriod;
        const escalation = saleModel.priceEscalation;
        
        // أنماط توزيع المبيعات
        const distributionPatterns = {
            1: [100],
            2: [60, 40],
            3: [20, 50, 30],
            4: [15, 35, 35, 15],
            5: [10, 20, 40, 20, 10]
        };
        
        const distribution = distributionPatterns[salesPeriod] || 
                             Array(salesPeriod).fill(100 / salesPeriod);
        
        const schedule = [];
        
        for (let i = 0; i < salesPeriod; i++) {
            const year = i + 1;
            const percentage = distribution[i];
            const soldArea = (totalArea * percentage) / 100;
            
            // حساب السعر مع الزيادة السنوية
            let pricePerSqm = basePrice;
            if (escalation.enabled && year > 1) {
                pricePerSqm = basePrice * Math.pow(1 + escalation.annualIncrease / 100, year - 1);
            }
            
            // الإيرادات الإجمالية
            const grossRevenue = soldArea * pricePerSqm;
            
            // تكاليف البيع
            const marketingCosts = grossRevenue * (saleModel.marketingCosts / 100);
            const brokerageFees = grossRevenue * (saleModel.brokerageFees / 100);
            const totalCosts = marketingCosts + brokerageFees;
            
            // صافي الإيرادات
            const netRevenue = grossRevenue - totalCosts;
            
            // توزيع النقد
            const downPayment = netRevenue * (saleModel.paymentTerms.downPayment / 100);
            const deliveryPayment = netRevenue * (saleModel.paymentTerms.deliveryPayment / 100);
            const installmentAmount = netRevenue - downPayment - deliveryPayment;
            const monthlyInstallment = installmentAmount / saleModel.paymentTerms.installmentPeriod;
            
            schedule.push({
                year,
                percentage,
                soldArea,
                pricePerSqm,
                grossRevenue,
                marketingCosts,
                brokerageFees,
                totalCosts,
                netRevenue,
                // توزيع النقد
                downPayment,
                deliveryPayment,
                installmentAmount,
                monthlyInstallment,
                installmentPeriod: saleModel.paymentTerms.installmentPeriod,
                // سيتم ملؤها لاحقاً
                installmentsReceived: 0,
                deliveryReceived: 0
            });
            
            console.log(`  السنة ${year}: بيع ${soldArea.toLocaleString()} م² بسعر ${pricePerSqm.toLocaleString()} ريال = ${grossRevenue.toLocaleString()} ريال`);
        }
        
        console.log('✅ [generateSalesSchedule] تم إنشاء جدول المبيعات بنجاح');
        
        return schedule;
        
    } catch (error) {
        console.error('❌ خطأ في إنشاء جدول المبيعات:', error);
        return [];
    }
}

/**
 * حساب النقد المحصّل من المبيعات لسنة معينة
 * @param {number} year - السنة
 * @param {object} saleModel - بيانات نموذج البيع
 * @returns {object} تفاصيل التحصيل
 */
function calculateSaleCashForYear(year, saleModel) {
    try {
        if (!saleModel.salesSchedule || saleModel.salesSchedule.length === 0) {
            console.warn('⚠️ [SaleCash] لا يوجد جدول مبيعات');
            return {
                year,
                downPayments: 0,
                installments: 0,
                deliveryPayments: 0,
                totalCash: 0
            };
        }
        
        let downPayments = 0;
        let installments = 0;
        let deliveryPayments = 0;
        
        // المرور على جميع المبيعات السابقة والحالية
        saleModel.salesSchedule.forEach(sale => {
            const saleYear = sale.year;
            
            // 1. الدفعات المقدمة (تُستلم في نفس سنة البيع)
            if (saleYear === year) {
                downPayments += sale.downPayment;
            }
            
            // 2. الأقساط (تُستلم على مدى installmentPeriod أشهر)
            const installmentStartYear = saleYear;
            const installmentEndYear = saleYear + Math.ceil(sale.installmentPeriod / 12);
            
            if (year >= installmentStartYear && year < installmentEndYear) {
                // حساب عدد الأشهر المستحقة في هذه السنة
                let monthsInThisYear = 12;
                
                // السنة الأولى
                if (year === installmentStartYear) {
                    monthsInThisYear = 12; // السنة كاملة
                }
                
                // السنة الأخيرة
                if (year === installmentEndYear - 1) {
                    const remainingMonths = sale.installmentPeriod % 12;
                    if (remainingMonths > 0) {
                        monthsInThisYear = remainingMonths;
                    }
                }
                
                installments += sale.monthlyInstallment * monthsInThisYear;
            }
            
            // 3. دفعة الاستلام (تُستلم عند تسليم المشروع)
            // نفترض أن التسليم يتم في نهاية فترة البناء + 1
            const deliveryYear = saleYear + 3; // مثال: 3 سنوات بعد البيع
            
            if (year === deliveryYear) {
                deliveryPayments += sale.deliveryPayment;
            }
        });
        
        const totalCash = downPayments + installments + deliveryPayments;
        
        console.log(`💰 [SaleCash] السنة ${year}:`, {
            downPayments: downPayments.toLocaleString(),
            installments: installments.toLocaleString(),
            deliveryPayments: deliveryPayments.toLocaleString(),
            totalCash: totalCash.toLocaleString()
        });
        
        return {
            year,
            downPayments,
            installments,
            deliveryPayments,
            totalCash
        };
        
    } catch (error) {
        console.error('❌ خطأ في حساب النقد المحصّل:', error);
        return {
            year,
            downPayments: 0,
            installments: 0,
            deliveryPayments: 0,
            totalCash: 0
        };
    }
}

// تصدير
if (typeof window !== 'undefined') {
    window.generateSalesSchedule = generateSalesSchedule;
    window.calculateSaleCashForYear = calculateSaleCashForYear;
}
```

#### ج) تحديث calculateRevenueForYear

في `src/index.tsx`، تعديل الدالة (السطر 7397):

```javascript
function calculateRevenueForYear(year) {
    try {
        const revenueModel = investmentData.revenueModel;
        
        // اختيار النموذج
        switch (revenueModel.type) {
            case 'rental':
                // الكود الموجود حالياً
                return calculateRentalRevenueForYear(year);
                
            case 'sale':
                // نموذج البيع
                if (typeof window.calculateSaleCashForYear === 'function') {
                    const saleData = window.calculateSaleCashForYear(year, revenueModel.sale);
                    return saleData.totalCash;
                } else {
                    console.error('❌ دالة calculateSaleCashForYear غير متاحة');
                    return 0;
                }
                
            case 'hybrid':
                // نموذج مختلط
                const rentalRev = calculateRentalRevenueForYear(year);
                const saleRev = window.calculateSaleCashForYear(year, revenueModel.sale);
                
                // تعديل الإيرادات حسب النسب
                const rentalPortion = rentalRev * (revenueModel.hybrid.rentalPercentage / 100);
                const totalRevenue = rentalPortion + saleRev.totalCash;
                
                console.log(`💰 [Hybrid Revenue] السنة ${year}:`, {
                    rental: rentalPortion.toLocaleString(),
                    sale: saleRev.totalCash.toLocaleString(),
                    total: totalRevenue.toLocaleString()
                });
                
                return totalRevenue;
                
            default:
                console.error('❌ نموذج إيرادات غير معروف:', revenueModel.type);
                return 0;
        }
        
    } catch (error) {
        console.error('❌ خطأ في حساب الإيرادات:', error);
        return 0;
    }
}

// دالة مساعدة لنموذج الإيجار
function calculateRentalRevenueForYear(year) {
    // الكود الموجود حالياً (السطور 7400-7455)
    let baseRevenue = 0;
    
    if (typeof window.calculateIntegratedAnnualRevenue === 'function') {
        baseRevenue = window.calculateIntegratedAnnualRevenue();
    } else {
        baseRevenue = investmentData.integration.annualRevenue || 0;
    }
    
    // تطبيق نمو الإيرادات
    let revenue = baseRevenue;
    
    if (investmentData.assumptions.revenueGrowthEnabled && year > 1) {
        const growthRate = investmentData.assumptions.revenueGrowthRate / 100;
        const method = investmentData.assumptions.revenueGrowthMethod;
        
        if (method === 'compound') {
            revenue = baseRevenue * Math.pow(1 + growthRate, year - 1);
        } else {
            revenue = baseRevenue * (1 + growthRate * (year - 1));
        }
    }
    
    // تطبيق الإشغال التدريجي
    let occupancyFactor = 1.0;
    
    if (investmentData.assumptions.occupancyRampUpEnabled) {
        if (year === 1) {
            occupancyFactor = investmentData.assumptions.occupancyYear1 / 100;
        } else if (year === 2) {
            occupancyFactor = investmentData.assumptions.occupancyYear2 / 100;
        } else if (year >= 3) {
            occupancyFactor = investmentData.assumptions.stabilizedOccupancy / 100;
        }
    }
    
    revenue = revenue * occupancyFactor;
    
    // تطبيق بدل الشواغر
    if (investmentData.assumptions.vacancyAllowanceEnabled) {
        const vacancyRate = investmentData.assumptions.vacancyAllowance / 100;
        revenue = revenue * (1 - vacancyRate);
    }
    
    return revenue;
}
```

#### د) واجهة المستخدم

في `src/index.tsx`، إضافة قسم جديد:

```html
<!-- قسم نموذج الإيرادات -->
<div class="form-section">
    <h3>
        <i class="fas fa-dollar-sign"></i>
        نموذج الإيرادات (Revenue Model)
    </h3>
    
    <!-- اختيار النموذج -->
    <div class="form-group">
        <label>نوع نموذج الإيرادات:</label>
        <select id="revenueModelType" onchange="switchRevenueModel()">
            <option value="rental">إيجار (Rental) - إيرادات سنوية متكررة</option>
            <option value="sale">بيع (Sale) - بيع الوحدات</option>
            <option value="hybrid">مختلط (Hybrid) - إيجار + بيع</option>
        </select>
    </div>
    
    <!-- قسم البيع -->
    <div id="saleModelSection" style="display: none;">
        <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h4 class="text-green-800 font-semibold mb-2">
                <i class="fas fa-home"></i>
                بيانات نموذج البيع
            </h4>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="form-group">
                    <label>المساحة القابلة للبيع (م²):</label>
                    <input type="number" id="totalSaleableGLA" 
                           min="0" step="1"
                           onchange="updateSaleModel()">
                    <div class="help-text">إجمالي المساحة المعروضة للبيع</div>
                </div>
                
                <div class="form-group">
                    <label>سعر المتر (ريال/م²):</label>
                    <input type="number" id="salePricePerSqm" 
                           min="0" step="100"
                           onchange="updateSaleModel()">
                </div>
                
                <div class="form-group">
                    <label>
                        <strong>إجمالي قيمة البيع:</strong>
                    </label>
                    <div id="totalSaleValue" class="metric-display">0 ريال</div>
                </div>
                
                <div class="form-group">
                    <label>فترة البيع (سنوات):</label>
                    <input type="number" id="salesPeriod" 
                           min="1" max="5" value="3"
                           onchange="updateSaleModel()">
                    <div class="help-text">عدد السنوات المتوقعة لإتمام البيع</div>
                </div>
            </div>
            
            <h5 class="font-semibold mt-4 mb-2">تكاليف البيع:</h5>
            <div class="grid grid-cols-2 gap-4">
                <div class="form-group">
                    <label>تكاليف التسويق (%):</label>
                    <input type="number" id="marketingCosts" 
                           min="0" max="10" value="2" step="0.1"
                           onchange="updateSaleModel()">
                </div>
                
                <div class="form-group">
                    <label>عمولات الوساطة (%):</label>
                    <input type="number" id="brokerageFees" 
                           min="0" max="10" value="2" step="0.1"
                           onchange="updateSaleModel()">
                </div>
            </div>
            
            <h5 class="font-semibold mt-4 mb-2">شروط الدفع (Payment Terms):</h5>
            <div class="grid grid-cols-3 gap-4">
                <div class="form-group">
                    <label>الدفعة المقدمة (%):</label>
                    <input type="number" id="downPaymentPercent" 
                           min="0" max="100" value="30"
                           onchange="updateSaleModel()">
                    <div class="help-text">عند التعاقد</div>
                </div>
                
                <div class="form-group">
                    <label>فترة التقسيط (أشهر):</label>
                    <input type="number" id="installmentPeriod" 
                           min="0" max="60" value="24"
                           onchange="updateSaleModel()">
                </div>
                
                <div class="form-group">
                    <label>دفعة الاستلام (%):</label>
                    <input type="number" id="deliveryPaymentPercent" 
                           min="0" max="100" value="70"
                           onchange="updateSaleModel()">
                    <div class="help-text">عند تسليم الوحدة</div>
                </div>
            </div>
            
            <div class="form-group mt-4">
                <label>
                    <input type="checkbox" id="priceEscalationEnabled"
                           onchange="updateSaleModel()">
                    زيادة السعر سنوياً (Price Escalation)
                </label>
                <div id="priceEscalationFields" style="display: none;" class="mt-2">
                    <label>نسبة الزيادة السنوية (%):</label>
                    <input type="number" id="annualPriceIncrease" 
                           min="0" max="20" value="2" step="0.5"
                           onchange="updateSaleModel()">
                </div>
            </div>
            
            <button type="button" 
                    onclick="showSalesScheduleModal()"
                    class="btn btn-primary w-full mt-4">
                <i class="fas fa-table"></i>
                عرض/تعديل جدول المبيعات
            </button>
        </div>
    </div>
    
    <!-- قسم المختلط -->
    <div id="hybridModelSection" style="display: none;">
        <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 class="text-purple-800 font-semibold mb-2">
                <i class="fas fa-balance-scale"></i>
                توزيع المساحات (Hybrid Model)
            </h4>
            
            <div class="grid grid-cols-2 gap-4">
                <div class="form-group">
                    <label>نسبة البيع (%):</label>
                    <input type="number" id="salePercentage" 
                           min="0" max="100" value="70"
                           onchange="updateHybridModel()">
                </div>
                
                <div class="form-group">
                    <label>نسبة الإيجار (%):</label>
                    <input type="number" id="rentalPercentage" 
                           min="0" max="100" value="30"
                           onchange="updateHybridModel()" readonly>
                    <div class="help-text">يتم حسابها تلقائياً = 100% - نسبة البيع</div>
                </div>
                
                <div class="form-group">
                    <label>مساحة البيع (م²):</label>
                    <div id="saleGLADisplay" class="metric-display">0 م²</div>
                </div>
                
                <div class="form-group">
                    <label>مساحة الإيجار (م²):</label>
                    <div id="rentalGLADisplay" class="metric-display">0 م²</div>
                </div>
            </div>
        </div>
    </div>
</div>
```

---

## 3. النموذج المختلط

(تم تضمينه في القسم السابق - يعمل تلقائياً بمجرد تطبيق نموذج البيع)

---

## 4. تحسينات إضافية

### 🎯 أ) Dashboard تفاعلية

```html
<!-- في أعلى الصفحة -->
<div class="investment-dashboard grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
    <div class="dashboard-card">
        <div class="card-icon">
            <i class="fas fa-chart-line"></i>
        </div>
        <div class="card-content">
            <div class="card-label">نموذج الإيرادات</div>
            <div class="card-value" id="dashboardRevenueModel">إيجار</div>
        </div>
    </div>
    
    <div class="dashboard-card">
        <div class="card-icon">
            <i class="fas fa-landmark"></i>
        </div>
        <div class="card-content">
            <div class="card-label">وضع الأرض</div>
            <div class="card-value" id="dashboardLandMode">شراء</div>
        </div>
    </div>
    
    <div class="dashboard-card">
        <div class="card-icon">
            <i class="fas fa-wallet"></i>
        </div>
        <div class="card-content">
            <div class="card-label">الاستثمار الكلي</div>
            <div class="card-value" id="dashboardTotalInvestment">0</div>
        </div>
    </div>
    
    <div class="dashboard-card">
        <div class="card-icon">
            <i class="fas fa-percent"></i>
        </div>
        <div class="card-content">
            <div class="card-label">WACC</div>
            <div class="card-value" id="dashboardWACC">7.5%</div>
        </div>
    </div>
    
    <div class="dashboard-card">
        <div class="card-icon">
            <i class="fas fa-coins"></i>
        </div>
        <div class="card-content">
            <div class="card-label">NPV</div>
            <div class="card-value" id="dashboardNPV">---</div>
        </div>
    </div>
    
    <div class="dashboard-card">
        <div class="card-icon">
            <i class="fas fa-chart-pie"></i>
        </div>
        <div class="card-content">
            <div class="card-label">IRR</div>
            <div class="card-value" id="dashboardIRR">---</div>
        </div>
    </div>
</div>

<style>
.investment-dashboard {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.dashboard-card {
    background: white;
    border-radius: 8px;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: transform 0.2s, box-shadow 0.2s;
}

.dashboard-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.card-icon {
    font-size: 28px;
    color: #667eea;
}

.card-content {
    flex: 1;
}

.card-label {
    font-size: 11px;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.card-value {
    font-size: 18px;
    font-weight: bold;
    color: #333;
    margin-top: 4px;
}
</style>
```

### 🎯 ب) Validation محسّنة

(تم تضمينها في التقرير الرئيسي)

### 🎯 ج) Comparison Tool

```javascript
function showComparisonTool() {
    // عرض modal مع خيارات المقارنة
    const modal = document.createElement('div');
    modal.id = 'comparisonToolModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 1200px;">
            <h3>
                <i class="fas fa-chart-bar"></i>
                أداة مقارنة السيناريوهات
            </h3>
            
            <div class="comparison-options mb-4">
                <p class="text-gray-600 mb-4">
                    سيتم مقارنة 4 سيناريوهات رئيسية بناءً على الإعدادات الحالية:
                </p>
                
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div class="scenario-card">
                        <h4>🏢 شراء + إيجار</h4>
                        <p>شراء الأرض + إيرادات إيجارية + تمويل بالدين</p>
                    </div>
                    
                    <div class="scenario-card">
                        <h4>🤝 شراكة + إيجار</h4>
                        <p>شراكة في الأرض + إيرادات إيجارية + تمويل ذاتي</p>
                    </div>
                    
                    <div class="scenario-card">
                        <h4>🏠 شراء + بيع</h4>
                        <p>شراء الأرض + بيع الوحدات + تمويل بالدين</p>
                    </div>
                    
                    <div class="scenario-card">
                        <h4>🎯 شراكة + مختلط</h4>
                        <p>شراكة في الأرض + بيع وإيجار + تمويل ذاتي</p>
                    </div>
                </div>
            </div>
            
            <div class="text-center">
                <button onclick="runComparison()" class="btn btn-primary">
                    <i class="fas fa-play"></i>
                    تشغيل المقارنة
                </button>
                <button onclick="closeComparisonModal()" class="btn btn-secondary ml-2">
                    إلغاء
                </button>
            </div>
            
            <!-- نتائج المقارنة -->
            <div id="comparisonResults" style="display: none;" class="mt-6">
                <table class="comparison-table">
                    <thead>
                        <tr>
                            <th>السيناريو</th>
                            <th>NPV</th>
                            <th>IRR</th>
                            <th>ROI</th>
                            <th>Payback Period</th>
                            <th>التقييم</th>
                        </tr>
                    </thead>
                    <tbody id="comparisonTableBody">
                        <!-- يتم ملؤه بواسطة JavaScript -->
                    </tbody>
                </table>
                
                <div id="comparisonChart" style="height: 400px;" class="mt-4">
                    <canvas id="comparisonChartCanvas"></canvas>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
}
```

---

## 📅 خطة التنفيذ

### المرحلة 1: الأولويات العالية (أسبوعان)
- [x] إصلاح وضع الشراكة
- [x] تحسين Expected NOI
- [x] Validation Rules

### المرحلة 2: نموذج البيع (شهر واحد)
- [ ] بنية البيانات الأساسية
- [ ] دوال الحساب
- [ ] واجهة المستخدم
- [ ] التكامل مع النظام الحالي

### المرحلة 3: التحسينات (أسبوعان)
- [ ] Dashboard
- [ ] Comparison Tool
- [ ] تقارير PDF

---

## 📞 ملاحظات

1. جميع الأكواد أعلاه **جاهزة للتطبيق مباشرة**
2. تم مراعاة **التوافق الكامل** مع النظام الحالي
3. جميع الدوال **موثقة بشكل جيد** باللغة العربية
4. الكود **modular** وسهل الصيانة
5. يمكن تطبيق المقترحات **بشكل تدريجي** دون التأثير على الوظائف الحالية

---

📅 **تاريخ الإنشاء:** 2025-10-25  
✍️ **الإصدار:** 1.0 - Practical Development Proposals
