# 📊 تقرير فحص شامل: نظام الاستثمار والتمويل وتكاليف الأرض

## 🔍 ملخص تنفيذي

تم إجراء فحص شامل لنظام دراسة الجدوى العقارية، وتحديداً للمكون السابع (الاستثمار والتمويل وتكاليف الأرض). النظام مصمم بشكل احترافي مع **وجود ترابط قوي بين المكونات**، ولكن تم رصد **فرص للتطوير والتحسين** خصوصاً لدعم سيناريو **إيرادات البيع** بالإضافة إلى الإيجار الحالي.

---

## 📋 الجزء الأول: آلية الحساب التفصيلية

### 1️⃣ **تكلفة الأرض (Land Acquisition)**

#### الأوضاع الثلاثة المدعومة:

##### **أ) الشراء (Purchase)**
```javascript
landCost = purchasePrice × landArea

مثال:
- سعر المتر: 1,500 ريال
- المساحة: 10,000 م²
- التكلفة الكلية: 15,000,000 ريال
```

**الموقع في جدول التدفقات:**
- السنة 0 (قبل البناء): تدفق خارج = -15,000,000 ريال

##### **ب) الشراكة (Partnership)**
```javascript
landCost = landValuePerSqm × landArea

مثال:
- قيمة المتر (للشريك): 2,000 ريال
- المساحة: 10,000 م²
- قيمة الأرض: 20,000,000 ريال

// يتم احتساب حصة الشريك من الأرباح/الإيرادات
partnershipShare = 50% (يمكن تعديله)
```

**ملاحظة مهمة:** في وضع الشراكة، تُحتسب قيمة الأرض كتكلفة رأسمالية في CAPEX.

##### **ج) الإيجار (Lease)**
```javascript
landCost = 0 // لا توجد تكلفة رأسمالية

// لكن يوجد إيجار سنوي:
yearlyRent = annualRent × landArea

// مع زيادات دورية:
currentRent = baseRent × (1 + increaseRate)^(numberOfIncrements)
```

**مثال:**
- إيجار سنوي: 150 ريال/م²
- المساحة: 10,000 م²
- الإيجار السنوي: 1,500,000 ريال
- زيادة كل 3 سنوات بنسبة 5%

**الموقع في جدول التدفقات:**
- السنة 1-20: تدفق خارج سنوي يُخصم من NOI

---

### 2️⃣ **تكلفة البناء (Construction Cost)**

#### التوزيع على فترة البناء:

```javascript
totalConstructionCost = integration.constructionCost

// توزيع افتراضي لـ 3 سنوات:
السنة -3: 30% = 3,000,000 ريال
السنة -2: 50% = 5,000,000 ريال
السنة -1: 20% = 2,000,000 ريال
```

#### أنماط التوزيع المدعومة:

| فترة البناء | التوزيع الافتراضي |
|--------------|-------------------|
| سنة واحدة | 100% |
| سنتان | 40% - 60% |
| 3 سنوات | 30% - 50% - 20% |
| 4 سنوات | 20% - 30% - 30% - 20% |
| 5 سنوات | 15% - 20% - 30% - 20% - 15% |

**ملاحظة:** يمكن للمستخدم تعديل التوزيع يدوياً من الواجهة.

---

### 3️⃣ **التمويل بالدين (Debt Financing)**

#### معادلات خدمة الدين:

##### **أ) القسط الثابت (Annuity)**
```javascript
// الدفعة الثابتة السنوية:
PMT = P × [r(1+r)^n] / [(1+r)^n - 1]

حيث:
P = مبلغ القرض (Loan Amount)
r = معدل الفائدة السنوي (Interest Rate)
n = عدد السنوات (Loan Period)

مثال:
- القرض: 50,000,000 ريال
- الفائدة: 5.5%
- المدة: 15 سنة
- الدفعة السنوية: ~4,945,000 ريال
```

##### **ب) القسط المتناقص (Linear)**
```javascript
// الأصل الثابت سنوياً:
principalPayment = loanAmount / loanPeriod

// الفائدة على الرصيد:
interestPayment = remainingBalance × interestRate

// الدفعة الكلية (تتناقص سنوياً):
totalPayment = principalPayment + interestPayment
```

#### فترة السماح (Grace Period):

```javascript
// ثلاثة أنواع:
1. none: لا توجد فترة سماح
2. interest-only: دفع الفائدة فقط (لا يُسدد الأصل)
3. full: لا دفعات على الإطلاق (الفائدة تُضاف للأصل)
```

---

### 4️⃣ **حساب التدفقات التشغيلية**

#### صافي الدخل التشغيلي (NOI):

```javascript
NOI = Revenue - OPEX - LandRent

// تفصيل الإيرادات:
revenue = baseRevenue 
          × (1 + growthRate)^(year-1)  // نمو مركب
          × occupancyFactor            // إشغال تدريجي
          × (1 - vacancyAllowance)     // بدل شواغر

// تفصيل النفقات:
opex = baseOpex × (1 + inflationRate)^(year-1)

// إيجار الأرض (إن وُجد):
landRent = annualRent × landArea × (1 + increaseRate)^increments
```

**مثال للسنة الثالثة:**
```javascript
// الإيرادات:
baseRevenue = 30,000,000 ريال
بعد النمو (3%): 30,000,000 × 1.03² = 31,827,000 ريال
الإشغال (90%): 31,827,000 × 0.9 = 28,644,300 ريال
بدل الشواغر (5%): 28,644,300 × 0.95 = 27,212,085 ريال

// النفقات:
baseOpex = 5,000,000 ريال
مع التضخم (2.5%): 5,000,000 × 1.025² = 5,253,125 ريال

// إيجار الأرض (إن وُجد):
landRent = 150 × 10,000 = 1,500,000 ريال

// NOI:
NOI = 27,212,085 - 5,253,125 - 1,500,000 = 20,458,960 ريال
```

---

### 5️⃣ **التدفق النقدي الحر (FCF)**

```javascript
FCF = NOI - DebtService + ExitValue (في سنة الخروج)

// مثال للسنة الثالثة (بدون خروج):
NOI = 20,458,960 ريال
DebtService = 4,945,000 ريال
FCF = 15,513,960 ريال

// مثال للسنة 10 (سنة الخروج):
NOI = 25,000,000 ريال
DebtService = 4,945,000 ريال
ExitValue = 150,000,000 ريال (إجمالي)
SellingCosts = 3,000,000 ريال (2%)
LoanPayoff = 30,000,000 ريال (الرصيد المتبقي)
NetProceeds = 150,000,000 - 3,000,000 - 30,000,000 = 117,000,000

FCF = 25,000,000 - 4,945,000 + 117,000,000 = 137,055,000 ريال
```

---

### 6️⃣ **حساب WACC و NPV**

#### WACC:
```javascript
WACC = (E/V × Re) + (D/V × Rd × (1 - Tc))

مثال:
- Equity = 30%, Cost = 12%
- Debt = 70%, Cost = 5.5%, Tax = 0%
- WACC = (0.3 × 12) + (0.7 × 5.5 × 1) = 7.45%
```

#### NPV:
```javascript
NPV = Σ [FCF_t / (1 + WACC)^t]

// لاحظ: الترقيم الزمني الصحيح:
السنة 0: t = 0
السنة -3 (بناء): t = 3
السنة -2 (بناء): t = 2
السنة -1 (بناء): t = 1
السنة 1 (تشغيل): t = 4
السنة 2 (تشغيل): t = 5
...

PV(السنة 1) = FCF₁ / (1.0745)⁴
PV(السنة 10) = FCF₁₀ / (1.0745)¹³

NPV = مجموع جميع القيم الحالية
```

---

## 🔗 الجزء الثاني: الترابط بين المكونات

### ✅ **مكونات مترابطة بشكل ممتاز:**

#### 1. **Integration Layer** → **CAPEX**
```javascript
landArea (من المكون 2) → landCost = purchasePrice × landArea
constructionCost (من المكون 3) → totalConstructionCost
annualRevenue (من المكون 4) → revenueForYear
```

#### 2. **CAPEX** → **Cash Flow**
```javascript
landCost → Year 0 cash outflow
constructionSchedule → Years -3,-2,-1 cash outflows
loanAmount → Year 0 cash inflow
```

#### 3. **Revenue System** → **NOI**
```javascript
calculateIntegratedAnnualRevenue() → baseRevenue
+ growth + occupancy + vacancy → revenue
```

#### 4. **OPEX System** → **NOI**
```javascript
calculateOpexSummary() → baseOpex
+ inflation → opex
```

#### 5. **NOI + Debt Service** → **FCF**
```javascript
NOI - debtService → freeCashFlow (basic)
+ exitValue (في سنة الخروج) → freeCashFlow (final)
```

#### 6. **FCF + WACC** → **NPV/IRR**
```javascript
freeCashFlows[] + calculatedWACC → NPV
freeCashFlows[] + Newton-Raphson → IRR
```

### ⚠️ **نقاط ضعف محتملة في الترابط:**

#### 1. **إيجار الأرض في وضع الإيجار**
```javascript
// ❌ المشكلة المحتملة:
في calculateLandRentForYear()، يتم حساب الإيجار السنوي
ولكن لا يوجد validation أن landAcquisition.mode === 'lease'

// ✅ الحل المقترح:
إضافة check في calculateNOIForYear():
if (landAcq.mode === 'lease') {
    landRent = calculateLandRentForYear(year);
} else {
    landRent = 0;
}
```

#### 2. **حصة الشريك في وضع الشراكة**
```javascript
// ⚠️ غير مطبق حالياً:
في وضع الشراكة، يُحتسب landCost لكن لا يوجد:
- خصم حصة الشريك من الإيرادات/الأرباح
- إضافة رسوم الإدارة للمطور

// 💡 مقترح التطوير:
if (landAcq.mode === 'partnership') {
    const partnerShare = revenue × (partnershipShare / 100);
    const managementFee = revenue × (managementFeePercentage / 100);
    
    // تعديل NOI:
    NOI = revenue - opex - partnerShare + managementFee;
}
```

#### 3. **Exit Value في وضع الشراكة**
```javascript
// ⚠️ لا يتم تقسيم عوائد البيع مع الشريك:
exitNetProceeds = exitValue - loanPayoff

// ✅ يجب أن يكون:
if (landAcq.mode === 'partnership') {
    developerShare = exitNetProceeds × (1 - partnershipShare/100);
    partnerShare = exitNetProceeds × (partnershipShare/100);
    FCF += developerShare; // فقط حصة المطور
}
```

---

## 🚨 الجزء الثالث: المكونات غير المترابطة

### 1️⃣ **الشراكة (Partnership Mode) - غير مكتمل**

**المتوفر حالياً:**
- ✅ حساب قيمة الأرض: `landCost = landValuePerSqm × landArea`
- ✅ تخزين بيانات الشراكة: `partnershipShare`, `managementFee`, etc.

**الناقص:**
- ❌ لا يتم خصم حصة الشريك من الإيرادات/الأرباح السنوية
- ❌ لا يتم إضافة رسوم الإدارة للمطور
- ❌ لا يتم تقسيم عوائد البيع (Exit Value) مع الشريك
- ❌ لا يوجد حساب تلقائي لحصة الشريك بناءً على المساهمة الرأسمالية

**التأثير على الحسابات:**
```javascript
// الوضع الحالي (خاطئ):
NOI = 30,000,000 - 5,000,000 = 25,000,000
FCF = 25,000,000 - 4,945,000 = 20,055,000

// الوضع الصحيح (مع شريك 50%):
NOI = 30,000,000 - 5,000,000 = 25,000,000
PartnerShare = 25,000,000 × 0.5 = 12,500,000
ManagementFee = 30,000,000 × 0.05 = 1,500,000
NetToInvestor = 25,000,000 - 12,500,000 + 1,500,000 = 14,000,000
FCF = 14,000,000 - 4,945,000 = 9,055,000

// الفرق: -11,000,000 ريال سنوياً! ❌
```

### 2️⃣ **Construction Schedule - ترتيب السنوات**

**⚠️ تحذير مهم:**
يوجد comment في الكود يشير إلى إصلاح تم عمله:
```javascript
// 🔄 إصلاح الترتيب: السنة 1 في الواجهة = أقدم سنة في التدفقات النقدية
// السنة 1 (index=0) → -3
// السنة 2 (index=1) → -2  
// السنة 3 (index=2) → -1
```

**يجب التأكد من:**
- أن المستخدم يفهم أن "السنة 1" في الواجهة = أقدم سنة
- أن التوزيع المحفوظ يتم تطبيقه بشكل صحيح
- عدم حدوث confusion بين السنوات الموجبة والسالبة

### 3️⃣ **Expected NOI - Manual vs Auto**

```javascript
// يوجد حقل يدوي:
exit.expectedNOI = 10,000,000 // input من المستخدم

// ويوجد حساب تلقائي:
updateExpectedNOIAutomatically() {
    const noiData = calculateNOIForYear(exitYear);
    // يُحدث حقل expectedNOI تلقائياً
}
```

**المشكلة:**
- إذا عدّل المستخدم NOI يدوياً، قد يتم الكتابة فوقه تلقائياً
- لا يوجد toggle واضح بين "Manual" و "Auto"

**الحل المقترح:**
```javascript
exit: {
    expectedNOIMode: 'auto', // 'auto' or 'manual'
    expectedNOIManual: 0,    // القيمة اليدوية
    expectedNOIAuto: 0,      // القيمة المحسوبة تلقائياً
    expectedNOI: 0           // القيمة المستخدمة فعلياً
}
```

---

## 💡 الجزء الرابع: مقترحات التطوير والتحسين

### 🎯 **المستوى الأول: إصلاحات عاجلة**

#### 1. **إكمال وضع الشراكة**

```javascript
// ملف جديد: partnership-calculations.js

function applyPartnershipAdjustments(noi, revenue, landAcq) {
    if (landAcq.mode !== 'partnership') {
        return {
            noiToInvestor: noi,
            partnerShare: 0,
            managementFee: 0,
            netAdjustment: 0
        };
    }
    
    let partnerShare = 0;
    let managementFee = 0;
    
    // حساب حصة الشريك
    if (landAcq.profitSharingModel === 'revenue') {
        partnerShare = revenue × (landAcq.partnershipShare / 100);
    } else if (landAcq.profitSharingModel === 'profit') {
        partnerShare = noi × (landAcq.partnershipShare / 100);
    } else { // hybrid
        const revenueShare = revenue × (landAcq.partnershipShare / 100) × 0.5;
        const profitShare = noi × (landAcq.partnershipShare / 100) × 0.5;
        partnerShare = revenueShare + profitShare;
    }
    
    // رسوم الإدارة للمطور
    managementFee = revenue × (landAcq.managementFeePercentage / 100);
    
    // NOI الصافي للمستثمر
    const noiToInvestor = noi - partnerShare + managementFee;
    
    return {
        noiToInvestor,
        partnerShare,
        managementFee,
        netAdjustment: managementFee - partnerShare
    };
}

// تعديل في buildCashFlowTable():
const noiData = calculateNOIForYear(year);
const partnershipAdj = applyPartnershipAdjustments(
    noiData.noi, 
    noiData.revenue, 
    investmentData.landAcquisition
);

// استخدام NOI المعدل:
let freeCashFlow = partnershipAdj.noiToInvestor - debtServiceData.payment;

// حفظ في جدول التدفقات:
cashFlows.push({
    ...existingFields,
    noiBeforePartnership: noiData.noi,
    partnerShare: partnershipAdj.partnerShare,
    managementFee: partnershipAdj.managementFee,
    noiAfterPartnership: partnershipAdj.noiToInvestor
});
```

#### 2. **تقسيم Exit Value مع الشريك**

```javascript
// تعديل في buildCashFlowTable() عند سنة الخروج:

if (year === exitYear && exitStrategy === 'sell') {
    exitGrossValue = calculateExitValue();
    exitSellingCosts = exitGrossValue × (sellingCostsPercent / 100);
    exitValue = exitGrossValue - exitSellingCosts;
    exitLoanPayoff = debtServiceData.remainingBalance;
    
    // ✅ NEW: تقسيم مع الشريك
    let exitNetProceeds = exitValue - exitLoanPayoff;
    
    if (landAcq.mode === 'partnership') {
        // حساب حصة كل طرف من عوائد البيع
        const totalInvestment = capex.totalCapitalRequired;
        const landValue = capex.landCost;
        const partnerContribution = landValue;
        const developerContribution = totalInvestment - landValue;
        
        // تقسيم بناءً على المساهمة الرأسمالية
        if (landAcq.autoCalculateProfitShare) {
            const developerSharePercent = (developerContribution / totalInvestment) × 100;
            exitNetProceeds = exitNetProceeds × (developerSharePercent / 100);
        } else {
            // استخدام النسبة المدخلة يدوياً
            const investorSharePercent = 100 - landAcq.partnershipShare;
            exitNetProceeds = exitNetProceeds × (investorSharePercent / 100);
        }
        
        console.log('🤝 [Exit - Partnership] تقسيم العوائد:', {
            totalProceeds: (exitValue - exitLoanPayoff).toLocaleString(),
            developerShare: exitNetProceeds.toLocaleString(),
            partnerShare: ((exitValue - exitLoanPayoff) - exitNetProceeds).toLocaleString()
        });
    }
    
    freeCashFlow += exitNetProceeds;
}
```

#### 3. **تحسين Expected NOI**

```javascript
// إضافة toggle في HTML:
<div class="form-group">
    <label>
        <input type="checkbox" 
               id="autoCalculateExpectedNOI" 
               checked
               onchange="toggleExpectedNOIMode()">
        حساب NOI المتوقع تلقائياً
    </label>
</div>

<input type="number" 
       id="expectedNOI" 
       disabled
       placeholder="سيتم الحساب تلقائياً">

// في JavaScript:
function toggleExpectedNOIMode() {
    const isAuto = document.getElementById('autoCalculateExpectedNOI').checked;
    const input = document.getElementById('expectedNOI');
    
    investmentData.exit.autoCalculateNOI = isAuto;
    input.disabled = isAuto;
    
    if (isAuto) {
        updateExpectedNOIAutomatically();
    }
}
```

---

### 🚀 **المستوى الثاني: تطوير سيناريو إيرادات البيع**

#### **السيناريو المطلوب:**
بدلاً من الإيرادات الإيجارية السنوية، المشروع يعتمد على **بيع الوحدات** (Sale Revenue).

#### **التغييرات المطلوبة:**

##### **1. إضافة Revenue Model إلى investmentData:**

```javascript
investmentData: {
    // ... existing fields
    
    // ✅ NEW: Revenue Model Selection
    revenueModel: {
        type: 'rental', // 'rental', 'sale', 'hybrid'
        
        // بيانات نموذج الإيجار (موجود حالياً)
        rental: {
            annualRevenue: 0,
            growthRate: 3.0,
            occupancy: {
                enabled: true,
                year1: 40,
                year2: 70,
                stabilized: 90
            }
        },
        
        // بيانات نموذج البيع (جديد)
        sale: {
            totalSaleableGLA: 0,        // م² قابلة للبيع
            pricePerSqm: 0,             // ريال/م²
            totalSaleValue: 0,          // إجمالي قيمة البيع
            salesSchedule: [],          // جدول المبيعات
            salesPeriod: 3,             // فترة البيع (سنوات)
            marketingCosts: 2.0,        // % تكاليف تسويق
            brokerageFees: 2.0,         // % عمولات وساطة
            paymentTerms: {
                downPayment: 30,        // % دفعة مقدمة
                installmentPeriod: 24,  // أشهر التقسيط
                deliveryPayment: 70     // % عند التسليم
            }
        },
        
        // نموذج مختلط (جديد)
        hybrid: {
            salePercentage: 70,         // % من المساحة للبيع
            rentalPercentage: 30,       // % من المساحة للإيجار
            saleGLA: 0,                 // م² للبيع
            rentalGLA: 0,               // م² للإيجار
            saleRevenue: 0,             // إيرادات البيع
            rentalRevenue: 0            // إيرادات الإيجار
        }
    }
}
```

##### **2. دالة حساب إيرادات البيع:**

```javascript
/**
 * حساب إيرادات البيع للسنة
 * @param {number} year - السنة
 * @returns {object} تفاصيل إيرادات البيع
 */
function calculateSaleRevenueForYear(year) {
    try {
        const saleModel = investmentData.revenueModel.sale;
        
        // التحقق من وجود جدول مبيعات
        if (!saleModel.salesSchedule || saleModel.salesSchedule.length === 0) {
            console.warn('⚠️ لا يوجد جدول مبيعات محدد');
            return {
                year,
                grossSaleRevenue: 0,
                marketingCosts: 0,
                brokerageFees: 0,
                netSaleRevenue: 0,
                cashReceived: 0
            };
        }
        
        // البحث عن مبيعات هذه السنة
        const yearSales = saleModel.salesSchedule.find(s => s.year === year);
        
        if (!yearSales) {
            return {
                year,
                grossSaleRevenue: 0,
                marketingCosts: 0,
                brokerageFees: 0,
                netSaleRevenue: 0,
                cashReceived: 0
            };
        }
        
        // حساب الإيرادات الإجمالية
        const grossSaleRevenue = yearSales.soldArea × yearSales.pricePerSqm;
        
        // تكاليف التسويق والوساطة
        const marketingCosts = grossSaleRevenue × (saleModel.marketingCosts / 100);
        const brokerageFees = grossSaleRevenue × (saleModel.brokerageFees / 100);
        
        // صافي الإيرادات
        const netSaleRevenue = grossSaleRevenue - marketingCosts - brokerageFees;
        
        // النقد المستلم فعلياً (حسب شروط الدفع)
        const downPayment = netSaleRevenue × (saleModel.paymentTerms.downPayment / 100);
        const installments = yearSales.installmentsReceived || 0;
        const deliveryPayment = yearSales.deliveryPayment || 0;
        
        const cashReceived = downPayment + installments + deliveryPayment;
        
        console.log(`💰 [SaleRevenue] السنة ${year}:`, {
            soldArea: yearSales.soldArea.toLocaleString() + ' م²',
            pricePerSqm: yearSales.pricePerSqm.toLocaleString(),
            grossRevenue: grossSaleRevenue.toLocaleString(),
            netRevenue: netSaleRevenue.toLocaleString(),
            cashReceived: cashReceived.toLocaleString()
        });
        
        return {
            year,
            grossSaleRevenue,
            marketingCosts,
            brokerageFees,
            netSaleRevenue,
            cashReceived,
            details: yearSales
        };
        
    } catch (error) {
        console.error('❌ خطأ في حساب إيرادات البيع:', error);
        return {
            year,
            grossSaleRevenue: 0,
            marketingCosts: 0,
            brokerageFees: 0,
            netSaleRevenue: 0,
            cashReceived: 0
        };
    }
}

window.calculateSaleRevenueForYear = calculateSaleRevenueForYear;
```

##### **3. دمج مع دالة calculateRevenueForYear الحالية:**

```javascript
function calculateRevenueForYear(year) {
    try {
        const revenueModel = investmentData.revenueModel;
        
        // اختيار النموذج المناسب
        switch (revenueModel.type) {
            case 'rental':
                // الكود الموجود حالياً
                return calculateRentalRevenueForYear(year);
                
            case 'sale':
                // استخدام نموذج البيع
                const saleData = calculateSaleRevenueForYear(year);
                return saleData.cashReceived; // النقد المستلم فقط
                
            case 'hybrid':
                // نموذج مختلط
                const rentalRev = calculateRentalRevenueForYear(year);
                const saleRev = calculateSaleRevenueForYear(year);
                
                // الإيرادات = (إيجار على المساحة المخصصة) + (مبيعات)
                const rentalPortion = rentalRev × (revenueModel.hybrid.rentalPercentage / 100);
                const totalRevenue = rentalPortion + saleRev.cashReceived;
                
                console.log(`💰 [Hybrid] السنة ${year}:`, {
                    rental: rentalPortion.toLocaleString(),
                    sale: saleRev.cashReceived.toLocaleString(),
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
```

##### **4. إنشاء جدول مبيعات تلقائي:**

```javascript
/**
 * إنشاء جدول مبيعات افتراضي
 * @returns {Array} جدول المبيعات
 */
function generateSalesSchedule() {
    try {
        const saleModel = investmentData.revenueModel.sale;
        const totalArea = saleModel.totalSaleableGLA;
        const pricePerSqm = saleModel.pricePerSqm;
        const salesPeriod = saleModel.salesPeriod;
        
        // توزيع المبيعات على الفترة
        // سنة 1: 20%، سنة 2: 50%، سنة 3: 30%
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
            const soldArea = (totalArea × percentage) / 100;
            
            // حساب الدفعات المستقبلية
            const grossRevenue = soldArea × pricePerSqm;
            const netRevenue = grossRevenue × (1 - (saleModel.marketingCosts + saleModel.brokerageFees) / 100);
            
            // توزيع النقد على سنوات التحصيل
            const downPayment = netRevenue × (saleModel.paymentTerms.downPayment / 100);
            const deliveryPayment = netRevenue × (saleModel.paymentTerms.deliveryPayment / 100);
            const installmentMonths = saleModel.paymentTerms.installmentPeriod;
            const monthlyInstallment = (netRevenue - downPayment - deliveryPayment) / installmentMonths;
            
            schedule.push({
                year: year,
                percentage: percentage,
                soldArea: soldArea,
                pricePerSqm: pricePerSqm,
                grossRevenue: grossRevenue,
                netRevenue: netRevenue,
                downPayment: downPayment,
                deliveryPayment: deliveryPayment,
                monthlyInstallment: monthlyInstallment,
                installmentPeriod: installmentMonths,
                // سيتم حساب التحصيلات السنوية لاحقاً
                installmentsReceived: 0
            });
        }
        
        console.log('📊 [SalesSchedule] تم إنشاء جدول مبيعات:', schedule);
        
        saleModel.salesSchedule = schedule;
        return schedule;
        
    } catch (error) {
        console.error('❌ خطأ في إنشاء جدول المبيعات:', error);
        return [];
    }
}

window.generateSalesSchedule = generateSalesSchedule;
```

##### **5. واجهة المستخدم لنموذج البيع:**

```html
<!-- إضافة إلى قسم Investment Parameters -->

<div class="form-section">
    <h3>نموذج الإيرادات (Revenue Model)</h3>
    
    <!-- اختيار النموذج -->
    <div class="form-group">
        <label>نوع النموذج:</label>
        <select id="revenueModelType" onchange="updateRevenueModel()">
            <option value="rental">إيجار (Rental)</option>
            <option value="sale">بيع (Sale)</option>
            <option value="hybrid">مختلط (Hybrid)</option>
        </select>
    </div>
    
    <!-- قسم البيع (يظهر عند اختيار sale أو hybrid) -->
    <div id="saleModelSection" style="display: none;">
        <h4>بيانات نموذج البيع</h4>
        
        <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
                <label>المساحة القابلة للبيع (م²):</label>
                <input type="number" id="totalSaleableGLA" 
                       onchange="updateSaleModel()">
            </div>
            
            <div class="form-group">
                <label>سعر المتر (ريال):</label>
                <input type="number" id="salePrice PerSqm" 
                       onchange="updateSaleModel()">
            </div>
            
            <div class="form-group">
                <label>فترة البيع (سنوات):</label>
                <input type="number" id="salesPeriod" 
                       min="1" max="5" value="3"
                       onchange="updateSaleModel()">
            </div>
            
            <div class="form-group">
                <label>تكاليف التسويق (%):</label>
                <input type="number" id="marketingCosts" 
                       step="0.1" value="2.0"
                       onchange="updateSaleModel()">
            </div>
            
            <div class="form-group">
                <label>عمولات الوساطة (%):</label>
                <input type="number" id="brokerageFees" 
                       step="0.1" value="2.0"
                       onchange="updateSaleModel()">
            </div>
        </div>
        
        <h5>شروط الدفع (Payment Terms)</h5>
        <div class="grid grid-cols-3 gap-4">
            <div class="form-group">
                <label>الدفعة المقدمة (%):</label>
                <input type="number" id="downPayment" 
                       value="30" onchange="updateSaleModel()">
            </div>
            
            <div class="form-group">
                <label>فترة التقسيط (أشهر):</label>
                <input type="number" id="installmentPeriod" 
                       value="24" onchange="updateSaleModel()">
            </div>
            
            <div class="form-group">
                <label>دفعة التسليم (%):</label>
                <input type="number" id="deliveryPayment" 
                       value="70" onchange="updateSaleModel()">
            </div>
        </div>
        
        <!-- جدول المبيعات -->
        <button type="button" 
                onclick="showSalesScheduleModal()"
                class="btn btn-primary mt-4">
            <i class="fas fa-table"></i>
            عرض/تعديل جدول المبيعات
        </button>
    </div>
</div>

<!-- Modal لجدول المبيعات -->
<div id="salesScheduleModal" class="modal">
    <div class="modal-content">
        <h3>جدول المبيعات (Sales Schedule)</h3>
        
        <table id="salesScheduleTable" class="data-table">
            <thead>
                <tr>
                    <th>السنة</th>
                    <th>النسبة</th>
                    <th>المساحة المباعة</th>
                    <th>السعر/م²</th>
                    <th>الإيرادات الإجمالية</th>
                    <th>التكاليف</th>
                    <th>صافي الإيرادات</th>
                    <th>الدفعة المقدمة</th>
                    <th>الأقساط</th>
                    <th>دفعة التسليم</th>
                </tr>
            </thead>
            <tbody id="salesScheduleTableBody">
                <!-- يتم ملؤه بواسطة JavaScript -->
            </tbody>
        </table>
        
        <button onclick="closeSalesScheduleModal()">إغلاق</button>
    </div>
</div>
```

##### **6. تعديل حساب NOI لنموذج البيع:**

```javascript
function calculateNOIForYear(year) {
    try {
        const revenueModel = investmentData.revenueModel;
        
        // حساب الإيرادات (إيجار أو بيع أو مختلط)
        const revenue = calculateRevenueForYear(year);
        
        // OPEX
        let opex = calculateOpexForYear(year);
        
        // ✅ تعديل: OPEX للبيع يختلف عن الإيجار
        if (revenueModel.type === 'sale') {
            // في نموذج البيع، OPEX أقل (لا توجد تكاليف تشغيل مستمرة)
            // فقط تكاليف الصيانة البسيطة حتى البيع
            opex = opex × 0.2; // 20% من OPEX العادي
        } else if (revenueModel.type === 'hybrid') {
            // تعديل OPEX حسب النسبة
            const rentalPercent = revenueModel.hybrid.rentalPercentage / 100;
            opex = opex × rentalPercent;
        }
        
        const landRent = calculateLandRentForYear(year);
        const noi = revenue - opex - landRent;
        
        console.log(`✅ [NOI] السنة ${year}:`, {
            revenueModel: revenueModel.type,
            revenue: revenue.toLocaleString(),
            opex: opex.toLocaleString(),
            landRent: landRent.toLocaleString(),
            noi: noi.toLocaleString()
        });
        
        return {
            year,
            revenue,
            opex,
            landRent,
            noi,
            noiMargin: revenue > 0 ? (noi / revenue) × 100 : 0
        };
        
    } catch (error) {
        console.error('❌ خطأ في حساب NOI:', error);
        return { year, revenue: 0, opex: 0, landRent: 0, noi: 0, noiMargin: 0 };
    }
}
```

##### **7. التعامل مع Exit Value في نموذج البيع:**

```javascript
// تعديل في buildCashFlowTable():

if (year === exitYear && exitStrategy === 'sell') {
    const revenueModel = investmentData.revenueModel;
    
    if (revenueModel.type === 'sale') {
        // ✅ في نموذج البيع، Exit Value = البيع المتبقي فقط
        const saleModel = revenueModel.sale;
        
        // حساب ما تم بيعه حتى الآن
        let soldArea = 0;
        saleModel.salesSchedule.forEach(s => {
            if (s.year <= year) {
                soldArea += s.soldArea;
            }
        });
        
        // المساحة المتبقية
        const remainingArea = saleModel.totalSaleableGLA - soldArea;
        
        if (remainingArea > 0) {
            // بيع المتبقي بسعر خروج (قد يكون أقل من السعر الأصلي)
            const exitDiscount = 0.9; // خصم 10% للبيع السريع
            exitGrossValue = remainingArea × saleModel.pricePerSqm × exitDiscount;
            
            console.log('🏷️ [Exit - Sale Model] بيع المتبقي:', {
                remainingArea: remainingArea.toLocaleString() + ' م²',
                exitPrice: (saleModel.pricePerSqm × exitDiscount).toLocaleString(),
                exitValue: exitGrossValue.toLocaleString()
            });
        } else {
            // تم بيع كل شيء - لا توجد قيمة خروج إضافية
            exitGrossValue = 0;
            console.log('✅ [Exit - Sale Model] تم بيع جميع الوحدات');
        }
        
    } else {
        // نموذج الإيجار أو المختلط - استخدام الطريقة الحالية
        exitGrossValue = calculateExitValue();
    }
    
    // ... باقي كود Exit Value
}
```

---

### 🎨 **المستوى الثالث: تحسينات إضافية**

#### 1. **لوحة معلومات تفاعلية (Dashboard)**

```html
<!-- إضافة dashboard في أعلى الصفحة -->
<div class="investment-dashboard">
    <div class="dashboard-card">
        <h4>نموذج الإيرادات</h4>
        <div class="metric-value" id="revenueModelDisplay">إيجار</div>
        <div class="metric-label">Revenue Model</div>
    </div>
    
    <div class="dashboard-card">
        <h4>وضع الأرض</h4>
        <div class="metric-value" id="landModeDisplay">شراء</div>
        <div class="metric-label">Land Mode</div>
    </div>
    
    <div class="dashboard-card">
        <h4>الاستثمار الكلي</h4>
        <div class="metric-value" id="totalInvestmentDisplay">0</div>
        <div class="metric-label">Total Investment</div>
    </div>
    
    <div class="dashboard-card">
        <h4>التمويل بالدين</h4>
        <div class="metric-value" id="debtFinancingDisplay">معطّل</div>
        <div class="metric-label">Debt Financing</div>
    </div>
    
    <div class="dashboard-card">
        <h4>WACC</h4>
        <div class="metric-value" id="waccDisplay">7.5%</div>
        <div class="metric-label">Discount Rate</div>
    </div>
    
    <div class="dashboard-card">
        <h4>سنة الخروج</h4>
        <div class="metric-value" id="exitYearDisplay">10</div>
        <div class="metric-label">Exit Year</div>
    </div>
</div>
```

#### 2. **Validation Rules محسّنة**

```javascript
/**
 * التحقق من صحة جميع البيانات قبل الحساب
 * @returns {object} نتائج التحقق
 */
function validateInvestmentData() {
    const errors = [];
    const warnings = [];
    
    // 1. تحقق من بيانات الأرض
    const landAcq = investmentData.landAcquisition;
    if (landAcq.mode === 'purchase' && landAcq.purchasePrice <= 0) {
        errors.push('سعر شراء الأرض يجب أن يكون أكبر من صفر');
    }
    if (landAcq.mode === 'lease' && landAcq.annualRent <= 0) {
        errors.push('الإيجار السنوي يجب أن يكون أكبر من صفر');
    }
    
    // 2. تحقق من فترات المشروع
    const financing = investmentData.financing;
    if (financing.constructionPeriod < 1 || financing.constructionPeriod > 10) {
        errors.push('فترة البناء يجب أن تكون بين 1-10 سنوات');
    }
    if (financing.operatingPeriod < 1 || financing.operatingPeriod > 50) {
        errors.push('فترة التشغيل يجب أن تكون بين 1-50 سنة');
    }
    
    // 3. تحقق من التمويل بالدين
    const debtFinancing = investmentData.debtFinancing;
    if (debtFinancing.enabled) {
        if (debtFinancing.loanAmount <= 0) {
            errors.push('مبلغ القرض يجب أن يكون أكبر من صفر');
        }
        if (debtFinancing.interestRate <= 0 || debtFinancing.interestRate > 20) {
            warnings.push('معدل الفائدة يبدو غير معتاد (يجب أن يكون بين 0-20%)');
        }
        if (debtFinancing.loanPeriod > financing.operatingPeriod) {
            errors.push('فترة القرض لا يمكن أن تتجاوز فترة التشغيل');
        }
    }
    
    // 4. تحقق من WACC
    const wacc = investmentData.discounting.calculatedWACC;
    if (wacc <= 0 || wacc > 30) {
        warnings.push('معدل الخصم (WACC) يبدو غير معتاد: ' + wacc + '%');
    }
    
    // 5. تحقق من Exit Strategy
    const exit = investmentData.exit;
    if (exit.year > financing.operatingPeriod) {
        errors.push('سنة الخروج لا يمكن أن تتجاوز فترة التشغيل');
    }
    if (exit.method === 'gordon' && wacc <= exit.gordonGrowthRate) {
        errors.push('في نموذج Gordon، WACC يجب أن يكون أكبر من معدل النمو');
    }
    
    // 6. تحقق من نموذج الإيرادات
    const revenueModel = investmentData.revenueModel;
    if (revenueModel.type === 'sale') {
        if (revenueModel.sale.totalSaleableGLA <= 0) {
            errors.push('المساحة القابلة للبيع يجب أن تكون أكبر من صفر');
        }
        if (revenueModel.sale.pricePerSqm <= 0) {
            errors.push('سعر البيع يجب أن يكون أكبر من صفر');
        }
    }
    
    // 7. تحقق من الترابط بين المكونات
    const integration = investmentData.integration;
    if (integration.landArea <= 0) {
        errors.push('يجب إدخال مساحة الأرض في المكون الثاني (Land & Site)');
    }
    if (integration.constructionCost <= 0) {
        errors.push('يجب إدخال تكلفة البناء في المكون الثالث (Construction)');
    }
    if (revenueModel.type === 'rental' && integration.annualRevenue <= 0) {
        errors.push('يجب إدخال الإيرادات في المكون الرابع (Revenue)');
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        summary: {
            totalErrors: errors.length,
            totalWarnings: warnings.length
        }
    };
}

// استخدام Validation قبل الحساب:
function calculateFinancialKPIs() {
    console.log('📊 بدء حساب المؤشرات المالية...');
    
    // التحقق من صحة البيانات
    const validation = validateInvestmentData();
    
    if (!validation.isValid) {
        console.error('❌ الأخطاء:', validation.errors);
        alert('❌ يوجد ' + validation.errors.length + ' أخطاء في البيانات:\n\n' + 
              validation.errors.join('\n'));
        return;
    }
    
    if (validation.warnings.length > 0) {
        console.warn('⚠️ تحذيرات:', validation.warnings);
    }
    
    // متابعة الحسابات...
    buildCashFlowTable();
    calculateNPV();
    calculateIRR();
    // ...
}
```

#### 3. **Comparison Tool - مقارنة السيناريوهات**

```javascript
/**
 * مقارنة سيناريوهات متعددة
 */
function compareScenarios() {
    const scenarios = [
        {
            name: 'شراء الأرض + إيجار',
            settings: {
                landMode: 'purchase',
                revenueModel: 'rental',
                debtEnabled: true
            }
        },
        {
            name: 'شراكة + إيجار',
            settings: {
                landMode: 'partnership',
                revenueModel: 'rental',
                debtEnabled: false
            }
        },
        {
            name: 'شراء الأرض + بيع',
            settings: {
                landMode: 'purchase',
                revenueModel: 'sale',
                debtEnabled: true
            }
        },
        {
            name: 'شراكة + مختلط',
            settings: {
                landMode: 'partnership',
                revenueModel: 'hybrid',
                debtEnabled: false
            }
        }
    ];
    
    const results = [];
    
    // حفظ الإعدادات الحالية
    const originalSettings = { ...investmentData };
    
    scenarios.forEach(scenario => {
        // تطبيق إعدادات السيناريو
        investmentData.landAcquisition.mode = scenario.settings.landMode;
        investmentData.revenueModel.type = scenario.settings.revenueModel;
        investmentData.debtFinancing.enabled = scenario.settings.debtEnabled;
        
        // إعادة الحساب
        buildCashFlowTable();
        const npv = calculateNPV();
        const irr = calculateIRR();
        const roi = calculateROI();
        
        results.push({
            scenario: scenario.name,
            npv: npv,
            irr: irr,
            roi: roi,
            payback: calculatePaybackPeriod()
        });
    });
    
    // استعادة الإعدادات الأصلية
    investmentData = originalSettings;
    buildCashFlowTable();
    
    // عرض جدول المقارنة
    console.table(results);
    displayComparisonModal(results);
}
```

---

## 📊 الجزء الخامس: ملخص المقترحات

### ✅ **الأولوية العالية (Critical)**

| # | المقترح | التأثير | الجهد | الحالة |
|---|---------|---------|-------|--------|
| 1 | إكمال وضع الشراكة (Partnership) | 🔴 عالي | متوسط | ❌ غير مطبق |
| 2 | تقسيم Exit Value مع الشريك | 🔴 عالي | منخفض | ❌ غير مطبق |
| 3 | Validation Rules شاملة | 🟡 متوسط | منخفض | جزئي ⚠️ |
| 4 | Expected NOI Auto/Manual Toggle | 🟢 منخفض | منخفض | ❌ غير مطبق |

### 🚀 **الأولوية المتوسطة (Enhancement)**

| # | المقترح | التأثير | الجهد | الحالة |
|---|---------|---------|-------|--------|
| 5 | نموذج إيرادات البيع (Sale Model) | 🔴 عالي | عالي | ❌ غير مطبق |
| 6 | النموذج المختلط (Hybrid Model) | 🟡 متوسط | عالي | ❌ غير مطبق |
| 7 | جدول مبيعات قابل للتعديل | 🟡 متوسط | متوسط | ❌ غير مطبق |
| 8 | Dashboard تفاعلية | 🟢 منخفض | منخفض | ❌ غير مطبق |

### 💡 **الأولوية المنخفضة (Nice to Have)**

| # | المقترح | التأثير | الجهد | الحالة |
|---|---------|---------|-------|--------|
| 9 | Comparison Tool | 🟡 متوسط | عالي | ❌ غير مطبق |
| 10 | تصدير تقرير PDF | 🟢 منخفض | متوسط | ❌ غير مطبق |
| 11 | حفظ السيناريوهات | 🟢 منخفض | منخفض | ❌ غير مطبق |

---

## 🎯 الخلاصة النهائية

### ✅ **النقاط الإيجابية:**

1. **البنية الهندسية ممتازة**: المكونات مصممة بشكل modular ومفصول
2. **الحسابات المالية دقيقة**: NPV, IRR, WACC محسوبة بشكل صحيح
3. **المرونة عالية**: دعم 3 أوضاع للأرض + خيارات تمويل متعددة
4. **التوثيق جيد**: Console logs تساعد في Debug
5. **Integration محكم**: ترابط قوي بين المكونات الأساسية

### ⚠️ **نقاط تحتاج تحسين:**

1. **وضع الشراكة غير مكتمل**: لا يخصم حصة الشريك من الأرباح
2. **نموذج البيع غير موجود**: النظام حالياً مصمم للإيجار فقط
3. **Validation محدودة**: لا توجد تحققات شاملة قبل الحساب
4. **Expected NOI**: يمكن الكتابة فوق القيمة اليدوية تلقائياً

### 🚀 **خريطة الطريق المقترحة:**

#### **المرحلة 1 (أسبوعان):**
- ✅ إكمال وضع الشراكة
- ✅ إضافة Validation Rules
- ✅ تحسين Expected NOI

#### **المرحلة 2 (شهر واحد):**
- ✅ تطوير نموذج إيرادات البيع
- ✅ إضافة جدول المبيعات
- ✅ دمج النموذج المختلط

#### **المرحلة 3 (أسبوعان):**
- ✅ Dashboard تفاعلية
- ✅ Comparison Tool
- ✅ تحسينات UX

---

## 📞 ملاحظات ختامية

النظام الحالي **احترافي جداً** ومصمم بشكل جيد للمشاريع العقارية الإيجارية. التطويرات المقترحة ستجعله:

1. **أكثر شمولاً**: دعم نماذج إيرادات متعددة
2. **أكثر دقة**: معالجة وضع الشراكة بشكل صحيح
3. **أسهل استخداماً**: Dashboard + Validation
4. **أقوى تحليلاً**: Comparison Tool

**التوصية:** البدء بالأولوية العالية (المقترحات 1-4) أولاً، ثم تقييم الحاجة للمرحلة التالية بناءً على feedback المستخدمين.

---

📅 **تاريخ التقرير:** 2025-10-25  
✍️ **تم بواسطة:** Claude AI - Investment & Financing Analysis  
📊 **الإصدار:** 1.0 - Comprehensive Investment Analysis Report
