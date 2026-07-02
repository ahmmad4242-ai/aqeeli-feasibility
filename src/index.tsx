import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import reportRoutes from './routes/report'

type Bindings = {
  OPENAI_API_KEY?: string;
  OPENAI_BASE_URL?: string;
}

const app = new Hono<{ Bindings: Bindings }>()

const translations = {
  ar: {
    locale: 'ar',
    direction: 'rtl',
    loading: 'جارٍ التحميل...',
    pleaseWait: 'يرجى الانتظار',
    invalidInput: 'البيانات المدخلة غير صحيحة',
    mustBePositive: 'يجب أن تكون القيمة موجبة',
    mustBeGreaterThanZero: 'يجب أن تكون القيمة أكبر من الصفر',
    success: 'تم بنجاح',
    error: 'حدث خطأ',
    warning: 'تحذير',
    info: 'معلومة',
    disabledFeature: 'تم تعطيل هذه الميزة مؤقتاً',
    calculating: 'جاري الحساب...',
    processingData: 'معالجة البيانات...',
    dataValidationError: 'يرجى التحقق من صحة البيانات المدخلة',
    calculationComplete: 'اكتملت العملية الحسابية بنجاح',
    calculationError: 'حدث خطأ في الحسابات',
    unexpectedError: 'حدث خطأ غير متوقع',
    exportingReport: 'تصدير التقرير...',
    reportExported: 'تم تصدير التقرير بنجاح',

    title: 'منصة نقوة',
    subtitle: 'أداة دراسة الجدوى العقارية',
    projectConfig: 'معلومات المشروع',
    projectName: 'اسم المشروع',
    clientName: 'اسم العميل',
    city: 'المدينة',
    landArea: 'مساحة الأرض (م²)',
    far: 'معامل البناء (FAR)',
    projectCode: 'كود المشروع',
    locationMap: 'موقع المشروع على الخريطة',
    popularCities: 'المدن المقترحة',
    coordinates: 'الإحداثيات',
    latitude: 'خط العرض',
    longitude: 'خط الطول',
    currentLocation: 'الموقع الحالي',
    usesConfig: 'تكوين الاستخدامات',
    costConfig: 'تكوين التكاليف',
    revenueConfig: 'تكوين الإيرادات',
    calculate: 'احسب دراسة الجدوى',

    fullReport: 'التقرير الكامل',
    executiveSummary: 'الملخص التنفيذي',
    gfa: 'إجمالي المساحة المبنية',
    gla: 'إجمالي المساحة المؤجرة',
    totalCost: 'إجمالي التكلفة',
    yield: 'العائد',
    glaDistribution: 'توزيع المساحات المؤجرة',
    costBreakdown: 'تفصيل التكاليف',
    resultsTitle: 'النتائج المالية',
    noResults: 'لا توجد نتائج للعرض',
    share: 'النسبة',
    efficiency: 'الكفاءة',
    sampleProject: 'مشروع عقاري نموذجي',
    sampleClient: 'شركة التطوير العقاري',
    sampleCity: 'الرياض',
    hotel: 'فندق',
    retail: 'تجاري',
    office: 'مكاتب',
    residential: 'سكني'
  },
  en: {
    locale: 'en',
    direction: 'ltr',
    loading: 'Loading...',
    pleaseWait: 'Please wait',
    invalidInput: 'Invalid input',
    mustBePositive: 'Value must be positive',
    mustBeGreaterThanZero: 'Value must be greater than zero',
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Info',
    disabledFeature: 'This feature is currently disabled',
    calculating: 'Calculating...',
    processingData: 'Processing data...',
    dataValidationError: 'Please verify the input values',
    calculationComplete: 'Calculation completed successfully',
    calculationError: 'An error occurred during calculation',
    unexpectedError: 'An unexpected error occurred',
    exportingReport: 'Exporting report...',
    reportExported: 'Report exported successfully',

    title: 'Advanced Real Estate Feasibility Study',
    subtitle: 'Comprehensive real estate investment analysis tool',
    projectConfig: 'Project Information',
    projectName: 'Project Name',
    clientName: 'Client Name',
    city: 'City',
    landArea: 'Land Area (sqm)',
    far: 'Floor Area Ratio (FAR)',
    projectCode: 'Project Code',
    locationMap: 'Project location on map',
    popularCities: 'Suggested Cities',
    coordinates: 'Coordinates',
    latitude: 'Latitude',
    longitude: 'Longitude',
    currentLocation: 'Current Location',
    usesConfig: 'Uses Configuration',
    costConfig: 'Cost Configuration',
    revenueConfig: 'Revenue Configuration',
    calculate: 'Calculate Feasibility',

    fullReport: 'Full Report',
    executiveSummary: 'Executive Summary',
    gfa: 'Gross Floor Area',
    gla: 'Gross Leasable Area',
    totalCost: 'Total Cost',
    yield: 'Yield',
    glaDistribution: 'GLA Distribution',
    costBreakdown: 'Cost Breakdown',
    resultsTitle: 'Financial Results',
    noResults: 'No results to display',
    share: 'Share',
    efficiency: 'Efficiency',
    sampleProject: 'Sample Real Estate Project',
    sampleClient: 'Real Estate Development Co.',
    sampleCity: 'Riyadh',
    hotel: 'Hotel',
    retail: 'Retail',
    office: 'Office',
    residential: 'Residential'
  }
} as const

const serializedTranslations = JSON.stringify(translations).replace(/</g, '\\u003c')

const renderDeprecatedPage = (title: string, description: string): string => `
  <!DOCTYPE html>
  <html lang="ar" dir="rtl">
  <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
          body { font-family: 'Tajawal', sans-serif; background: #f9fafb; color: #1f2937; padding: 48px; line-height: 1.8; }
          .card { max-width: 760px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 15px 35px rgba(15, 23, 42, 0.08); border: 1px solid #e5e7eb; }
          h1 { font-size: 28px; margin-bottom: 16px; display: flex; align-items: center; gap: 12px; }
          p { margin: 12px 0; font-size: 17px; }
          .badge { display: inline-block; margin-top: 24px; padding: 8px 16px; border-radius: 9999px; background: #e5e7eb; color: #374151; font-weight: 600; }
      </style>
  </head>
  <body>
      <div class="card">
          <h1>⚠️ ${title}</h1>
          <p>${description}</p>
          <p>تم إيقاف هذه الصفحة ضمن خطة تنظيف النظام وإعادة إطلاق نظام التدفقات النقدية.</p>
          <p>للوصول إلى التطبيق الرئيسي، فضلاً انتقل إلى <a href="/" style="color:#4b5563; text-decoration:none;">الصفحة الرئيسية</a>.</p>
          <span class="badge">إصدار الصيانة الحالي</span>
      </div>
  </body>
  </html>
`


// Enable CORS for API requests
app.use('/api/*', cors())

// AI Report Generator Routes
app.route('/', reportRoutes)

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// Serve favicon.ico - redirect to static path
app.get('/favicon.ico', (c) => {
  return c.redirect('/static/favicon.ico', 301)
})

app.get('/debug-test', (c) => {
  return c.html(renderDeprecatedPage('صفحة اختبار الاستخدامات', 'تم تعطيل صفحة اختبار تحديث تكاليف الاستخدامات ضمن خطة الصيانة الحالية.'))
})

app.get('/investment-update-test', (c) => {
  return c.html(renderDeprecatedPage('صفحة اختبار معاملات الاستثمار', 'تم تعطيل أدوات التحقق الخاصة بمعاملات الاستثمار بعد إزالة منطق التدفقات النقدية القديم.'))
})

app.get('/custom-categories', (c) => {
  return c.html(renderDeprecatedPage('صفحة اختبار الأقسام المخصصة', 'تم تعطيل هذه الصفحة مؤقتاً لحين إعادة تنظيم نظام التكاليف.'))
})

app.get('/investment-test', (c) => {
  return c.html(renderDeprecatedPage('صفحة اختبار إجمالي الاستثمار', 'تم تعطيل اختبار إجمالي الاستثمار المؤتمت بعد إعادة بناء دوال التحليل المالي.'))
})

app.get('/test', (c) => {
  return c.html(renderDeprecatedPage('صفحة اختبار التكامل المالي', 'هذه الصفحة التجريبية لم تعد مطلوبة بعد إيقاف نظام التدفقات النقدية المتقادم.'))
})

app.get('/test-ai-report', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>اختبار ميزة التقرير بالذكاء الاصطناعي</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white/5 backdrop-filter backdrop-blur-sm/5 p-8">
    <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold text-white mb-6">اختبار ميزة التقرير بالذكاء الاصطناعي ✨</h1>
        
        <div class="bg-white/5 backdrop-filter backdrop-blur-sm shadow rounded-lg p-6 mb-6">
            <h2 class="text-xl font-semibold mb-4">معلومات المشروع</h2>
            <div class="space-y-3">
                <div>
                    <label class="block text-sm font-medium text-white/90 mb-1">اسم المشروع</label>
                    <input type="text" id="projectName" value="مشروع سكني فاخر" 
                           class="w-full px-3 py-2 border rounded-md">
                </div>
                <div>
                    <label class="block text-sm font-medium text-white/90 mb-1">التكلفة الإجمالية (ريال)</label>
                    <input type="number" id="totalCost" value="150000000" 
                           class="w-full px-3 py-2 border rounded-md">
                </div>
                <div>
                    <label class="block text-sm font-medium text-white/90 mb-1">الإيرادات المتوقعة (ريال)</label>
                    <input type="number" id="totalRevenue" value="220000000" 
                           class="w-full px-3 py-2 border rounded-md">
                </div>
                <div>
                    <label class="block text-sm font-medium text-white/90 mb-1">صافي الربح (ريال)</label>
                    <input type="number" id="netProfit" value="70000000" 
                           class="w-full px-3 py-2 border rounded-md">
                </div>
            </div>
        </div>

        <button onclick="generateReport()" 
                class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition shadow-md">
            🤖 إنشاء التقرير بالذكاء الاصطناعي
        </button>

        <div id="loading" class="hidden mt-6 text-center">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p class="mt-3 text-white/80">جاري إنشاء التقرير... قد يستغرق هذا بضع ثوانٍ ⏱️</p>
        </div>

        <div id="result" class="mt-6 bg-white/5 backdrop-filter backdrop-blur-sm shadow rounded-lg p-6 hidden">
            <h2 class="text-xl font-semibold mb-4">نتيجة الاختبار</h2>
            <div id="resultContent" class="prose max-w-none"></div>
        </div>
        
        <div class="mt-6 bg-blue-500/20 border border-blue-400/30 rounded-lg p-4">
            <h3 class="font-semibold text-blue-100 mb-2">📚 معلومات الاختبار</h3>
            <ul class="text-sm text-blue-300 space-y-1">
                <li>• API Endpoint: /api/generate-report</li>
                <li>• Model: gpt-4o-mini (OpenAI)</li>
                <li>• الإعدادات: تم تحديثها بنجاح</li>
                <li>• الحالة: ✅ جاهز للاستخدام</li>
            </ul>
        </div>
    </div>

    <script>
        async function generateReport() {
            const loading = document.getElementById('loading');
            const result = document.getElementById('result');
            const resultContent = document.getElementById('resultContent');

            loading.classList.remove('hidden');
            result.classList.add('hidden');

            try {
                const projectData = {
                    projectName: document.getElementById('projectName').value,
                    totalCost: parseFloat(document.getElementById('totalCost').value),
                    totalRevenue: parseFloat(document.getElementById('totalRevenue').value),
                    netProfit: parseFloat(document.getElementById('netProfit').value)
                };

                console.log('📤 Sending request:', projectData);

                const response = await fetch('/api/generate-report', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(projectData)
                });

                const data = await response.json();
                console.log('📥 Response:', data);

                loading.classList.add('hidden');
                result.classList.remove('hidden');

                if (data.success) {
                    resultContent.innerHTML = \`
                        <div class="bg-emerald-500/20 border-2 border-emerald-400/30 rounded-lg p-4 mb-4">
                            <h3 class="text-lg font-semibold text-emerald-100 flex items-center">
                                <span class="text-2xl mr-2">✅</span> نجح إنشاء التقرير!
                            </h3>
                            <p class="text-sm text-emerald-300 mt-1">
                                تم إنشاء التقرير بنجاح باستخدام نموذج <strong>\${data.metadata.model}</strong>
                            </p>
                            <p class="text-xs text-green-500 mt-1">
                                عدد الرموز المستخدمة: \${data.metadata.tokensUsed} | 
                                وقت الإنشاء: \${new Date(data.metadata.generatedAt).toLocaleString('ar-EG')}
                            </p>
                        </div>
                        <div class="bg-white/5 backdrop-filter backdrop-blur-sm/5 border rounded-lg p-4 max-h-96 overflow-y-auto">
                            <pre class="whitespace-pre-wrap text-sm text-white">\${data.report}</pre>
                        </div>
                    \`;
                } else {
                    resultContent.innerHTML = \`
                        <div class="bg-red-500/20 border-2 border-red-400/30 rounded-lg p-4">
                            <h3 class="text-lg font-semibold text-red-100 flex items-center">
                                <span class="text-2xl mr-2">❌</span> فشل إنشاء التقرير
                            </h3>
                            <p class="text-sm text-red-300 mt-2">\${data.error}</p>
                        </div>
                    \`;
                }
            } catch (error) {
                loading.classList.add('hidden');
                result.classList.remove('hidden');
                resultContent.innerHTML = \`
                    <div class="bg-red-500/20 border-2 border-red-400/30 rounded-lg p-4">
                        <h3 class="text-lg font-semibold text-red-100 flex items-center">
                            <span class="text-2xl mr-2">⚠️</span> خطأ في الاتصال
                        </h3>
                        <p class="text-sm text-red-300 mt-2">\${error.message}</p>
                    </div>
                \`;
                console.error('❌ Error:', error);
            }
        }
    </script>
</body>
</html>
  `)
})

app.get('/test-export-import', async (c) => {
  try {
    const testFile = await fetch('file:///home/user/webapp/test_export_import.html').then(r => r.text()).catch(() => null)
    if (testFile) {
      return c.html(testFile)
    } else {
      return c.html(`
        <html><head><title>صفحة الاختبار</title></head>
        <body><h1>صفحة اختبار نظام التصدير والاستيراد</h1>
        <p>يمكنك الوصول إلى الصفحة الرئيسية من <a href="/">هنا</a></p>
        <p>أو استخدم الدوال مباشرة في console المتصفح:</p>
        <pre>
          exportFeasibilityData()  // تصدير
          importFeasibilityData()  // استيراد
          exportCostsData()        // تصدير التكاليف
          importCostsData()        // استيراد التكاليف
        </pre>
        </body></html>
      `)
    }
  } catch (error) {
    return c.html(`<html><body><h1>خطأ في تحميل صفحة الاختبار</h1><p>${error.message}</p></body></html>`)
  }
})

app.get('/api/translations', (c) => {
  c.header('Cache-Control', 'no-store, no-cache, must-revalidate')
  return c.json(translations)
})

app.get('/api/translations/:lang', (c) => {
  const lang = c.req.param('lang')
  const translation = translations[lang as keyof typeof translations] || translations.en
  c.header('Cache-Control', 'no-store, no-cache, must-revalidate')
  return c.json(translation)
})

app.post('/api/calculate', async (c) => {
  try {
    const data = await c.req.json()
    
    const gfa = data.landArea * data.far
    
    let totalGla = 0
    const useBreakdown: any = {}
    
    Object.keys(data.uses).forEach(use => {
      const useData = data.uses[use]
      if (useData.share > 0) {
        const useGfa = gfa * (useData.share / 100)
        const useGla = useGfa * (useData.efficiency / 100)
        totalGla += useGla
        useBreakdown[use] = {
          gfa: useGfa,
          gla: useGla,
          share: useData.share,
          efficiency: useData.efficiency
        }
      }
    })
    
    let totalCost = 0
    const costBreakdown: any = {}
    
    Object.keys(data.uses).forEach(use => {
      const useData = data.uses[use]
      const costs = data.costs[use]
      if (useData.share > 0 && costs) {
        const useGfa = gfa * (useData.share / 100)
        const structureCost = useGfa * costs.structure
        const finishesCost = useGfa * costs.finishes
        const ffeCost = useGfa * costs.ffe
        
        const useTotalCost = structureCost + finishesCost + ffeCost
        totalCost += useTotalCost
        
        costBreakdown[use] = {
          structure: structureCost,
          finishes: finishesCost,
          ffe: ffeCost,
          total: useTotalCost
        }
      }
    })
    
    const govFees = totalCost * (data.extraCosts.govFees / 100)
    const consultantFees = totalCost * (data.extraCosts.consultantFees / 100)
    const supervisionFees = totalCost * (data.extraCosts.supervisionFees / 100)
    const developerFees = totalCost * (data.extraCosts.developerFees / 100)
    const contingency = totalCost * (data.extraCosts.contingency / 100)
    
    const extraCostsTotal = govFees + consultantFees + supervisionFees + developerFees + contingency
    totalCost += extraCostsTotal
    
    let totalRentIncome = 0
    let totalSalesIncome = 0
    const revenueBreakdown: any = {}
    
    Object.keys(data.uses).forEach(use => {
      const useData = data.uses[use]
      const revenues = data.revenues[use]
      if (useData.share > 0 && revenues) {
        const useGla = useBreakdown[use].gla
        
        const rentIncome = useGla * revenues.rentPerSqm * (revenues.occupancyRate / 100)
        totalRentIncome += rentIncome
        
        const salesIncome = revenues.salePrice ? useGla * revenues.salePrice : 0
        totalSalesIncome += salesIncome
        
        revenueBreakdown[use] = {
          rent: rentIncome,
          sales: salesIncome,
          gla: useGla
        }
      }
    })
    
    const totalRevenue = totalRentIncome + totalSalesIncome
    
    const opex = totalRentIncome * (data.omDepreciation.opexRate / 100)
    const depreciation = totalCost * (data.omDepreciation.depreciationRate / 100)
    const noi = totalRentIncome - opex
    const adjustedIncome = noi - depreciation
    
    const grossYield = totalCost > 0 ? (totalRentIncome / totalCost) * 100 : 0
    const netYield = totalCost > 0 ? (adjustedIncome / totalCost) * 100 : 0
    
    const results = {
      areas: {
        gfa,
        gla: totalGla,
        useBreakdown
      },
      costs: {
        total: totalCost,
        breakdown: costBreakdown,
        extraCosts: {
          govFees,
          consultantFees,
          supervisionFees,
          developerFees,
          contingency,
          total: extraCostsTotal
        }
      },
      revenues: {
        total: totalRevenue,
        rent: totalRentIncome,
        sales: totalSalesIncome,
        breakdown: revenueBreakdown
      },
      financials: {
        opex,
        depreciation,
        noi,
        adjustedIncome,
        grossYield,
        netYield
      },
      totals: {
        cost: totalCost,
        revenue: totalRevenue,
        noi,
        adjustedIncome
      },
      investment: {
        total: totalCost,
        breakdown: costBreakdown
      }
    }
    
    return c.json(results)
  } catch (error) {
    return c.json({ error: 'Calculation failed' }, 500)
  }
})

// KPI Dashboard route removed - functionality moved to main page
// Enhanced Uses System route
app.get('/enhanced-uses', async (c) => {
  // Read the HTML file content and serve it directly
  const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>إدارة الاستخدامات | Uses Management System</title>
    
    <!-- Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700&display=swap" rel="stylesheet">
    
    <!-- External Libraries -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    
    <!-- React (for development) -->
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    
    <!-- Custom Styles -->
    <style>
        .arabic { font-family: 'Tajawal', sans-serif; }
        .english { font-family: 'Inter', sans-serif; }
        
        .rtl { direction: rtl; }
        .ltr { direction: ltr; }
        
        /* Tailwind classes for dynamic colors */
        .bg-white/8 { background-color: #f9fafb; }
        .bg-white/8 { background-color: #eff6ff; }
        .border-white/20 { border-color: #bfdbfe; }
        
        /* Editable table styles */
        .editable-input {
            transition: all 0.2s ease-in-out;
        }
        .editable-input:hover {
            background-color: #f0f9ff !important;
            border: 1px solid #0ea5e9 !important;
        }
        .editable-input:focus {
            background-color: #f0f9ff !important;
            border: 2px solid #0ea5e9 !important;
            outline: none !important;
            box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.1) !important;
        }
        
        /* Table row hover effects */
        .floor-row:hover {
            background-color: #fafafa !important;
        }
        
        /* Calculated fields styling */
        .calculated-field {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            color: #64748b;
            font-weight: 600;
        }
        .border-white/20 { border-color: #93c5fd; }
        .text-white/90 { color: #2563eb; }
        .text-white/90 { color: #1d4ed8; }
        .text-white { color: #1e40af; }
        
        .bg-purple-25 { background-color: #f9fafb; }
        .bg-white/8 { background-color: #f3f4f6; }
        .border-white/20 { border-color: #e9d5ff; }
        .border-white/20 { border-color: #d8b4fe; }
        .text-white/90 { color: #9333ea; }
        .text-white/90 { color: #7c3aed; }
        .text-white { color: #6b21a8; }
        
        .bg-orange-25 { background-color: #fffaf0; }
        .bg-orange-500/20 { background-color: #fff7ed; }
        .border-orange-400/30 { border-color: #fed7aa; }
        .border-orange-400/40 { border-color: #fdba74; }
        .text-orange-300 { color: #ea580c; }
        .text-orange-200 { color: #c2410c; }
        .text-orange-100 { color: #9a3412; }
        
        .bg-emerald-500/15 { background-color: #f9fafb; }
        .bg-white/8 { background-color: #f0fdf4; }
        .border-gray-400 { border-color: #bbf7d0; }
        .border-white/20 { border-color: #86efac; }
        .text-white/90 { color: #16a34a; }
        .text-white/90 { color: #15803d; }
        .text-white { color: #166534; }
        
        .transition-all { transition: all 0.2s ease-in-out; }
        .transition-colors { transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out, border-color 0.2s ease-in-out; }
        .transition-shadow { transition: box-shadow 0.2s ease-in-out; }
        
        .hover\\:shadow-sm:hover { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
        
        /* Notification System Styles */
        .notification {
            padding: 1rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            animation: slideIn 0.3s ease-out;
            position: relative;
            overflow: hidden;
        }
        
        .notification-success {
            background: linear-gradient(135deg, #374151, #1f2937);
            color: white;
        }
        
        .notification-error {
            background: linear-gradient(135deg, #dc2626, #991b1b);
            color: white;
        }
        
        .notification-warning {
            background: linear-gradient(135deg, #f59e0b, #b45309);
            color: white;
        }
        
        .notification-info {
            background: linear-gradient(135deg, #6b7280, #4b5563);
            color: white;
        }
        
        .notification-loading {
            background: linear-gradient(135deg, #374151, #1f2937);
            color: white;
        }
        
        .notification .close-btn {
            position: absolute;
            top: 0.5rem;
            left: 0.5rem;
            background: rgba(255, 255, 255, 0.2);
            border: none;
            border-radius: 50%;
            width: 1.5rem;
            height: 1.5rem;
            color: white;
            cursor: pointer;
            font-size: 0.75rem;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .notification .close-btn:hover {
            background: rgba(255, 255, 255, 0.3);
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .notification.slide-out {
            animation: slideOut 0.3s ease-in;
        }
        
        /* Empty State Styles */
        .empty-state-message {
            background: linear-gradient(135deg, #f8fafc, #e2e8f0);
            border: 2px dashed #cbd5e1;
            border-radius: 12px;
            margin: 1rem 0;
        }
        
        /* Tooltip Styles */
        [data-tooltip] {
            position: relative;
        }
        
        [data-tooltip]:hover::after {
            content: attr(data-tooltip);
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 0.5rem 0.75rem;
            border-radius: 0.375rem;
            font-size: 0.75rem;
            white-space: nowrap;
            z-index: 1000;
            animation: tooltipFadeIn 0.2s ease-out;
        }
        
        [data-tooltip]:hover::before {
            content: '';
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%) translateY(50%);
            border: 0.25rem solid transparent;
            border-top-color: rgba(0, 0, 0, 0.8);
            z-index: 1000;
        }
        
        @keyframes tooltipFadeIn {
            from {
                opacity: 0;
                transform: translateX(-50%) translateY(-0.5rem);
            }
            to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        }
        
        /* Field Validation Styles */
        .field-error {
            border-color: #ef4444 !important;
            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }
        
        .field-success {
            border-color: #10b981 !important;
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }
        
        /* Loading States */
        .btn-loading {
            position: relative;
            pointer-events: none;
            opacity: 0.7;
        }
        
        .btn-loading::after {
            content: '';
            position: absolute;
            top: 50%;
            right: 1rem;
            transform: translateY(-50%);
            width: 1rem;
            height: 1rem;
            border: 2px solid transparent;
            border-top: 2px solid currentColor;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            to {
                transform: translateY(-50%) rotate(360deg);
            }
        }
        
        /* Status Indicators */
        .status-indicator {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.25rem 0.5rem;
            border-radius: 0.375rem;
            font-size: 0.75rem;
            font-weight: 500;
        }
        
        .status-success {
            background: #e5e7eb;
            color: #065f46;
        }
        
        .status-warning {
            background: #fcd34d;
            color: #92400e;
        }
        
        .status-error {
            background: #fee2e2;
            color: #991b1b;
        }
        
        .status-info {
            background: #dbeafe;
            color: #1e40af;
        }
        
        .lang-btn {
            position: fixed;
            top: 1rem;
            right: 1rem;
            z-index: 1000;
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid rgba(102, 126, 234, 0.3);
            padding: 0.5rem 1rem;
            border-radius: 2rem;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .lang-btn:hover {
            background: #667eea;
            color: white;
        }
        
        /* Component 7: Investment, Financing & Land Costs Styles */
        .land-option-card .land-option-label {
            transition: all 0.3s ease;
        }
        
        .land-option-card input[type="radio"]:checked + .land-option-label {
            border-width: 3px;
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }
        
        .financing-option-card .financing-option-label {
            transition: all 0.3s ease;
        }
        
        .financing-option-card input[type="radio"]:checked + .financing-option-label {
            border-width: 3px;
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }
        
        .investment-input {
            transition: all 0.2s ease;
        }
        
        .investment-input:focus {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(147, 51, 234, 0.15);
        }
        
        .kpi-card {
            transition: all 0.3s ease;
        }
        
        .kpi-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }
        
        .integration-card {
            transition: all 0.3s ease;
        }
        
        .integration-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }
        
        /* Status indicators */
        .status-excellent {
            background-color: #e5e5e5;
            color: #166534;
        }
        
        .status-very-good {
            background-color: #f5f5f5;
            color: #1e40af;
        }
        
        .status-good {
            background-color: #fef3c7;
            color: #92400e;
        }
        
        .status-needs-improvement {
            background-color: #fee2e2;
            color: #991b1b;
        }
        
        /* Cash flow chart styles */
        #cashFlowChart {
            border-radius: 8px;
        }
    </style>
</head>
<body class="bg-white/5 backdrop-filter backdrop-blur-sm/5 arabic rtl">
    <!-- Language Toggle -->
    <button class="lang-btn" onclick="toggleLanguageSimple()">
        <i class="fas fa-globe mr-2"></i>
        <span id="langText">English</span>
    </button>

    <div class="min-h-screen p-6">
        <!-- Header -->
        <div class="text-center mb-8">
            <h1 class="text-4xl font-bold text-white mb-2" id="mainTitle">
                إدارة الاستخدامات
            </h1>
            <p class="text-xl text-white/80" id="mainSubtitle">
                Uses Management System
            </p>
            <div class="mt-4 text-sm text-white/70">
                تطوير متقدم لإدارة أنواع الاستخدامات والوحدات الفرعية في المشاريع العقارية
            </div>
            
            <!-- Back to Main -->
            <div class="mt-6">
                <a href="/" class="inline-flex items-center px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors">
                    <i class="fas fa-arrow-left mr-2"></i>
                    العودة للصفحة الرئيسية
                </a>
            </div>
        </div>

        <!-- Project Parameters -->
        <div class="max-w-4xl mx-auto mb-6">
            <div class="bg-white/5 backdrop-filter backdrop-blur-sm/5 backdrop-filter backdrop-blur-sm rounded-xl shadow-lg p-6">
                <h2 class="text-xl font-bold text-white mb-4">
                    <i class="fas fa-cog text-white/70 mr-2"></i>
                    معاملات المشروع
                </h2>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-white/90 mb-1">
                            مساحة الأرض (م²)
                        </label>
                        <input 
                            type="number" 
                            id="landArea"
                            value="10000"
                            class="w-full border border-white/20 rounded-md px-3 py-2 focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                            onchange="updateProjectParams()"
                        >
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-white/90 mb-1">
                            معامل البناء (FAR)
                        </label>
                        <input 
                            type="number" 
                            id="far"
                            value="3.5"
                            step="0.1"
                            class="w-full border border-white/20 rounded-md px-3 py-2 focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                            onchange="updateProjectParams()"
                        >
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-white/90 mb-1">
                            إجمالي المساحة المبنية (م²)
                        </label>
                        <input 
                            type="text" 
                            id="totalGFA"
                            readonly
                            class="w-full border border-white/20 rounded-md px-3 py-2 bg-white/5 backdrop-filter backdrop-blur-sm/5 text-white/90 font-bold"
                        >
                    </div>
                </div>
            </div>
        </div>

        <!-- React Component Container -->
        <div class="max-w-7xl mx-auto">
            <div id="enhanced-uses-container"></div>
        </div>

        <!-- Features Description -->
        <div class="max-w-4xl mx-auto mt-8">
            <div class="bg-white/5 backdrop-filter backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h2 class="text-2xl font-bold text-white mb-4">
                    <i class="fas fa-star text-yellow-500 mr-2"></i>
                    الميزات الجديدة
                </h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 class="font-bold text-white/90 mb-2">
                            <i class="fas fa-layer-group mr-2"></i>
                            إدارة الوحدات الفرعية
                        </h3>
                        <ul class="text-sm text-white/90 space-y-1">
                            <li>• تصنيف كل استخدام لوحدات فرعية متعددة</li>
                            <li>• حساب عدد الوحداتاً حسب المساحة</li>
                            <li>• إدارة نسب التوزيع والكفاءة لكل نوع</li>
                            <li>• إضافة وحذف الوحدات الفرعية ديناميكياً</li>
                        </ul>
                    </div>
                    
                    <div>
                        <h3 class="font-bold text-white/90 mb-2">
                            <i class="fas fa-calculator mr-2"></i>
                            حسابات ذكية
                        </h3>
                        <ul class="text-sm text-white/90 space-y-1">
                            <li>• حساب المساحات والوحدات في الوقت الفعلي</li>
                            <li>• تحذيرات عند تجاوز 100% في النسب</li>
                            <li>• ملخص للاستخدامات والوحدات</li>
                            <li>• التحديث العند تغيير المعاملات</li>
                        </ul>
                    </div>
                    
                    <div>
                        <h3 class="font-bold text-orange-200 mb-2">
                            <i class="fas fa-expand-arrows-alt mr-2"></i>
                            واجهة تفاعلية
                        </h3>
                        <ul class="text-sm text-white/90 space-y-1">
                            <li>• توسيع/طي الأقسام بسهولة</li>

                            <li>• تصميم ملون ومنظم لكل استخدام</li>
                            <li>• أيقونات ورموز بصرية واضحة</li>
                        </ul>
                    </div>
                    
                    <div>
                        <h3 class="font-bold text-white/90 mb-2">
                            <i class="fas fa-tools mr-2"></i>
                            أدوات إدارية
                        </h3>
                        <ul class="text-sm text-white/90 space-y-1">

                            <li>• التحقق من صحة البيانات</li>
                            <li>• حفظ واستعادة الإعدادات</li>
                            <li>• تصدير البيانات لأدوات أخرى</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- React Component Script -->
    <script type="text/babel">
        const { useState, useEffect } = React;

        // Enhanced Uses System Component 
        const UsesSystemEnhanced = ({ onUsesChange, landArea = 10000, far = 3.5 }) => {
            const initialUses = [
              {
                id: "retail",
                name: "تجاري",
                nameEn: "Retail",
                color: "gray",
                icon: "🛒",
                share: 20,
                efficiency: 78,
                totalGLA: 0,
                totalUnits: 0,
                subUnits: [
                  { 
                    id: "s1", 
                    name: "متجر رئيسي", 
                    percentage: 40, 
                    efficiency: 85, 
                    areaPerUnit: 300, 
                    units: 2,
                    totalArea: 600
                  },
                  { 
                    id: "s2", 
                    name: "متجر كبير", 
                    percentage: 30, 
                    efficiency: 80, 
                    areaPerUnit: 200, 
                    units: 12,
                    totalArea: 2400
                  },
                  { 
                    id: "s3", 
                    name: "متجر صغير", 
                    percentage: 30, 
                    efficiency: 75, 
                    areaPerUnit: 100, 
                    units: 47,
                    totalArea: 4700
                  },
                ],
              },
              {
                id: "hotel",
                name: "فندق",
                nameEn: "Hotel",
                color: "gray",
                icon: "🏨",
                share: 30,
                efficiency: 82,
                totalGLA: 0,
                totalUnits: 0,
                subUnits: [
                  { 
                    id: "h1", 
                    name: "جناح", 
                    percentage: 20, 
                    efficiency: 85, 
                    areaPerUnit: 60, 
                    units: 11,
                    totalArea: 660
                  },
                  { 
                    id: "h2", 
                    name: "غرفة عادية", 
                    percentage: 40, 
                    efficiency: 80, 
                    areaPerUnit: 40, 
                    units: 52,
                    totalArea: 2080
                  },
                  { 
                    id: "h3", 
                    name: "غرفة اقتصادية", 
                    percentage: 40, 
                    efficiency: 70, 
                    areaPerUnit: 30, 
                    units: 44,
                    totalArea: 1320
                  },
                ],
              },
              {
                id: "residential",
                name: "سكني",
                nameEn: "Residential",
                color: "orange",
                icon: "🏠",
                share: 40,
                efficiency: 76,
                totalGLA: 0,
                totalUnits: 0,
                subUnits: [
                  { 
                    id: "r1", 
                    name: "بنتهاوس", 
                    percentage: 10, 
                    efficiency: 85, 
                    areaPerUnit: 250, 
                    units: 6,
                    totalArea: 1500
                  },
                  { 
                    id: "r2", 
                    name: "شقة 3 غرف", 
                    percentage: 25, 
                    efficiency: 80, 
                    areaPerUnit: 180, 
                    units: 31,
                    totalArea: 5580
                  },
                  { 
                    id: "r3", 
                    name: "شقة غرفتين", 
                    percentage: 25, 
                    efficiency: 78, 
                    areaPerUnit: 120, 
                    units: 45,
                    totalArea: 5400
                  },
                  { 
                    id: "r4", 
                    name: "شقة غرفة", 
                    percentage: 40, 
                    efficiency: 75, 
                    areaPerUnit: 80, 
                    units: 45,
                    totalArea: 3600
                  },
                ],
              },
              {
                id: "office",
                name: "مكاتب",
                nameEn: "Office",
                color: "gray",
                icon: "🏢",
                share: 10,
                efficiency: 82,
                totalGLA: 0,
                totalUnits: 0,
                subUnits: [
                  { 
                    id: "o1", 
                    name: "مكتب كبير", 
                    percentage: 30, 
                    efficiency: 85, 
                    areaPerUnit: 200, 
                    units: 8,
                    totalArea: 1600
                  },
                  { 
                    id: "o2", 
                    name: "مكتب متوسط", 
                    percentage: 40, 
                    efficiency: 80, 
                    areaPerUnit: 120, 
                    units: 24,
                    totalArea: 2880
                  },
                  { 
                    id: "o3", 
                    name: "مكتب صغير", 
                    percentage: 30, 
                    efficiency: 75, 
                    areaPerUnit: 80, 
                    units: 34,
                    totalArea: 2720
                  },
                ],
              },
            ];

            const [uses, setUses] = useState(initialUses);
            const [expanded, setExpanded] = useState([]);


            // حساب المساحات التلقائي
            useEffect(() => {
                const totalGFA = landArea * far;
                const updatedUses = uses.map(use => {
                  const useGFA = totalGFA * (use.share / 100);
                  const useGLA = useGFA * (use.efficiency / 100);
                  
                  // حساب المساحات للوحدات الفرعية
                  const updatedSubUnits = use.subUnits.map(subUnit => {
                    const subUnitGLA = useGLA * (subUnit.percentage / 100);
                    const units = Math.round(subUnitGLA / subUnit.areaPerUnit);
                    return {
                      ...subUnit,
                      units,
                      totalArea: units * subUnit.areaPerUnit
                    };
                  });

                  const totalUnits = updatedSubUnits.reduce((sum, sub) => sum + sub.units, 0);

                  return {
                    ...use,
                    subUnits: updatedSubUnits,
                    totalGLA: useGLA,
                    totalUnits
                  };
                });

                setUses(updatedUses);
                onUsesChange?.(updatedUses);
            }, [landArea, far]);

            const toggleExpand = (id) => {
                setExpanded(prev => 
                  prev.includes(id) 
                    ? prev.filter(item => item !== id)
                    : [...prev, id]
                );
            };



            const updateUseShare = (useId, newShare) => {
                setUses(prev => 
                  prev.map(use => 
                    use.id === useId ? { ...use, share: newShare } : use
                  )
                );
            };

            const updateUseEfficiency = (useId, newEfficiency) => {
                setUses(prev => 
                  prev.map(use => 
                    use.id === useId ? { ...use, efficiency: newEfficiency } : use
                  )
                );
            };

            const updateSubUnit = (useId, subUnitId, field, value) => {
                setUses(prev => 
                  prev.map(use => 
                    use.id === useId 
                      ? {
                          ...use,
                          subUnits: use.subUnits.map(sub =>
                            sub.id === subUnitId ? { ...sub, [field]: value } : sub
                          )
                        }
                      : use
                  )
                );
            };

            const addSubUnit = (useId) => {
                const newId = \`\${useId}_\${Date.now()}\`;
                const newSubUnit = {
                  id: newId,
                  name: "وحدة جديدة",
                  percentage: 0,
                  efficiency: 80,
                  areaPerUnit: 100,
                  units: 0,
                  totalArea: 0
                };

                setUses(prev => 
                  prev.map(use => 
                    use.id === useId 
                      ? { ...use, subUnits: [...use.subUnits, newSubUnit] }
                      : use
                  )
                );
            };

            const deleteSubUnit = (useId, subUnitId) => {
                if (window.confirm("هل أنت متأكد من حذف هذه الوحدة؟")) {
                  setUses(prev =>
                    prev.map(use =>
                      use.id === useId
                        ? { ...use, subUnits: use.subUnits.filter(sub => sub.id !== subUnitId) }
                        : use
                    )
                  );
                }
            };



            const totalSharePercentage = uses.reduce((sum, use) => sum + use.share, 0);
            const hasShareWarning = totalSharePercentage !== 100;

            return (
                <div className="bg-white/5 backdrop-filter backdrop-blur-sm rounded-xl shadow-lg p-6 mb-6">
                  {/* Header */}
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">
                        🏗️ إدارة الاستخدامات
                      </h2>
                      <p className="text-white/80">
                        إجمالي المساحة المبنية: <span className="font-bold text-white/90">{(landArea * far).toLocaleString('en-US')}</span> م²
                      </p>
                    </div>
                    
                    <div className="flex gap-3">

                      

                    </div>
                  </div>

                  {/* Share Warning */}
                  {hasShareWarning && (
                    <div className="bg-amber-500/20 border-l-4 border-yellow-400 p-4 mb-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <i className="fas fa-exclamation-triangle text-yellow-400"></i>
                        </div>
                        <div className="ml-3">
                          <p className="text-amber-200">
                            تحذير: إجمالي نسب الاستخدامات = <strong>{totalSharePercentage.toFixed(1)}%</strong>
                            {totalSharePercentage > 100 ? " (يتجاوز 100%)" : " (أقل من 100%)"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Uses Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {uses.map((use) => (
                      <div
                        key={use.id}
                        className={\`rounded-lg border-2 shadow-md p-4 transition-all duration-200 \${
                          expanded.includes(use.id) 
                            ? \`bg-\${use.color}-50 border-\${use.color}-300\` 
                            : \`bg-\${use.color}-25 border-\${use.color}-200 hover:border-\${use.color}-300\`
                        }\`}
                      >
                        {/* Use Header */}
                        <div
                          className="flex justify-between items-center cursor-pointer"
                          onClick={() => toggleExpand(use.id)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{use.icon}</span>
                            <div>
                              <h3 className={\`text-\${use.color}-800 font-bold text-lg\`}>
                                {use.name}
                              </h3>
                              <p className="text-sm text-white/80">
                                {use.totalUnits} وحدة • {use.totalGLA.toLocaleString('en-US')} م²
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={\`text-\${use.color}-600 font-bold\`}>
                              {use.share}%
                            </span>
                            <i className={\`fas \${expanded.includes(use.id) ? 'fa-chevron-up' : 'fa-chevron-down'} text-\${use.color}-600\`}></i>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {expanded.includes(use.id) && (
                          <div className="mt-4 space-y-4">
                            {/* Main Controls */}
                            <div className="grid grid-cols-2 gap-4 p-3 bg-white/5 backdrop-filter backdrop-blur-sm rounded-lg border">
                              <div>
                                <label className="block text-sm font-medium text-white/90 mb-1">
                                  النسبة (%)
                                </label>
                                <input
                                  type="number"
                                  value={use.share}
                                  onChange={(e) => updateUseShare(use.id, parseFloat(e.target.value) || 0)}
                                  className="w-full border border-white/20 rounded-md px-3 py-2 focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-white/90 mb-1">
                                  الكفاءة (%)
                                </label>
                                <input
                                  type="number"
                                  value={use.efficiency}
                                  onChange={(e) => updateUseEfficiency(use.id, parseFloat(e.target.value) || 0)}
                                  className="w-full border border-white/20 rounded-md px-3 py-2 focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                />
                              </div>
                            </div>

                            {/* Sub Units */}
                            <div className="space-y-3">
                              <h4 className="font-semibold text-white flex items-center gap-2">
                                <i className="fas fa-list text-white/70"></i>
                                أنواع الوحدات
                              </h4>

                              {use.subUnits.map((subUnit) => (
                                <div
                                  key={subUnit.id}
                                  className="flex items-center gap-2 p-3 border rounded-lg bg-white hover:shadow-sm transition-shadow"
                                >
                                  <button
                                    onClick={() => deleteSubUnit(use.id, subUnit.id)}
                                    className="text-red-500 hover:text-red-200 p-1"
                                    title="حذف الوحدة"
                                  >
                                    <i className="fas fa-trash-alt"></i>
                                  </button>

                                  <input
                                    type="text"
                                    value={subUnit.name}
                                    onChange={(e) => updateSubUnit(use.id, subUnit.id, 'name', e.target.value)}
                                    className="flex-1 border border-white/20 rounded px-2 py-1 text-sm"
                                    placeholder="اسم الوحدة"
                                  />

                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      value={subUnit.percentage}
                                      onChange={(e) => updateSubUnit(use.id, subUnit.id, 'percentage', parseFloat(e.target.value) || 0)}
                                      className="w-16 border border-white/20 rounded px-2 py-1 text-sm text-center"
                                      min="0"
                                      max="100"
                                      step="0.1"
                                    />
                                    <span className="text-xs text-white/70">%</span>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      value={subUnit.areaPerUnit}
                                      onChange={(e) => updateSubUnit(use.id, subUnit.id, 'areaPerUnit', parseFloat(e.target.value) || 0)}
                                      className="w-20 border border-white/20 rounded px-2 py-1 text-sm text-center"
                                      min="0"
                                      step="0.1"
                                    />
                                    <span className="text-xs text-white/70">م²</span>
                                  </div>

                                  <div className="flex items-center gap-1 bg-white/8 rounded px-2 py-1">
                                    <span className="font-bold text-white/90 text-sm">
                                      {subUnit.units}
                                    </span>
                                    <span className="text-xs text-white/90">وحدة</span>
                                  </div>
                                </div>
                              ))}

                              <button
                                onClick={() => addSubUnit(use.id)}
                                className="w-full py-2 border-2 border-dashed border-white/20 rounded-lg text-white/80 hover:border-gray-400 hover:text-white/90 transition-colors"
                              >
                                <i className="fas fa-plus mr-2"></i>
                                إضافة نوع وحدة جديد
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Summary */}
                  <div className="mt-6 p-4 bg-white/5 rounded-lg">
                    <h3 className="font-bold text-white mb-3">📊 ملخص الاستخدامات</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {uses.map((use) => (
                        <div key={use.id} className="text-center">
                          <div className={\`text-2xl font-bold text-\${use.color}-600\`}>
                            {use.totalUnits}
                          </div>
                          <div className="text-sm text-white/80">
                            {use.name} • {use.share}%
                          </div>
                          <div className="text-xs text-white/70">
                            {use.totalGLA.toLocaleString('en-US')} م²
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-white/20">
                      <div className="flex justify-between text-sm">
                        <span>إجمالي النسب:</span>
                        <span className={\`font-bold \${hasShareWarning ? 'text-red-300' : 'text-white/90'}\`}>
                          {totalSharePercentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>إجمالي الوحدات:</span>
                        <span className="font-bold text-white/90">
                          {uses.reduce((sum, use) => sum + use.totalUnits, 0)} وحدة
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>إجمالي المساحة المؤجرة:</span>
                        <span className="font-bold text-white/90">
                          {uses.reduce((sum, use) => sum + use.totalGLA, 0).toLocaleString('en-US')} م²
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
            );
        };

        // Global variables for project parameters
        let currentLandArea = 10000;
        let currentFAR = 3.5;

        // Render the component
        function renderComponent() {
            ReactDOM.render(
                React.createElement(UsesSystemEnhanced, {
                    landArea: currentLandArea,
                    far: currentFAR,
                    onUsesChange: (uses) => {
                        console.log('Uses updated:', uses);
                    }
                }),
                document.getElementById('enhanced-uses-container')
            );
        }

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            updateProjectParams();
            renderComponent();
        });

        // Update project parameters
        function updateProjectParams() {
            const landAreaInput = document.getElementById('landArea');
            const farInput = document.getElementById('far');
            const totalGFAInput = document.getElementById('totalGFA');

            if (landAreaInput && farInput && totalGFAInput) {
                currentLandArea = parseFloat(landAreaInput.value) || 10000;
                currentFAR = parseFloat(farInput.value) || 3.5;
                
                const totalGFA = currentLandArea * currentFAR;
                totalGFAInput.value = totalGFA.toLocaleString('en-US') + ' م²';
                
                // Re-render component with new parameters
                renderComponent();
            }
        }

        // Language toggle functionality
        let currentLang = 'ar';

        function toggleLanguageSimple() {
            currentLang = currentLang === 'ar' ? 'en' : 'ar';
            currentLanguage = currentLang; // Update floors system language variable
            
            if (currentLang === 'en') {
                document.body.className = 'bg-white/5 english ltr';
                document.getElementById('langText').textContent = 'العربية';
                document.getElementById('mainTitle').textContent = 'Uses Management System';
                document.getElementById('mainSubtitle').textContent = 'إدارة الاستخدامات';
            } else {
                document.body.className = 'bg-white/5 arabic rtl';
                document.getElementById('langText').textContent = 'English';
                document.getElementById('mainTitle').textContent = 'إدارة الاستخدامات';
                document.getElementById('mainSubtitle').textContent = 'Uses Management System';
            }
            
            // Update map translations
            if (typeof updateMapTranslations === 'function') {
                updateMapTranslations();
            }
            
            // Update floors translations
            if (typeof updateFloorsTranslations === 'function') {
                updateFloorsTranslations();
            }
        }
    </script>
</body>
</html>`;

  return c.html(htmlContent)
})

// Main page route
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>منصة نقوة | أداة دراسة الجدوى العقارية</title>
        
        <!-- Fonts - Enhanced Arabic Typography -->
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800&display=swap" rel="stylesheet">
        
        <!-- External Libraries -->
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
        
        <!-- CRITICAL: Convert numerals BEFORE page render -->
        <script>
            // Execute IMMEDIATELY before DOM is parsed
            (function() {
                // Map of Arabic-Indic numerals to Latin
                const arabicToLatin = {
                    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
                    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
                    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
                    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
                };
                
                window.toLatinNumerals = function(str) {
                    if (str == null) return '';
                    return String(str).replace(/[٠-٩۰-۹]/g, (c) => arabicToLatin[c] || c);
                };
                
                // Convert ALL inputs immediately when DOM is ready
                function convertAllInputs() {
                    document.querySelectorAll('input, textarea, select, td, th, span, div, p, label').forEach(el => {
                        // Convert value attribute
                        if (el.value !== undefined && el.value !== null && el.value !== '') {
                            el.value = window.toLatinNumerals(el.value);
                        }
                        
                        // Convert text content
                        if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
                            el.textContent = window.toLatinNumerals(el.textContent);
                        }
                        
                        // Convert placeholder
                        if (el.placeholder) {
                            el.placeholder = window.toLatinNumerals(el.placeholder);
                        }
                    });
                }
                
                // Run as soon as DOM is interactive
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', convertAllInputs);
                } else {
                    convertAllInputs();
                }
                
                // Also run immediately (synchronously)
                if (document.body) {
                    convertAllInputs();
                }
            })();
        </script>
        
        <!-- Custom Styles -->
        <style>
            /* Root variables for Premium Design System */
            :root {
                /* Color Palette */
                --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                --accent-gradient: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                --success-gradient: linear-gradient(135deg, #10b981 0%, #059669 100%);
                --danger-gradient: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                --info-gradient: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                
                /* Glass Morphism */
                --glass-bg: rgba(255, 255, 255, 0.95);
                --glass-bg-dark: rgba(31, 41, 55, 0.9);
                --glass-border: rgba(255, 255, 255, 0.18);
                --glass-border-dark: rgba(255, 255, 255, 0.1);
                
                /* Shadows - Premium Multi-Layer */
                --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                
                /* Spacing System */
                --spacing-xs: 0.5rem;
                --spacing-sm: 0.75rem;
                --spacing-md: 1rem;
                --spacing-lg: 1.5rem;
                --spacing-xl: 2rem;
                --spacing-2xl: 3rem;
                
                /* Border Radius */
                --radius-sm: 0.5rem;
                --radius-md: 0.75rem;
                --radius-lg: 1rem;
                --radius-xl: 1.25rem;
                --radius-2xl: 1.5rem;
                --radius-full: 9999px;
                
                /* Transitions */
                --transition-fast: 0.15s cubic-bezier(0.4, 0, 0.2, 1);
                --transition-base: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                --transition-slow: 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                
                /* Z-Index Scale */
                --z-dropdown: 1000;
                --z-sticky: 1020;
                --z-fixed: 1030;
                --z-modal-backdrop: 1040;
                --z-modal: 1050;
                --z-popover: 1060;
                --z-tooltip: 1070;
            }
            
            /* Force Western Arabic numerals (0-9) everywhere */
            * {
                font-variant-numeric: lining-nums !important;
                -webkit-font-feature-settings: "lnum" 1 !important;
                font-feature-settings: "lnum" 1 !important;
            }
            
            /* Smooth scrolling */
            html {
                scroll-behavior: smooth;
                overflow-x: hidden;
            }
            
            /* Premium Body Background with Animated Mesh Gradient */
            .premium-body {
                min-height: 100vh;
                background: 
                    radial-gradient(ellipse at top right, rgba(102, 126, 234, 0.15) 0%, transparent 50%),
                    radial-gradient(ellipse at bottom left, rgba(251, 191, 36, 0.15) 0%, transparent 50%),
                    radial-gradient(ellipse at center, rgba(118, 75, 162, 0.1) 0%, transparent 50%),
                    linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
                background-size: 100% 100%, 100% 100%, 100% 100%, 100% 100%;
                background-attachment: fixed;
                position: relative;
            }
            
            /* Animated Gradient Orbs */
            .premium-body::before {
                content: '';
                position: fixed;
                top: -50%;
                right: -50%;
                width: 200%;
                height: 200%;
                background: radial-gradient(
                    circle at center,
                    rgba(102, 126, 234, 0.08) 0%,
                    transparent 50%
                );
                animation: rotateOrb 30s linear infinite;
                pointer-events: none;
                z-index: 0;
            }
            
            .premium-body::after {
                content: '';
                position: fixed;
                bottom: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: radial-gradient(
                    circle at center,
                    rgba(251, 191, 36, 0.06) 0%,
                    transparent 50%
                );
                animation: rotateOrb 40s linear infinite reverse;
                pointer-events: none;
                z-index: 0;
            }
            
            @keyframes rotateOrb {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            /* Main Container with Z-index */
            .main-container {
                position: relative;
                z-index: 1;
            }
            
            /* ========================================
               PREMIUM HEADER DESIGN
               ======================================== */
            .premium-header {
                background: rgba(15, 23, 42, 0.8);
                backdrop-filter: blur(20px) saturate(180%);
                -webkit-backdrop-filter: blur(20px) saturate(180%);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: 
                    0 4px 6px -1px rgba(0, 0, 0, 0.1),
                    0 2px 4px -1px rgba(0, 0, 0, 0.06),
                    0 0 0 1px rgba(255, 255, 255, 0.05);
                transition: all var(--transition-base);
            }
            
            .premium-header-inner {
                max-width: 1400px;
                margin: 0 auto;
                padding: 1.25rem 2rem;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 2rem;
            }
            
            /* Logo and Brand */
            .header-brand {
                display: flex;
                align-items: center;
                gap: 1.5rem;
            }
            
            .logo-container {
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            
            .logo-icon {
                width: 56px;
                height: 56px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: var(--radius-xl);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.75rem;
                color: white;
                box-shadow: 
                    0 8px 16px rgba(102, 126, 234, 0.3),
                    0 0 0 1px rgba(255, 255, 255, 0.1);
                transition: all var(--transition-base);
                position: relative;
                overflow: hidden;
            }
            
            .logo-icon::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: linear-gradient(
                    45deg,
                    transparent 30%,
                    rgba(255, 255, 255, 0.2) 50%,
                    transparent 70%
                );
                animation: logoShine 3s infinite;
            }
            
            @keyframes logoShine {
                0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
                100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
            }
            
            .logo-icon:hover {
                transform: scale(1.05) rotate(5deg);
                box-shadow: 
                    0 12px 24px rgba(102, 126, 234, 0.4),
                    0 0 0 2px rgba(255, 255, 255, 0.15);
            }
            
            .brand-text {
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
            }
            
            .brand-title {
                font-size: 1.75rem;
                font-weight: 700;
                background: linear-gradient(135deg, #ffffff 0%, #e5e7eb 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                line-height: 1.2;
                margin: 0;
            }
            
            .brand-subtitle {
                font-size: 0.9375rem;
                color: rgba(229, 231, 235, 0.7);
                font-weight: 400;
                margin: 0;
            }
            
            /* Header Actions */
            .header-actions {
                display: flex;
                align-items: center;
                gap: 1.5rem;
            }
            
            .action-buttons-group {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.5rem;
                background: rgba(255, 255, 255, 0.05);
                border-radius: var(--radius-lg);
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .premium-action-btn {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.625rem 1rem;
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: var(--radius-md);
                color: #e5e7eb;
                font-size: 0.875rem;
                font-weight: 500;
                cursor: pointer;
                transition: all var(--transition-base);
                position: relative;
                overflow: hidden;
            }
            
            .premium-action-btn::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%);
                opacity: 0;
                transition: opacity var(--transition-base);
            }
            
            .premium-action-btn:hover {
                background: rgba(255, 255, 255, 0.15);
                border-color: rgba(251, 191, 36, 0.3);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
            
            .premium-action-btn:hover::before {
                opacity: 1;
            }
            
            .premium-action-btn-primary {
                background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                border-color: #fbbf24;
                color: #1f2937;
            }
            
            .premium-action-btn-primary:hover {
                background: linear-gradient(135deg, #fcd34d 0%, #fbbf24 100%);
                transform: translateY(-3px) scale(1.05);
                box-shadow: 0 8px 20px rgba(251, 191, 36, 0.4);
            }
            
            .btn-label {
                white-space: nowrap;
            }
            
            /* ========================================
               PREMIUM TABS NAVIGATION
               ======================================== */
            .premium-tabs-container {
                background: rgba(15, 23, 42, 0.6);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                padding: 1rem 0;
                position: sticky;
                top: 90px;
                z-index: calc(var(--z-sticky) - 1);
            }
            
            .premium-tabs-inner {
                max-width: 1400px;
                margin: 0 auto;
                padding: 0 2rem;
            }
            
            .tabs-scroll-wrapper {
                display: flex;
                gap: 0.75rem;
                overflow-x: auto;
                overflow-y: hidden;
                padding-bottom: 0.5rem;
                scrollbar-width: thin;
                scrollbar-color: rgba(102, 126, 234, 0.3) transparent;
            }
            
            .tabs-scroll-wrapper::-webkit-scrollbar {
                height: 6px;
            }
            
            .tabs-scroll-wrapper::-webkit-scrollbar-track {
                background: transparent;
            }
            
            .tabs-scroll-wrapper::-webkit-scrollbar-thumb {
                background: rgba(102, 126, 234, 0.3);
                border-radius: 3px;
            }
            
            .tabs-scroll-wrapper::-webkit-scrollbar-thumb:hover {
                background: rgba(102, 126, 234, 0.5);
            }
            
            /* Custom scrollbar */
            ::-webkit-scrollbar {
                width: 12px;
                height: 12px;
            }
            
            ::-webkit-scrollbar-track {
                background: rgba(31, 41, 55, 0.1);
                border-radius: 10px;
            }
            
            ::-webkit-scrollbar-thumb {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 10px;
                border: 2px solid rgba(255, 255, 255, 0.1);
            }
            
            ::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(135deg, #7e8ff5 0%, #8b5db8 100%);
            }
            
            /* Critical: Force input fields to use Latin numerals */
            input[type="number"],
            input[type="text"],
            input,
            textarea,
            select {
                font-family: 'Inter', sans-serif !important;
                direction: ltr !important;
                text-align: right !important;
            }
            
            /* Keep placeholder text in Arabic direction */
            input::placeholder,
            textarea::placeholder {
                direction: rtl !important;
                text-align: right !important;
            }
            
            .arabic { 
                font-family: 'IBM Plex Sans Arabic', 'Cairo', 'Tajawal', sans-serif;
                font-weight: 400;
                line-height: 1.7;
                letter-spacing: 0.01em;
            }
            .english { 
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                font-weight: 400;
                line-height: 1.6;
            }
            
            .rtl { direction: rtl; }
            .ltr { direction: ltr; }
            
            .chart-container {
                position: relative;
                height: 300px;
                width: 100%;
            }
            
            .input-group {
                margin-bottom: 1rem;
            }
            
            .btn-primary {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 0.875rem 1.75rem;
                border-radius: 0.75rem;
                font-weight: 600;
                font-size: 0.9375rem;
                transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
                cursor: pointer;
                position: relative;
                overflow: hidden;
                box-shadow: 
                    0 4px 6px -1px rgba(102, 126, 234, 0.2),
                    0 2px 4px -1px rgba(102, 126, 234, 0.1);
            }
            
            .btn-primary::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
                opacity: 0;
                transition: opacity 0.35s ease;
            }
            
            .btn-primary:hover {
                transform: translateY(-3px) scale(1.02);
                box-shadow: 
                    0 20px 25px -5px rgba(102, 126, 234, 0.3),
                    0 10px 10px -5px rgba(102, 126, 234, 0.2);
            }
            
            .btn-primary:hover::before {
                opacity: 1;
            }
            
            .btn-primary:active {
                transform: translateY(-1px) scale(0.98);
            }
            
            .card {
                background: rgba(255, 255, 255, 0.06);
                backdrop-filter: blur(20px) saturate(180%);
                -webkit-backdrop-filter: blur(20px) saturate(180%);
                border-radius: var(--radius-xl);
                padding: 1.75rem;
                box-shadow: 
                    0 8px 16px -4px rgba(0, 0, 0, 0.12),
                    0 4px 8px -2px rgba(0, 0, 0, 0.08),
                    0 0 0 1px rgba(255, 255, 255, 0.08),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.12);
                transition: all var(--transition-base);
                position: relative;
                overflow: hidden;
            }
            
            .card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 2px;
                background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.5), transparent);
                opacity: 0;
                transition: opacity var(--transition-base);
            }
            
            .card:hover {
                transform: translateY(-6px) scale(1.01);
                box-shadow: 
                    0 20px 40px -8px rgba(0, 0, 0, 0.2),
                    0 10px 20px -4px rgba(0, 0, 0, 0.15),
                    0 0 0 2px rgba(102, 126, 234, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.15);
                border-color: rgba(102, 126, 234, 0.3);
            }
            
            .card:hover::before {
                opacity: 1;
            }
            
            .results-card {
                background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            }
            
            .metric-card {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                border-radius: 1rem;
                padding: 1.5rem;
                text-align: center;
                border: 2px solid rgba(229, 231, 235, 0.5);
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 
                    0 4px 6px -1px rgba(0, 0, 0, 0.06),
                    0 2px 4px -1px rgba(0, 0, 0, 0.04);
                position: relative;
                overflow: hidden;
            }
            
            .metric-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
                transform: scaleX(0);
                transform-origin: left;
                transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .metric-card:hover {
                border-color: rgba(102, 126, 234, 0.4);
                transform: translateY(-5px) scale(1.02);
                box-shadow: 
                    0 20px 25px -5px rgba(0, 0, 0, 0.1),
                    0 10px 10px -5px rgba(0, 0, 0, 0.04);
            }
            
            .metric-card:hover::before {
                transform: scaleX(1);
            }
            
            .sidebar {
                height: 100vh;
                overflow-y: auto;
                background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            
            .main-content {
                height: 100vh;
                overflow-y: auto;
            }
            
            input, select {
                width: 100%;
                padding: 0.75rem 1rem;
                border: 2px solid rgba(229, 231, 235, 0.8);
                border-radius: 0.75rem;
                font-size: 0.9375rem;
                background: rgba(255, 255, 255, 0.9);
                backdrop-filter: blur(8px);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            }
            
            input:hover, select:hover {
                border-color: rgba(102, 126, 234, 0.3);
                background: rgba(255, 255, 255, 1);
            }
            
            input:focus, select:focus {
                outline: none;
                border-color: #667eea;
                background: white;
                box-shadow: 
                    0 0 0 4px rgba(102, 126, 234, 0.1),
                    0 4px 6px -1px rgba(0, 0, 0, 0.1);
                transform: translateY(-1px);
            }
            
            input::placeholder, select::placeholder {
                color: #9ca3af;
                font-weight: 400;
            }
            
            .lang-btn {
                position: fixed;
                top: 1.25rem;
                right: 1.25rem;
                z-index: 1000;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border: 2px solid rgba(102, 126, 234, 0.2);
                padding: 0.625rem 1.25rem;
                border-radius: 2rem;
                cursor: pointer;
                font-weight: 500;
                font-size: 0.9375rem;
                transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 
                    0 4px 6px -1px rgba(0, 0, 0, 0.1),
                    0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }
            
            .lang-btn:hover {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                transform: translateY(-2px) scale(1.05);
                border-color: #667eea;
                box-shadow: 
                    0 10px 15px -3px rgba(102, 126, 234, 0.3),
                    0 4px 6px -2px rgba(102, 126, 234, 0.2);
            }
            
            .lang-btn:active {
                transform: translateY(0) scale(0.98);
            }
            
            .loading {
                opacity: 0.6;
                pointer-events: none;
                filter: blur(2px);
                transition: all 0.3s ease;
            }
            
            /* Enhanced Loading Spinner */
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            @keyframes pulse-glow {
                0%, 100% {
                    opacity: 1;
                    transform: scale(1);
                }
                50% {
                    opacity: 0.7;
                    transform: scale(1.05);
                }
            }
            
            .loading-spinner {
                animation: spin 1s linear infinite, pulse-glow 2s ease-in-out infinite;
            }
            
            .warning {
                background-color: #fef3c7;
                border: 1px solid #f59e0b;
                border-radius: 0.5rem;
                padding: 1rem;
                margin: 1rem 0;
            }
            
            .warning-icon {
                color: #f59e0b;
            }
            
            /* Dynamic color classes for uses system */
            .bg-white/8 { background-color: #f9fafb; }
            .bg-white/8 { background-color: #eff6ff; }
            .border-white/20 { border-color: #bfdbfe; }
            .border-white/20 { border-color: #93c5fd; }
            .text-white/90 { color: #2563eb; }
            .text-white/90 { color: #1d4ed8; }
            .text-white { color: #1e40af; }
            
            .bg-purple-25 { background-color: #f9fafb; }
            .bg-white/8 { background-color: #f3f4f6; }
            .border-white/20 { border-color: #e9d5ff; }
            .border-white/20 { border-color: #d8b4fe; }
            .text-white/90 { color: #9333ea; }
            .text-white/90 { color: #7c3aed; }
            .text-white { color: #6b21a8; }
            
            .bg-orange-25 { background-color: #fffaf0; }
            .bg-orange-500/20 { background-color: #fff7ed; }
            .border-orange-400/30 { border-color: #fed7aa; }
            .border-orange-400/40 { border-color: #fdba74; }
            .text-orange-300 { color: #ea580c; }
            .text-orange-200 { color: #c2410c; }
            .text-orange-100 { color: #9a3412; }
            
            .bg-emerald-500/15 { background-color: #f9fafb; }
            .bg-white/8 { background-color: #f0fdf4; }
            .border-gray-400 { border-color: #bbf7d0; }
            .border-white/20 { border-color: #86efac; }
            .text-white/90 { color: #16a34a; }
            .text-white/90 { color: #15803d; }
            .text-white { color: #166534; }
            
            .bg-red-25 { background-color: #fef2f2; }
            .bg-red-500/25 { background-color: #fee2e2; }
            .border-red-400/30 { border-color: #fecaca; }
            .border-red-400/40 { border-color: #fca5a5; }
            .text-red-300 { color: #dc2626; }
            .text-red-200 { color: #b91c1c; }
            .text-red-100 { color: #991b1b; }
            
            .bg-yellow-25 { background-color: #fffbeb; }
            .bg-amber-500/20 { background-color: #fffbeb; }
            .border-amber-400/30 { border-color: #fde68a; }
            .border-amber-400/40 { border-color: #fcd34d; }
            .text-amber-300 { color: #d97706; }
            .text-amber-200 { color: #b45309; }
            .text-amber-100 { color: #92400e; }
            
            .bg-red-25 { background-color: #fef2f2; }
            .bg-red-500/25 { background-color: #fee2e2; }
            .border-red-400/30 { border-color: #fecaca; }
            .border-red-400/40 { border-color: #fca5a5; }
            .text-red-300 { color: #dc2626; }
            .text-red-200 { color: #b91c1c; }
            .text-red-100 { color: #991b1b; }
            
            .bg-yellow-25 { background-color: #fffbeb; }
            .bg-amber-500/20 { background-color: #fffbeb; }
            .border-amber-400/30 { border-color: #fde68a; }
            .border-amber-400/40 { border-color: #fcd34d; }
            .text-amber-300 { color: #d97706; }
            .text-amber-200 { color: #b45309; }
            .text-amber-100 { color: #92400e; }
            
            .bg-emerald-25 { background-color: #f9fafb; }
            .bg-white/8 { background-color: #f3f4f6; }
            .border-white/15 { border-color: #a7f3d0; }
            .border-white/20 { border-color: #6ee7b7; }
            .text-white/80 { color: #059669; }
            .text-white/90 { color: #047857; }
            .text-white { color: #065f46; }
            
            .bg-cyan-25 { background-color: #f9fafb; }
            .bg-white/8 { background-color: #ecfeff; }
            .border-white/15 { border-color: #a5f3fc; }
            .border-white/20 { border-color: #67e8f9; }
            .text-white/90 { color: #0891b2; }
            .text-white/90 { color: #0e7490; }
            .text-white { color: #155e75; }
            
            .bg-violet-25 { background-color: #f9fafb; }
            .bg-white/8 { background-color: #f3e8ff; }
            .border-white/15 { border-color: #e9d5ff; }
            .border-white/20 { border-color: #d8b4fe; }
            .text-white/90 { color: #7c3aed; }
            .text-white/90 { color: #6d28d9; }
            .text-white { color: #5b21b6; }
            
            .bg-amber-25 { background-color: #fffbeb; }
            .bg-amber-500/20 { background-color: #fffbeb; }
            .border-amber-200 { border-color: #fde68a; }
            .border-amber-300 { border-color: #fcd34d; }
            .text-amber-300 { color: #d97706; }
            .text-amber-200 { color: #b45309; }
            .text-amber-100 { color: #92400e; }
            
            /* Enhanced KPI Cards Styles */
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            
            .pulse-indicator {
                animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            
            /* Enhanced grid layouts for better responsiveness */
            .kpi-grid-primary {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 1.5rem;
            }
            
            .kpi-grid-secondary {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                gap: 1.5rem;
            }
            
            /* Enhanced hover effects */
            .enhanced-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            }
            
            /* Better spacing for Arabic text */
            .arabic .kpi-card {
                text-align: right;
                direction: rtl;
            }
            
            /* Responsive improvements */
            @media (max-width: 640px) {
                .kpi-grid-primary,
                .kpi-grid-secondary {
                    grid-template-columns: 1fr;
                    gap: 1rem;
                }
            }
            
            /* Enhanced Summary Cards - تحسينات آمنة للملخص */
            .uses-summary-enhanced {
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                border-radius: 1rem;
                padding: 1.5rem;
                border: 1px solid #cbd5e1;
            }
            
            .summary-metric-card {
                background: white;
                border-radius: 0.75rem;
                padding: 1rem;
                border: 2px solid #e5e7eb;
                transition: all 0.2s ease;
            }
            
            .summary-metric-card:hover {
                border-color: #3b82f6;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            
            /* ========================================
               نظام علامات التبويب (Tabs System)
               ======================================== */
            .tab-button {
                position: relative;
                padding: 0.75rem 1.5rem;
                background: rgba(255, 255, 255, 0.06);
                border: 2px solid transparent;
                border-radius: var(--radius-lg);
                color: rgba(229, 231, 235, 0.9);
                font-size: 0.9375rem;
                font-weight: 500;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 0.625rem;
                white-space: nowrap;
                transition: all var(--transition-base);
                overflow: hidden;
            }
            
            /* Tab Glow Effect */
            .tab-button::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(
                    135deg,
                    rgba(102, 126, 234, 0.0) 0%,
                    rgba(118, 75, 162, 0.0) 100%
                );
                opacity: 0;
                transition: opacity var(--transition-base);
                z-index: -1;
            }
            
            /* Tab Bottom Border Indicator */
            .tab-button::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 50%;
                transform: translateX(-50%) scaleX(0);
                width: 80%;
                height: 3px;
                background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #fbbf24 100%);
                border-radius: 2px 2px 0 0;
                transition: transform var(--transition-base);
            }
            
            .tab-button:hover {
                background: rgba(255, 255, 255, 0.12);
                border-color: rgba(102, 126, 234, 0.3);
                transform: translateY(-2px);
                color: #ffffff;
                box-shadow: 
                    0 4px 12px rgba(0, 0, 0, 0.15),
                    0 0 0 1px rgba(102, 126, 234, 0.2);
            }
            
            .tab-button:hover::before {
                opacity: 1;
            }
            
            .tab-button:hover::after {
                transform: translateX(-50%) scaleX(1);
            }
            
            /* Active Tab State */
            .tab-button.tab-active {
                background: linear-gradient(
                    135deg,
                    rgba(102, 126, 234, 0.25) 0%,
                    rgba(118, 75, 162, 0.25) 50%,
                    rgba(251, 191, 36, 0.25) 100%
                );
                border-color: rgba(251, 191, 36, 0.5);
                color: #ffffff;
                font-weight: 600;
                transform: translateY(-3px);
                box-shadow: 
                    0 8px 20px rgba(102, 126, 234, 0.3),
                    0 4px 10px rgba(251, 191, 36, 0.2),
                    0 0 0 2px rgba(251, 191, 36, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.2);
            }
            
            .tab-button.tab-active::before {
                opacity: 1;
                background: linear-gradient(
                    135deg,
                    rgba(102, 126, 234, 0.15) 0%,
                    rgba(118, 75, 162, 0.15) 50%,
                    rgba(251, 191, 36, 0.15) 100%
                );
            }
            
            .tab-button.tab-active::after {
                transform: translateX(-50%) scaleX(1);
                height: 4px;
                box-shadow: 0 0 8px rgba(251, 191, 36, 0.5);
            }
            
            .tab-button.tab-active i {
                color: #fbbf24;
                filter: drop-shadow(0 0 4px rgba(251, 191, 36, 0.5));
            }
            
            .tab-content {
                display: none;
            }
            
            .tab-content.tab-active {
                display: block;
                animation: tabContentFadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            @keyframes tabContentFadeIn {
                from {
                    opacity: 0;
                    transform: translateY(20px) scale(0.98);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
            
            /* ========================================
               PREMIUM CONTENT CONTAINER
               ======================================== */
            .premium-content {
                max-width: 1400px;
                margin: 0 auto;
                padding: 2rem;
                position: relative;
                z-index: 1;
            }
            
            /* ========================================
               TAB-SPECIFIC ENHANCEMENTS
               ======================================== */
            
            /* Modern Input Fields */
            .modern-input-group {
                position: relative;
                margin-bottom: var(--spacing-lg);
            }
            
            .modern-input-label {
                display: block;
                font-size: 0.875rem;
                font-weight: 600;
                color: rgba(255, 255, 255, 0.9);
                margin-bottom: 0.5rem;
                transition: color var(--transition-base);
            }
            
            .modern-input {
                width: 100%;
                padding: 0.875rem 1rem;
                background: rgba(255, 255, 255, 0.08);
                border: 2px solid rgba(255, 255, 255, 0.12);
                border-radius: var(--radius-lg);
                color: #ffffff;
                font-size: 0.9375rem;
                font-weight: 500;
                transition: all var(--transition-base);
                backdrop-filter: blur(10px);
            }
            
            .modern-input::placeholder {
                color: rgba(255, 255, 255, 0.4);
            }
            
            .modern-input:hover {
                background: rgba(255, 255, 255, 0.12);
                border-color: rgba(251, 191, 36, 0.3);
            }
            
            .modern-input:focus {
                background: rgba(255, 255, 255, 0.15);
                border-color: #fbbf24;
                outline: none;
                box-shadow: 
                    0 0 0 4px rgba(251, 191, 36, 0.15),
                    0 4px 12px rgba(0, 0, 0, 0.1);
                transform: translateY(-1px);
            }
            
            /* Info Card Grid */
            .info-card-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: var(--spacing-lg);
                margin-bottom: var(--spacing-xl);
            }
            
            .info-card {
                background: rgba(255, 255, 255, 0.06);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: var(--radius-xl);
                padding: var(--spacing-lg);
                transition: all var(--transition-base);
                position: relative;
                overflow: hidden;
            }
            
            .info-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: linear-gradient(90deg, #667eea, #764ba2, #fbbf24);
                opacity: 0;
                transition: opacity var(--transition-base);
            }
            
            .info-card:hover {
                background: rgba(255, 255, 255, 0.1);
                border-color: rgba(251, 191, 36, 0.3);
                transform: translateY(-4px);
                box-shadow: 
                    0 12px 40px rgba(0, 0, 0, 0.2),
                    0 0 0 1px rgba(251, 191, 36, 0.1);
            }
            
            .info-card:hover::before {
                opacity: 1;
            }
            
            .info-card-icon {
                width: 56px;
                height: 56px;
                background: linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2));
                border-radius: var(--radius-lg);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.75rem;
                margin-bottom: var(--spacing-md);
                border: 1px solid rgba(255, 255, 255, 0.15);
                transition: all var(--transition-base);
            }
            
            .info-card:hover .info-card-icon {
                transform: scale(1.1) rotate(5deg);
                background: linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3));
            }
            
            .info-card-title {
                font-size: 0.875rem;
                font-weight: 600;
                color: rgba(255, 255, 255, 0.7);
                margin-bottom: 0.5rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            
            .info-card-value {
                font-size: 1.75rem;
                font-weight: 700;
                color: #ffffff;
                line-height: 1.2;
                margin-bottom: 0.5rem;
            }
            
            .info-card-description {
                font-size: 0.875rem;
                color: rgba(255, 255, 255, 0.6);
                line-height: 1.5;
            }
            
            /* Modern Table Styles */
            .modern-table-wrapper {
                background: rgba(255, 255, 255, 0.04);
                border-radius: var(--radius-xl);
                padding: var(--spacing-lg);
                border: 1px solid rgba(255, 255, 255, 0.08);
                overflow-x: auto;
                overflow-y: visible;
                margin-bottom: var(--spacing-xl);
                /* Smooth scrolling for horizontal overflow */
                scrollbar-width: thin;
                scrollbar-color: rgba(251, 191, 36, 0.3) rgba(255, 255, 255, 0.05);
            }
            
            .modern-table-wrapper::-webkit-scrollbar {
                height: 8px;
            }
            
            .modern-table-wrapper::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 4px;
            }
            
            .modern-table-wrapper::-webkit-scrollbar-thumb {
                background: rgba(251, 191, 36, 0.3);
                border-radius: 4px;
            }
            
            .modern-table-wrapper::-webkit-scrollbar-thumb:hover {
                background: rgba(251, 191, 36, 0.5);
            }
            
            .modern-table {
                width: 100%;
                border-collapse: separate;
                border-spacing: 0;
            }
            
            .modern-table thead {
                background: rgba(102, 126, 234, 0.15);
            }
            
            .modern-table th {
                padding: 0.625rem 0.75rem;
                text-align: center;
                font-size: 0.8125rem;
                font-weight: 700;
                color: #fbbf24;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                border-bottom: 2px solid rgba(251, 191, 36, 0.3);
                position: sticky;
                top: 0;
                background: rgba(102, 126, 234, 0.15);
                backdrop-filter: blur(10px);
                z-index: 10;
                white-space: nowrap;
            }
            
            .modern-table tbody tr {
                background: rgba(255, 255, 255, 0.03);
                transition: all var(--transition-base);
            }
            
            .modern-table tbody tr:hover {
                background: rgba(255, 255, 255, 0.08);
                transform: scale(1.01);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
            
            .modern-table td {
                padding: 0.5rem 0.625rem;
                color: rgba(255, 255, 255, 0.9);
                font-size: 0.875rem;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                text-align: center;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 200px;
            }
            
            .modern-table tbody tr:last-child td {
                border-bottom: none;
            }
            
            /* Stats Grid */
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: var(--spacing-md);
                margin-bottom: var(--spacing-xl);
            }
            
            .stat-card {
                background: rgba(255, 255, 255, 0.05);
                backdrop-filter: blur(15px);
                border-radius: var(--radius-lg);
                padding: var(--spacing-lg);
                border: 1px solid rgba(255, 255, 255, 0.1);
                text-align: center;
                transition: all var(--transition-base);
                position: relative;
                overflow: hidden;
            }
            
            .stat-card::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: linear-gradient(90deg, transparent, var(--accent-gradient), transparent);
                transform: scaleX(0);
                transition: transform var(--transition-base);
            }
            
            .stat-card:hover {
                background: rgba(255, 255, 255, 0.1);
                border-color: rgba(251, 191, 36, 0.4);
                transform: translateY(-6px) scale(1.05);
                box-shadow: 
                    0 16px 32px rgba(0, 0, 0, 0.2),
                    0 0 0 1px rgba(251, 191, 36, 0.2);
            }
            
            .stat-card:hover::after {
                transform: scaleX(1);
            }
            
            .stat-value {
                font-size: 2rem;
                font-weight: 800;
                color: #fbbf24;
                line-height: 1;
                margin-bottom: 0.5rem;
                text-shadow: 0 0 20px rgba(251, 191, 36, 0.3);
            }
            
            .stat-label {
                font-size: 0.875rem;
                color: rgba(255, 255, 255, 0.7);
                font-weight: 500;
            }
            
            /* Chart Container */
            .chart-container-modern {
                background: rgba(255, 255, 255, 0.04);
                backdrop-filter: blur(15px);
                border-radius: var(--radius-xl);
                padding: var(--spacing-xl);
                border: 1px solid rgba(255, 255, 255, 0.08);
                margin-bottom: var(--spacing-xl);
                position: relative;
                overflow: hidden;
            }
            
            .chart-container-modern::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 2px;
                background: linear-gradient(90deg, #667eea, #764ba2, #fbbf24);
            }
            
            .chart-title {
                font-size: 1.25rem;
                font-weight: 700;
                color: #ffffff;
                margin-bottom: var(--spacing-lg);
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            
            .chart-title i {
                color: #fbbf24;
                filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.4));
            }
            
            /* Progress Bar */
            .progress-bar-container {
                width: 100%;
                height: 12px;
                background: rgba(255, 255, 255, 0.08);
                border-radius: var(--radius-full);
                overflow: hidden;
                position: relative;
                margin-top: 0.75rem;
            }
            
            .progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #667eea, #764ba2, #fbbf24);
                border-radius: var(--radius-full);
                transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                box-shadow: 0 0 15px rgba(251, 191, 36, 0.5);
            }
            
            .progress-bar::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(
                    90deg,
                    transparent 0%,
                    rgba(255, 255, 255, 0.3) 50%,
                    transparent 100%
                );
                animation: shimmerProgress 2s infinite;
            }
            
            @keyframes shimmerProgress {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
            
            .progress-label {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 0.875rem;
                color: rgba(255, 255, 255, 0.7);
                margin-bottom: 0.5rem;
            }
            
            .progress-percentage {
                font-weight: 700;
                color: #fbbf24;
            }
            
            /* Action Button Group */
            .action-btn-group {
                display: flex;
                flex-wrap: wrap;
                gap: var(--spacing-sm);
                margin-top: var(--spacing-lg);
            }
            
            .action-btn {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.75rem 1.25rem;
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: var(--radius-lg);
                color: #ffffff;
                font-size: 0.9375rem;
                font-weight: 600;
                cursor: pointer;
                transition: all var(--transition-base);
                position: relative;
                overflow: hidden;
            }
            
            .action-btn::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 0;
                height: 0;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.2);
                transform: translate(-50%, -50%);
                transition: width 0.4s, height 0.4s;
            }
            
            .action-btn:hover::before {
                width: 300px;
                height: 300px;
            }
            
            .action-btn:hover {
                background: rgba(255, 255, 255, 0.12);
                border-color: rgba(251, 191, 36, 0.4);
                transform: translateY(-2px);
                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
            }
            
            .action-btn-primary {
                background: linear-gradient(135deg, #fbbf24, #f59e0b);
                border-color: #fbbf24;
                color: #1f2937;
            }
            
            .action-btn-primary:hover {
                background: linear-gradient(135deg, #fcd34d, #fbbf24);
                transform: translateY(-3px) scale(1.05);
                box-shadow: 0 12px 24px rgba(251, 191, 36, 0.4);
            }
            
            /* Badge */
            .badge {
                display: inline-flex;
                align-items: center;
                padding: 0.375rem 0.75rem;
                background: rgba(251, 191, 36, 0.15);
                border: 1px solid rgba(251, 191, 36, 0.3);
                border-radius: var(--radius-full);
                font-size: 0.8125rem;
                font-weight: 600;
                color: #fbbf24;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            
            .badge-success {
                background: rgba(16, 185, 129, 0.15);
                border-color: rgba(16, 185, 129, 0.3);
                color: #10b981;
            }
            
            .badge-warning {
                background: rgba(245, 158, 11, 0.15);
                border-color: rgba(245, 158, 11, 0.3);
                color: #f59e0b;
            }
            
            .badge-danger {
                background: rgba(239, 68, 68, 0.15);
                border-color: rgba(239, 68, 68, 0.3);
                color: #ef4444;
            }
            
            .badge-info {
                background: rgba(59, 130, 246, 0.15);
                border-color: rgba(59, 130, 246, 0.3);
                color: #3b82f6;
            }
            
            /* Form Grid Layout */
            .form-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: var(--spacing-lg);
                margin-bottom: var(--spacing-xl);
            }
            
            .form-grid-2 {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .form-grid-3 {
                grid-template-columns: repeat(3, 1fr);
            }
            
            .form-grid-4 {
                grid-template-columns: repeat(4, 1fr);
            }
            
            .form-grid-6 {
                grid-template-columns: repeat(6, 1fr);
            }
            
            /* Enhanced Select */
            .modern-select {
                width: 100%;
                padding: 0.875rem 1rem;
                padding-left: 2.5rem;
                background: rgba(255, 255, 255, 0.08);
                border: 2px solid rgba(255, 255, 255, 0.12);
                border-radius: var(--radius-lg);
                color: #ffffff;
                font-size: 0.9375rem;
                font-weight: 500;
                cursor: pointer;
                transition: all var(--transition-base);
                appearance: none;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23fbbf24' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: left 1rem center;
            }
            
            .modern-select:hover {
                background-color: rgba(255, 255, 255, 0.12);
                border-color: rgba(251, 191, 36, 0.3);
            }
            
            .modern-select:focus {
                background-color: rgba(255, 255, 255, 0.15);
                border-color: #fbbf24;
                outline: none;
                box-shadow: 
                    0 0 0 4px rgba(251, 191, 36, 0.15),
                    0 4px 12px rgba(0, 0, 0, 0.1);
            }
            
            .modern-select option {
                background: #1f2937;
                background-color: #1f2937 !important;
                color: #ffffff !important;
                padding: 0.75rem;
                font-weight: 500;
            }
            
            .modern-select option:checked {
                background: linear-gradient(0deg, #3b82f6 0%, #2563eb 100%) !important;
                color: #ffffff !important;
            }
            
            .modern-select option:hover {
                background: #374151 !important;
                color: #fbbf24 !important;
            }
            
            /* Fix for Chrome/Safari dropdown background */
            select.modern-select {
                color-scheme: dark;
            }
            
            /* Divider */
            .divider {
                height: 1px;
                background: linear-gradient(
                    90deg,
                    transparent,
                    rgba(255, 255, 255, 0.2),
                    transparent
                );
                margin: var(--spacing-xl) 0;
            }
            
            .divider-text {
                position: relative;
                text-align: center;
                margin: var(--spacing-xl) 0;
            }
            
            .divider-text::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 0;
                right: 0;
                height: 1px;
                background: linear-gradient(
                    90deg,
                    transparent,
                    rgba(255, 255, 255, 0.2),
                    transparent
                );
            }
            
            .divider-text span {
                position: relative;
                background: rgba(15, 23, 42, 0.8);
                padding: 0 1rem;
                color: rgba(255, 255, 255, 0.6);
                font-size: 0.875rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.1em;
            }
            
            /* Alert Box */
            .alert {
                padding: var(--spacing-lg);
                border-radius: var(--radius-lg);
                border: 1px solid;
                margin-bottom: var(--spacing-lg);
                display: flex;
                align-items: flex-start;
                gap: var(--spacing-md);
                backdrop-filter: blur(10px);
            }
            
            .alert-icon {
                font-size: 1.5rem;
                flex-shrink: 0;
            }
            
            .alert-content {
                flex: 1;
            }
            
            .alert-title {
                font-weight: 700;
                margin-bottom: 0.25rem;
            }
            
            .alert-message {
                font-size: 0.875rem;
                opacity: 0.9;
            }
            
            .alert-success {
                background: rgba(16, 185, 129, 0.1);
                border-color: rgba(16, 185, 129, 0.3);
                color: #10b981;
            }
            
            .alert-warning {
                background: rgba(245, 158, 11, 0.1);
                border-color: rgba(245, 158, 11, 0.3);
                color: #f59e0b;
            }
            
            .alert-danger {
                background: rgba(239, 68, 68, 0.1);
                border-color: rgba(239, 68, 68, 0.3);
                color: #ef4444;
            }
            
            .alert-info {
                background: rgba(59, 130, 246, 0.1);
                border-color: rgba(59, 130, 246, 0.3);
                color: #3b82f6;
            }
            
            /* Premium Section Card */
            .premium-section {
                background: rgba(255, 255, 255, 0.03);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border-radius: var(--radius-2xl);
                padding: 2rem;
                margin-bottom: 2rem;
                border: 1px solid rgba(255, 255, 255, 0.08);
                box-shadow: 
                    0 8px 32px rgba(0, 0, 0, 0.12),
                    0 0 0 1px rgba(255, 255, 255, 0.05);
                transition: all var(--transition-base);
                overflow: visible; /* Allow dropdowns/tooltips */
            }
            
            .premium-section:hover {
                border-color: rgba(102, 126, 234, 0.2);
                box-shadow: 
                    0 12px 48px rgba(0, 0, 0, 0.15),
                    0 0 0 1px rgba(102, 126, 234, 0.1);
            }
            
            /* Section Header */
            .section-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 1.5rem;
                padding-bottom: 1rem;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .section-title {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                font-size: 1.5rem;
                font-weight: 700;
                color: #ffffff;
                margin: 0;
            }
            
            .section-title i {
                color: #fbbf24;
                filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.3));
            }
            
            .section-actions {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                flex-wrap: wrap;
            }
            
            /* Enhanced Animations */
            @keyframes fadeIn {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(-30px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            @keyframes scaleIn {
                from {
                    opacity: 0;
                    transform: scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: scale(1);
                }
            }
            
            @keyframes shimmer {
                0% {
                    background-position: -1000px 0;
                }
                100% {
                    background-position: 1000px 0;
                }
            }
            
            /* Loading skeleton */
            .skeleton {
                background: linear-gradient(
                    90deg,
                    #f0f0f0 25%,
                    #e0e0e0 50%,
                    #f0f0f0 75%
                );
                background-size: 2000px 100%;
                animation: shimmer 2s infinite linear;
                border-radius: 0.5rem;
            }
            
            /* ========================================
               RESPONSIVE DESIGN SYSTEM
               ======================================== */
            @media (max-width: 1024px) {
                .premium-header-inner {
                    padding: 1rem 1.5rem;
                }
                
                .premium-tabs-inner {
                    padding: 0 1.5rem;
                }
                
                .premium-content {
                    padding: 1.5rem;
                }
            }
            
            @media (max-width: 768px) {
                .premium-header-inner {
                    flex-direction: column;
                    gap: 1rem;
                    padding: 1rem;
                }
                
                .header-brand {
                    width: 100%;
                    justify-content: center;
                }
                
                .header-actions {
                    width: 100%;
                    justify-content: center;
                }
                
                .action-buttons-group {
                    flex-wrap: wrap;
                }
                
                .premium-action-btn {
                    flex: 1;
                    min-width: 100px;
                }
                
                .btn-label {
                    font-size: 0.8125rem;
                }
                
                .logo-icon {
                    width: 48px;
                    height: 48px;
                    font-size: 1.5rem;
                }
                
                .brand-title {
                    font-size: 1.5rem;
                }
                
                .brand-subtitle {
                    font-size: 0.875rem;
                }
                
                .premium-tabs-container {
                    top: auto;
                    position: relative;
                }
                
                .tab-button {
                    padding: 0.625rem 1.25rem;
                    font-size: 0.875rem;
                    gap: 0.5rem;
                }
                
                .premium-content {
                    padding: 1rem;
                }
                
                .premium-section {
                    padding: 1.5rem;
                    border-radius: var(--radius-xl);
                }
                
                .section-title {
                    font-size: 1.25rem;
                }
                
                .card {
                    padding: 1.25rem;
                    border-radius: var(--radius-lg);
                }
                
                .metric-card {
                    padding: 1.25rem;
                }
                
                .lang-btn {
                    padding: 0.5rem 1rem;
                    font-size: 0.875rem;
                    top: 1rem;
                    right: 1rem;
                }
                
                input, select {
                    padding: 0.625rem 0.875rem;
                    font-size: 0.875rem;
                }
                
                .btn-primary {
                    padding: 0.75rem 1.5rem;
                    font-size: 0.875rem;
                }
            }
            
            @media (max-width: 480px) {
                .tab-button {
                    padding: 0.5rem 0.875rem;
                    font-size: 0.8125rem;
                    border-radius: var(--radius-md);
                }
                
                .tab-button i {
                    font-size: 0.875rem;
                }
                
                .logo-container {
                    gap: 0.75rem;
                }
                
                .logo-icon {
                    width: 42px;
                    height: 42px;
                    font-size: 1.25rem;
                }
                
                .brand-title {
                    font-size: 1.25rem;
                }
                
                .brand-subtitle {
                    font-size: 0.8125rem;
                }
                
                .premium-section {
                    padding: 1.25rem;
                }
                
                .section-header {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 1rem;
                }
                
                .section-actions {
                    width: 100%;
                    justify-content: flex-start;
                }
                
                .modern-table-wrapper {
                    padding: 0.75rem;
                }
                
                .modern-table th,
                .modern-table td {
                    padding: 0.5rem;
                    font-size: 0.75rem;
                }
                
                .info-card-grid {
                    grid-template-columns: 1fr;
                }
                
                .stats-grid {
                    grid-template-columns: 1fr;
                }
                
                .section-title {
                    font-size: 1.125rem;
                }
                
                h1 {
                    font-size: 1.75rem !important;
                }
                
                h2 {
                    font-size: 1.5rem !important;
                }
                
                h3 {
                    font-size: 1.25rem !important;
                }
            }
            
            /* ========================================
               🔧 CUSTOM DROPDOWN Z-INDEX FIX FOR TABLES
               ======================================== */
            
            /* Ensure table cells don't clip dropdown menus */
            .modern-table tbody tr td {
                overflow: visible !important;
                position: relative !important;
            }
            
            /* Ensure table rows don't clip dropdown menus */
            .modern-table tbody tr {
                position: relative !important;
            }
            
            /* Ensure table body allows overflow */
            .modern-table tbody {
                overflow: visible !important;
            }
            
            /* ⚠️ IMPORTANT: Don't force overflow: visible on table wrapper
               This conflicts with overflow-x: auto for horizontal scrolling
               Let inline styles control wrapper overflow */
            
            /* Ensure parking requirements table specifically allows overflow */
            #parkingRequirementsTable tbody tr td {
                overflow: visible !important;
                position: relative !important;
            }
            
            #parkingRequirementsTable tbody tr {
                position: relative !important;
            }
            
            /* Custom dropdown wrapper should have high z-index when active */
            .custom-dark-dropdown {
                position: relative !important;
                z-index: 2 !important;
            }
        </style>
        <script>window.TRANSLATION_FALLBACKS = ${serializedTranslations};</script>
    </head>
    <body class="premium-body arabic rtl">
        <!-- Notification System -->
        <div id="notification-container" class="fixed top-4 right-4 space-y-2" style="max-width: 400px; z-index: 9999;">
            <!-- Notifications will be dynamically inserted here -->
        </div>

        <!-- Loading Overlay -->
        <div id="loading-overlay" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center" style="z-index: 9999;">
            <div class="bg-white/5 backdrop-filter backdrop-blur-sm/5 backdrop-filter backdrop-blur-sm rounded-lg p-6 max-w-sm mx-4">
                <div class="flex items-center space-x-3">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                    <div>
                        <p class="text-white font-medium" id="loading-title">جاري التحميل...</p>
                        <p class="text-white/80 text-sm" id="loading-message">يرجى الانتظار</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Language Toggle -->
        <button class="lang-btn" onclick="toggleLanguageSimple()">
            <i class="fas fa-globe mr-2"></i>
            <span id="langText">English</span>
        </button>

        <!-- Premium Header with Glassmorphism -->
        <header class="premium-header sticky top-0 z-[var(--z-sticky)]">
            <div class="premium-header-inner">
                <!-- Logo and Title Section -->
                <div class="header-brand">
                    <div class="logo-container">
                        <div class="logo-icon">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div class="brand-text">
                            <h1 class="brand-title" id="mainTitle">منصة نقوة</h1>
                            <p class="brand-subtitle" id="mainSubtitle">أداة دراسة الجدوى العقارية</p>
                        </div>
                    </div>
                </div>
                
                <!-- Action Buttons -->
                <div class="header-actions">
                    <div class="action-buttons-group">
                        <button 
                            onclick="showComprehensiveExport()"
                            class="premium-action-btn"
                            title="تصدير متعدد"
                        >
                            <i class="fas fa-download"></i>
                            <span class="btn-label">تصدير</span>
                        </button>
                        
                        <button 
                            onclick="showAutoImport()"
                            class="premium-action-btn"
                            title="استيراد تلقائي"
                        >
                            <i class="fas fa-file-import"></i>
                            <span class="btn-label">استيراد</span>
                        </button>
                        
                        <button 
                            onclick="refreshAllSystemsManually()"
                            class="premium-action-btn premium-action-btn-primary"
                            title="تحديث شامل"
                        >
                            <i class="fas fa-sync-alt"></i>
                            <span class="btn-label">تحديث</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>

        <!-- Premium Navigation Tabs -->
        <nav class="premium-tabs-container">
            <div class="premium-tabs-inner">
                <div class="tabs-scroll-wrapper">
                    <button onclick="switchTab('tab-project')" id="btn-tab-project" class="tab-button tab-active">
                        <i class="fas fa-info-circle mr-2"></i>
                        معلومات المشروع
                    </button>
                    <button onclick="switchTab('tab-floors')" id="btn-tab-floors" class="tab-button">
                        <i class="fas fa-building mr-2"></i>
                        إدارة الأدوار والاستخدامات
                    </button>
                    <button onclick="switchTab('tab-parking')" id="btn-tab-parking" class="tab-button">
                        <i class="fas fa-car mr-2"></i>
                        إدارة المواقف
                    </button>
                    <button onclick="switchTab('tab-costs')" id="btn-tab-costs" class="tab-button">
                        <i class="fas fa-coins mr-2"></i>
                        إدارة التكاليف
                    </button>
                    <button onclick="switchTab('tab-revenue')" id="btn-tab-revenue" class="tab-button">
                        <i class="fas fa-dollar-sign mr-2"></i>
                        إدارة الإيرادات
                    </button>
                    <button onclick="switchTab('tab-opex')" id="btn-tab-opex" class="tab-button">
                        <i class="fas fa-file-invoice-dollar mr-2"></i>
                        النفقات التشغيلية (OPEX)
                    </button>
                    <button onclick="switchTab('tab-investment')" id="btn-tab-investment" class="tab-button">
                        <i class="fas fa-chart-line mr-2"></i>
                        الاستثمار والتمويل
                    </button>
                    <button onclick="switchTab('tab-cashflow')" id="btn-tab-cashflow" class="tab-button">
                        <i class="fas fa-table mr-2"></i>
                        جدول التدفقات النقدية
                    </button>
                    <button onclick="switchTab('tab-summary')" id="btn-tab-summary" class="tab-button">
                        <i class="fas fa-clipboard-list mr-2"></i>
                        الملخص
                    </button>
                </div>
            </div>
        </div>

        <!-- Premium Content Container -->
        <main class="premium-content main-container">
            
            <!-- Tab 1: Project Information + Map -->
            <div id="tab-project" class="tab-content tab-active">
            <!-- Project Configuration - Enhanced with v14.0 Design System -->
            <div class="premium-section">
                <div class="section-header">
                    <h3 class="section-title" id="projectConfigTitle">
                        <i class="fas fa-info-circle"></i>
                        معلومات المشروع
                    </h3>
                    
                    <!-- أزرار التصدير والاستيراد لمعلومات المشروع -->
                    <div class="section-actions">
                        <button
                            onclick="exportProjectData()"
                            class="action-btn"
                            title="تصدير بيانات معلومات المشروع الأساسية والموقع"
                        >
                            <i class="fas fa-download"></i>
                            <span>تصدير</span>
                        </button>
                        
                        <button
                            onclick="importProjectData()"
                            class="action-btn"
                            title="استيراد بيانات معلومات المشروع الأساسية والموقع"
                        >
                            <i class="fas fa-upload"></i>
                            <span>استيراد</span>
                        </button>
                    </div>
                </div>
                
                <div class="form-grid-6">
                    <div class="modern-input-group">
                        <label class="modern-input-label" id="projectNameLabel">
                            <i class="fas fa-building mr-2"></i>
                            اسم المشروع
                        </label>
                        <input type="text" id="projectName" value="مشروع عقاري نموذجي" class="modern-input" placeholder="أدخل اسم المشروع">
                    </div>
                    
                    <div class="modern-input-group">
                        <label class="modern-input-label" id="clientNameLabel">
                            <i class="fas fa-user-tie mr-2"></i>
                            اسم العميل
                        </label>
                        <input type="text" id="clientName" value="شركة التطوير العقاري" class="modern-input" placeholder="أدخل اسم العميل">
                    </div>
                    
                    <div class="modern-input-group">
                        <label class="modern-input-label" id="cityLabel">
                            <i class="fas fa-map-marker-alt mr-2"></i>
                            المدينة
                        </label>
                        <select id="city" class="modern-select" onchange="onCitySelect(this.value)">
                            <option value="الرياض" data-lat="24.7136" data-lng="46.6753">الرياض</option>
                            <option value="مكة المكرمة" data-lat="21.3891" data-lng="39.8579">مكة المكرمة</option>
                            <option value="المدينة المنورة" data-lat="24.5247" data-lng="39.5692">المدينة المنورة</option>
                            <option value="الدمام" data-lat="26.4207" data-lng="50.0888">الدمام</option>
                            <option value="الخبر" data-lat="26.2172" data-lng="50.1971">الخبر</option>
                            <option value="الظهران" data-lat="26.2361" data-lng="50.1553">الظهران</option>
                            <option value="جدة" data-lat="21.4858" data-lng="39.1925">جدة</option>
                            <option value="بريدة" data-lat="26.3266" data-lng="43.9750">بريدة</option>
                            <option value="أبها" data-lat="18.2164" data-lng="42.5047">أبها</option>
                            <option value="جازان" data-lat="16.8892" data-lng="42.5511">جازان</option>
                            <option value="حائل" data-lat="27.5114" data-lng="41.6900">حائل</option>
                            <option value="تبوك" data-lat="28.3998" data-lng="36.5700">تبوك</option>
                            <option value="نجران" data-lat="17.4924" data-lng="44.1277">نجران</option>
                            <option value="سكاكا" data-lat="29.9697" data-lng="40.2064">سكاكا</option>
                            <option value="الباحة" data-lat="20.0129" data-lng="41.4677">الباحة</option>
                            <option value="عرعر" data-lat="30.9753" data-lng="41.0381">عرعر</option>
                            <option value="الطائف" data-lat="21.2703" data-lng="40.4158">الطائف</option>
                            <option value="حفر الباطن" data-lat="28.4267" data-lng="45.9647">حفر الباطن</option>
                            <option value="الأحساء" data-lat="25.4244" data-lng="49.5847">الأحساء</option>
                            <option value="الدرعية" data-lat="24.7324" data-lng="46.5737">الدرعية</option>
                            <option value="العلا" data-lat="26.6083" data-lng="37.9236">العلا</option>
                        </select>
                    </div>
                    
                    <div class="modern-input-group">
                        <label class="modern-input-label" id="landAreaLabel">
                            <i class="fas fa-ruler-combined mr-2"></i>
                            مساحة الأرض (م²)
                        </label>
                        <input type="number" id="landArea" value="10000" min="1" max="1000000" step="1" data-require-positive="true" class="modern-input" placeholder="10000" onchange="updateUsesCalculations(); validateField(this)" oninput="validateField(this)">
                    </div>
                    
                    <div class="modern-input-group">
                        <label class="modern-input-label" id="farLabel">
                            <i class="fas fa-layer-group mr-2"></i>
                            معامل البناء (FAR)
                        </label>
                        <input type="number" id="far" value="3.5" min="0" step="0.1" class="modern-input" placeholder="3.5" onchange="updateUsesCalculations(); validateField(this)" oninput="validateField(this)">
                    </div>
                    
                    <div class="modern-input-group">
                        <label class="modern-input-label" id="projectCodeLabel">
                            <i class="fas fa-barcode mr-2"></i>
                            كود المشروع
                        </label>
                        <input type="text" id="projectCode" value="PRJ-001" placeholder="PRJ-001" class="modern-input" onchange="updateProjectParams()" oninput="this.value = this.value.toUpperCase()">
                    </div>
                </div>
            </div>
            
            <!-- Project Location Map System - Enhanced with v14.0 Design System -->
            <div class="premium-section">
                <div class="section-header">
                    <h3 class="section-title" id="locationMapTitle">
                        <i class="fas fa-map-marked-alt"></i>
                        موقع المشروع على الخريطة
                    </h3>
                    
                    <!-- Editable Coordinates -->
                    <div class="section-actions" style="gap: 1rem;">
                        <div class="modern-input-group" style="margin-bottom: 0; max-width: 160px;">
                            <label class="modern-input-label" id="latitudeLabel" style="font-size: 0.75rem; margin-bottom: 0.25rem;">
                                <i class="fas fa-map-pin mr-1"></i>
                                خط العرض
                            </label>
                            <input 
                                type="number" 
                                id="currentLatitude" 
                                value="24.7136" 
                                step="0.000001" 
                                min="-90" 
                                max="90"
                                class="modern-input" 
                                style="padding: 0.5rem 0.75rem; font-size: 0.875rem;"
                                onchange="updateMapFromCoordinates()" 
                                onblur="validateCoordinates()"
                            >
                        </div>
                        <div class="modern-input-group" style="margin-bottom: 0; max-width: 160px;">
                            <label class="modern-input-label" id="longitudeLabel" style="font-size: 0.75rem; margin-bottom: 0.25rem;">
                                <i class="fas fa-map-pin mr-1"></i>
                                خط الطول
                            </label>
                            <input 
                                type="number" 
                                id="currentLongitude" 
                                value="46.6753" 
                                step="0.000001" 
                                min="-180" 
                                max="180"
                                class="modern-input" 
                                style="padding: 0.5rem 0.75rem; font-size: 0.875rem;"
                                onchange="updateMapFromCoordinates()" 
                                onblur="validateCoordinates()"
                            >
                        </div>
                        <div class="info-card" style="padding: 0.75rem 1rem; margin-bottom: 0; max-width: 200px;">
                            <div class="info-card-title" style="font-size: 0.75rem; margin-bottom: 0.25rem;">
                                <i class="fas fa-location-arrow mr-1"></i>
                                <span id="currentLocationLabel">الموقع الحالي</span>
                            </div>
                            <div class="info-card-value" style="font-size: 1rem;" id="currentLocationName">الرياض</div>
                        </div>
                        <button 
                            onclick="centerMapOnCoordinates()" 
                            class="action-btn action-btn-primary"
                            style="align-self: flex-end;"
                            title="تحديث الخريطة"
                        >
                            <i class="fas fa-sync-alt"></i>
                            <span>تحديث الخريطة</span>
                        </button>
                    </div>
                </div>
                
                <!-- Full Width Interactive Map -->
                <div class="chart-container-modern" style="height: auto; padding: 1rem;">
                    <div class="bg-white/5 backdrop-filter backdrop-blur-sm/5 backdrop-filter backdrop-blur-sm rounded-lg shadow-sm overflow-hidden">
                        <div id="map" class="w-full h-96 lg:h-[500px]"></div>
                    </div>
                </div>
                
                <!-- Map Instructions -->
                <div class="alert alert-info" style="margin-top: 1rem;">
                    <div class="alert-icon">
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <div class="alert-content">
                        <div class="alert-title">كيفية استخدام الخريطة</div>
                        <div class="alert-message">
                            انقر على الخريطة لتحديد الموقع، أو أدخل الإحداثيات يدوياً، أو اختر مدينة من القائمة المنسدلة.
                        </div>
                    </div>
                </div>

            </div>
        </div>
        </div> <!-- نهاية Tab 1: معلومات المشروع -->

        <!-- Tab 2: إدارة الأدوار - Enhanced with v14.0 Design System -->
        <div id="tab-floors" class="tab-content">
            <div class="premium-section">
                <!-- Floors Header -->
                <div style="margin-bottom: var(--spacing-xl);">
                    <h3 class="section-title" style="margin-bottom: var(--spacing-lg);">
                        <i class="fas fa-building"></i>
                        <span id="floorsManagementTitle">إدارة الأدوار والاستخدامات</span>
                    </h3>
                    
                    <!-- Info Cards + Action Buttons in Single Row -->
                    <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--spacing-md); align-items: stretch;">
                        <!-- مساحة الأرض -->
                        <div class="info-card" style="padding: 0.875rem 1rem; display: flex; flex-direction: column; justify-content: center;">
                            <div class="info-card-title" style="font-size: 0.75rem; margin-bottom: 0.375rem;">مساحة الأرض</div>
                            <div class="info-card-value" style="font-size: 1.375rem; line-height: 1;" id="landAreaDisplay">10,000</div>
                            <div class="info-card-description" style="font-size: 0.75rem;">م²</div>
                        </div>
                        
                        <!-- معامل البناء المسموح -->
                        <div class="info-card" style="padding: 0.875rem 1rem; display: flex; flex-direction: column; justify-content: center;">
                            <div class="info-card-title" style="font-size: 0.75rem; margin-bottom: 0.375rem;">معامل البناء المسموح</div>
                            <div class="info-card-value" style="font-size: 1.375rem; line-height: 1;" id="allowedFARDisplay">3.5</div>
                            <div class="info-card-description" style="font-size: 0.75rem;">FAR</div>
                        </div>
                        
                        <!-- إضافة دور -->
                        <button id="addFloorBtn" class="action-btn action-btn-primary" style="height: 100%; min-height: 72px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.375rem;">
                            <i class="fas fa-plus" style="font-size: 1.25rem;"></i>
                            <span id="addFloorText" style="font-size: 0.875rem;">إضافة دور</span>
                        </button>
                        
                        <!-- تصدير -->
                        <button
                            onclick="exportFloorsData()"
                            class="action-btn"
                            style="height: 100%; min-height: 72px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.375rem;"
                            title="تصدير بيانات نظام إدارة الأدوار"
                        >
                            <i class="fas fa-download" style="font-size: 1.25rem;"></i>
                            <span style="font-size: 0.875rem;">تصدير</span>
                        </button>
                        
                        <!-- استيراد -->
                        <button
                            onclick="importFloorsData()"
                            class="action-btn"
                            style="height: 100%; min-height: 72px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.375rem;"
                            title="استيراد بيانات نظام إدارة الأدوار"
                        >
                            <i class="fas fa-upload" style="font-size: 1.25rem;"></i>
                            <span style="font-size: 0.875rem;">استيراد</span>
                        </button>
                        
                        <!-- مكتبة القوالب -->
                        <button
                            onclick="showTemplatesLibrary('floors')"
                            class="action-btn"
                            style="background: linear-gradient(135deg, #667eea, #764ba2); border-color: #667eea; color: white; height: 100%; min-height: 72px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.375rem;"
                            title="فتح مكتبة قوالب الأدوار"
                        >
                            <i class="fas fa-layer-group" style="font-size: 1.25rem;"></i>
                            <span style="font-size: 0.875rem;">مكتبة القوالب</span>
                        </button>
                        
                        <!-- تحديث -->
                        <button
                            onclick="forceRefreshFloors()"
                            class="action-btn"
                            style="background: linear-gradient(135deg, #f59e0b, #ea580c); border-color: #f59e0b; color: white; height: 100%; min-height: 72px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.375rem;"
                            title="تحديث"
                        >
                            <i class="fas fa-sync-alt" style="font-size: 1.25rem;"></i>
                            <span style="font-size: 0.875rem;">تحديث</span>
                        </button>
                    </div>
                </div>

                <!-- Floors Table - Enhanced with modern-table-wrapper -->
                <div class="modern-table-wrapper">
                    <table class="modern-table">
                        <thead>
                            <tr>
                                <th id="floorNumberHeader">الدور</th>
                                <th id="floorUsageHeader">الاستخدام</th>
                                <th id="floorReferenceHeader">المرجع</th>
                                <th id="floorPercentageHeader">النسبة (%)</th>
                                <th id="servicePercentageHeader">نسبة الخدمات (%)</th>
                                <th id="repeatCountHeader">🔢 عدد التكرار</th>
                                <th id="calculatedAreaHeader">المساحة المحسوبة</th>
                                <th id="netAreaHeader">المساحة الصافية</th>
                                <th id="serviceAreaHeader">مساحة الخدمات</th>
                                <th id="floorOrderHeader">الترتيب</th>
                                <th id="floorActionsHeader">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody id="floorsTableBody">
                            <!-- Floors will be dynamically inserted here -->
                        </tbody>
                    </table>
                </div>

                <!-- 🚀 v11.0: معاينة إجمالي عدد الأدوار -->
                <div id="floorsCountPreview" style="margin-top: var(--spacing-md);">
                    <!-- سيتم ملؤه بواسطة FloorsValidationSystem.showFloorsPreview() -->
                </div>

                <div class="divider"></div>

                <!-- 📊 Floors Summary Section -->
                <div style="margin-top: var(--spacing-xl);">
                    <div class="section-header" style="margin-bottom: var(--spacing-lg);">
                        <h3 class="section-title">
                            <i class="fas fa-chart-line"></i>
                            <span id="comprehensiveSummariesTitle">ملخص الأدوار</span>
                        </h3>
                    </div>

                    <!-- 2-Column Grid: FAR Analysis - Stacked Charts -->
                    <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: var(--spacing-lg); margin-bottom: var(--spacing-lg);">

                        <!-- FAR Analysis Card -->
                        <div class="info-card" style="background: linear-gradient(135deg, rgba(55, 65, 81, 0.4), rgba(17, 24, 39, 0.6)); padding: var(--spacing-xl);">
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--spacing-md); flex-wrap: wrap; gap: var(--spacing-sm);">
                                <h4 class="info-card-title" style="font-size: 1.25rem; display: flex; align-items: center; gap: 0.5rem;">
                                    <i class="fas fa-building"></i>
                                    <span id="farAnalysisTitle">تحليل معامل البناء</span>
                                </h4>
                                <!-- Manual Allowed FAR Input -->
                                <div class="modern-input-group" style="margin: 0; max-width: 200px;">
                                    <label for="manualAllowedFAR" class="modern-input-label" style="font-size: 0.75rem; white-space: nowrap;">معامل البناء المسموح:</label>
                                    <input 
                                        type="number" 
                                        id="manualAllowedFAR" 
                                        step="0.1" 
                                        min="0"
                                        placeholder="3.5"
                                        class="modern-input" 
                                        style="text-align: center; font-weight: bold;"
                                        onchange="updateFARAnalysis()"
                                    />
                                </div>
                            </div>
                            <div id="farAnalysisContent" style="display: flex; flex-direction: column; gap: var(--spacing-md);">
                                <!-- Dynamic content -->
                            </div>
                        </div>

                        <!-- Stacked Charts Column -->
                        <div style="display: flex; flex-direction: column; gap: var(--spacing-lg);">
                            <!-- Pie Chart: Usage Distribution -->
                            <div class="info-card" style="padding: var(--spacing-xl);">
                                <h4 class="info-card-title" style="font-size: 1.125rem; margin-bottom: var(--spacing-md); display: flex; align-items: center; gap: 0.5rem;">
                                    <i class="fas fa-chart-pie"></i>
                                    <span id="pieChartTitle">توزيع الاستخدامات</span>
                                </h4>
                                <div style="display: flex; justify-content: center; align-items: center; height: 250px;">
                                    <canvas id="usageDistributionPieChart"></canvas>
                                </div>
                            </div>

                            <!-- Radar Chart: Usage Analysis -->
                            <div class="info-card" style="padding: var(--spacing-xl);">
                                <h4 class="info-card-title" style="font-size: 1.125rem; margin-bottom: var(--spacing-md); display: flex; align-items: center; gap: 0.5rem;">
                                    <i class="fas fa-radar"></i>
                                    <span id="radarChartTitle">تحليل الاستخدامات</span>
                                </h4>
                                <div style="display: flex; justify-content: center; align-items: center; height: 250px;">
                                    <canvas id="usageRadarChart"></canvas>
                                </div>
                            </div>
                        </div>

                    </div>


                </div>

            </div>
            
            <!-- قسم إدارة الاستخدامات - Enhanced with v14.0 Design System -->
            <div class="premium-section">
                <!-- Uses Header -->
                <div style="margin-bottom: var(--spacing-xl);">
                    <h3 class="section-title" style="margin-bottom: var(--spacing-lg);">
                        <i class="fas fa-th-large"></i>
                        <span>إدارة الاستخدامات</span>
                    </h3>
                    
                    <!-- Info Card + Action Buttons in Single Row -->
                    <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--spacing-md); align-items: stretch;">
                        <!-- إجمالي المساحة المبنية -->
                        <div class="info-card" style="padding: 0.875rem 1rem; display: flex; flex-direction: column; justify-content: center;">
                            <div class="info-card-title" style="font-size: 0.75rem; margin-bottom: 0.375rem;">إجمالي المساحة المبنية</div>
                            <div class="info-card-value" style="font-size: 1.375rem; line-height: 1;" id="totalGFADisplay">35,000</div>
                            <div class="info-card-description" style="font-size: 0.75rem;">م² (GFA)</div>
                        </div>
                        
                        <!-- إضافة استخدام -->
                        <button
                            onclick="addNewUseType()"
                            class="action-btn action-btn-primary"
                            style="height: 100%; min-height: 72px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.375rem;"
                            title="إضافة نوع استخدام جديد قابل للتخصيص"
                        >
                            <i class="fas fa-plus" style="font-size: 1.25rem;"></i>
                            <span style="font-size: 0.875rem;">إضافة استخدام</span>
                        </button>
                        
                        <!-- قوالب جاهزة -->
                        <button
                            onclick="UsageTemplatesSystem.showTemplateSelector()"
                            class="action-btn"
                            style="background: linear-gradient(135deg, #9333ea, #7c3aed); border-color: #9333ea; color: white; height: 100%; min-height: 72px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.375rem;"
                            title="اختر من القوالب الجاهزة"
                        >
                            <i class="fas fa-clipboard-list" style="font-size: 1.25rem;"></i>
                            <span style="font-size: 0.875rem;">قوالب جاهزة</span>
                        </button>
                        
                        <!-- تصدير -->
                        <button
                            onclick="exportUsesData()"
                            class="action-btn"
                            style="height: 100%; min-height: 72px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.375rem;"
                            title="تصدير بيانات إدارة الاستخدامات"
                        >
                            <i class="fas fa-download" style="font-size: 1.25rem;"></i>
                            <span style="font-size: 0.875rem;">تصدير</span>
                        </button>
                        
                        <!-- استيراد -->
                        <button
                            onclick="importUsesData()"
                            class="action-btn"
                            style="height: 100%; min-height: 72px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.375rem;"
                            title="استيراد بيانات إدارة الاستخدامات"
                        >
                            <i class="fas fa-upload" style="font-size: 1.25rem;"></i>
                            <span style="font-size: 0.875rem;">استيراد</span>
                        </button>
                        
                        <!-- تحديث -->
                        <button
                            onclick="forceRefreshUses()"
                            class="action-btn"
                            style="background: linear-gradient(135deg, #f59e0b, #ea580c); border-color: #f59e0b; color: white; height: 100%; min-height: 72px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.375rem;"
                            title="تحديث"
                        >
                            <i class="fas fa-sync-alt" style="font-size: 1.25rem;"></i>
                            <span style="font-size: 0.875rem;">تحديث</span>
                        </button>
                    </div>
                </div>

                <!-- Share Warning - Enhanced with alert-warning -->
                <div id="shareWarning" class="alert alert-warning hidden">
                    <div class="alert-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="alert-content">
                        <div class="alert-title">تحذير النسب</div>
                        <div class="alert-message" id="shareWarningText">
                            تحذير: إجمالي نسب الاستخدامات يختلف عن 100%
                        </div>
                    </div>
                </div>

                <!-- Uses Grid -->
                <div class="stats-grid" style="grid-template-columns: repeat(auto-fill, minmax(500px, 1fr)); gap: var(--spacing-md);" id="usesGrid">
                    <!-- Uses will be populated by JavaScript -->
                </div>

                <!-- Enhanced Summary Section - v14.0 Design -->
                <div class="divider"></div>
                <div class="mt-6">
                    <div class="section-header" style="margin-bottom: var(--spacing-lg);">
                        <h3 class="section-title" style="font-size: 1.25rem;">
                            <i class="fas fa-chart-bar"></i>
                            ملخص الاستخدامات
                        </h3>
                        <button onclick="updateUsesSummary()" class="action-btn">
                            <i class="fas fa-sync"></i>
                            <span>تحديث</span>
                        </button>
                    </div>
                    
                    <!-- الملخص المتقدم للاستخدامات - تخطيط صفوف منفصلة تماماً -->
                    <div class="space-y-8">
                        <!-- المحتوى الكامل سيتم إنشاؤه بواسطة JavaScript -->
                        <div id="usesSummary" class="w-full">
                            <!-- سيتم تحديث هذا المحتوى بواسطة JavaScript -->
                            <!-- Enhanced summary with 5 separate rows will be populated by JavaScript -->
                        </div>
                        
                        <!-- العناصر القديمة مخفية -->
                        <div id="totalsSummary" style="display: none;">
                            <!-- Hidden old totals -->
                        </div>
                        
                        <div id="additionalMetrics" style="display: none;">
                            <!-- Hidden old metrics -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </div> <!-- نهاية Tab 2: إدارة الأدوار والاستخدامات -->

        <!-- Tab 4: إدارة المواقف -->
        <div id="tab-parking" class="tab-content">
        <!-- 🅿️ Parking Management System -->
        <div class="p-6 bg-white/5 backdrop-filter backdrop-blur-sm/8">
            <div class="premium-section">
                <!-- Parking Header - v14.13 Style -->
                <div style="margin-bottom: var(--spacing-xl);">
                    <h3 class="section-title" style="margin-bottom: var(--spacing-lg);">
                        <i class="fas fa-parking"></i>
                        <span>🅿️ إدارة المواقف</span>
                    </h3>
                    
                    <!-- Action Buttons Grid - v14.15 (Same style as Tab 2) -->
                    <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--spacing-md); align-items: stretch;">
                        <!-- تصدير -->
                        <button
                            onclick="exportParkingData()"
                            class="action-btn"
                            style="height: 100%; min-height: 72px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.375rem;"
                            title="تصدير بيانات المواقف"
                        >
                            <i class="fas fa-download" style="font-size: 1.25rem;"></i>
                            <span style="font-size: 0.875rem;">تصدير</span>
                        </button>
                        
                        <!-- استيراد -->
                        <button
                            onclick="importParkingData()"
                            class="action-btn"
                            style="height: 100%; min-height: 72px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.375rem;"
                            title="استيراد بيانات المواقف"
                        >
                            <i class="fas fa-upload" style="font-size: 1.25rem;"></i>
                            <span style="font-size: 0.875rem;">استيراد</span>
                        </button>
                        
                        <!-- تحديث -->
                        <button
                            onclick="forceRefreshParking()"
                            class="action-btn"
                            style="background: linear-gradient(135deg, #f59e0b, #ea580c); border-color: #f59e0b; color: white; height: 100%; min-height: 72px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.375rem;"
                            title="تحديث"
                        >
                            <i class="fas fa-sync-alt" style="font-size: 1.25rem;"></i>
                            <span style="font-size: 0.875rem;">تحديث</span>
                        </button>
                    </div>
                </div>

                <!-- Parking Requirements Section - v14.13 -->
                <div class="mb-8">
                    <h3 class="section-title" style="margin-bottom: var(--spacing-lg);">
                        <i class="fas fa-calculator"></i>
                        <span>احتياجات المواقف</span>
                    </h3>
                    
                    <!-- Requirements Configuration Grid -->
                    <div class="grid grid-cols-1 gap-6">
                        <!-- Calculation Methods for Each Use - v14.13 -->
                        <div class="info-card">
                            <h4 class="text-lg font-semibold text-white mb-6 flex items-center">
                                <i class="fas fa-cog text-amber-400 mr-2"></i>
                                طرق الحساب
                            </h4>
                            
                            <!-- Uses Requirements Table - v14.13 -->
                            <div class="modern-table-wrapper">
                                <table class="modern-table" id="parkingRequirementsTable">
                                    <thead>
                                        <tr>
                                            <th class="text-right py-3 px-4 font-semibold">الاستخدام</th>
                                            <th class="text-center py-3 px-4 font-semibold">يتطلب مواقف</th>
                                            <th class="text-right py-3 px-4 font-semibold">الطريقة</th>
                                            <th class="text-right py-3 px-4 font-semibold">المعامل</th>
                                            <th class="text-right py-3 px-4 font-semibold" id="areaTypeHeader">نوع المساحة</th>
                                            <th class="text-right py-3 px-4 font-semibold" id="largeUnitsHeader" style="display: none;">وحدات كبيرة (م²)</th>
                                            <th class="text-center py-3 px-4 font-semibold">احتساب مضاعف</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <!-- Dynamic rows will be generated by renderParkingRequirementsTable() -->
                                    </tbody>
                                </table>
                            </div>
                            
                            <!-- Visitor Parking Percentage - v14.13 -->
                            <div class="mt-6 info-card" style="padding: var(--spacing-md);">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center">
                                        <i class="fas fa-users text-white/90 mr-2"></i>
                                        <span class="font-semibold text-white">نسبة مواقف الزوار</span>
                                        <span class="text-sm text-white/80 mr-2">نسبة إضافية من إجمالي المواقف المطلوبة</span>
                                    </div>
                                    <div class="flex items-center">
                                        <input type="number" step="1" min="0" max="50" value="20" class="w-20 px-3 py-2 border border-white/20 rounded-lg focus:ring-2 focus:ring-gray-500" id="visitorParkingPercentage" onchange="updateVisitorParkingPercentage(this.value)">
                                        <span class="ml-2 font-bold text-white/90">%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Requirements Summary - v14.13 -->
                        <div class="info-card">
                            <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                                <i class="fas fa-chart-line text-emerald-400 mr-2"></i>
                                ملخص الاحتياجات المحسوبة
                            </h4>
                            
                            <div id="parkingRequirementsSummary">
                                <!-- Summary will be populated by JavaScript -->
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Parking Supply Section - v14.13 -->
                <div class="mb-8">
                    <h3 class="section-title" style="margin-bottom: var(--spacing-lg);">
                        <i class="fas fa-warehouse"></i>
                        <span>معروض المواقف</span>
                    </h3>
                    
                    <!-- Supply Configuration Grid -->
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <!-- Ground Level Parking - v14.13 -->
                        <div class="info-card">
                            <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                                <i class="fas fa-road text-green-400 mr-2"></i>
                                المواقف الأرضية
                            </h4>
                            
                            <div class="space-y-4">
                                <div class="grid grid-cols-2 gap-3">
                                    <div>
                                        <label class="block text-sm font-medium text-white/90 mb-1">عدد الأدوار</label>
                                        <input type="number" id="groundParkingFloors" class="w-full px-3 py-2 border border-white/20 rounded-lg focus:ring-2 focus:ring-gray-500" value="1" min="0" onchange="calculateParkingSupply()">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-white/90 mb-1">نسبة التغطية (%)</label>
                                        <input type="number" id="groundCoverageRatio" class="w-full px-3 py-2 border border-white/20 rounded-lg focus:ring-2 focus:ring-gray-500" value="60" min="0" max="100" onchange="calculateParkingSupply()">
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-white/90 mb-1">مساحة الموقف الواحد (م²)</label>
                                    <input type="number" id="groundSpacePerCar" class="w-full px-3 py-2 border border-white/20 rounded-lg focus:ring-2 focus:ring-gray-500" value="25" min="15" onchange="calculateParkingSupply()">
                                </div>
                                <div style="background: rgba(34, 197, 94, 0.15); padding: var(--spacing-md); border-radius: var(--radius-lg); border: 2px solid rgba(34, 197, 94, 0.3);">
                                    <div class="text-sm text-emerald-200">العدد المحسوب:</div>
                                    <div class="text-xl font-bold text-emerald-300" id="groundParkingCount">240</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Above Ground Parking - v14.13 -->
                        <div class="info-card">
                            <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                                <i class="fas fa-building text-indigo-400 mr-2"></i>
                                المواقف العلوية
                            </h4>
                            
                            <div class="space-y-4">
                                <div class="grid grid-cols-2 gap-3">
                                    <div>
                                        <label class="block text-sm font-medium text-white/90 mb-1">عدد الأدوار</label>
                                        <input type="number" id="aboveParkingFloors" class="w-full px-3 py-2 border border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500" value="2" min="0" onchange="calculateParkingSupply()">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-white/90 mb-1">نسبة التغطية (%)</label>
                                        <input type="number" id="aboveCoverageRatio" class="w-full px-3 py-2 border border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500" value="80" min="0" max="100" onchange="calculateParkingSupply()">
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-white/90 mb-1">مساحة الموقف الواحد (م²)</label>
                                    <input type="number" id="aboveSpacePerCar" class="w-full px-3 py-2 border border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500" value="22" min="15" onchange="calculateParkingSupply()">
                                </div>
                                <div style="background: rgba(99, 102, 241, 0.15); padding: var(--spacing-md); border-radius: var(--radius-lg); border: 2px solid rgba(99, 102, 241, 0.3);">
                                    <div class="text-sm text-indigo-200">العدد المحسوب:</div>
                                    <div class="text-xl font-bold text-indigo-300" id="aboveParkingCount">581</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Underground Parking - v14.13 -->
                        <div class="info-card">
                            <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                                <i class="fas fa-arrow-down text-slate-400 mr-2"></i>
                                مواقف الأقبية
                            </h4>
                            
                            <div class="space-y-4">
                                <div class="grid grid-cols-2 gap-3">
                                    <div>
                                        <label class="block text-sm font-medium text-white/90 mb-1">عدد الأدوار</label>
                                        <input type="number" id="basementParkingFloors" class="w-full px-3 py-2 border border-white/20 rounded-lg focus:ring-2 focus:ring-gray-500" value="1" min="0" onchange="calculateParkingSupply()">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-white/90 mb-1">نسبة التغطية (%)</label>
                                        <input type="number" id="basementCoverageRatio" class="w-full px-3 py-2 border border-white/20 rounded-lg focus:ring-2 focus:ring-gray-500" value="85" min="0" max="100" onchange="calculateParkingSupply()">
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-white/90 mb-1">مساحة الموقف الواحد (م²)</label>
                                    <input type="number" id="basementSpacePerCar" class="w-full px-3 py-2 border border-white/20 rounded-lg focus:ring-2 focus:ring-gray-500" value="20" min="15" onchange="calculateParkingSupply()">
                                </div>
                                <div style="background: rgba(148, 163, 184, 0.15); padding: var(--spacing-md); border-radius: var(--radius-lg); border: 2px solid rgba(148, 163, 184, 0.3);">
                                    <div class="text-sm text-slate-200">العدد المحسوب:</div>
                                    <div class="text-xl font-bold text-slate-300" id="basementParkingCount">425</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>




                <!-- Parking Summary Section - v14.13 -->
                <div class="parking-summary-enhanced">
                    <div style="margin-bottom: var(--spacing-xl);">
                        <h3 class="section-title" style="margin-bottom: var(--spacing-lg);">
                            <i class="fas fa-chart-bar"></i>
                            <span>ملخص المواقف</span>
                        </h3>
                        
                        <!-- Refresh Button - v14.15 (Same style as Tab 2) -->
                        <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--spacing-md); margin-bottom: var(--spacing-lg); align-items: stretch;">
                            <button
                                onclick="refreshParkingSummary()"
                                class="action-btn"
                                style="background: linear-gradient(135deg, #f59e0b, #ea580c); border-color: #f59e0b; color: white; height: 100%; min-height: 72px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.375rem;"
                                title="تحديث الملخص"
                            >
                                <i class="fas fa-sync" style="font-size: 1.25rem;"></i>
                                <span style="font-size: 0.875rem;">تحديث</span>
                            </button>
                        </div>
                    </div>
                    
                    <div id="parkingSummary" class="w-full">
                        <!-- Enhanced parking summary with charts will be populated by JavaScript -->
                    </div>
                </div>
            </div>
        </div>
        </div> <!-- نهاية Tab 4: إدارة المواقف -->

        <!-- Tab 5: إدارة التكاليف -->
        <div id="tab-costs" class="tab-content">
        <!-- Enhanced Costs Management System - v14.14 -->
        <div class="premium-section">
            <!-- Costs Header - v14.14 Style (Same as Tab 2) -->
            <div style="margin-bottom: var(--spacing-xl);">
                <h3 class="section-title" style="margin-bottom: var(--spacing-lg);">
                    <i class="fas fa-coins"></i>
                    <span>💰 إدارة التكاليف</span>
                </h3>
                
                <!-- Action Buttons Grid - v14.14 (Same style as Tab 2) -->
                <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--spacing-md); align-items: stretch;">
                    <!-- إضافة قسم جديد -->
                    <button
                        onclick="addNewCostCategory()"
                        class="action-btn action-btn-primary"
                        style="height: 100%; min-height: 72px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.375rem;"
                    >
                        <i class="fas fa-plus" style="font-size: 1.25rem;"></i>
                        <span style="font-size: 0.875rem;">إضافة قسم جديد</span>
                    </button>
                    
                    <!-- تصدير -->
                    <button
                        onclick="exportCostsData()"
                        class="action-btn"
                        style="height: 100%; min-height: 72px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.375rem;"
                        title="تصدير بيانات التكاليف"
                    >
                        <i class="fas fa-download" style="font-size: 1.25rem;"></i>
                        <span style="font-size: 0.875rem;">تصدير</span>
                    </button>
                    
                    <!-- استيراد -->
                    <button
                        onclick="importCostsData()"
                        class="action-btn"
                        style="height: 100%; min-height: 72px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.375rem;"
                        title="استيراد بيانات التكاليف"
                    >
                        <i class="fas fa-upload" style="font-size: 1.25rem;"></i>
                        <span style="font-size: 0.875rem;">استيراد</span>
                    </button>
                    
                    <!-- مكتبة القوالب -->
                    <button
                        onclick="showTemplatesLibrary()"
                        class="action-btn"
                        style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-color: #667eea; color: white; height: 100%; min-height: 72px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.375rem;"
                        title="مكتبة القوالب - قوالب جاهزة للتكاليف والإيرادات والنفقات"
                    >
                        <i class="fas fa-layer-group" style="font-size: 1.25rem;"></i>
                        <span style="font-size: 0.875rem;">مكتبة القوالب</span>
                    </button>
                    
                    <!-- تحديث -->
                    <button
                        onclick="forceRefreshCosts()"
                        class="action-btn"
                        style="background: linear-gradient(135deg, #f59e0b, #ea580c); border-color: #f59e0b; color: white; height: 100%; min-height: 72px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.375rem;"
                        title="تحديث"
                    >
                        <i class="fas fa-sync-alt" style="font-size: 1.25rem;"></i>
                        <span style="font-size: 0.875rem;">تحديث</span>
                    </button>
                </div>
            </div>

            <!-- Costs Grid - v14.14 -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" id="costsGrid">
                <!-- Costs will be populated by JavaScript -->
            </div>

            <!-- Cost Summary - v14.14 -->
            <div style="margin-top: var(--spacing-xl);">
                <h3 class="section-title" style="margin-bottom: var(--spacing-lg);">
                    <i class="fas fa-chart-pie"></i>
                    <span>ملخص التكاليف</span>
                </h3>
                <div class="info-card">
                    <div id="costsSummary">
                        <!-- Summary will be populated by JavaScript -->
                    </div>
                </div>
            </div>
        </div>
        </div> <!-- نهاية Tab 5: إدارة التكاليف -->

        <!-- Tab 6: إدارة الإيرادات -->
        <div id="tab-revenue" class="tab-content">
        <!-- Enhanced Revenues Management System - v14.16 -->
        <div class="premium-section">
            <!-- Revenues Header - v14.16 Style (Same as Tab 2) -->
            <div style="margin-bottom: var(--spacing-xl);">
                <h3 class="section-title" style="margin-bottom: var(--spacing-lg);">
                    <i class="fas fa-dollar-sign"></i>
                    <span>💰 إدارة الإيرادات</span>
                </h3>
                
                <!-- Action Buttons Grid - v14.16 (Same style as Tab 2) -->
                <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--spacing-md); align-items: stretch;">
                    <!-- تصدير -->
                    <button
                        onclick="exportRevenuesData()"
                        class="action-btn"
                        style="height: 100%; min-height: 72px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.375rem;"
                        title="تصدير بيانات الإيرادات"
                    >
                        <i class="fas fa-download" style="font-size: 1.25rem;"></i>
                        <span style="font-size: 0.875rem;">تصدير</span>
                    </button>
                    
                    <!-- استيراد -->
                    <button
                        onclick="importRevenuesData()"
                        class="action-btn"
                        style="height: 100%; min-height: 72px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.375rem;"
                        title="استيراد بيانات الإيرادات"
                    >
                        <i class="fas fa-upload" style="font-size: 1.25rem;"></i>
                        <span style="font-size: 0.875rem;">استيراد</span>
                    </button>
                    
                    <!-- تحديث -->
                    <button
                        onclick="forceRefreshRevenues()"
                        class="action-btn"
                        style="background: linear-gradient(135deg, #f59e0b, #ea580c); border-color: #f59e0b; color: white; height: 100%; min-height: 72px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.375rem;"
                        title="تحديث"
                    >
                        <i class="fas fa-sync-alt" style="font-size: 1.25rem;"></i>
                        <span style="font-size: 0.875rem;">تحديث</span>
                    </button>
                </div>
            </div>

            <!-- Revenues Grid - v14.16 -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" id="revenuesGrid">
                <!-- Revenues will be populated by JavaScript -->
            </div>

            <!-- Revenue Summary - v14.16 -->
            <div style="margin-top: var(--spacing-xl);">
                <h3 class="section-title" style="margin-bottom: var(--spacing-lg);">
                    <i class="fas fa-chart-line"></i>
                    <span>ملخص الإيرادات</span>
                </h3>
                <div class="info-card">
                    <div id="revenuesSummary">
                        <!-- Summary will be populated by JavaScript -->
                    </div>
                </div>
            </div>
        </div>
        </div> <!-- نهاية Tab 6: إدارة الإيرادات -->

        <!-- Tab 7: النفقات التشغيلية (OPEX) -->
        <div id="tab-opex" class="tab-content">
            <!-- Component 6.5: Operating Expenses (OPEX) Management System - v14.16 -->
            <div class="premium-section">
                <!-- OPEX Header - v14.16 Style (Same as Tab 2) -->
                <div style="margin-bottom: var(--spacing-xl);">
                    <h3 class="section-title" style="margin-bottom: var(--spacing-lg);">
                        <i class="fas fa-tools"></i>
                        <span id="opexManagementTitle">إدارة النفقات التشغيلية (OPEX)</span>
                    </h3>
                    
                    <!-- Action Buttons Grid - v14.16 (Same style as Tab 2) -->
                    <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--spacing-md); align-items: stretch;">
                        <!-- تصدير -->
                        <button
                            onclick="exportOpexData()"
                            class="action-btn"
                            style="height: 100%; min-height: 72px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.375rem;"
                            title="تصدير بيانات النفقات التشغيلية (OPEX)"
                        >
                            <i class="fas fa-download" style="font-size: 1.25rem;"></i>
                            <span style="font-size: 0.875rem;">تصدير</span>
                        </button>
                        
                        <!-- استيراد -->
                        <button
                            onclick="importOpexData()"
                            class="action-btn"
                            style="height: 100%; min-height: 72px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.375rem;"
                            title="استيراد بيانات النفقات التشغيلية (OPEX)"
                        >
                            <i class="fas fa-upload" style="font-size: 1.25rem;"></i>
                            <span style="font-size: 0.875rem;">استيراد</span>
                        </button>
                        
                        <!-- تحديث -->
                        <button
                            onclick="forceRefreshOpex()"
                            class="action-btn"
                            style="background: linear-gradient(135deg, #f59e0b, #ea580c); border-color: #f59e0b; color: white; height: 100%; min-height: 72px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.375rem;"
                            title="تحديث"
                        >
                            <i class="fas fa-sync-alt" style="font-size: 1.25rem;"></i>
                            <span style="font-size: 0.875rem;">تحديث</span>
                        </button>
                    </div>
                </div>

            <!-- OPEX Grid - v14.16 -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" id="opexGrid">
                <!-- OPEX categories will be populated by JavaScript -->
                <div id="opexDebugIndicator" class="col-span-full bg-amber-500/25 border border-yellow-400 text-amber-100 px-4 py-3 rounded">
                    🔍 تحميل نظام OPEX... إذا استمرت هذه الرسالة، فهناك مشكلة في JavaScript
                </div>
            </div>

            <!-- OPEX System Container - Required by renderOpexSystem() JavaScript function -->
            <div id="opexSystem" class="mt-6 w-full">
                <!-- Will be populated by renderOpexSystem() function in app.js -->
            </div>

            <!-- OPEX Summary - v14.16 -->
            <div style="margin-top: var(--spacing-xl);">
                <h3 class="section-title" style="margin-bottom: var(--spacing-lg);">
                    <i class="fas fa-chart-pie"></i>
                    <span>ملخص النفقات التشغيلية</span>
                </h3>
                <div class="info-card">
                    <div id="opexSummary">
                        <!-- Summary will be populated by JavaScript -->
                    </div>
                </div>
            </div>
        </div>
        </div> <!-- نهاية Tab 7: النفقات التشغيلية (OPEX) -->

        <!-- Tab 8: الاستثمار والتمويل -->
        <div id="tab-investment" class="tab-content">
            <!-- Component 7: Investment, Financing & Land Costs - v14.16 -->
            <div class="premium-section">
                <!-- Investment Header - v14.16 Style -->
                <div style="margin-bottom: var(--spacing-xl);">
                    <h3 class="section-title" style="margin-bottom: var(--spacing-lg);">
                        <i class="fas fa-coins"></i>
                        <span id="investmentFinancingTitle">الاستثمار والتمويل وتكاليف الأرض</span>
                    </h3>
                    
                    <!-- نظام 1: الأرض والبناء - v14.16 -->
                    <div style="margin-bottom: var(--spacing-lg);">
                        <h4 class="text-sm font-semibold text-white/90 mb-3">الأرض والبناء:</h4>
                        <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--spacing-md); align-items: stretch;">
                            <button
                                onclick="exportLandConstructionData()"
                                class="action-btn"
                                style="height: 100%; min-height: 72px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.375rem;"
                                title="تصدير بيانات الأرض والبناء"
                            >
                                <i class="fas fa-download" style="font-size: 1.25rem;"></i>
                                <span style="font-size: 0.875rem;">تصدير</span>
                            </button>
                            
                            <button
                                onclick="importLandConstructionData()"
                                class="action-btn"
                                style="height: 100%; min-height: 72px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.375rem;"
                                title="استيراد بيانات الأرض والبناء"
                            >
                                <i class="fas fa-upload" style="font-size: 1.25rem;"></i>
                                <span style="font-size: 0.875rem;">استيراد</span>
                            </button>
                            
                            <button
                                onclick="forceRefreshLandConstruction()"
                                class="action-btn"
                                style="background: linear-gradient(135deg, #f59e0b, #ea580c); border-color: #f59e0b; color: white; height: 100%; min-height: 72px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.375rem;"
                                title="تحديث"
                            >
                                <i class="fas fa-sync-alt" style="font-size: 1.25rem;"></i>
                                <span style="font-size: 0.875rem;">تحديث</span>
                            </button>
                        </div>
                    </div>
                    
                    <!-- نظام 2: التمويل والاستراتيجية - v14.16 -->
                    <div>
                        <h4 class="text-sm font-semibold text-white/90 mb-3">التمويل والاستراتيجية:</h4>
                        <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--spacing-md); align-items: stretch;">
                            <button
                                onclick="exportFinancingStrategyData()"
                                class="action-btn"
                                style="height: 100%; min-height: 72px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.375rem;"
                                title="تصدير بيانات التمويل والاستراتيجية"
                            >
                                <i class="fas fa-download" style="font-size: 1.25rem;"></i>
                                <span style="font-size: 0.875rem;">تصدير</span>
                            </button>
                            
                            <button
                                onclick="importFinancingStrategyData()"
                                class="action-btn"
                                style="height: 100%; min-height: 72px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.375rem;"
                                title="استيراد بيانات التمويل والاستراتيجية"
                            >
                                <i class="fas fa-upload" style="font-size: 1.25rem;"></i>
                                <span style="font-size: 0.875rem;">استيراد</span>
                            </button>
                            
                            <button
                                onclick="forceRefreshFinancing()"
                                class="action-btn"
                                style="background: linear-gradient(135deg, #f59e0b, #ea580c); border-color: #f59e0b; color: white; height: 100%; min-height: 72px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.375rem;"
                                title="تحديث"
                            >
                                <i class="fas fa-sync-alt" style="font-size: 1.25rem;"></i>
                                <span style="font-size: 0.875rem;">تحديث</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Land Acquisition Section -->
                <div class="mb-8">
                    <h3 class="text-2xl font-bold text-white mb-6 flex items-center">
                        <i class="fas fa-map-marker-alt text-white/90 mr-3"></i>
                        <span id="landAcquisitionTitle">طرق الحصول على الأرض</span>
                    </h3>
                    
                    <div class="bg-white/5 backdrop-filter backdrop-blur-sm/5 backdrop-filter backdrop-blur-sm rounded-xl p-6 shadow-lg">
                        <!-- Land Acquisition Mode Selection -->
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <!-- Purchase Option -->
                            <div class="land-option-card" id="purchaseCard">
                                <input type="radio" id="landPurchase" name="landAcquisition" value="purchase" class="hidden" checked>
                                <label for="landPurchase" class="land-option-label cursor-pointer block p-6 bg-white/5 rounded-xl border-2 border-white/20 hover:border-white/30 transition-all duration-200">
                                    <div class="flex flex-col items-center text-center">
                                        <div class="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                            <i class="fas fa-home text-white text-2xl"></i>
                                        </div>
                                        <h4 class="text-lg font-bold text-white mb-2" id="landPurchaseTitle">شراء الأرض</h4>
                                        <p class="text-sm text-white/90" id="landPurchaseDesc">شراء الأرض بالكامل</p>
                                    </div>
                                </label>
                            </div>

                            <!-- Lease Option -->
                            <div class="land-option-card" id="leaseCard">
                                <input type="radio" id="landLease" name="landAcquisition" value="lease" class="hidden">
                                <label for="landLease" class="land-option-label cursor-pointer block p-6 bg-white/5 rounded-xl border-2 border-orange-400/30 hover:border-orange-400 transition-all duration-200">
                                    <div class="flex flex-col items-center text-center">
                                        <div class="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mb-4">
                                            <i class="fas fa-handshake text-white text-2xl"></i>
                                        </div>
                                        <h4 class="text-lg font-bold text-orange-100 mb-2" id="landLeaseTitle">استئجار الأرض</h4>
                                        <p class="text-sm text-orange-300" id="landLeaseDesc">استئجار الأرض لفترة محددة</p>
                                    </div>
                                </label>
                            </div>

                            <!-- Partnership Option -->
                            <div class="land-option-card" id="partnershipCard">
                                <input type="radio" id="landPartnership" name="landAcquisition" value="partnership" class="hidden">
                                <label for="landPartnership" class="land-option-label cursor-pointer block p-6 bg-white/5 rounded-xl border-2 border-white/20 hover:border-white/30 transition-all duration-200">
                                    <div class="flex flex-col items-center text-center">
                                        <div class="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                            <i class="fas fa-users text-white text-2xl"></i>
                                        </div>
                                        <h4 class="text-lg font-bold text-white mb-2" id="landPartnershipTitle">شراكة الأرض</h4>
                                        <p class="text-sm text-white/90" id="landPartnershipDesc">شراكة مع مالك الأرض</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <!-- Land Cost Details -->
                        <div id="landCostDetails" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <!-- Will be populated dynamically based on selection -->
                        </div>
                    </div>
                </div>



                <!-- Investment Overview (Simplified) -->
                <div class="mb-8">
                    <h3 class="text-2xl font-bold text-white mb-6 flex items-center">
                        <i class="fas fa-info-circle text-white/90 mr-3"></i>
                        <span id="investmentOverviewTitle">ملخص الاستثمار</span>
                    </h3>
                    
                    <div class="bg-white/5 backdrop-filter backdrop-blur-sm rounded-xl p-6 shadow-lg border-2 border-white/20">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <!-- Total Investment (Display Only) -->
                            <div class="investment-param">
                                <label class="block text-sm font-medium text-white/90 mb-2" id="totalInvestmentLabel">
                                    <i class="fas fa-coins text-white/90 mr-2"></i>
                                    إجمالي الاستثمار (ريال)
                                </label>
                                <input type="text" id="totalInvestment" class="investment-input w-full px-4 py-3 border-2 border-white/20 rounded-lg bg-white/5 backdrop-filter backdrop-blur-sm text-white font-bold text-xl" 
                                       readonly value="0">
                                <div class="text-xs text-white/70 mt-1" id="totalInvestmentBreakdown">
                                    أرض (0%) + تطوير (0%)
                                </div>
                            </div>

                            <!-- Construction Period -->
                            <div class="investment-param">
                                <label class="block text-sm font-medium text-white/90 mb-2">
                                    <i class="fas fa-hard-hat text-orange-300 mr-2"></i>
                                    فترة البناء (سنة)
                                    <span class="text-xs text-white/70 block">Construction Period</span>
                                </label>
                                <input type="number" id="constructionPeriod" 
                                       class="w-full px-4 py-3 border-2 border-white/20 rounded-lg focus:ring-2 focus:ring-gray-500" 
                                       value="3" min="1" max="10" step="1" 
                                       onchange="handleConstructionPeriodChange()">
                                <div class="text-xs text-white/70 mt-1">عدد سنوات البناء</div>
                            </div>

                            <!-- Operating Period -->
                            <div class="investment-param">
                                <label class="block text-sm font-medium text-white/90 mb-2">
                                    <i class="fas fa-cogs text-white/90 mr-2"></i>
                                    فترة التشغيل (سنة)
                                    <span class="text-xs text-white/70 block">Operating Period</span>
                                </label>
                                <input type="number" id="operatingPeriod" 
                                       class="w-full px-4 py-3 border-2 border-white/20 rounded-lg focus:ring-2 focus:ring-gray-500" 
                                       value="20" min="5" max="50" step="1">
                                <div class="text-xs text-white/70 mt-1">مدة تشغيل المشروع</div>
                            </div>

                            <!-- Investment Note -->
                            <div class="flex items-center p-4 bg-white/10 rounded-lg border border-white/20">
                                <div class="flex-shrink-0">
                                    <i class="fas fa-lightbulb text-white/90 text-2xl"></i>
                                </div>
                                <div class="mr-3">
                                    <h4 class="text-sm font-semibold text-white">معاملات التمويل</h4>
                                    <p class="text-xs text-white/90 mt-1">
                                        معاملات التمويل متوفرة في قسم <strong>"هيكل التمويل بالدين"</strong> أدناه.
                                    </p>
                                    <div class="text-xs text-white/90 mt-2 space-y-1">
                                        <div>• نسبة رأس المال ومعدل الفائدة</div>
                                        <div>• مدة التمويل وحساب WACC</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Construction Cost Distribution Section -->
                <div class="mb-8">
                    <h3 class="text-2xl font-bold text-white mb-6 flex items-center">
                        <i class="fas fa-calendar-alt text-orange-300 mr-3"></i>
                        <span id="constructionDistributionTitle">توزيع تكاليف البناء</span>
                    </h3>
                    
                    <div class="bg-white/5 backdrop-filter backdrop-blur-sm/5 backdrop-filter backdrop-blur-sm rounded-xl p-6 shadow-lg">
                        <!-- Distribution Summary -->
                        <div class="mb-6 p-4 bg-orange-500/20 rounded-lg border border-orange-400/30">
                            <div class="flex items-center justify-between mb-4">
                                <h4 class="text-lg font-semibold text-white flex items-center">
                                    <i class="fas fa-chart-pie text-orange-300 mr-2"></i>
                                    <span>توزيع التكاليف حسب سنوات البناء</span>
                                </h4>
                                <div class="flex items-center gap-4">

                                    <div class="text-sm text-white/80">
                                        <span>فترة البناء: </span>
                                        <span class="font-bold text-orange-300" id="distributionPeriodDisplay">3 سنوات</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Cost Distribution Grid -->
                            <div id="costDistributionGrid" class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <!-- Will be populated dynamically based on construction period -->
                            </div>
                            
                            <!-- Distribution Summary -->
                            <div class="mt-4 p-3 bg-white/5 backdrop-filter backdrop-blur-sm/5 backdrop-filter backdrop-blur-sm rounded-lg border border-orange-400/30">
                                <div class="flex items-center justify-between text-sm">
                                    <span class="text-white/80">إجمالي تكلفة التطوير:</span>
                                    <span class="font-bold text-white" id="totalDevelopmentCost">0 ريال</span>
                                </div>
                                <div class="flex items-center justify-between text-sm mt-1">
                                    <span class="text-white/80">متوسط التكلفة السنوية:</span>
                                    <span class="font-bold text-orange-300" id="averageAnnualCost">0 ريال</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Distribution Note -->
                        <div class="p-4 bg-white/5 backdrop-filter backdrop-blur-sm/8 rounded-lg border border-white/20">
                            <div class="flex items-start gap-2">
                                <i class="fas fa-info-circle text-white/90 mt-0.5"></i>
                                <div class="text-sm text-white/90">
                                    <p class="font-semibold mb-1">ملاحظات حول توزيع التكاليف:</p>
                                    <ul class="list-disc list-inside space-y-1 text-xs">
                                        <li><strong>التوزيع المتساوي</strong>: يتم توزيع تكاليف البناء بالتساوي على سنوات البناء المحددة</li>
                                        <li><strong>التكاليف المتغيرة</strong>: يمكن تخصيص نسب مختلفة لكل سنة حسب طبيعة المشروع</li>
                                        <li><strong>التحديث التلقائي</strong>: يتم تحديث التوزيعاً عند تغيير فترة البناء أو التكاليف</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Discount Rate & Exit Strategy Section -->
                <div class="mb-8">
                    <h3 class="text-2xl font-bold text-white mb-6 flex items-center">
                        <i class="fas fa-chart-line text-white/90 mr-3"></i>
                        <span id="discountRateTitle">معدل الخصم واستراتيجية الخروج</span>
                    </h3>
                    
                    <div class="bg-white/5 backdrop-filter backdrop-blur-sm/5 backdrop-filter backdrop-blur-sm rounded-xl p-6 shadow-lg">
                        <!-- WACC Calculation Section -->
                        <div class="mb-6 p-4 bg-white/5 backdrop-filter backdrop-blur-sm/8 rounded-lg border border-white/20">
                            <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                                <i class="fas fa-calculator text-white/90 mr-2"></i>
                                <span>حساب معدل الخصم (WACC)</span>
                            </h4>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <!-- Cost of Equity -->
                                <div>
                                    <label class="block text-sm font-medium text-white/90 mb-2">
                                        تكلفة رأس المال (%)
                                        <span class="text-xs text-white/70 block">Cost of Equity</span>
                                    </label>
                                    <input type="number" id="costOfEquity" 
                                           class="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-gray-500" 
                                           value="12.0" min="0" max="50" step="0.1" 
                                           onchange="calculateWACC()">
                                    <div class="text-xs text-white/70 mt-1">العائد المطلوب على رأس المال</div>
                                </div>

                                <!-- Cost of Debt -->
                                <div>
                                    <label class="block text-sm font-medium text-white/90 mb-2">
                                        تكلفة الدين (%)
                                        <span class="text-xs text-white/70 block">Cost of Debt</span>
                                    </label>
                                    <input type="number" id="costOfDebt" 
                                           class="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-gray-500 bg-white/5 backdrop-filter backdrop-blur-sm/5" 
                                           value="5.5" readonly>
                                    <div class="text-xs text-white/70 mt-1">يساوي معدل الفائدة</div>
                                </div>

                                <!-- Tax Rate -->
                                <div>
                                    <label class="block text-sm font-medium text-white/90 mb-2">
                                        معدل الضريبة (%)
                                        <span class="text-xs text-white/70 block">Tax Rate</span>
                                    </label>
                                    <input type="number" id="taxRate" 
                                           class="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-gray-500" 
                                           value="0" min="0" max="50" step="0.1" 
                                           onchange="calculateWACC()">
                                    <div class="text-xs text-white/70 mt-1">معدل ضريبة الشركات (0% حالياً)</div>
                                </div>

                                <!-- Calculated WACC (Display) -->
                                <div class="md:col-span-2 lg:col-span-3">
                                    <div class="bg-gradient-to-r from-gray-700 to-gray-800 text-white p-4 rounded-lg">
                                        <div class="flex items-center justify-between">
                                            <div>
                                                <div class="text-sm opacity-90">معدل الخصم المحسوب (WACC)</div>
                                                <div class="text-xs opacity-75 mt-1">
                                                    WACC = (E/V × Re) + (D/V × Rd × (1 - Tc))
                                                </div>
                                            </div>
                                            <div class="text-right">
                                                <div class="text-3xl font-bold" id="calculatedWACC">7.5%</div>
                                                <div class="text-xs opacity-75 mt-1">يستخدم في حساب NPV</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- ✅ NEW: WACC Components Breakdown -->
                                <div class="md:col-span-2 lg:col-span-3">
                                    <div class="bg-white/5 backdrop-filter backdrop-blur-sm border border-white/20 rounded-lg p-4">
                                        <h5 class="text-sm font-semibold text-white mb-3 flex items-center">
                                            <i class="fas fa-chart-pie mr-2"></i>
                                            تفصيل مكونات WACC
                                        </h5>
                                        
                                        <div id="waccBreakdown" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <!-- Equity Component -->
                                            <div class="bg-white/5 backdrop-filter backdrop-blur-sm/8 rounded p-3">
                                                <div class="flex items-center justify-between mb-2">
                                                    <span class="text-xs text-white/80">مساهمة رأس المال</span>
                                                    <span class="text-sm font-bold text-white/90" id="equityContribution">3.60%</span>
                                                </div>
                                                <div class="w-full bg-white/10 rounded-full h-2">
                                                    <div class="bg-gray-700 h-2 rounded-full" id="equityBar" style="width: 48%"></div>
                                                </div>
                                                <div class="text-xs text-white/70 mt-1">
                                                    <span id="equityCalc">30% × 12.0% = 3.60%</span>
                                                </div>
                                            </div>
                                            
                                            <!-- Debt Component -->
                                            <div class="bg-red-500/25 rounded p-3">
                                                <div class="flex items-center justify-between mb-2">
                                                    <span class="text-xs text-white/80">مساهمة الدين</span>
                                                    <span class="text-sm font-bold text-red-300" id="debtContribution">3.85%</span>
                                                </div>
                                                <div class="w-full bg-white/10 rounded-full h-2">
                                                    <div class="bg-red-600 h-2 rounded-full" id="debtBar" style="width: 52%"></div>
                                                </div>
                                                <div class="text-xs text-white/70 mt-1">
                                                    <span id="debtCalc">70% × 5.5% × (1-0%) = 3.85%</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="mt-3 p-2 bg-white/5 backdrop-filter backdrop-blur-sm/5 rounded text-xs text-white/80">
                                            <strong>💡 الملاحظة:</strong> كلما زادت نسبة الدين (Leverage)، انخفض WACC لأن تكلفة الدين أقل من تكلفة رأس المال
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Debt Financing Section -->
                        <div class="mb-6 p-4 bg-white/5 backdrop-filter backdrop-blur-sm/8 rounded-lg border border-white/20">
                            <div class="flex items-center justify-between mb-4">
                                <h4 class="text-lg font-semibold text-white flex items-center">
                                    <i class="fas fa-university text-white/90 mr-2"></i>
                                    <span>هيكل التمويل بالدين (Debt Financing)</span>
                                </h4>
                                <label class="flex items-center cursor-pointer">
                                    <input type="checkbox" id="enableDebtFinancing" 
                                           class="sr-only peer"
                                           onchange="toggleDebtFinancing()">
                                    <div class="relative w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white/5 backdrop-filter backdrop-blur-sm after:border-white/20 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-700"></div>
                                    <span class="mr-3 text-sm font-medium text-white/90">تفعيل التمويل بالدين</span>
                                </label>
                            </div>
                            
                            <div id="debtFinancingSection" style="display: none;">
                                <!-- Investment & Financing Parameters (Consolidated) -->
                                <div class="mb-6 p-4 bg-white/5 backdrop-filter backdrop-blur-sm/8 rounded-lg border border-white/20">
                                    <h5 class="font-semibold text-white mb-3 flex items-center">
                                        <i class="fas fa-sliders-h text-white/90 mr-2"></i>
                                        معاملات الاستثمار والتمويل الأساسية
                                    </h5>
                                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <!-- Equity Ratio -->
                                        <div>
                                            <label class="block text-sm font-medium text-white/90 mb-2">
                                                نسبة رأس المال (%)
                                                <span class="text-xs text-white/70 block">Equity Ratio</span>
                                            </label>
                                            <input type="number" id="equityRatio" 
                                                   class="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500" 
                                                   value="30" min="0" max="100" step="1"
                                                   onchange="updateFinancingStructure(); calculateWACC();">
                                            <div class="text-xs text-white/70 mt-1">نسبة التمويل الذاتي</div>
                                        </div>

                                        <!-- Profit Rate (Primary) -->
                                        <div>
                                            <label class="block text-sm font-medium text-white/90 mb-2">
                                                معدل الربح السنوي (%)
                                                <span class="text-xs text-white/70 block">Profit Rate</span>
                                            </label>
                                            <input type="number" id="interestRate" 
                                                   class="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500" 
                                                   value="5.5" min="0" max="20" step="0.1"
                                                   onchange="updateDebtService(); calculateWACC();">
                                            <div class="text-xs text-white/70 mt-1">المستخدم في حساب WACC</div>
                                        </div>

                                        <!-- Financing Term -->
                                        <div>
                                            <label class="block text-sm font-medium text-white/90 mb-2">
                                                مدة التمويل (سنة)
                                                <span class="text-xs text-white/70 block">Financing Term</span>
                                            </label>
                                            <input type="number" id="financingTerm" 
                                                   class="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-indigo-500" 
                                                   value="15" min="1" max="30" step="1"
                                                   onchange="updateDebtService(); updateFinancialKPIs();">
                                            <div class="text-xs text-white/70 mt-1">مدة سداد القرض</div>
                                        </div>



                                        <!-- Debt Ratio (Auto-calculated) -->
                                        <div>
                                            <label class="block text-sm font-medium text-white/90 mb-2">
                                                نسبة الدين (%)
                                                <span class="text-xs text-white/70 block">Debt Ratio</span>
                                            </label>
                                            <input type="number" id="debtRatio" 
                                                   class="w-full px-4 py-3 border border-white/20 rounded-lg bg-white/5 backdrop-filter backdrop-blur-sm/5 text-white/90 font-semibold" 
                                                   value="70" readonly>
                                            <div class="text-xs text-white/70 mt-1">محسوبةاً (100% - رأس المال)</div>
                                        </div>
                                    </div>
                                </div>

                                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <!-- Loan Amount -->
                                    <div>
                                        <label class="block text-sm font-medium text-white/90 mb-2">
                                            مبلغ القرض (ريال)
                                            <span class="text-xs text-white/70 block">Loan Amount</span>
                                        </label>
                                        <input type="number" id="loanAmount" 
                                               class="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-gray-500" 
                                               value="50000000" min="0" step="1000000"
                                               onchange="updateDebtService()">
                                        <div class="text-xs text-white/70 mt-1">المبلغ المقترض من البنك</div>
                                    </div>
                                    
                                    <!-- Loan Period -->
                                    <div>
                                        <label class="block text-sm font-medium text-white/90 mb-2">
                                            فترة القرض (سنوات)
                                            <span class="text-xs text-white/70 block">Loan Period</span>
                                        </label>
                                        <input type="number" id="loanPeriod" 
                                               class="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-gray-500" 
                                               value="15" min="1" max="30" step="1"
                                               onchange="updateDebtService()">
                                        <div class="text-xs text-white/70 mt-1">مدة سداد القرض</div>
                                    </div>
                                    
                                    <!-- Amortization Type -->
                                    <div>
                                        <label class="block text-sm font-medium text-white/90 mb-2">
                                            طريقة السداد
                                            <span class="text-xs text-white/70 block">Amortization Type</span>
                                        </label>
                                        <select id="amortizationType" 
                                                class="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-gray-500"
                                                onchange="updateDebtService()">
                                            <option value="annuity">قسط ثابت (Annuity) - الأكثر شيوعاً</option>
                                            <option value="linear">قسط متناقص (Linear)</option>
                                        </select>
                                        <div class="text-xs text-white/70 mt-1">نوع جدول السداد</div>
                                    </div>
                                    
                                    <!-- Grace Period -->
                                    <div>
                                        <label class="block text-sm font-medium text-white/90 mb-2">
                                            فترة السماح (سنوات)
                                            <span class="text-xs text-white/70 block">Grace Period</span>
                                        </label>
                                        <input type="number" id="gracePeriod" 
                                               class="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-gray-500" 
                                               value="0" min="0" max="5" step="1"
                                               onchange="updateDebtService()">
                                        <div class="text-xs text-white/70 mt-1">عدد سنوات التأجيل</div>
                                    </div>
                                    
                                    <!-- Grace Period Type -->
                                    <div>
                                        <label class="block text-sm font-medium text-white/90 mb-2">
                                            نوع فترة السماح
                                            <span class="text-xs text-white/70 block">Grace Type</span>
                                        </label>
                                        <select id="gracePeriodType" 
                                                class="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-gray-500"
                                                onchange="updateDebtService()">
                                            <option value="none">لا توجد فترة سماح</option>
                                            <option value="interest-only">فقط الفوائد (Interest Only)</option>
                                            <option value="full">لا دفع (Full Grace)</option>
                                        </select>
                                        <div class="text-xs text-white/70 mt-1">طريقة التعامل خلال فترة السماح</div>
                                    </div>
                                </div>
                                
                                <!-- Debt Service Summary -->
                                <div class="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div class="bg-white/5 backdrop-filter backdrop-blur-sm p-4 rounded-lg border border-white/20">
                                        <div class="text-xs text-white/80 mb-1">القسط السنوي (السنة 1)</div>
                                        <div class="text-lg font-bold text-white/90" id="firstYearPayment">0 ريال</div>
                                    </div>
                                    <div class="bg-white/5 backdrop-filter backdrop-blur-sm p-4 rounded-lg border border-white/20">
                                        <div class="text-xs text-white/80 mb-1">إجمالي أرباح الممول</div>
                                        <div class="text-lg font-bold text-white/90" id="totalInterest">0 ريال</div>
                                    </div>
                                    <div class="bg-white/5 backdrop-filter backdrop-blur-sm p-4 rounded-lg border border-white/20">
                                        <div class="text-xs text-white/80 mb-1">إجمالي المدفوع</div>
                                        <div class="text-lg font-bold text-white" id="totalPayments">0 ريال</div>
                                    </div>
                                    <div class="bg-white/5 backdrop-filter backdrop-blur-sm p-4 rounded-lg border border-white/20">
                                        <div class="text-xs text-white/80 mb-1">DSCR المتوقع (السنة 3)</div>
                                        <div class="text-lg font-bold text-white/90" id="expectedDSCR">N/A</div>
                                    </div>
                                </div>
                                
                                <div class="mt-3 p-3 bg-white/5 backdrop-filter backdrop-blur-sm/8 rounded-lg border border-white/20">
                                    <div class="flex items-start gap-2">
                                        <i class="fas fa-info-circle text-white/90 mt-0.5"></i>
                                        <div class="text-xs text-white/90">
                                            <p class="font-semibold mb-1">ملاحظات مهمة:</p>
                                            <ul class="list-disc list-inside space-y-0.5">
                                                <li><strong>القسط الثابت (Annuity)</strong>: مبلغ ثابت كل سنة، الفائدة تقل والأصل يزيد</li>
                                                <li><strong>القسط المتناقص (Linear)</strong>: أصل ثابت، الفائدة تقل، المبلغ الإجمالي يتناقص</li>
                                                <li><strong>فترة السماح</strong>: تأجيل السداد لفترة محددة في بداية القرض</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Exit Strategy Section -->
                        <div class="mb-6 p-4 bg-white/5 backdrop-filter backdrop-blur-sm/8 rounded-lg border border-gray-400">
                            <h4 class="text-lg font-semibold text-white mb-4 flex items-center">
                                <i class="fas fa-sign-out-alt text-white/90 mr-2"></i>
                                <span>استراتيجية الخروج (Exit Strategy)</span>
                            </h4>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <!-- Strategy Selection -->
                                <div>
                                    <label class="block text-sm font-medium text-white/90 mb-2">
                                        نوع الاستراتيجية
                                    </label>
                                    <select id="exitStrategy" 
                                            class="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-gray-500"
                                            onchange="updateExitStrategyFields()">
                                        <option value="sell">بيع المشروع (Sell)</option>
                                        <option value="hold">الاحتفاظ (Hold - Perpetuity)</option>
                                        <option value="refinance">إعادة التمويل (Refinance)</option>
                                    </select>
                                </div>

                                <!-- Exit Year -->
                                <div>
                                    <label class="block text-sm font-medium text-white/90 mb-2">
                                        سنة الخروج / البيع
                                    </label>
                                    <input type="number" id="exitYear" 
                                           class="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-gray-500" 
                                           value="10" min="1" max="50" 
                                           onchange="calculateExitValue()">
                                    <div class="text-xs text-white/70 mt-1">السنة المتوقعة للبيع أو الخروج</div>
                                </div>

                                <!-- Exit Method -->
                                <div>
                                    <label class="block text-sm font-medium text-white/90 mb-2">
                                        طريقة التقييم
                                    </label>
                                    <select id="exitMethod" 
                                            class="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-gray-500"
                                            onchange="updateExitMethodFields()">
                                        <option value="capRate">معدل الرسملة (Cap Rate)</option>
                                        <option value="multiple">المضاعف (Multiple)</option>
                                        <option value="appraisal">تقدير مباشر (Appraisal)</option>
                                        <option value="gordon">نموذج جوردون (Gordon Growth)</option>
                                    </select>
                                </div>

                                <!-- Cap Rate (for capRate method) -->
                                <div id="capRateField">
                                    <label class="block text-sm font-medium text-white/90 mb-2">
                                        معدل الرسملة (%)
                                        <span class="text-xs text-white/70 block">Capitalization Rate</span>
                                    </label>
                                    <input type="number" id="exitCapRate" 
                                           class="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-gray-500" 
                                           value="6.5" min="0" max="20" step="0.1" 
                                           onchange="calculateExitValue()">
                                    <div class="text-xs text-white/70 mt-1">Exit Value = NOI / Cap Rate</div>
                                </div>

                                <!-- Multiple (for multiple method) -->
                                <div id="multipleField" style="display: none;">
                                    <label class="block text-sm font-medium text-white/90 mb-2">
                                        المضاعف
                                        <span class="text-xs text-white/70 block">Multiple (e.g., 12x)</span>
                                    </label>
                                    <input type="number" id="exitMultiple" 
                                           class="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-gray-500" 
                                           value="12" min="0" max="50" step="0.1" 
                                           onchange="calculateExitValue()">
                                    <div class="text-xs text-white/70 mt-1">Exit Value = NOI × Multiple</div>
                                </div>

                                <!-- Appraisal (for appraisal method) -->
                                <div id="appraisalField" style="display: none;">
                                    <label class="block text-sm font-medium text-white/90 mb-2">
                                        القيمة التقديرية (ريال)
                                    </label>
                                    <input type="number" id="exitAppraisal" 
                                           class="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-gray-500" 
                                           value="150000000" min="0" step="1000000" 
                                           onchange="calculateExitValue()">
                                    <div class="text-xs text-white/70 mt-1">قيمة مقدرة مباشرة للمشروع</div>
                                </div>

                                <!-- Gordon Growth Rate (for gordon method) -->
                                <div id="gordonField" style="display: none;">
                                    <label class="block text-sm font-medium text-white/90 mb-2">
                                        معدل النمو الدائم (%)
                                        <span class="text-xs text-white/70 block">Perpetual Growth Rate</span>
                                    </label>
                                    <input type="number" id="gordonGrowthRate" 
                                           class="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-gray-500" 
                                           value="2.5" min="0" max="10" step="0.1" 
                                           onchange="calculateExitValue()">
                                    <div class="text-xs text-white/70 mt-1">Terminal Value = CF × (1+g) / (r-g)</div>
                                </div>

                                <!-- Expected NOI (Net Operating Income) -->
                                <div class="md:col-span-2">
                                    <label class="block text-sm font-medium text-white/90 mb-2">
                                        صافي الدخل التشغيلي المتوقع (NOI) في سنة الخروج
                                        <span class="text-xs text-white/70 block">Net Operating Income</span>
                                    </label>
                                    <div class="flex gap-2">
                                        <input type="number" id="expectedNOI" 
                                               class="flex-1 px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-gray-500" 
                                               value="10000000" min="0" step="100000" 
                                               onchange="calculateExitValue()">
                                        <button type="button" 
                                                onclick="updateExpectedNOIAutomatically()" 
                                                class="px-6 py-3 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-all flex items-center gap-2"
                                                title="حساب من OPEX والإيرادات">
                                            <i class="fas fa-sync-alt"></i>
                                            <span>حساب</span>
                                        </button>
                                    </div>
                                    <div class="text-xs text-white/70 mt-1">
                                        📊 يُحسباً: NOI = الإيرادات - OPEX - إيجار الأرض (إن وجد) | مع تطبيق النمو، التضخم، والإشغال التدريجي
                                    </div>
                                </div>
                                
                                <!-- Selling Costs -->
                                <div class="md:col-span-2" id="sellingCostsField">
                                    <label class="block text-sm font-medium text-white/90 mb-2">
                                        تكاليف البيع (%)
                                    </label>
                                    <input type="number" id="sellingCosts" 
                                           class="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-gray-500" 
                                           value="2.0" min="0" max="10" step="0.1" 
                                           onchange="calculateExitValue()">
                                    <div class="text-xs text-white/70 mt-1">عمولات + رسوم قانونية + مصاريف أخرى</div>
                                </div>
                                
                                <!-- Refinance LTV (only for Refinance strategy) -->
                                <div class="md:col-span-2" id="refinanceLTVField" style="display: none;">
                                    <label class="block text-sm font-medium text-white/90 mb-2">
                                        نسبة التمويل الجديدة (%)
                                        <span class="text-xs text-white/70 block">New Loan-to-Value Ratio</span>
                                    </label>
                                    <input type="number" id="refinanceLTV" 
                                           class="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-gray-500" 
                                           value="70" min="0" max="90" step="1" 
                                           onchange="updateRefinanceCalculations()">
                                    <div class="text-xs text-white/70 mt-1">
                                        💰 القرض الجديد = قيمة المشروع × نسبة التمويل
                                    </div>
                                </div>

                                <!-- Calculated Exit Value (Display) -->
                                <div class="md:col-span-2">
                                    <div class="bg-gradient-to-r from-gray-700 to-gray-800 text-white p-4 rounded-lg">
                                        <div class="flex items-center justify-between">
                                            <div>
                                                <div class="text-sm opacity-90">القيمة النهائية المحسوبة</div>
                                                <div class="text-xs opacity-75 mt-1">Exit / Terminal Value (بعد خصم تكاليف البيع)</div>
                                            </div>
                                            <div class="text-right">
                                                <div class="text-3xl font-bold" id="calculatedExitValue">0 ريال</div>
                                                <div class="text-xs opacity-75 mt-1">في السنة <span id="displayExitYear">10</span></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- ✅ NEW: Exit Analysis Tools -->
                                <div class="md:col-span-2">
                                    <div class="bg-white/5 backdrop-filter backdrop-blur-sm/8 border border-white/20 rounded-lg p-4">
                                        <h5 class="text-sm font-semibold text-white mb-3 flex items-center">
                                            <i class="fas fa-flask mr-2"></i>
                                            أدوات التحليل المتقدم
                                        </h5>
                                        
                                        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <!-- Test Exit Scenarios Button -->
                                            <button type="button" 
                                                    onclick="showExitScenariosModal()"
                                                    class="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-all flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                                                <i class="fas fa-vials"></i>
                                                <span>اختبار الطرق الأربعة</span>
                                            </button>
                                            
                                            <!-- Sensitivity Analysis Button -->
                                            <button type="button" 
                                                    onclick="showSensitivityAnalysisModal()"
                                                    class="px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-all flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                                                <i class="fas fa-chart-line"></i>
                                                <span>تحليل الحساسية</span>
                                            </button>
                                            
                                            <!-- Validate Parameters Button -->
                                            <button type="button" 
                                                    onclick="showValidationModal()"
                                                    class="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-all flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                                                <i class="fas fa-exclamation-triangle"></i>
                                                <span>التحقق من المعاملات</span>
                                            </button>
                                        </div>
                                        
                                        <div class="text-xs text-white/90 mt-3 bg-white/10 rounded p-2">
                                            <strong>💡 نصيحة:</strong> استخدم هذه الأدوات لاختبار مدى تأثير Exit Value على ربحية المشروع (NPV و IRR)
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- ✅ NEW: Analysis Results Modal -->
                <div id="analysisModal" class="fixed inset-0 bg-black bg-opacity-50 hidden flex items-center justify-center p-4" style="z-index: 9999;">
                    <div class="bg-white/5 backdrop-filter backdrop-blur-sm/5 backdrop-filter backdrop-blur-sm rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                        <!-- Modal Header -->
                        <div class="sticky top-0 bg-gradient-to-r from-gray-800 to-black text-white p-6 rounded-t-2xl flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <i class="fas fa-chart-bar text-3xl"></i>
                                <div>
                                    <h3 class="text-2xl font-bold" id="modalTitle">نتائج التحليل</h3>
                                    <p class="text-sm opacity-90" id="modalSubtitle">تحليل متقدم لاستراتيجية الخروج</p>
                                </div>
                            </div>
                            <button onclick="closeAnalysisModal()" class="text-white hover:bg-white/5 backdrop-filter backdrop-blur-sm hover:bg-opacity-20 rounded-full p-2 transition-all">
                                <i class="fas fa-times text-2xl"></i>
                            </button>
                        </div>
                        
                        <!-- Modal Body -->
                        <div class="p-6" id="modalContent">
                            <!-- Content will be inserted here dynamically -->
                        </div>
                        
                        <!-- Modal Footer -->
                        <div class="sticky bottom-0 bg-white/5 backdrop-filter backdrop-blur-sm/5 p-4 rounded-b-2xl flex justify-between items-center border-t">
                            <div class="text-sm text-white/80">
                                <i class="fas fa-info-circle mr-2"></i>
                                انقر على F12 لعرض التفاصيل الكاملة في Console
                            </div>
                            <button onclick="closeAnalysisModal()" class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all">
                                <i class="fas fa-times mr-2"></i>
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>


                <!-- Growth & Assumptions Section -->
                <div class="mb-8">
                    <h3 class="text-2xl font-bold text-white mb-6 flex items-center">
                        <i class="fas fa-seedling text-white/90 mr-3"></i>
                        <span id="growthAssumptionsTitle">افتراضات النمو والتضخم</span>
                    </h3>
                    
                    <div class="bg-white/5 backdrop-filter backdrop-blur-sm/5 backdrop-filter backdrop-blur-sm rounded-xl p-6 shadow-lg">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <!-- General Inflation -->
                            <div>
                                <label class="block text-sm font-medium text-white/90 mb-2">
                                    <input type="checkbox" id="inflationEnabled" checked onchange="toggleInflation()">
                                    معدل التضخم العام (%)
                                </label>
                                <input type="number" id="inflationRate" 
                                       class="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-teal-500" 
                                       value="2.5" min="0" max="20" step="0.1">
                                <div class="text-xs text-white/70 mt-1">يُطبق على OPEX والتكاليف</div>
                            </div>

                            <!-- Revenue Growth -->
                            <div>
                                <label class="block text-sm font-medium text-white/90 mb-2">
                                    <input type="checkbox" id="revenueGrowthEnabled" checked onchange="toggleRevenueGrowth()">
                                    معدل نمو الإيرادات (%)
                                </label>
                                <input type="number" id="revenueGrowthRate" 
                                       class="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-teal-500" 
                                       value="3.0" min="0" max="20" step="0.1">
                                <div class="text-xs text-white/70 mt-1">نمو سنوي مركب للإيرادات</div>
                            </div>

                            <!-- Revenue Growth Method -->
                            <div>
                                <label class="block text-sm font-medium text-white/90 mb-2">
                                    طريقة النمو
                                </label>
                                <select id="revenueGrowthMethod" 
                                        class="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-teal-500">
                                    <option value="compound">مركب (Compound)</option>
                                    <option value="simple">بسيط (Simple)</option>
                                </select>
                                <div class="text-xs text-white/70 mt-1">مركب يراكم النمو سنوياً</div>
                            </div>

                            <!-- Occupancy Settings -->
                            <div class="md:col-span-2 lg:col-span-3 p-4 bg-white/5 backdrop-filter backdrop-blur-sm/8 rounded-lg border border-teal-200">
                                <h4 class="text-md font-semibold text-white mb-3 flex items-center">
                                    <i class="fas fa-chart-area text-white/90 mr-2"></i>
                                    <input type="checkbox" id="occupancyRampUpEnabled" checked onchange="toggleOccupancyRampUp()" class="mr-2">
                                    الإشغال التدريجي (Occupancy Ramp-Up)
                                </h4>
                                
                                <div class="grid grid-cols-1 md:grid-cols-4 gap-4" id="occupancyRampUpFields">
                                    <!-- Stabilized Occupancy -->
                                    <div>
                                        <label class="block text-sm font-medium text-white/90 mb-2">
                                            نسبة الإشغال المستقرة (%)
                                        </label>
                                        <input type="number" id="stabilizedOccupancy" 
                                               class="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-teal-500" 
                                               value="90" min="0" max="100" step="1">
                                        <div class="text-xs text-white/70 mt-1">الإشغال المتوقع طويل الأجل</div>
                                    </div>

                                    <!-- Year 1 Occupancy -->
                                    <div>
                                        <label class="block text-sm font-medium text-white/90 mb-2">
                                            السنة 1 (%)
                                        </label>
                                        <input type="number" id="occupancyYear1" 
                                               class="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-teal-500" 
                                               value="40" min="0" max="100" step="1">
                                    </div>

                                    <!-- Year 2 Occupancy -->
                                    <div>
                                        <label class="block text-sm font-medium text-white/90 mb-2">
                                            السنة 2 (%)
                                        </label>
                                        <input type="number" id="occupancyYear2" 
                                               class="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-teal-500" 
                                               value="70" min="0" max="100" step="1">
                                    </div>

                                    <!-- Year 3 Occupancy -->
                                    <div>
                                        <label class="block text-sm font-medium text-white/90 mb-2">
                                            السنة 3 (%)
                                        </label>
                                        <input type="number" id="occupancyYear3" 
                                               class="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-teal-500" 
                                               value="90" min="0" max="100" step="1">
                                        <div class="text-xs text-white/70 mt-1">ثم الاستقرار</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Vacancy Allowance -->
                            <div>
                                <label class="block text-sm font-medium text-white/90 mb-2">
                                    <input type="checkbox" id="vacancyAllowanceEnabled" checked onchange="toggleVacancyAllowance()">
                                    بدل الشواغر (%)
                                </label>
                                <input type="number" id="vacancyAllowance" 
                                       class="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-teal-500" 
                                       value="5.0" min="0" max="50" step="0.1">
                                <div class="text-xs text-white/70 mt-1">احتياطي للشواغر المتوقعة</div>
            </div>
                        </div>
                    </div>
                </div>


                <!-- Integration Summary -->
                <div class="mb-8">
                    <h3 class="text-2xl font-bold text-white mb-6 flex items-center">
                        <i class="fas fa-link text-white/90 mr-3"></i>
                        <span id="integrationSummaryTitle">ملخص التكامل</span>
                    </h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <!-- Land Area Integration -->
                        <div class="integration-card bg-white/5 backdrop-filter backdrop-blur-sm p-6 rounded-xl border border-white/20">
                            <div class="flex items-center justify-between mb-4">
                                <h4 class="text-sm font-medium text-white/90" id="landAreaIntegrationLabel">الأرض</h4>
                                <i class="fas fa-map text-white/90"></i>
                            </div>
                            <div class="text-xl font-bold text-white/90" id="landAreaIntegrationValue">0 م²</div>
                            <div class="text-xs text-white/70 mt-1" id="landAreaCostValue">تكلفة: 0 ريال</div>
                        </div>

                        <!-- Total Construction Cost Integration -->
                        <div class="integration-card bg-white/5 backdrop-filter backdrop-blur-sm p-6 rounded-xl border border-white/20">
                            <div class="flex items-center justify-between mb-4">
                                <h4 class="text-sm font-medium text-white/90" id="constructionCostIntegrationLabel">تكلفة التطوير</h4>
                                <i class="fas fa-building text-white/90"></i>
                            </div>
                            <div class="text-xl font-bold text-white/90" id="constructionCostIntegrationValue">0 ريال</div>
                            <div class="text-xs text-white/70 mt-1" id="costPerSqmValue">للمتر المربع: 0 ريال</div>
                        </div>

                        <!-- Total Revenue Integration -->
                        <div class="integration-card bg-white/5 backdrop-filter backdrop-blur-sm p-6 rounded-xl border border-white/20">
                            <div class="flex items-center justify-between mb-4">
                                <h4 class="text-sm font-medium text-white/90" id="revenueIntegrationLabel">الإيرادات</h4>
                                <i class="fas fa-dollar-sign text-white/90"></i>
                            </div>
                            <div class="text-xl font-bold text-white/90" id="revenueIntegrationValue">0 ريال/سنة</div>
                            <div class="text-xs text-white/70 mt-1" id="revenuePerSqmValue">للمتر المربع: 0 ريال/سنة</div>
                        </div>

                        <!-- Total Project Cost -->
                        <div class="integration-card bg-white/5 backdrop-filter backdrop-blur-sm p-6 rounded-xl border border-white/20">
                            <div class="flex items-center justify-between mb-4">
                                <h4 class="text-sm font-medium text-white/90" id="totalProjectCostLabel">إجمالي تكلفة المشروع</h4>
                                <i class="fas fa-coins text-amber-300"></i>
                            </div>
                            <div class="text-xl font-bold text-amber-300" id="totalProjectCostValue">0 ريال</div>
                            <div class="text-xs text-white/70 mt-1" id="projectCostBreakdownValue">أرض + بناء + تمويل</div>
                        </div>
                    </div>
                </div>
            </div>
        </div> <!-- نهاية Tab 8: الاستثمار والتمويل -->

        <!-- Tab 9: جدول التدفقات النقدية -->
        <div id="tab-cashflow" class="tab-content">
            <!-- Cash Flow Table Section - v14.16 -->
            <div class="premium-section">
                <div class="mb-8">
                    <!-- Cash Flow Header - v14.16 Style (Same as Tab 2) -->
                    <div style="margin-bottom: var(--spacing-xl);">
                        <h3 class="section-title" style="margin-bottom: var(--spacing-lg);">
                            <i class="fas fa-table"></i>
                            <span id="cashFlowTableTitle">جدول التدفقات النقدية (Cash Flow Table)</span>
                        </h3>
                        
                        <!-- Action Buttons Grid - v14.16 (Same style as Tab 2) -->
                        <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--spacing-md); align-items: stretch;">
                            <!-- تصدير JSON -->
                            <button
                                onclick="exportCashFlowTableToJSON()"
                                class="action-btn"
                                style="height: 100%; min-height: 72px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.375rem;"
                                title="تصدير جدول التدفقات النقدية"
                            >
                                <i class="fas fa-download" style="font-size: 1.25rem;"></i>
                                <span style="font-size: 0.875rem;">تصدير JSON</span>
                            </button>
                            
                            <!-- تحديث -->
                            <button
                                onclick="forceRefreshCashFlow()"
                                class="action-btn"
                                style="background: linear-gradient(135deg, #f59e0b, #ea580c); border-color: #f59e0b; color: white; height: 100%; min-height: 72px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.375rem;"
                                title="تحديث"
                            >
                                <i class="fas fa-sync-alt" style="font-size: 1.25rem;"></i>
                                <span style="font-size: 0.875rem;">تحديث</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="bg-white/5 backdrop-filter backdrop-blur-sm/5 backdrop-filter backdrop-blur-sm rounded-xl shadow-lg overflow-hidden">
                        <div class="overflow-x-auto">
                            <table class="w-full text-xs" id="cashFlowTable">
                                <thead class="bg-gradient-to-r from-gray-700 to-gray-800 text-white">
                                    <!-- Row 1: Main Categories -->
                                    <tr class="border-b border-white border-opacity-30">
                                        <th rowspan="2" class="px-3 py-2 text-center border-l border-white border-opacity-30">السنة<br/><span class="text-xs opacity-75">Year</span></th>
                                        <th colspan="4" class="px-3 py-2 text-center bg-red-600 bg-opacity-40 border-l border-white border-opacity-30">
                                            النفقات الرأسمالية (CAPEX)
                                        </th>
                                        <th colspan="4" class="px-3 py-2 text-center bg-gray-700 bg-opacity-40 border-l border-white border-opacity-30">
                                            العمليات التشغيلية (Operations)
                                        </th>
                                        <th colspan="3" class="px-3 py-2 text-center bg-gray-700 bg-opacity-40 border-l border-white border-opacity-30" id="partnershipColumnsHeader" style="display: none;">
                                            تعديلات الشراكة (Partnership)
                                        </th>
                                        <th colspan="5" class="px-3 py-2 text-center bg-gray-700 bg-opacity-40">
                                            التدفقات النقدية (Cash Flows)
                                        </th>
                                    </tr>
                                    <!-- Row 2: Column Names -->
                                    <tr>
                                        <!-- CAPEX Columns -->
                                        <th class="px-2 py-2 text-center border-l border-white border-opacity-20">تكلفة الأرض<br/><span class="text-xs opacity-75">Land</span></th>
                                        <th class="px-2 py-2 text-center">البناء<br/><span class="text-xs opacity-75">Construction</span></th>
                                        <th class="px-2 py-2 text-center">صرف القرض<br/><span class="text-xs opacity-75">Loan</span></th>
                                        <th class="px-2 py-2 text-center border-l border-white border-opacity-20">رأس المال<br/><span class="text-xs opacity-75">Equity</span></th>
                                        <!-- Operations Columns -->
                                        <th class="px-2 py-2 text-center border-l border-white border-opacity-20">الإيرادات<br/><span class="text-xs opacity-75">Revenue</span></th>
                                        <th class="px-2 py-2 text-center">OPEX</th>
                                        <th class="px-2 py-2 text-center" id="landRentColumn">إيجار<br/><span class="text-xs opacity-75">Rent</span></th>
                                        <th class="px-2 py-2 text-center bg-amber-500/200 bg-opacity-30 border-l border-white border-opacity-20">NOI قبل<br/><span class="text-xs opacity-75">Before</span></th>
                                        <!-- Partnership Columns (hidden by default) -->
                                        <th class="px-2 py-2 text-center border-l border-white border-opacity-20 partnership-column" style="display: none;">حصة شركاء<br/><span class="text-xs opacity-75">Partners</span></th>
                                        <th class="px-2 py-2 text-center partnership-column" style="display: none;">رسوم إدارة<br/><span class="text-xs opacity-75">Mgmt Fee</span></th>
                                        <th class="px-2 py-2 text-center bg-gray-700 bg-opacity-30 border-l border-white border-opacity-20 partnership-column" style="display: none;">NOI صافي<br/><span class="text-xs opacity-75">Net NOI</span></th>
                                        <!-- Cash Flow Columns -->
                                        <th class="px-2 py-2 text-center border-l border-white border-opacity-20">خدمة الدين<br/><span class="text-xs opacity-75">Debt Svc</span></th>
                                        <th class="px-2 py-2 text-center">التدفق الحر<br/><span class="text-xs opacity-75">Free CF</span></th>
                                        <th class="px-2 py-2 text-center bg-gray-700 bg-opacity-30">التدفق التراكمي<br/><span class="text-xs opacity-75">Cumulative</span></th>
                                        <th class="px-2 py-2 text-center">هامش NOI<br/><span class="text-xs opacity-75">Margin</span></th>
                                        <th class="px-2 py-2 text-center">DSCR</th>
                                    </tr>
                                </thead>
                                <tbody id="cashFlowTableBody" class="divide-y divide-gray-200">
                                    <tr>
                                        <td colspan="20" class="px-4 py-12 text-center text-white/70">
                                            <i class="fas fa-table text-4xl mb-3 opacity-30"></i>
                                            <p>انقر على "تحديث الجدول" لعرض التدفقات النقدية الموسعة</p>
                                            <p class="text-xs mt-2">سيتم عرض فترة البناء (السنوات السالبة) + فترة التشغيل (السنوات الموجبة)</p>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                        <!-- Summary Row -->
                        <div class="bg-white/5 backdrop-filter backdrop-blur-sm p-4 border-t-2 border-white/20" id="cashFlowSummary" style="display: none;">
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                <div>
                                    <div class="text-sm text-white/80">إجمالي الإيرادات</div>
                                    <div class="text-lg font-bold text-white/90" id="totalRevenueSummary">0 ريال</div>
                                </div>
                                <div>
                                    <div class="text-sm text-white/80">إجمالي OPEX</div>
                                    <div class="text-lg font-bold text-red-300" id="totalOpexSummary">0 ريال</div>
                                </div>
                                <div>
                                    <div class="text-sm text-white/80">إجمالي NOI</div>
                                    <div class="text-lg font-bold text-amber-300" id="totalNOISummary">0 ريال</div>
                                </div>
                                <div>
                                    <div class="text-sm text-white/80">إجمالي التدفق النقدي</div>
                                    <div class="text-lg font-bold text-white/90" id="totalCashFlowSummary">0 ريال</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-4 p-4 bg-white/5 backdrop-filter backdrop-blur-sm/8 rounded-lg border border-white/20">
                        <div class="flex items-start gap-3">
                            <i class="fas fa-info-circle text-white/90 mt-1"></i>
                            <div class="text-sm text-white/90">
                                <p class="font-semibold mb-2">📊 ملاحظات مهمة:</p>
                                <ul class="list-disc list-inside space-y-1">
                                    <li><strong>فترة البناء (السنوات السالبة)</strong>: السنة 0 = شراء الأرض + صرف القرض | السنوات (-3، -2، -1) = تكاليف البناء بنسب (30%، 50%، 20%)</li>
                                    <li><strong>فترة التشغيل (السنوات الموجبة)</strong>: من السنة 1 إلى 20 مع حساب الإيرادات وخدمة الدين</li>
                                    <li><strong>النفقات الرأسمالية (CAPEX)</strong>: تكلفة الأرض + تكلفة البناء + صرف القرض + رأس المال المطلوب</li>
                                    <li><strong>التدفق النقدي التراكمي</strong>: يوضح نقطة التعادل (Break-even Point) عندما يصبح موجباً 🎯</li>
                                    <li><strong>عمود إيجار الأرض</strong> يظهر فقط في حالة استئجار الأرض</li>
                                    <li><strong>خدمة الدين</strong>: يتم حسابها من نظام التمويل بالدين (إذا كان مفعّلاً)</li>
                                    <li><strong>DSCR</strong> (Debt Service Coverage Ratio) = NOI / خدمة الدين | القيمة الجيدة: ≥ 1.25x</li>
                                    <li><strong>NOI</strong> = الإيرادات - OPEX - إيجار الأرض</li>
                                    <li><strong>التدفق النقدي الحر</strong> = NOI - خدمة الدين</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div> <!-- نهاية Tab 9: جدول التدفقات النقدية -->


        <!-- Tab 11: الملخص -->
        <div id="tab-summary" class="tab-content">
            <div class="card">
                <div class="card-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                    <h2 class="text-2xl font-bold flex items-center">
                        <i class="fas fa-chart-bar mr-3"></i>
                        الملخص
                    </h2>
                    <p class="mt-2 text-sm opacity-90">
                        عرض ومركز لجميع ملخصات المشروع والمؤشرات المالية
                    </p>
                </div>

                <div class="card-body">
                    
                    <!-- ==================== معلومات المشروع والموقع ==================== -->
                    <div class="project-info-section mb-8 p-6 bg-white/5 backdrop-filter backdrop-blur-sm rounded-lg shadow-lg border-2 border-indigo-400/30">
                        <h3 class="text-2xl font-bold mb-6 flex items-center text-indigo-100">
                            <i class="fas fa-info-circle mr-3 text-indigo-300"></i>
                            <span>📋 معلومات المشروع</span>
                        </h3>
                        
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <!-- معلومات المشروع الأساسية -->
                            <div class="bg-white/5 backdrop-filter backdrop-blur-sm p-4 rounded-lg shadow-sm">
                                <h4 class="font-bold text-white mb-4 flex items-center">
                                    <i class="fas fa-building mr-2 text-blue-300"></i>
                                    البيانات الأساسية
                                </h4>
                                <div class="space-y-3 text-sm">
                                    <div class="flex justify-between border-b pb-2">
                                        <span class="text-white/80">اسم المشروع:</span>
                                        <span class="font-semibold text-white" id="summary-project-name">-</span>
                                    </div>
                                    <div class="flex justify-between border-b pb-2">
                                        <span class="text-white/80">اسم العميل:</span>
                                        <span class="font-semibold text-white" id="summary-client-name">-</span>
                                    </div>
                                    <div class="flex justify-between border-b pb-2">
                                        <span class="text-white/80">الموقع:</span>
                                        <span class="font-semibold text-white" id="summary-location">-</span>
                                    </div>
                                    <div class="flex justify-between border-b pb-2">
                                        <span class="text-white/80">مساحة الأرض:</span>
                                        <span class="font-semibold text-white" id="summary-land-area">-</span>
                                    </div>
                                    <div class="flex justify-between border-b pb-2">
                                        <span class="text-white/80">معامل البناء:</span>
                                        <span class="font-semibold text-white" id="summary-far">-</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-white/80">المساحة الإجمالية:</span>
                                        <span class="font-semibold text-white" id="summary-gfa">-</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- خريطة الموقع -->
                            <div class="bg-white/5 backdrop-filter backdrop-blur-sm p-4 rounded-lg shadow-sm">
                                <h4 class="font-bold text-white mb-4 flex items-center">
                                    <i class="fas fa-map-marked-alt mr-2 text-emerald-300"></i>
                                    موقع المشروع
                                </h4>
                                <div id="summary-map" style="height: 300px; border-radius: 8px; overflow: hidden;" class="bg-white/5 backdrop-filter backdrop-blur-sm/8">
                                    <!-- سيتم عرض الخريطة هنا -->
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ==================== ملخص الأدوار ==================== -->
                    <div class="summary-section mb-8 p-6 bg-white/5 backdrop-filter backdrop-blur-sm rounded-lg shadow-sm border border-blue-400/30">
                        <h3 class="text-xl font-bold mb-4 flex items-center text-blue-100">
                            <i class="fas fa-building mr-3 text-blue-300"></i>
                            <span>📊 ملخص الأدوار</span>
                        </h3>
                        <div id="summary-floors-copy">
                            <!-- سيتم ملؤهاً من Enhanced Summary Section -->
                            <p class="text-white/70 italic">جاري التحميل...</p>
                        </div>
                    </div>

                    <!-- ==================== ملخص الاستخدامات ==================== -->
                    <div class="summary-section mb-8 p-6 bg-white/5 backdrop-filter backdrop-blur-sm rounded-lg shadow-sm border border-emerald-400/30">
                        <h3 class="text-xl font-bold mb-4 flex items-center text-emerald-100">
                            <i class="fas fa-th-large mr-3 text-emerald-300"></i>
                            <span>📊 ملخص الاستخدامات</span>
                        </h3>
                        <div id="summary-uses-copy">
                            <!-- سيتم ملؤهاً من Enhanced Summary Section -->
                            <p class="text-white/70 italic">جاري التحميل...</p>
                        </div>
                    </div>

                    <!-- ==================== ملخص المواقف ==================== -->
                    <div class="summary-section mb-8 p-6 bg-white/5 backdrop-filter backdrop-blur-sm rounded-lg shadow-sm border border-purple-400/30">
                        <h3 class="text-xl font-bold mb-4 flex items-center text-purple-100">
                            <i class="fas fa-car mr-3 text-purple-300"></i>
                            <span>🅿️ ملخص المواقف</span>
                        </h3>
                        <div id="summary-parking-copy">
                            <!-- سيتم ملؤهاً من Parking Summary -->
                            <p class="text-white/70 italic">جاري التحميل...</p>
                        </div>
                    </div>

                    <!-- ==================== ملخص التكاليف ==================== -->
                    <div class="summary-section mb-8 p-6 bg-white/5 backdrop-filter backdrop-blur-sm rounded-lg shadow-sm border border-red-400/30">
                        <h3 class="text-xl font-bold mb-4 flex items-center text-red-100">
                            <i class="fas fa-money-bill-wave mr-3 text-red-300"></i>
                            <span>💰 ملخص التكاليف</span>
                        </h3>
                        <div id="summary-costs-copy">
                            <!-- سيتم ملؤهاً من Cost Summary -->
                            <p class="text-white/70 italic">جاري التحميل...</p>
                        </div>
                    </div>

                    <!-- ==================== ملخص الإيرادات ==================== -->
                    <div class="summary-section mb-8 p-6 bg-white/5 backdrop-filter backdrop-blur-sm rounded-lg shadow-sm border border-amber-400/30">
                        <h3 class="text-xl font-bold mb-4 flex items-center text-amber-100">
                            <i class="fas fa-chart-line mr-3 text-amber-300"></i>
                            <span>💵 ملخص الإيرادات</span>
                        </h3>
                        <div id="summary-revenue-copy">
                            <!-- سيتم ملؤهاً من Revenue Summary -->
                            <p class="text-white/70 italic">جاري التحميل...</p>
                        </div>
                    </div>

                    <!-- ==================== ملخص النفقات التشغيلية (OPEX) ==================== -->
                    <div class="summary-section mb-8 p-6 bg-white/5 backdrop-filter backdrop-blur-sm rounded-lg shadow-sm border border-cyan-400/30">
                        <h3 class="text-xl font-bold mb-4 flex items-center text-cyan-900">
                            <i class="fas fa-cogs mr-3 text-cyan-300"></i>
                            <span>⚙️ ملخص النفقات التشغيلية (OPEX)</span>
                        </h3>
                        <div id="summary-opex-copy">
                            <!-- سيتم ملؤهاً من OPEX Summary -->
                            <p class="text-white/70 italic">جاري التحميل...</p>
                        </div>
                    </div>

                    <hr class="my-8 border-2 border-white/20">

                    <!-- ==================== المؤشرات المالية الرئيسية ==================== -->
                    <!-- Financial KPIs Dashboard -->
                    <div class="mb-6" id="kpiDashboardSection" style="display: block;">
                        <div class="bg-white/5 backdrop-filter backdrop-blur-sm rounded-xl shadow-xl p-6 border-2 border-white/20">
                            <!-- Dashboard Header -->
                            <div class="flex items-center justify-between mb-6">
                                <div class="flex items-center gap-3">
                                    <div class="bg-gray-700 text-white p-3 rounded-lg">
                                        <i class="fas fa-chart-line text-2xl"></i>
                                    </div>
                                    <div>
                                        <h2 class="text-2xl font-bold text-white">المؤشرات المالية الرئيسية</h2>
                                        <p class="text-sm text-white/80">Financial Key Performance Indicators (KPIs)</p>
                                    </div>
                                </div>
                                <button onclick="updateKPIDashboard()" 
                                        class="p-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all shadow-lg animate-pulse" 
                                        title="تحديث">
                                    <i class="fas fa-sync-alt"></i>
                                </button>
                            </div>

                            <!-- Export to Comparison Tool Section -->
                            <div class="mt-6 mb-8 bg-white/5 backdrop-filter backdrop-blur-sm/5 backdrop-filter backdrop-blur-sm rounded-lg shadow-lg p-6 border-2 border-white/20">
                                <div class="text-center">
                                    <div class="flex flex-col items-center gap-3">
                                        <div class="flex gap-3">
                                            <button 
                                                onclick="if(window.computeExportDataTable){window.computeExportDataTable();document.getElementById('exportDataTable').style.display='block';}"
                                                class="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-black text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-all duration-300 transform hover:scale-105"
                                                title="عرض جدول البيانات المحسوبة">
                                                <i class="fas fa-table mr-2"></i>
                                                عرض جدول البيانات
                                            </button>
                                            <button 
                                                onclick="generateAIReport()"
                                                class="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-all duration-300 transform hover:scale-105"
                                                title="إنشاء تقرير منظم بالذكاء الاصطناعي">
                                                <i class="fas fa-robot mr-2"></i>
                                                إنشاء التقرير
                                            </button>
                                            <button 
                                                id="exportComparisonButton"
                                                data-export-action="comparison-tool"
                                                class="bg-gradient-to-r from-gray-800 to-black hover:from-gray-800 hover:to-black text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-all duration-300 transform hover:scale-105"
                                                title="تصدير البيانات المالية بتنسيق أداة المقارنة">
                                                <i class="fas fa-file-export mr-2"></i>
                                                التصدير لأداة المقارنة
                                            </button>
                                        </div>
                                        <p class="text-xs text-white/70">يتم حساب وتصدير جميع المؤشرات المالية من sessionStorage مباشرة</p>
                                    </div>
                                </div>
                                
                                <!-- Export Data Table (Hidden by default) -->
                                <div id="exportDataTable" class="mt-6 bg-white/5 backdrop-filter backdrop-blur-sm/5 rounded-lg p-6" style="display: none;">
                                    <div class="flex items-center justify-between mb-4">
                                        <h3 class="text-xl font-bold text-white flex items-center gap-2">
                                            <i class="fas fa-database text-white/90"></i>
                                            بيانات التصدير المحسوبة
                                            <span class="text-sm font-normal text-white/70">Computed Export Data</span>
                                        </h3>
                                        <button onclick="document.getElementById('exportDataTable').style.display='none'" 
                                                class="bg-white/5 backdrop-filter backdrop-blur-sm/50 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-all">
                                            <i class="fas fa-times mr-2"></i>
                                            إخفاء الجدول
                                        </button>
                                    </div>
                                    <div class="overflow-x-auto">
                                        <table class="w-full text-sm border-collapse">
                                            <thead>
                                                <tr class="bg-white/10">
                                                    <th class="p-3 text-right font-semibold border border-white/20">الحقل | Field</th>
                                                    <th class="p-3 text-right font-semibold border border-white/20">القيمة | Value</th>
                                                    <th class="p-3 text-right font-semibold border border-white/20">المصدر | Source</th>
                                                </tr>
                                            </thead>
                                            <tbody id="exportDataTableBody">
                                                <tr><td colspan="3" class="p-4 text-center text-white/70">انقر "عرض جدول البيانات" لحساب القيم...</td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <!-- KPIs Grid (6 Cards) -->
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                                
                                <!-- Card 1: NPV -->
                                <div id="npvCard" class="kpi-card bg-white/5 backdrop-filter backdrop-blur-sm/5 backdrop-filter backdrop-blur-sm rounded-lg shadow-lg p-5 border-l-4 border-gray-500 hover:shadow-xl transition-all">
                                    <div class="flex items-start justify-between mb-3">
                                        <div class="flex items-center gap-2">
                                            <i class="fas fa-coins text-white/90 text-2xl"></i>
                                            <div>
                                                <h3 class="text-sm font-semibold text-white/80">NPV</h3>
                                                <p class="text-xs text-white/70">صافي القيمة الحالية</p>
                                            </div>
                                        </div>
                                        <div id="npvIndicator" class="status-indicator">
                                            <i class="fas fa-circle text-gray-300 text-xs"></i>
                                        </div>
                                    </div>
                                    <div id="npvValue" class="text-3xl font-bold text-gray-400 mb-2">انقر "احسب" لعرض النتائج</div>
                                    <div id="npvInterpretation" class="text-xs text-white/80">
                                        <i class="fas fa-info-circle mr-1"></i>موجب = مربح
                                    </div>
                                </div>

                                <!-- Card 2: IRR -->
                                <div id="irrCard" class="kpi-card bg-white/5 backdrop-filter backdrop-blur-sm/5 backdrop-filter backdrop-blur-sm rounded-lg shadow-lg p-5 border-l-4 border-gray-600 hover:shadow-xl transition-all">
                                    <div class="flex items-start justify-between mb-3">
                                        <div class="flex items-center gap-2">
                                            <i class="fas fa-percentage text-white/90 text-2xl"></i>
                                            <div>
                                                <h3 class="text-sm font-semibold text-white/80">IRR</h3>
                                                <p class="text-xs text-white/70">معدل العائد الداخلي</p>
                                            </div>
                                        </div>
                                        <div id="irrIndicator" class="status-indicator">
                                            <i class="fas fa-circle text-gray-300 text-xs"></i>
                                        </div>
                                    </div>
                                    <div id="irrValue" class="text-3xl font-bold text-gray-400 mb-2 text-2xl">قيد الانتظار</div>
                                    <div id="irrInterpretation" class="text-xs text-white/80">
                                        <i class="fas fa-info-circle mr-1"></i>مقارنة مع WACC: <span id="waccComparison">---</span>
                                    </div>
                                </div>

                                <!-- Card 3: ROI -->
                                <div id="roiCard" class="kpi-card bg-white/5 backdrop-filter backdrop-blur-sm/5 backdrop-filter backdrop-blur-sm rounded-lg shadow-lg p-5 border-l-4 border-gray-600 hover:shadow-xl transition-all">
                                    <div class="flex items-start justify-between mb-3">
                                        <div class="flex items-center gap-2">
                                            <i class="fas fa-chart-line text-white/90 text-2xl"></i>
                                            <div>
                                                <h3 class="text-sm font-semibold text-white/80">ROI</h3>
                                                <p class="text-xs text-white/70">عائد الاستثمار</p>
                                            </div>
                                        </div>
                                        <div id="roiIndicator" class="status-indicator">
                                            <i class="fas fa-circle text-gray-300 text-xs"></i>
                                        </div>
                                    </div>
                                    <div id="roiValue" class="text-3xl font-bold text-gray-400 mb-2 text-2xl">قيد الانتظار</div>
                                    <div id="roiInterpretation" class="text-xs text-white/80">
                                        <i class="fas fa-info-circle mr-1"></i>ممتاز: >20% | جيد: 10-20%
                                    </div>
                                </div>

                                <!-- Card 4: DSCR -->
                                <div id="dscrCard" class="kpi-card bg-white/5 backdrop-filter backdrop-blur-sm/5 backdrop-filter backdrop-blur-sm rounded-lg shadow-lg p-5 border-l-4 border-yellow-500 hover:shadow-xl transition-all">
                                    <div class="flex items-start justify-between mb-3">
                                        <div class="flex items-center gap-2">
                                            <i class="fas fa-shield-alt text-amber-300 text-2xl"></i>
                                            <div>
                                                <h3 class="text-sm font-semibold text-white/80">DSCR</h3>
                                                <p class="text-xs text-white/70">نسبة تغطية الدين</p>
                                            </div>
                                        </div>
                                        <div id="dscrIndicator" class="status-indicator">
                                            <i class="fas fa-circle text-gray-300 text-xs"></i>
                                        </div>
                                    </div>
                                    <div id="dscrValue" class="text-3xl font-bold text-gray-400 mb-2 text-2xl">قيد الانتظار</div>
                                    <div id="dscrInterpretation" class="text-xs text-white/80">
                                        <i class="fas fa-info-circle mr-1"></i>متوسط: <span id="dscrAvg">---</span> | أدنى: <span id="dscrMin">---</span>
                                    </div>
                                </div>

                                <!-- Card 5: Payback Period -->
                                <div id="paybackCard" class="kpi-card bg-white/5 backdrop-filter backdrop-blur-sm/5 backdrop-filter backdrop-blur-sm rounded-lg shadow-lg p-5 border-l-4 border-red-500 hover:shadow-xl transition-all">
                                    <div class="flex items-start justify-between mb-3">
                                        <div class="flex items-center gap-2">
                                            <i class="fas fa-clock text-red-300 text-2xl"></i>
                                            <div>
                                                <h3 class="text-sm font-semibold text-white/80">Payback</h3>
                                                <p class="text-xs text-white/70">فترة الاسترداد</p>
                                            </div>
                                        </div>
                                        <div id="paybackIndicator" class="status-indicator">
                                            <i class="fas fa-circle text-gray-300 text-xs"></i>
                                        </div>
                                    </div>
                                    <div id="paybackValue" class="text-3xl font-bold text-gray-400 mb-2 text-2xl">قيد الانتظار</div>
                                    <div id="paybackInterpretation" class="text-xs text-white/80">
                                        <i class="fas fa-info-circle mr-1"></i>ممتاز: ≤10 سنوات | مقبول: 10-15
                                    </div>
                                </div>

                                <!-- Card 6: MOIC -->
                                <div id="moicCard" class="kpi-card bg-white/5 backdrop-filter backdrop-blur-sm/5 backdrop-filter backdrop-blur-sm rounded-lg shadow-lg p-5 border-l-4 border-gray-600 hover:shadow-xl transition-all">
                                    <div class="flex items-start justify-between mb-3">
                                        <div class="flex items-center gap-2">
                                            <i class="fas fa-medal text-white/90 text-2xl"></i>
                                            <div>
                                                <h3 class="text-sm font-semibold text-white/80">MOIC</h3>
                                                <p class="text-xs text-white/70">مضاعف رأس المال</p>
                                            </div>
                                        </div>
                                        <div id="moicIndicator" class="status-indicator">
                                            <i class="fas fa-circle text-gray-300 text-xs"></i>
                                        </div>
                                    </div>
                                    <div id="moicValue" class="text-3xl font-bold text-gray-400 mb-2 text-2xl">قيد الانتظار</div>
                                    <div id="moicInterpretation" class="text-xs text-white/80">
                                        <i class="fas fa-info-circle mr-1"></i>ممتاز: >2.0x | جيد: 1.5-2.0x
                                    </div>
                                </div>

                            </div>

                            <!-- Investment Decision Summary -->
                            <div id="investmentDecisionPanel" class="bg-white/5 backdrop-filter backdrop-blur-sm/5 backdrop-filter backdrop-blur-sm rounded-lg shadow-lg p-6 border-2 border-white/15">
                                <div class="flex items-center gap-3 mb-4">
                                    <i class="fas fa-lightbulb text-yellow-500 text-3xl"></i>
                                    <h3 class="text-xl font-bold text-white">تحليل قرار الاستثمار</h3>
                                </div>

                                <!-- Overall Decision -->
                                <div id="overallDecision" class="mb-6 p-6 rounded-lg bg-white/5 backdrop-filter backdrop-blur-sm/5 border-2 border-white/15">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <div class="text-sm text-white/80 mb-1">القرار النهائي</div>
                                            <div id="decisionText" class="text-3xl font-bold text-white">---</div>
                                        </div>
                                        <div id="decisionIcon" class="text-6xl opacity-20">
                                            <i class="fas fa-question-circle text-gray-400"></i>
                                        </div>
                                    </div>
                                    <div id="decisionScore" class="mt-4 text-sm text-white/80">
                                        <i class="fas fa-chart-bar mr-1"></i>النقاط: <span id="scoreValue">0/6</span>
                                    </div>
                                </div>

                                <!-- Strengths & Weaknesses -->
                                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <!-- Strengths -->
                                    <div class="bg-white/5 backdrop-filter backdrop-blur-sm/8 rounded-lg p-5 border border-gray-400">
                                        <div class="flex items-center gap-2 mb-3">
                                            <i class="fas fa-check-circle text-white/90 text-xl"></i>
                                            <h4 class="text-lg font-semibold text-white">نقاط القوة</h4>
                                        </div>
                                        <ul id="strengthsList" class="space-y-2 text-sm text-white/90">
                                            <li class="flex items-start gap-2">
                                                <i class="fas fa-spinner fa-spin mt-1"></i>
                                                <span>جاري التحليل...</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <!-- Weaknesses -->
                                    <div class="bg-red-500/25 rounded-lg p-5 border border-red-400/30">
                                        <div class="flex items-center gap-2 mb-3">
                                            <i class="fas fa-exclamation-triangle text-red-300 text-xl"></i>
                                            <h4 class="text-lg font-semibold text-red-100">نقاط الضعف</h4>
                                        </div>
                                        <ul id="weaknessesList" class="space-y-2 text-sm text-red-200">
                                            <li class="flex items-start gap-2">
                                                <i class="fas fa-spinner fa-spin mt-1"></i>
                                                <span>جاري التحليل...</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <!-- Interactive Charts Section -->
                            <div id="chartsSection" class="mt-8">
                                <h2 class="text-3xl font-bold text-white mb-6 flex items-center gap-2">
                                    <i class="fas fa-chart-bar text-white/90"></i>
                                    الرسوم البيانية
                                    <span class="text-sm font-normal text-white/70">Interactive Charts</span>
                                </h2>

                                <!-- Charts Grid -->
                                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                    <!-- Chart 1: Cash Flow Over Time -->
                                    <div class="bg-white/5 backdrop-filter backdrop-blur-sm/5 backdrop-filter backdrop-blur-sm rounded-lg shadow-lg p-6">
                                        <h3 class="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                            <i class="fas fa-water text-white/90"></i>
                                            التدفقات النقدية السنوية
                                            <span class="text-sm font-normal text-white/70">Annual Cash Flows</span>
                                        </h3>
                                        <div class="relative" style="height: 300px;">
                                            <canvas id="mainCashFlowChart"></canvas>
                                        </div>
                                    </div>

                                    <!-- Chart 2: KPI Comparison -->
                                    <div class="bg-white/5 backdrop-filter backdrop-blur-sm/5 backdrop-filter backdrop-blur-sm rounded-lg shadow-lg p-6">
                                        <h3 class="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                            <i class="fas fa-chart-pie text-white/90"></i>
                                            مقارنة المؤشرات المالية
                                            <span class="text-sm font-normal text-white/70">KPI Comparison</span>
                                        </h3>
                                        <div class="relative" style="height: 300px;">
                                            <canvas id="mainKpiComparisonChart"></canvas>
                                        </div>
                                    </div>
                                </div>

                                <!-- Chart 3: Cumulative Cash Flow -->
                                <div class="bg-white/5 backdrop-filter backdrop-blur-sm/5 backdrop-filter backdrop-blur-sm rounded-lg shadow-lg p-6">
                                    <h3 class="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                        <i class="fas fa-chart-line text-white/90"></i>
                                        التدفقات النقدية التراكمية
                                        <span class="text-sm font-normal text-white/70">Cumulative Cash Flows</span>
                                    </h3>
                                    <div class="relative" style="height: 350px;">
                                        <canvas id="mainCumulativeCashFlowChart"></canvas>
                                    </div>
                                </div>
                            </div>

                            <!-- Sensitivity Analysis Section -->
                            <div id="sensitivitySection" class="mt-8">
                                <h2 class="text-3xl font-bold text-white mb-6 flex items-center gap-2">
                                    <i class="fas fa-sliders-h text-white/90"></i>
                                    تحليل الحساسية
                                    <span class="text-sm font-normal text-white/70">Sensitivity Analysis</span>
                                </h2>

                                <!-- Sensitivity Analysis Controls -->
                                <div class="bg-white/5 backdrop-filter backdrop-blur-sm rounded-lg p-6 mb-6 border border-white/20">
                                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <!-- Control 1: Discount Rate -->
                                        <div class="bg-white/5 backdrop-filter backdrop-blur-sm/5 backdrop-filter backdrop-blur-sm rounded-lg p-4">
                                            <label class="block text-sm font-semibold text-white/90 mb-2">
                                                <i class="fas fa-percentage text-white/90"></i>
                                                معدل الخصم | Discount Rate
                                            </label>
                                            <div class="flex items-center gap-2">
                                                <input type="range" id="mainDiscountRateSlider" min="5" max="20" step="0.5" value="12" 
                                                       class="flex-1" oninput="updateMainSensitivityAnalysis()">
                                                <span id="mainDiscountRateValue" class="text-lg font-bold text-white min-w-[60px]">12.0%</span>
                                            </div>
                                        </div>

                                        <!-- Control 2: Revenue Change -->
                                        <div class="bg-white/5 backdrop-filter backdrop-blur-sm/5 backdrop-filter backdrop-blur-sm rounded-lg p-4">
                                            <label class="block text-sm font-semibold text-white/90 mb-2">
                                                <i class="fas fa-arrow-up text-white/90"></i>
                                                تغيير الإيرادات | Revenue Change
                                            </label>
                                            <div class="flex items-center gap-2">
                                                <input type="range" id="mainRevenueChangeSlider" min="-30" max="30" step="5" value="0" 
                                                       class="flex-1" oninput="updateMainSensitivityAnalysis()">
                                                <span id="mainRevenueChangeValue" class="text-lg font-bold text-white min-w-[60px]">0%</span>
                                            </div>
                                        </div>

                                        <!-- Control 3: Cost Change -->
                                        <div class="bg-white/5 backdrop-filter backdrop-blur-sm/5 backdrop-filter backdrop-blur-sm rounded-lg p-4">
                                            <label class="block text-sm font-semibold text-white/90 mb-2">
                                                <i class="fas fa-arrow-down text-red-300"></i>
                                                تغيير التكاليف | Cost Change
                                            </label>
                                            <div class="flex items-center gap-2">
                                                <input type="range" id="mainCostChangeSlider" min="-30" max="30" step="5" value="0" 
                                                       class="flex-1" oninput="updateMainSensitivityAnalysis()">
                                                <span id="mainCostChangeValue" class="text-lg font-bold text-white min-w-[60px]">0%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Sensitivity Results Grid -->
                                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <!-- NPV Sensitivity Chart -->
                                    <div class="bg-white/5 backdrop-filter backdrop-blur-sm/5 backdrop-filter backdrop-blur-sm rounded-lg shadow-lg p-6">
                                        <h3 class="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                            <i class="fas fa-coins text-white/90"></i>
                                            حساسية NPV
                                            <span class="text-sm font-normal text-white/70">NPV Sensitivity</span>
                                        </h3>
                                        <div class="relative" style="height: 300px;">
                                            <canvas id="mainNpvSensitivityChart"></canvas>
                                        </div>
                                        <div id="mainNpvSensitivityValue" class="mt-4 text-center">
                                            <p class="text-sm text-white/80">NPV الحالي:</p>
                                            <p class="text-2xl font-bold text-white">---</p>
                                        </div>
                                    </div>

                                    <!-- IRR Sensitivity Chart -->
                                    <div class="bg-white/5 backdrop-filter backdrop-blur-sm/5 backdrop-filter backdrop-blur-sm rounded-lg shadow-lg p-6">
                                        <h3 class="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                            <i class="fas fa-percentage text-white/90"></i>
                                            حساسية IRR
                                            <span class="text-sm font-normal text-white/70">IRR Sensitivity</span>
                                        </h3>
                                        <div class="relative" style="height: 300px;">
                                            <canvas id="mainIrrSensitivityChart"></canvas>
                                        </div>
                                        <div id="mainIrrSensitivityValue" class="mt-4 text-center">
                                            <p class="text-sm text-white/80">IRR الحالي:</p>
                                            <p class="text-2xl font-bold text-white">---</p>
                                        </div>
                                    </div>
                                </div>

                                <!-- Sensitivity Table -->
                                <div class="bg-white/5 backdrop-filter backdrop-blur-sm/5 backdrop-filter backdrop-blur-sm rounded-lg shadow-lg p-6 mt-6">
                                    <h3 class="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                                        <i class="fas fa-table text-white/90"></i>
                                        جدول تحليل الحساسية
                                        <span class="text-sm font-normal text-white/70">Sensitivity Analysis Table</span>
                                    </h3>
                                    <div class="overflow-x-auto">
                                        <table class="w-full text-sm" id="mainSensitivityTable">
                                            <thead>
                                                <tr class="bg-white/5 backdrop-filter backdrop-blur-sm/8">
                                                    <th class="p-3 text-right font-semibold border">المتغير | Variable</th>
                                                    <th class="p-3 text-center font-semibold border">القيمة الأساسية | Base</th>
                                                    <th class="p-3 text-center font-semibold border">التغيير | Change</th>
                                                    <th class="p-3 text-center font-semibold border">NPV الجديد | New NPV</th>
                                                    <th class="p-3 text-center font-semibold border">IRR الجديد | New IRR</th>
                                                    <th class="p-3 text-center font-semibold border">التأثير | Impact</th>
                                                </tr>
                                            </thead>
                                            <tbody id="mainSensitivityTableBody">
                                                <tr>
                                                    <td colspan="6" class="p-4 text-center text-white/70">جاري التحميل...</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </div>

        <!-- Notification System JavaScript -->
        <script>
            // Notification System
            let notificationCount = 0;
            
            function showNotification(message, type = 'info', duration = 5000, title = null) {
                const container = document.getElementById('notification-container');
                if (!container) return;
                
                const id = \`notification-\${++notificationCount}\`;
                const notification = document.createElement('div');
                notification.id = id;
                notification.className = \`notification notification-\${type}\`;
                
                const iconMap = {
                    success: 'fas fa-check-circle',
                    error: 'fas fa-exclamation-triangle', 
                    warning: 'fas fa-exclamation-circle',
                    info: 'fas fa-info-circle',
                    loading: 'fas fa-spinner fa-spin'
                };
                
                const currentLang = document.documentElement.lang || 'ar';
                const translations = window.translations || {};
                const t = translations[currentLang] || translations.ar || {};
                
                const displayTitle = title || t[type] || type;
                
                notification.innerHTML = \`
                    <button class="close-btn" onclick="removeNotification('\${id}')">×</button>
                    <div class="flex items-center space-x-3">
                        <i class="\${iconMap[type] || iconMap.info} text-lg"></i>
                        <div>
                            <p class="font-medium">\${displayTitle}</p>
                            <p class="text-sm opacity-90">\${message}</p>
                        </div>
                    </div>
                \`;
                
                container.appendChild(notification);
                
                // Auto remove after duration (except for loading notifications)
                if (type !== 'loading' && duration > 0) {
                    setTimeout(() => removeNotification(id), duration);
                }
                
                return id;
            }
            
            function removeNotification(id) {
                const notification = document.getElementById(id);
                if (notification) {
                    notification.classList.add('slide-out');
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 300);
                }
            }
            
            function showLoading(title, message) {
                const overlay = document.getElementById('loading-overlay');
                const titleEl = document.getElementById('loading-title');
                const messageEl = document.getElementById('loading-message');
                
                if (overlay && titleEl && messageEl) {
                    const currentLang = document.documentElement.lang || 'ar';
                    const translations = window.translations || {};
                    const t = translations[currentLang] || translations.ar || {};
                    
                    titleEl.textContent = title || t.loading || 'جاري التحميل...';
                    messageEl.textContent = message || t.pleaseWait || 'يرجى الانتظار';
                    overlay.classList.remove('hidden');
                    overlay.classList.add('flex');
                }
            }
            
            function hideLoading() {
                const overlay = document.getElementById('loading-overlay');
                if (overlay) {
                    overlay.classList.add('hidden');
                    overlay.classList.remove('flex');
                }
            }
            
            // Validation helper functions
            function validatePositiveNumber(value, fieldName = '') {
                const num = parseFloat(value);
                const currentLang = document.documentElement.lang || 'ar';
                const translations = window.translations || {};
                const t = translations[currentLang] || translations.ar || {};
                
                if (isNaN(num)) {
                    return { valid: false, message: t.invalidInput || 'البيانات المدخلة غير صحيحة' };
                }
                
                if (num < 0) {
                    return { valid: false, message: \`\${fieldName}: \${t.mustBePositive || 'يجب أن تكون القيمة موجبة'}\` };
                }
                
                return { valid: true, value: num };
            }
            
            function validateGreaterThanZero(value, fieldName = '') {
                const num = parseFloat(value);
                const currentLang = document.documentElement.lang || 'ar';
                const translations = window.translations || {};
                const t = translations[currentLang] || translations.ar || {};
                
                if (isNaN(num)) {
                    return { valid: false, message: t.invalidInput || 'البيانات المدخلة غير صحيحة' };
                }
                
                if (num <= 0) {
                    return { valid: false, message: \`\${fieldName}: \${t.mustBeGreaterThanZero || 'يجب أن تكون القيمة أكبر من صفر'}\` };
                }
                
                return { valid: true, value: num };
            }
            
            function validateRange(value, min, max, fieldName = '') {
                const validation = validatePositiveNumber(value, fieldName);
                if (!validation.valid) return validation;
                
                const num = validation.value;
                const currentLang = document.documentElement.lang || 'ar';
                const translations = window.translations || {};
                const t = translations[currentLang] || translations.ar || {};
                
                if (num < min || num > max) {
                    return { valid: false, message: \`\${fieldName}: القيمة يجب أن تكون بين \${min} و \${max}\` };
                }
                
                return { valid: true, value: num };
            }
            
            // Enhanced form validation
            function validateField(element) {
                if (!element) return true;
                
                const value = element.value.trim();
                const fieldType = element.type;
                const fieldName = element.previousElementSibling?.textContent || element.id || 'الحقل';
                
                // Skip validation for empty optional fields
                if (!value && !element.required) return true;
                
                let validation = { valid: true };
                
                if (fieldType === 'number') {
                    const min = parseFloat(element.min) || 0;
                    const max = parseFloat(element.max) || Infinity;
                    
                    if (element.step && parseFloat(element.step) > 0) {
                        validation = validateRange(value, min, max, fieldName);
                    } else {
                        validation = validatePositiveNumber(value, fieldName);
                    }
                    
                    if (validation.valid && element.getAttribute('data-require-positive') === 'true') {
                        validation = validateGreaterThanZero(value, fieldName);
                    }
                }
                
                if (!validation.valid) {
                    showNotification(validation.message, 'error');
                    element.focus();
                    element.classList.add('field-error');
                    element.classList.remove('field-success');
                    
                    // Add status indicator
                    addFieldStatusIndicator(element, 'error', validation.message);
                    
                    setTimeout(() => {
                        element.classList.remove('field-error');
                        removeFieldStatusIndicator(element);
                    }, 5000);
                    return false;
                }
                
                element.classList.remove('field-error');
                element.classList.add('field-success');
                addFieldStatusIndicator(element, 'success');
                
                setTimeout(() => {
                    element.classList.remove('field-success');
                    removeFieldStatusIndicator(element);
                }, 2000);
                
                return true;
            }
            
            // Field status indicator functions
            function addFieldStatusIndicator(element, type, message = '') {
                removeFieldStatusIndicator(element);
                
                const indicator = document.createElement('div');
                indicator.className = \`field-status-indicator status-indicator status-\${type}\`;
                indicator.style.cssText = 'position: absolute; top: 100%; left: 0; z-index: 100; margin-top: 0.25rem;';
                
                const icons = {
                    success: 'fas fa-check',
                    error: 'fas fa-exclamation-triangle',
                    warning: 'fas fa-exclamation-circle',
                    info: 'fas fa-info-circle'
                };
                
                const messages = {
                    success: 'صحيح',
                    error: message || 'خطأ',
                    warning: 'تحذير',
                    info: 'معلومات'
                };
                
                indicator.innerHTML = \`
                    <i class="\${icons[type]}"></i>
                    <span>\${messages[type]}</span>
                \`;
                
                // Make parent relative if not already
                const parent = element.parentElement;
                if (parent && getComputedStyle(parent).position === 'static') {
                    parent.style.position = 'relative';
                }
                
                parent.appendChild(indicator);
            }
            
            function removeFieldStatusIndicator(element) {
                const parent = element.parentElement;
                if (parent) {
                    const existing = parent.querySelector('.field-status-indicator');
                    if (existing) {
                        existing.remove();
                    }
                }
            }
            
            // Button loading state functions
            function setButtonLoading(button, loading = true) {
                if (!button) return;
                
                if (loading) {
                    button.classList.add('btn-loading');
                    button.disabled = true;
                } else {
                    button.classList.remove('btn-loading');
                    button.disabled = false;
                }
            }
            
            // Global error handler
            window.addEventListener('error', function(e) {
                console.error('Global error:', e.error);
                const currentLang = document.documentElement.lang || 'ar';
                const translations = window.translations || {};
                const t = translations[currentLang] || translations.ar || {};
                
                showNotification(
                    t.unexpectedError || 'حدث خطأ غير متوقع',
                    'error'
                );
            });
            
            // Enhanced calculation function with validation and notifications
            function handleCalculateWithValidation() {
                const currentLang = document.documentElement.lang || 'ar';
                const translations = window.translations || {};
                const t = translations[currentLang] || translations.ar || {};
                
                const calcButton = document.getElementById('calculateBtn');
                
                // Set button loading state
                setButtonLoading(calcButton, true);
                
                // Show loading
                showLoading(t.calculating || 'جاري الحساب...', t.processingData || 'معالجة البيانات...');
                
                try {
                    // Validate key fields first
                    const fieldsToValidate = ['landArea', 'far'];
                    let validationPassed = true;
                    
                    for (const fieldId of fieldsToValidate) {
                        const field = document.getElementById(fieldId);
                        if (field && !validateField(field)) {
                            validationPassed = false;
                            break;
                        }
                    }
                    
                    if (!validationPassed) {
                        hideLoading();
                        setButtonLoading(calcButton, false);
                        showNotification(
                            t.dataValidationError || 'يرجى التحقق من صحة البيانات المدخلة',
                            'error'
                        );
                        return;
                    }
                    
                    // Simulate calculation time for better UX
                    setTimeout(() => {
                        try {
                            console.log('🎯 [handleCalculateWithValidation] بدء الحساباتة...');
                            
                            // Call original calculation function
                            if (typeof handleCalculate === 'function') {
                                handleCalculate();
                            } else if (typeof window.handleCalculate === 'function') {
                                window.handleCalculate();
                            }
                            
                            // CRITICAL: تحديث جدول التدفقات النقدية و KPIs Dashboard
                            console.log('📊 [handleCalculateWithValidation] تحديث Cash Flow & KPIs...');
                            
                            // Step 1: حساب CAPEX
                            if (typeof calculateCapitalExpenditure === 'function') {
                                console.log('  ✓ استدعاء calculateCapitalExpenditure()');
                                calculateCapitalExpenditure();
                            } else if (typeof window.calculateCapitalExpenditure === 'function') {
                                console.log('  ✓ استدعاء window.calculateCapitalExpenditure()');
                                window.calculateCapitalExpenditure();
                            }
                            
                            // Step 2: بناء جدول التدفقات النقدية
                            if (typeof buildCashFlowTable === 'function') {
                                console.log('  ✓ استدعاء buildCashFlowTable()');
                                buildCashFlowTable();
                            } else if (typeof window.buildCashFlowTable === 'function') {
                                console.log('  ✓ استدعاء window.buildCashFlowTable()');
                                window.buildCashFlowTable();
                            }
                            
                            // Step 3: عرض الجدول (هذه تستدعي updateKPIDashboard()اً)
                            if (typeof renderCashFlowTable === 'function') {
                                console.log('  ✓ استدعاء renderCashFlowTable()');
                                renderCashFlowTable();
                            } else if (typeof window.renderCashFlowTable === 'function') {
                                console.log('  ✓ استدعاء window.renderCashFlowTable()');
                                window.renderCashFlowTable();
                            }
                            
                            console.log('✅ [handleCalculateWithValidation] اكتملت جميع الحسابات');
                            
                            // CRITICAL FIX: استدعاء إضافي صريح لـ updateKPIDashboard
                            console.log('🔄 [handleCalculateWithValidation] استدعاء إضافي لـ updateKPIDashboard...');
                            setTimeout(() => {
                                if (typeof updateKPIDashboard === 'function') {
                                    updateKPIDashboard();
                                    console.log('✅ [handleCalculateWithValidation] تم استدعاء updateKPIDashboard() بنجاح');
                                } else if (typeof window.updateKPIDashboard === 'function') {
                                    window.updateKPIDashboard();
                                    console.log('✅ [handleCalculateWithValidation] تم استدعاء window.updateKPIDashboard() بنجاح');
                                } else {
                                    console.error('❌ [handleCalculateWithValidation] updateKPIDashboard غير متوفرة!');
                                }
                                
                                // التمريراً إلى Dashboard
                                const dashboardSection = document.getElementById('kpiDashboardSection');
                                if (dashboardSection && dashboardSection.style.display === 'block') {
                                    console.log('📍 [handleCalculateWithValidation] التمرير إلى Dashboard...');
                                    setTimeout(() => {
                                        dashboardSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }, 500);
                                }
                            }, 300);
                            
                            hideLoading();
                            setButtonLoading(calcButton, false);
                            
                            // Remove empty state messages
                            const emptyMessages = document.querySelectorAll('.empty-state-message');
                            emptyMessages.forEach(msg => msg.remove());
                            
                            showNotification(
                                t.calculationComplete || 'اكتملت العملية الحسابية بنجاح',
                                'success',
                                3000
                            );
                        } catch (error) {
                            hideLoading();
                            setButtonLoading(calcButton, false);
                            console.error('❌ Calculation error:', error);
                            showNotification(
                                t.calculationError || 'حدث خطأ في الحسابات',
                                'error'
                            );
                        }
                    }, 800); // Small delay for better UX
                    
                } catch (error) {
                    hideLoading();
                    setButtonLoading(calcButton, false);
                    console.error('Validation error:', error);
                    showNotification(
                        t.unexpectedError || 'حدث خطأ غير متوقع',
                        'error'
                    );
                }
            }
            
            // Enhanced export functions
            function handleExportWithNotification(exportFunc, type = 'report') {
                const currentLang = document.documentElement.lang || 'ar';
                const translations = window.translations || {};
                const t = translations[currentLang] || translations.ar || {};
                
                showLoading(t.exportingReport || 'تصدير التقرير...', t.pleaseWait || 'يرجى الانتظار');
                
                try {
                    setTimeout(() => {
                        try {
                            if (typeof exportFunc === 'function') {
                                exportFunc();
                            }
                            hideLoading();
                            showNotification(
                                t.reportExported || 'تم تصدير التقرير بنجاح',
                                'success'
                            );
                        } catch (error) {
                            hideLoading();
                            console.error('Export error:', error);
                            showNotification(
                                'فشل في تصدير التقرير',
                                'error'
                            );
                        }
                    }, 500);
                } catch (error) {
                    hideLoading();
                    showNotification(
                        t.unexpectedError || 'حدث خطأ غير متوقع',
                        'error'
                    );
                }
            }
            
            // Enhanced reset function
            function handleResetWithNotification() {
                const currentLang = document.documentElement.lang || 'ar';
                const translations = window.translations || {};
                const t = translations[currentLang] || translations.ar || {};
                
                if (confirm('هل أنت متأكد من إعادة تعيين جميع البيانات؟')) {
                    try {
                        // Call original reset function
                        if (typeof resetForm === 'function') {
                            resetForm();
                        } else if (typeof window.resetForm === 'function') {
                            window.resetForm();
                        }
                        
                        showNotification(
                            t.dataReset || 'تم إعادة تعيين البيانات',
                            'success',
                            2000
                        );
                    } catch (error) {
                        console.error('Reset error:', error);
                        showNotification(
                            t.unexpectedError || 'حدث خطأ غير متوقع',
                            'error'
                        );
                    }
                }
            }
            
            // Export functions globally
            window.showNotification = showNotification;
            window.removeNotification = removeNotification;
            window.showLoading = showLoading;
            window.hideLoading = hideLoading;
            window.validateField = validateField;
            window.validatePositiveNumber = validatePositiveNumber;
            window.validateGreaterThanZero = validateGreaterThanZero;
            window.validateRange = validateRange;
            window.handleCalculateWithValidation = handleCalculateWithValidation;
            window.handleExportWithNotification = handleExportWithNotification;
            window.handleResetWithNotification = handleResetWithNotification;
            window.addFieldStatusIndicator = addFieldStatusIndicator;
            window.removeFieldStatusIndicator = removeFieldStatusIndicator;
            window.setButtonLoading = setButtonLoading;
            // Safe assignment - only if function is defined
            if (typeof addEmptyStateMessages === 'function') {
                window.addEmptyStateMessages = addEmptyStateMessages;
            }
            // Safe assignment - only if function is defined
            if (typeof addTooltips === 'function') {
                window.addTooltips = addTooltips;
            }
            
            // Show welcome message for first-time users
            document.addEventListener('DOMContentLoaded', function() {
                const hasVisited = localStorage.getItem('real_estate_visited');
                if (!hasVisited) {
                    setTimeout(() => {
                        const currentLang = document.documentElement.lang || 'ar';
                        const welcomeMessage = currentLang === 'en' 
                            ? 'Welcome to Real Estate Feasibility Pro! Enter your project details and click "Calculate" to start.'
                            : 'مرحباً بك في تطبيق دراسة الجدوى العقارية المتقدم! أدخل بيانات مشروعك واضغط "احسب" للبدء.';
                        
                        showNotification(welcomeMessage, 'info', 8000);
                        localStorage.setItem('real_estate_visited', 'true');
                    }, 2000);
                }
                
                // Add helpful tooltips and empty state messages
                setTimeout(() => {
                    try {
                        if (typeof addEmptyStateMessages === 'function') {
                            addEmptyStateMessages();
                        }
                    } catch (error) {
                        console.log('🔧 addEmptyStateMessages not available yet, will try later');
                    }
                    
                    try {
                        if (typeof addTooltips === 'function') {
                            addTooltips();
                        }
                    } catch (error) {
                        console.log('🔧 addTooltips not available yet, will try later');
                    }
                }, 1000);
            });
        </script>
        </div> <!-- نهاية Tab 10: المؤشرات المالية الرئيسية -->
        
        </div> <!-- نهاية Tabs Content Container -->

        <!-- ✅ NEW: Validation utilities -->
        <script src="/static/validation-utils.js?v=${Date.now()}"></script>
        
        <!-- ✅ NEW: Partnership calculations utilities -->
        <script src="/static/partnership-utils.js?v=${Date.now()}"></script>
        
        <!-- ✅ NEW: Tabs System for organized UI sections -->
        <script src="/static/tabs-system.js?v=${Date.now()}"></script>
        
        <!-- ✅ NEW: Comprehensive Report Data Collector -->
        <script src="/static/report-data-collector.js?v=${Date.now()}"></script>
        <script src="/static/summary-copy-system.js?v=${Date.now()}"></script>
        <script src="/static/summary-project-info.js?v=${Date.now()}"></script>
        
        <script src="/static/app.js?v=${Date.now()}"></script>
        
        <!-- EMERGENCY RENDER: Force render all systems after app.js loads -->
        <script>
        // Add empty state messages to various sections
        function addEmptyStateMessages() {
            const currentLang = document.documentElement.lang || 'ar';
            const translations = window.translations || {};
            const t = translations[currentLang] || translations.ar || {};
            
            // Add empty state for results section if no calculations yet
            setTimeout(() => {
                const resultsContainer = document.querySelector('#resultsContainer, .results-container');
                if (resultsContainer) {
                    const hasResults = resultsContainer.querySelector('.result-value:not([data-value="0"])');
                    if (!hasResults) {
                        const emptyMessage = document.createElement('div');
                        emptyMessage.className = 'empty-state-message text-center py-8 text-white/70';
                        emptyMessage.innerHTML = \`
                            <i class="fas fa-calculator text-3xl mb-3 opacity-50"></i>
                            <p class="text-lg font-medium mb-2">\${t.noData || 'لا توجد بيانات للعرض'}</p>
                            <p class="text-sm">\${currentLang === 'en' ? 'Enter project data and click Calculate to see results' : 'أدخل بيانات المشروع واضغط احسب لعرض النتائج'}</p>
                        \`;
                        resultsContainer.prepend(emptyMessage);
                    }
                }
            }, 1000);
        }
        
        // Add helpful tooltips
        function addTooltips() {
            const currentLang = document.documentElement.lang || 'ar';
            
            const tooltips = {
                'landArea': currentLang === 'en' ? 'Total land area in square meters' : 'إجمالي مساحة الأرض بالمتر المربع',
                'far': currentLang === 'en' ? 'Floor Area Ratio - maximum buildable area relative to land area' : 'معامل البناء المسموح - نسبة المساحة المبنية إلى مساحة الأرض'
            };
            
            Object.keys(tooltips).forEach(id => {
                const field = document.getElementById(id);
                if (field) {
                    field.setAttribute('title', tooltips[id]);
                    field.setAttribute('data-tooltip', tooltips[id]);
                }
            });
        }

        window.addEventListener('load', function() {
            console.log('🚀 EMERGENCY: Page fully loaded, checking systems...')
            
            // Wait a bit for app.js to initialize
            setTimeout(function() {
                console.log('🔧 EMERGENCY: Force rendering systems...')
                
                // Systems will be rendered automatically when app.js loads
                
                console.log('✅ EMERGENCY: All emergency renders attempted')
            }, 500)
        })
        </script>
        


        <!-- Map JavaScript -->
        <script>
            // Global variables for map
            let map;
            let currentMarker;
            
            // Initialize map when page loads
            document.addEventListener('DOMContentLoaded', function() {
                initializeMap();
            });
            
            function initializeMap() {
                // Initialize map centered on Saudi Arabia (Riyadh)
                map = L.map('map').setView([24.7136, 46.6753], 6);
                
                // Add OpenStreetMap tiles
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                }).addTo(map);
                
                // Add initial marker for Riyadh
                currentMarker = L.marker([24.7136, 46.6753])
                    .addTo(map)
                    .bindPopup('<strong>الرياض</strong><br>العاصمة الإدارية للمملكة العربية السعودية')
                    .openPopup();
                
                // Add click event to map
                map.on('click', function(e) {
                    updateMapLocation(e.latlng.lat, e.latlng.lng, 'موقع مخصص');
                });
            }
            
            // ✅ DUPLICATE REMOVED: onCitySelect 
            // Using advanced version from app.js with safety checks and window export
            // The app.js version includes typeof checks and global window exposure
            
            function selectCity(cityName, lat, lng) {
                // Update city select
                document.getElementById('city').value = cityName;
                
                // Update map location
                updateMapLocation(lat, lng, cityName);
                
                // Update coordinates display
                updateCoordinatesDisplay(lat, lng, cityName);
            }
            
            function updateMapLocation(lat, lng, locationName) {
                // Move map to new location
                map.setView([lat, lng], 10);
                
                // Remove existing marker
                if (currentMarker) {
                    map.removeLayer(currentMarker);
                }
                
                // Add new marker
                currentMarker = L.marker([lat, lng])
                    .addTo(map)
                    .bindPopup('<strong>' + locationName + '</strong><br>موقع المشروع المحدد')
                    .openPopup();
                
                // Update coordinates display
                updateCoordinatesDisplay(lat, lng, locationName);
            }
            
            function updateCoordinatesDisplay(lat, lng, locationName) {
                document.getElementById('currentLatitude').value = lat.toFixed(6);
                document.getElementById('currentLongitude').value = lng.toFixed(6);
                document.getElementById('currentLocationName').textContent = locationName;
            }
            
            // Update map when coordinates are manually entered
            function updateMapFromCoordinates() {
                const latInput = document.getElementById('currentLatitude');
                const lngInput = document.getElementById('currentLongitude');
                
                const lat = parseFloat(latInput.value);
                const lng = parseFloat(lngInput.value);
                
                // Validate coordinates
                if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                    console.warn('Invalid coordinates:', lat, lng);
                    return;
                }
                
                // Update map position
                map.setView([lat, lng], 10);
                
                // Remove existing marker
                if (currentMarker) {
                    map.removeLayer(currentMarker);
                }
                
                // Add new marker
                currentMarker = L.marker([lat, lng])
                    .addTo(map)
                    .bindPopup('<strong>موقع مخصص</strong><br>Lat: ' + lat.toFixed(6) + '<br>Lng: ' + lng.toFixed(6))
                    .openPopup();
                
                // Update location name
                document.getElementById('currentLocationName').textContent = 'موقع مخصص';
            }
            
            // Center map on current coordinates
            function centerMapOnCoordinates() {
                updateMapFromCoordinates();
            }
            
            // Validate coordinate inputs
            function validateCoordinates() {
                const latInput = document.getElementById('currentLatitude');
                const lngInput = document.getElementById('currentLongitude');
                
                let lat = parseFloat(latInput.value);
                let lng = parseFloat(lngInput.value);
                
                // Clamp latitude to valid range
                if (lat < -90) {
                    lat = -90;
                    latInput.value = lat;
                } else if (lat > 90) {
                    lat = 90;
                    latInput.value = lat;
                }
                
                // Clamp longitude to valid range
                if (lng < -180) {
                    lng = -180;
                    lngInput.value = lng;
                } else if (lng > 180) {
                    lng = 180;
                    lngInput.value = lng;
                }
            }
            
            // Update translations for map when language changes
            function updateMapTranslations() {
                const isArabic = document.documentElement.lang === 'ar';
                const t = translations[isArabic ? 'ar' : 'en'];
                
                document.getElementById('locationMapTitle').textContent = t.locationMap;
                document.getElementById('popularCitiesTitle').textContent = t.popularCities;
                document.getElementById('coordinatesTitle').textContent = t.coordinates;
                document.getElementById('latitudeLabel').textContent = t.latitude + ':';
                document.getElementById('longitudeLabel').textContent = t.longitude + ':';
                document.getElementById('currentLocationLabel').textContent = t.currentLocation + ':';
            }
        </script>

        <!-- Floors Management JavaScript -->
        <script>
            // Global variables for floors management
            let floorsData = [];
            window.floorsData = floorsData; // Make it accessible globally
            let floorIdCounter = 1;
            let currentLanguage = 'ar'; // Language variable for floors system
            
            // Chart instances
            let usagePieChart = null;
            let usageRadarChart = null;
            
            // 🆕 Custom usage types system (dynamic)
            let customUsageTypes = []; // Store custom usage types created by user
            window.customUsageTypes = customUsageTypes;
            
            // 🆕 Default usage types with icons and colors
            const defaultUsageTypes = [
                { id: 'parking', nameAr: 'مواقف', nameEn: 'Parking', icon: '🅿️', color: '#6B7280', countInGLA: false },
                { id: 'services', nameAr: 'خدمات', nameEn: 'Services', icon: '🔧', color: '#6B7280', countInGLA: false },
                { id: 'reception', nameAr: 'استقبال', nameEn: 'Reception', icon: '🎫', color: '#F59E0B', countInGLA: true },
                { id: 'hotel', nameAr: 'فندق', nameEn: 'Hotel', icon: '🏨', color: '#6B7280', countInGLA: true },
                { id: 'retail', nameAr: 'تجاري', nameEn: 'Retail', icon: '🛒', color: '#9CA3AF', countInGLA: true },
                { id: 'office', nameAr: 'مكتبي', nameEn: 'Office', icon: '🏢', color: '#F97316', countInGLA: true },
                { id: 'residential', nameAr: 'سكني', nameEn: 'Residential', icon: '🏠', color: '#EF4444', countInGLA: true }
            ];

            // 🆕 Helper function: Get all usage types (default + custom)
            function getAllUsageTypes() {
                // 🆕 Read from usesData (Uses Management System) if available
                if (window.usesData && Object.keys(window.usesData).length > 0) {
                    console.log('📋 [getAllUsageTypes] قراءة من نظام إدارة الاستخدامات:', Object.keys(window.usesData).length, 'استخدام');
                    return Object.values(window.usesData).map(use => ({
                        id: use.id,
                        nameAr: use.name || use.nameAr,
                        nameEn: use.nameEn || use.name,
                        icon: use.icon || '🏗️',
                        color: use.color || 'gray',
                        countInGLA: use.efficiency !== undefined ? (use.efficiency > 0) : true,
                        isCustom: use.isCustom || false
                    }));
                }
                
                // Fallback to local types if usesData not available
                console.log('⚠️ [getAllUsageTypes] استخدام الأنواع الافتراضية (usesData غير متوفر)');
                return [...defaultUsageTypes, ...customUsageTypes];
            }
            
            // 🆕 Helper function: Get usage type by ID
            function getUsageType(usageId) {
                return getAllUsageTypes().find(t => t.id === usageId) || defaultUsageTypes[0];
            }
            
            // 🔄 Load usage types settings from localStorage on page load
            function loadUsageTypesSettings() {
                try {
                    const savedDefaultSettings = localStorage.getItem('defaultUsageTypesSettings');
                    const savedCustomTypes = localStorage.getItem('customUsageTypes');
                    
                    if (savedDefaultSettings) {
                        const saved = JSON.parse(savedDefaultSettings);
                        // Update countInGLA for default types based on saved settings
                        saved.forEach(savedType => {
                            const type = defaultUsageTypes.find(t => t.id === savedType.id);
                            if (type && savedType.countInGLA !== undefined) {
                                type.countInGLA = savedType.countInGLA;
                            }
                        });
                        console.log('✅ Loaded default usage types settings from localStorage');
                    }
                    
                    if (savedCustomTypes) {
                        customUsageTypes = JSON.parse(savedCustomTypes);
                        window.customUsageTypes = customUsageTypes;
                        console.log('✅ Loaded custom usage types from localStorage');
                    }
                } catch (error) {
                    console.error('❌ Error loading usage types settings:', error);
                }
            }
            
            // Load settings on page initialization
            loadUsageTypesSettings();
            
            // 🆕 Function: Add custom usage type
            function addCustomUsageType(nameAr, nameEn) {
                const id = 'custom_' + Date.now();
                const icons = ['🏗️', '🏭', '🏬', '🏪', '🏫', '🏥', '🏦', '⛪', '🕌', '🏛️', '🎭', '🎨', '🎪', '🎬', '📚', '⚽', '🏊', '🎯'];
                const colors = ['#06B6D4', '#84CC16', '#A855F7', '#EC4899', '#14B8A6', '#F472B6', '#FB923C'];
                const icon = icons[Math.floor(Math.random() * icons.length)];
                const color = colors[Math.floor(Math.random() * colors.length)];
                
                const newType = {
                    id: id,
                    nameAr: nameAr,
                    nameEn: nameEn || nameAr,
                    icon: icon,
                    color: color,
                    countInGLA: true,  // Default to true for custom types
                    isCustom: true
                };
                
                customUsageTypes.push(newType);
                window.customUsageTypes = customUsageTypes;
                return newType;
            }
            
            // 🆕 Function: Duplicate floor
            function duplicateFloor(floorId) {
                const floor = floorsData.find(f => f.id === floorId);
                if (!floor) return;
                
                const newNumber = prompt(
                    currentLanguage === 'ar' ? 'أدخل اسم/رقم الدور الجديد:' : 'Enter new floor name/number:',
                    floor.number + ' (نسخة)'
                );
                
                if (!newNumber || !newNumber.trim()) return;
                
                // Check if name exists
                if (floorsData.find(f => f.number === newNumber.trim())) {
                    alert(currentLanguage === 'ar' ? 'هذا الاسم موجود بالفعل' : 'This name already exists');
                    return;
                }
                
                // Create duplicate with new ID
                const newFloor = {
                    ...floor,
                    id: floorIdCounter++,
                    number: newNumber.trim(),
                    order: floorsData.length,
                    repeatCount: floor.repeatCount || 1
                };
                
                floorsData.push(newFloor);
                window.floorsData = floorsData;
                sortFloorsByOrder();
                updateFloorsDisplay();
                updateAllSummaries();
            }

            // Initialize floors management when page loads
            document.addEventListener('DOMContentLoaded', function() {
                initializeFloorsManagement();
            });

            function initializeFloorsManagement() {
                // Add event listeners
                document.getElementById('addFloorBtn').addEventListener('click', showAddFloorForm);
                // Form event listeners removed - direct floor addition

                // Add project parameter listeners
                const landAreaInput = document.getElementById('landArea');
                const farInput = document.getElementById('far');
                
                if (landAreaInput) {
                    landAreaInput.addEventListener('input', () => {
                        updateProjectDisplayValues();
                        updateFARAnalysis();
                    });
                }
                if (farInput) {
                    farInput.addEventListener('input', () => {
                        updateProjectDisplayValues();
                        updateFARAnalysis();
                    });
                }

                // No default floors - start with empty table
                // loadSampleFloors() removed - user adds floors manually
                updateFloorsDisplay();
                updateAllSummaries();
                updateProjectDisplayValues(); // Initial update
            }

            function updateProjectDisplayValues() {
                const landAreaEl = document.getElementById('landArea');
                const farEl = document.getElementById('far');
                
                if (!landAreaEl || !farEl) return; // Skip if elements don't exist
                
                const landArea = parseFloat(landAreaEl.value) || 10000;
                const far = parseFloat(farEl.value) || 3.5;

                // Update display values (with null checks)
                const landAreaDisplay = document.getElementById('landAreaDisplay');
                const allowedFARDisplay = document.getElementById('allowedFARDisplay');
                const allowedFARSummaryValue = document.getElementById('allowedFARSummaryValue');
                
                if (landAreaDisplay) landAreaDisplay.textContent = landArea.toLocaleString('en-US');
                if (allowedFARDisplay) allowedFARDisplay.textContent = far;
                if (allowedFARSummaryValue) allowedFARSummaryValue.textContent = far;

                // Recalculate all floor areas and update summary
                updateFloorsDisplay();
                updateAllSummaries();
            }

            function showAddFloorForm() {
                // ✨ إضافة دور فارغ مباشرة بدون نموذج
                addEmptyFloor();
            }
            
            function addEmptyFloor() {
                // 🆕 Get the next floor number automatically
                const nextFloorNumber = floorsData.length + 1;
                
                // 🆕 Get first available usage (or 'services' as default)
                const allUsages = getAllUsageTypes();
                const defaultUsage = allUsages.length > 0 ? allUsages[0].id : 'services';
                
                // 🆕 Create new empty floor
                const newFloor = {
                    id: floorIdCounter++,
                    number: nextFloorNumber.toString(),
                    usage: defaultUsage,
                    reference: 'landArea',
                    percentage: 10, // 10% as default
                    servicePercentage: 15,
                    calculatedArea: 0,
                    netArea: 0,
                    serviceArea: 0,
                    enabled: true,
                    countInFAR: true,
                    repeatCount: 1,
                    order: floorsData.length
                };
                
                // Calculate areas
                const landArea = parseFloat(document.getElementById('landArea')?.value) || 10000;
                newFloor.calculatedArea = (landArea * newFloor.percentage) / 100;
                
                // Calculate netArea based on usage countInGLA
                const use = window.usesData?.[newFloor.usage];
                const countInGLA = use?.countInGLA !== false;
                
                newFloor.serviceArea = newFloor.calculatedArea * (newFloor.servicePercentage / 100);
                newFloor.netArea = countInGLA ? (newFloor.calculatedArea - newFloor.serviceArea) : 0;
                
                floorsData.push(newFloor);
                window.floorsData = floorsData;
                localStorage.setItem('floorsData', JSON.stringify(floorsData));
                
                sortFloorsByOrder();
                updateFloorsDisplay();
                updateAllSummaries();
                
                console.log('✅ تمت إضافة دور جديد:', newFloor);
            }

            function hideAddFloorForm() {
                document.getElementById('addFloorForm').classList.add('hidden');
                clearFloorForm();
            }

            function clearFloorForm() {
                document.getElementById('floorNumberInput').value = '';
                document.getElementById('floorUsageSelect').value = 'parking';
                updateReferenceOptions(); // Update reference options
                document.getElementById('floorReferenceSelect').value = 'landArea';
                document.getElementById('floorPercentageInput').value = '';
                document.getElementById('servicePercentageInput').value = '15';
                document.getElementById('calculatedAreaInput').value = '';
            }

            function updateReferenceOptions() {
                const referenceSelect = document.getElementById('floorReferenceSelect');
                const currentValue = referenceSelect.value;
                
                // Clear existing options
                referenceSelect.innerHTML = '';
                
                // Add land area option
                const isArabic = currentLanguage === 'ar';
                const landAreaText = isArabic ? 'مساحة الأرض' : 'Land Area';
                referenceSelect.innerHTML += \`<option value="landArea">\${landAreaText}</option>\`;
                
                // Add other floors as options
                floorsData.forEach(floor => {
                    const floorText = isArabic ? 'الدور ' : 'Floor ';
                    referenceSelect.innerHTML += \`<option value="\${floor.id}">\${floorText}\${floor.number}</option>\`;
                });
                
                // Restore previous value if it still exists
                if (currentValue) {
                    const optionExists = Array.from(referenceSelect.options).some(option => option.value === currentValue);
                    if (optionExists) {
                        referenceSelect.value = currentValue;
                    }
                }
                
                // Recalculate area
                calculateFloorArea();
            }

            function calculateFloorArea() {
                const percentage = parseFloat(document.getElementById('floorPercentageInput').value) || 0;
                const reference = document.getElementById('floorReferenceSelect').value;
                
                let referenceArea = 0;
                if (reference === 'landArea') {
                    referenceArea = parseFloat(document.getElementById('landArea').value) || 10000;
                } else {
                    // Reference is another floor
                    const referenceFloor = floorsData.find(f => f.id === parseInt(reference));
                    if (referenceFloor) {
                        referenceArea = referenceFloor.calculatedArea;
                    }
                }

                const calculatedArea = (referenceArea * percentage) / 100;
                document.getElementById('calculatedAreaInput').value = calculatedArea.toFixed(2);
            }

            function saveFloor() {
                const floorNumber = document.getElementById('floorNumberInput').value.trim();
                const floorUsage = document.getElementById('floorUsageSelect').value;
                const floorReference = document.getElementById('floorReferenceSelect').value;
                const floorPercentage = parseFloat(document.getElementById('floorPercentageInput').value);
                const servicePercentage = parseFloat(document.getElementById('servicePercentageInput').value) || 15;
                const calculatedArea = parseFloat(document.getElementById('calculatedAreaInput').value);

                // Validation
                if (!floorNumber) {
                    alert(currentLanguage === 'ar' ? 'يرجى إدخال رقم الدور' : 'Please enter floor number');
                    return;
                }

                if (!floorPercentage || floorPercentage <= 0) {
                    alert(currentLanguage === 'ar' ? 'يرجى إدخال نسبة صحيحة' : 'Please enter valid percentage');
                    return;
                }

                if (servicePercentage < 0 || servicePercentage > 100) {
                    alert(currentLanguage === 'ar' ? 'يرجى إدخال نسبة خدمات بين 0-100%' : 'Please enter service percentage between 0-100%');
                    return;
                }

                // Check if floor number already exists
                if (floorsData.find(f => f.number === floorNumber)) {
                    alert(currentLanguage === 'ar' ? 'هذا الدور موجود بالفعل' : 'Floor number already exists');
                    return;
                }

                // Calculate areas based on service percentage
                const serviceArea = calculatedArea * (servicePercentage / 100);
                
                // 🔹 Check if usage in usesData has countInGLA = false
                // Read from window.usesData (usage cards) NOT defaultUsageTypes
                const use = window.usesData?.[floorUsage];
                const isCountedInGLA = use?.countInGLA !== false; // Default to true if not set
                
                // If usage is NOT counted in GLA, netArea = 0 (all area is service area)
                const netArea = isCountedInGLA ? (calculatedArea - serviceArea) : 0;
                
                console.log('📍 Adding Floor ' + floorNumber + ' (' + floorUsage + '):');
                console.log('   - Usage card countInGLA: ' + (use?.countInGLA !== undefined ? use.countInGLA : 'default (true)'));
                console.log('   - calculatedArea: ' + calculatedArea.toFixed(0) + ' م²');
                console.log('   - netArea (GLA): ' + netArea.toFixed(0) + ' م²');
                console.log('   - serviceArea: ' + serviceArea.toFixed(0) + ' م²');

                // Add floor to data with order (last position)
                const newFloor = {
                    id: floorIdCounter++,
                    number: floorNumber,
                    usage: floorUsage,
                    reference: floorReference,
                    percentage: floorPercentage,
                    servicePercentage: servicePercentage,
                    calculatedArea: calculatedArea,
                    netArea: netArea,
                    serviceArea: serviceArea,
                    enabled: true,
                    countInFAR: true, // 🆕 محسوب في FAR النظامي (بدلاً من enabled)
                    repeatCount: 1, // 🆕 عدد تكرار الدور
                    order: floorsData.length
                };

                floorsData.push(newFloor);
                window.floorsData = floorsData; // Update global reference
                sortFloorsByOrder();
                updateFloorsDisplay();
                updateAllSummaries();
                
                // Update efficiency summary with new floors data
                if (typeof updateEnhancedEfficiencySummary === 'function') {
                    updateEnhancedEfficiencySummary();
                }
                hideAddFloorForm();
            }

            function sortFloorsByOrder() {
                floorsData.sort((a, b) => a.order - b.order);
                window.floorsData = floorsData; // Update global reference
            }

            function moveFloorUp(floorId) {
                const floorIndex = floorsData.findIndex(f => f.id === floorId);
                if (floorIndex > 0) {
                    // Swap orders
                    const temp = floorsData[floorIndex].order;
                    floorsData[floorIndex].order = floorsData[floorIndex - 1].order;
                    floorsData[floorIndex - 1].order = temp;
                    
                    sortFloorsByOrder();
                    updateFloorsDisplay();
                updateAllSummaries();
                }
            }

            function moveFloorDown(floorId) {
                const floorIndex = floorsData.findIndex(f => f.id === floorId);
                if (floorIndex < floorsData.length - 1) {
                    // Swap orders
                    const temp = floorsData[floorIndex].order;
                    floorsData[floorIndex].order = floorsData[floorIndex + 1].order;
                    floorsData[floorIndex + 1].order = temp;
                    
                    sortFloorsByOrder();
                    updateFloorsDisplay();
                updateAllSummaries();
                }
            }

            function deleteFloor(floorId) {
                const isArabic = currentLanguage === 'ar';
                const confirmMessage = isArabic ? 
                    'هل تريد حذف هذا الدور؟' : 
                    'Are you sure you want to delete this floor?';
                    
                if (confirm(confirmMessage)) {
                    floorsData = floorsData.filter(f => f.id !== floorId);
                    window.floorsData = floorsData; // Update global reference
                    updateFloorsDisplay();
                updateAllSummaries();
                }
            }

            // 🆕 Toggle countInFAR instead of enabled
            function toggleCountInFAR(floorId) {
                const floor = floorsData.find(f => f.id === floorId);
                if (floor) {
                    // Initialize countInFAR if undefined (for old data)
                    if (floor.countInFAR === undefined) {
                        floor.countInFAR = floor.enabled !== undefined ? floor.enabled : true;
                    }
                    floor.countInFAR = !floor.countInFAR;
                    window.floorsData = floorsData; // Update global reference
                    updateFloorsDisplay();
                updateAllSummaries();
                }
            }
            
            // Keep old function for backward compatibility
            function toggleFloor(floorId) {
                toggleCountInFAR(floorId);
            }

            // Inline editing functions
            function updateFloorName(floorId, newName) {
                const floor = floorsData.find(f => f.id === floorId);
                if (floor && newName.trim()) {
                    // Check if name already exists in other floors
                    const existingFloor = floorsData.find(f => f.id !== floorId && f.number === newName.trim());
                    if (existingFloor) {
                        alert(currentLanguage === 'ar' ? 'هذا الاسم موجود بالفعل' : 'This name already exists');
                        updateFloorsDisplay(); // Restore original value
                        return;
                    }
                    floor.number = newName.trim();
                    window.floorsData = floorsData; // Update global reference
                    updateFloorsDisplay();
                updateAllSummaries();
                }
            }

            function updateFloorReference(floorId, newReference) {
                const floor = floorsData.find(f => f.id === floorId);
                if (floor) {
                    floor.reference = newReference;
                    calculateFloorAreaForFloor(floor);
                    window.floorsData = floorsData; // Update global reference
                    updateFloorsDisplay();
                updateAllSummaries();
                }
            }

            function updateFloorPercentage(floorId, newPercentage) {
                const floor = floorsData.find(f => f.id === floorId);
                if (floor) {
                    const percentage = parseFloat(newPercentage);
                    if (percentage >= 0 && percentage <= 1000) { // Allow higher percentages for multi-floor entries
                        floor.percentage = percentage;
                        calculateFloorAreaForFloor(floor);
                        window.floorsData = floorsData; // Update global reference
                        updateFloorsDisplay();
                updateAllSummaries();
                    } else {
                        alert(currentLanguage === 'ar' ? 'يرجى إدخال نسبة بين 0-1000%' : 'Please enter percentage between 0-1000%');
                        updateFloorsDisplay(); // Restore original value
                    }
                }
            }

            function updateFloorServicePercentage(floorId, newServicePercentage) {
                const floor = floorsData.find(f => f.id === floorId);
                if (floor) {
                    const servicePercentage = parseFloat(newServicePercentage);
                    if (servicePercentage >= 0 && servicePercentage <= 100) {
                        floor.servicePercentage = servicePercentage;
                        // Recalculate areas
                        floor.serviceArea = floor.calculatedArea * (servicePercentage / 100);
                        
                        // 🔹 Check if usage in usesData has countInGLA = false
                        const use = window.usesData?.[floor.usage];
                        const isCountedInGLA = use?.countInGLA !== false;
                        
                        // If usage is NOT counted in GLA, netArea = 0
                        floor.netArea = isCountedInGLA ? (floor.calculatedArea - floor.serviceArea) : 0;
                        
                        window.floorsData = floorsData; // Update global reference
                        updateFloorsDisplay();
                updateAllSummaries();
                    } else {
                        alert(currentLanguage === 'ar' ? 'يرجى إدخال نسبة خدمات بين 0-100%' : 'Please enter service percentage between 0-100%');
                        updateFloorsDisplay(); // Restore original value
                    }
                }
            }
            
            // 🆕 Update floor repeat count
            function updateFloorRepeatCount(floorId, newRepeatCount) {
                const floor = floorsData.find(f => f.id === floorId);
                if (floor) {
                    const repeatCount = parseInt(newRepeatCount);
                    if (repeatCount >= 1 && repeatCount <= 999) {
                        floor.repeatCount = repeatCount;
                        window.floorsData = floorsData;
                        updateFloorsDisplay();
                updateAllSummaries();
                    } else {
                        alert(currentLanguage === 'ar' ? 'يرجى إدخال عدد صحيح بين 1-999' : 'Please enter a valid number between 1-999');
                        updateFloorsDisplay();
                updateAllSummaries();
                    }
                }
            }

            function updateFloorUsage(floorId, newUsage) {
                const floor = floorsData.find(f => f.id === floorId);
                if (!floor) return;
                
                floor.usage = newUsage;
                
                // 🔹 Recalculate netArea based on usage card's countInGLA setting
                const use = window.usesData?.[newUsage];
                const isCountedInGLA = use?.countInGLA !== false;
                
                // Recalculate areas
                floor.serviceArea = floor.calculatedArea * (floor.servicePercentage / 100);
                floor.netArea = isCountedInGLA ? (floor.calculatedArea - floor.serviceArea) : 0;
                
                console.log('🔄 Floor ' + floor.number + ' usage changed to ' + newUsage);
                console.log('   - countInGLA: ' + isCountedInGLA);
                console.log('   - netArea: ' + floor.netArea.toFixed(0) + ' م²');
                
                window.floorsData = floorsData; // Update global reference
                updateFloorsDisplay();
                updateAllSummaries();
            }

            function getUsageOptions(currentUsage) {
                const isArabic = currentLanguage === 'ar';
                const allTypes = getAllUsageTypes();

                let options = '';
                allTypes.forEach(type => {
                    const text = isArabic ? type.nameAr : type.nameEn;
                    const icon = type.icon || '';
                    const selected = type.id === currentUsage ? 'selected' : '';
                    options += \`<option value="\${type.id}" \${selected}>\${icon} \${text}\${type.isCustom ? ' ⭐' : ''}</option>\`;
                });

                return options;
            }

            function calculateFloorAreaForFloor(floor) {
                let referenceArea = 0;
                
                if (floor.reference === 'landArea') {
                    referenceArea = parseFloat(document.getElementById('landArea').value) || 10000;
                } else {
                    // Reference is another floor
                    const referenceFloor = floorsData.find(f => f.id === parseInt(floor.reference));
                    if (referenceFloor) {
                        referenceArea = referenceFloor.calculatedArea;
                    }
                }

                floor.calculatedArea = (referenceArea * floor.percentage) / 100;
                floor.serviceArea = floor.calculatedArea * (floor.servicePercentage / 100);
                
                // 🔹 Check if usage in usesData has countInGLA = false
                const use = window.usesData?.[floor.usage];
                const isCountedInGLA = use?.countInGLA !== false;
                
                // If usage is NOT counted in GLA, netArea = 0
                floor.netArea = isCountedInGLA ? (floor.calculatedArea - floor.serviceArea) : 0;
            }

            function getReferenceOptions(currentFloorId) {
                const isArabic = currentLanguage === 'ar';
                let options = \`<option value="landArea">\${isArabic ? 'مساحة الأرض' : 'Land Area'}</option>\`;
                
                // Add other floors as reference options
                floorsData.forEach(floor => {
                    if (floor.id !== currentFloorId) {
                        options += \`<option value="\${floor.id}">\${isArabic ? 'الدور' : 'Floor'} \${floor.number}</option>\`;
                    }
                });
                
                return options;
            }

            function updateFloorsDisplay() {
                const tbody = document.getElementById('floorsTableBody');
                tbody.innerHTML = '';

                floorsData.forEach(floor => {
                    const row = createFloorRow(floor);
                    tbody.appendChild(row);
                });
            }
            
            // Make updateFloorsDisplay globally accessible for uses system integration
            window.updateFloorsDisplay = updateFloorsDisplay;

            function createFloorRow(floor) {
                const row = document.createElement('tr');
                // 🆕 Use countInFAR instead of enabled
                const isCountedInFAR = floor.countInFAR !== undefined ? floor.countInFAR : (floor.enabled !== undefined ? floor.enabled : true);
                const repeatCount = floor.repeatCount || 1;
                row.className = isCountedInFAR ? 'bg-white floor-row hover:bg-white/8/30 transition-colors' : 'bg-white/8 opacity-70 floor-row hover:bg-white/10 transition-colors';

                const floorIndex = floorsData.findIndex(f => f.id === floor.id);
                const referenceOptions = getReferenceOptions(floor.id);
                const usageOptions = getUsageOptions(floor.usage);
                
                // Get usage type for styling
                const usageType = getUsageType(floor.usage);
                
                row.innerHTML = \`
                    <td class="border border-white/20 px-1 py-0.5">
                        <input type="text" 
                            value="\${floor.number}" 
                            onchange="updateFloorName(\${floor.id}, this.value)"
                            onblur="updateFloorName(\${floor.id}, this.value)"
                            class="editable-input w-full text-center text-sm border-0 bg-transparent rounded px-2 py-0.5 font-bold hover:bg-white/5 backdrop-filter backdrop-blur-sm/8 focus:bg-white/10 transition-colors"
                            style="min-width: 70px;" placeholder="اسم الدور">
                    </td>
                    <td class="border border-white/20 px-1 py-0.5">
                        <select onchange="updateFloorUsage(\${floor.id}, this.value)"
                            class="editable-input w-full text-sm border-0 bg-transparent rounded px-1 py-0.5 font-medium hover:bg-white/5 backdrop-filter backdrop-blur-sm/8 focus:bg-white/10 transition-colors cursor-pointer"
                            style="min-width: 120px;">
                            \${usageOptions}
                        </select>
                    </td>
                    <td class="border border-white/20 px-1 py-0.5">
                        <select onchange="updateFloorReference(\${floor.id}, this.value)"
                            class="editable-input w-full text-xs border-0 bg-transparent rounded px-1 py-0.5 hover:bg-white/5 backdrop-filter backdrop-blur-sm/5 transition-colors cursor-pointer"
                            style="min-width: 100px;">
                            \${referenceOptions}
                        </select>
                    </td>
                    <td class="border border-white/20 px-1 py-0.5">
                        <input type="number" 
                            value="\${floor.percentage.toFixed(1)}" 
                            onchange="updateFloorPercentage(\${floor.id}, this.value)"
                            onblur="updateFloorPercentage(\${floor.id}, this.value)"
                            class="editable-input w-full text-center text-sm border-0 bg-transparent rounded px-1 py-0.5 font-semibold hover:bg-amber-500/20 focus:bg-amber-500/25 transition-colors"
                            style="min-width: 60px;" step="0.1" min="0" max="1000" placeholder="%">
                    </td>
                    <td class="border border-white/20 px-1 py-0.5">
                        <input type="number" 
                            value="\${floor.servicePercentage.toFixed(1)}" 
                            onchange="updateFloorServicePercentage(\${floor.id}, this.value)"
                            onblur="updateFloorServicePercentage(\${floor.id}, this.value)"
                            class="editable-input w-full text-center text-sm border-0 bg-transparent rounded px-1 py-0.5 font-semibold hover:bg-orange-500/20 focus:bg-orange-500/25 transition-colors"
                            style="min-width: 60px;" step="0.1" min="0" max="100" placeholder="%">
                    </td>
                    <td class="border border-white/20 px-1 py-0.5 bg-white/5 backdrop-filter backdrop-blur-sm/8/50">
                        <input type="number" 
                            value="\${repeatCount}" 
                            onchange="updateFloorRepeatCount(\${floor.id}, this.value)"
                            onblur="updateFloorRepeatCount(\${floor.id}, this.value)"
                            class="editable-input w-full text-center text-sm border-0 bg-transparent rounded px-1 py-0.5 font-bold text-white/90 hover:bg-white/5 backdrop-filter backdrop-blur-sm/8 focus:bg-white/10 transition-colors"
                            style="min-width: 50px;" step="1" min="1" max="999" placeholder="#" title="عدد تكرار الدور">
                    </td>
                    <td class="border border-white/20 px-2 py-0.5 text-center text-sm calculated-field bg-white/5 backdrop-filter backdrop-blur-sm/8/30 font-semibold text-white/90">\${(floor.calculatedArea * repeatCount).toLocaleString('en-US')} م²</td>
                    <td class="border border-white/20 px-2 py-0.5 text-center text-sm calculated-field bg-white/5 backdrop-filter backdrop-blur-sm/8/30 font-semibold text-white/90">\${(floor.netArea * repeatCount).toLocaleString('en-US')} م²</td>
                    <td class="border border-white/20 px-2 py-0.5 text-center text-sm calculated-field bg-orange-500/20/30 font-semibold text-orange-200">\${(floor.serviceArea * repeatCount).toLocaleString('en-US')} م²</td>
                    <td class="border border-white/20 px-1 py-0.5 text-center bg-white/5 backdrop-filter backdrop-blur-sm/8/50">
                        <div class="flex justify-center gap-0.5 items-center">
                            <button onclick="moveFloorUp(\${floor.id})" 
                                class="px-1.5 py-0.5 bg-gray-700 text-white hover:bg-gray-800 rounded text-sm font-bold transition-all shadow-sm \${floorIndex === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:shadow'}"
                                \${floorIndex === 0 ? 'disabled' : ''} title="\${currentLanguage === 'ar' ? 'رفع للأعلى ↑' : 'Move Up ↑'}">
                                ↑
                            </button>
                            <button onclick="moveFloorDown(\${floor.id})" 
                                class="px-1.5 py-0.5 bg-gray-700 text-white hover:bg-gray-800 rounded text-sm font-bold transition-all shadow-sm \${floorIndex === floorsData.length - 1 ? 'opacity-40 cursor-not-allowed' : 'hover:shadow'}"
                                \${floorIndex === floorsData.length - 1 ? 'disabled' : ''} title="\${currentLanguage === 'ar' ? 'خفض للأسفل ↓' : 'Move Down ↓'}">
                                ↓
                            </button>
                        </div>
                    </td>
                    <td class="border border-white/20 px-1 py-0.5 text-center bg-white/5 backdrop-filter backdrop-blur-sm/5">
                        <div class="flex justify-center gap-0.5 items-center" style="white-space: nowrap;">
                            <button onclick="duplicateFloor(\${floor.id})" 
                                class="px-1.5 py-0.5 bg-gray-700 text-white hover:bg-gray-800 rounded text-sm transition-all shadow-sm hover:shadow"
                                title="\${currentLanguage === 'ar' ? '📋 نسخ' : '📋 Copy'}">
                                📋
                            </button>
                            <button onclick="toggleCountInFAR(\${floor.id})" 
                                class="px-1.5 py-0.5 rounded text-sm transition-all shadow-sm hover:shadow \${isCountedInFAR ? 'bg-gray-700 text-white hover:bg-gray-700' : 'bg-gray-400 text-white hover:bg-white/5 backdrop-filter backdrop-blur-sm/50'}"
                                title="\${isCountedInFAR ? (currentLanguage === 'ar' ? '✅ محسوب في FAR' : '✅ In FAR') : (currentLanguage === 'ar' ? '❌ غير محسوب في FAR' : '❌ Not in FAR')}">
                                \${isCountedInFAR ? '✅' : '❌'}
                            </button>
                            <button onclick="deleteFloor(\${floor.id})" 
                                class="px-1.5 py-0.5 bg-red-1000 text-white hover:bg-red-600 rounded text-sm transition-all shadow-sm hover:shadow"
                                title="\${currentLanguage === 'ar' ? '🗑️ حذف' : '🗑️ Delete'}">
                                🗑️
                            </button>
                        </div>
                    </td>
                \`;

                // Set the selected values for dropdowns after innerHTML is set
                setTimeout(() => {
                    const selectElements = row.querySelectorAll('select');
                    if (selectElements.length >= 1) {
                        // Usage dropdown (first select)
                        selectElements[0].value = floor.usage;
                    }
                    if (selectElements.length >= 2) {
                        // Reference dropdown (second select)
                        selectElements[1].value = floor.reference;
                    }
                }, 0);

                return row;
            }

            function getUsageText(usage) {
                const isArabic = currentLanguage === 'ar';
                const usageType = getUsageType(usage);
                const text = isArabic ? usageType.nameAr : usageType.nameEn;
                return (usageType.icon || '') + ' ' + text;
            }

            function getReferenceText(reference) {
                const isArabic = currentLanguage === 'ar';
                
                if (reference === 'landArea') {
                    return isArabic ? 'مساحة الأرض' : 'Land Area';
                }
                
                // Check if reference is another floor
                const referenceFloor = floorsData.find(f => f.id === parseInt(reference));
                if (referenceFloor) {
                    return (isArabic ? 'الدور ' : 'Floor ') + referenceFloor.number;
                }
                
                return reference;
            }

            // loadSampleFloors() removed - no default floors

            function resetFloors() {
                const isArabic = currentLanguage === 'ar';
                const confirmMessage = isArabic ? 
                    'هل تريد إعادة تعيين جميع الأدوار؟' : 
                    'Are you sure you want to reset all floors?';
                    
                if (confirm(confirmMessage)) {
                    floorsData = [];
                    floorIdCounter = 1;
                    window.floorsData = floorsData; // Update global reference
                    localStorage.removeItem('floorsData'); // Clear saved data
                    updateFloorsDisplay();
                    updateAllSummaries();
                }
            }

            // =====================================================
            // 📊 COMPREHENSIVE SUMMARIES FUNCTIONS
            // =====================================================

            function updateAllSummaries() {
                // 🔄 Update usage management calculations from floors data
                if (typeof window.updateUsesCalculations === 'function') {
                    window.updateUsesCalculations();
                }
                
                // updateUsageEfficiencySummary() تم حذفها - البيانات الآن في بطاقات الاستخدامات
                updateFARAnalysis();
                updateUsagePieChart();
                updateUsageRadarChart();
                
                // 🔄 Update FAR in project info automatically
                updateProjectInfoFAR();
            }

            // 1️⃣ Usage Efficiency Summary
            // 2️⃣ FAR Analysis (دالة updateUsageEfficiencySummary تم حذفها - الآن البيانات تظهر في بطاقات الاستخدامات مباشرة)
            function updateFARAnalysis() {
                const container = document.getElementById('farAnalysisContent');
                if (!container) return;

                const countedFloors = floorsData.filter(f => {
                    const countInFAR = f.countInFAR !== undefined ? f.countInFAR : true;
                    return countInFAR;
                });

                const landArea = parseFloat(document.getElementById('landArea')?.value) || 10000;
                
                // 🔹 Read allowed FAR from manual input field (independent from project info)
                let allowedFAR = parseFloat(document.getElementById('manualAllowedFAR')?.value);
                
                // If manual input is empty, try to load from localStorage
                if (!allowedFAR || isNaN(allowedFAR)) {
                    const savedFAR = localStorage.getItem('manualAllowedFAR');
                    if (savedFAR) {
                        allowedFAR = parseFloat(savedFAR);
                        // Update input field with saved value
                        const inputField = document.getElementById('manualAllowedFAR');
                        if (inputField) inputField.value = allowedFAR;
                    } else {
                        // Default value if nothing is saved
                        allowedFAR = 3.5;
                    }
                } else {
                    // Save the manual input value to localStorage
                    localStorage.setItem('manualAllowedFAR', allowedFAR.toString());
                }

                const totalBuiltArea = countedFloors.reduce((sum, f) => {
                    const repeat = f.repeatCount || 1;
                    return sum + (f.calculatedArea * repeat);
                }, 0);

                const actualFARValue = landArea > 0 ? (totalBuiltArea / landArea) : 0;
                const actualFAR = actualFARValue.toFixed(2);
                const farUtilization = allowedFAR > 0 ? ((actualFARValue / allowedFAR) * 100).toFixed(1) : 0;
                const totalFloorsCount = countedFloors.reduce((sum, f) => sum + (f.repeatCount || 1), 0);
                
                // 💾 Save FAR values and floors count to window for export
                window.calculatedActualFAR = actualFARValue;  // Save as number, not string
                window.calculatedAllowedFAR = allowedFAR;
                window.calculatedFloorsCount = totalFloorsCount;  // Save floors count with repeats
                console.log('✅ Saved to window: actualFAR =', actualFARValue, '(', actualFAR, '), allowedFAR =', allowedFAR, ', floorsCount =', totalFloorsCount);

                let barColor = 'bg-gray-400';
                let statusText = 'ضمن الحدود';
                let statusIcon = '✅';

                if (farUtilization > 100) {
                    barColor = 'bg-red-400';
                    statusText = 'تجاوز الحد المسموح';
                    statusIcon = '⚠️';
                } else if (farUtilization > 90) {
                    barColor = 'bg-yellow-400';
                    statusText = 'قريب من الحد';
                    statusIcon = '⚡';
                }

                const farColorClass = parseFloat(actualFAR) > allowedFAR ? 'text-red-300' : 'text-gray-300';
                const progressWidth = Math.min(farUtilization, 100);

                let html = '<div class="space-y-4">';
                html += '<div class="grid grid-cols-2 gap-4">';
                html += '<div class="bg-white/5 backdrop-filter backdrop-blur-sm/10 rounded-lg p-4">';
                html += '<div class="text-white/70 text-sm mb-2">معامل البناء المسموح</div>';
                html += '<div class="text-3xl font-bold">' + allowedFAR + '</div>';
                html += '</div>';
                html += '<div class="bg-white/5 backdrop-filter backdrop-blur-sm/10 rounded-lg p-4">';
                html += '<div class="text-white/70 text-sm mb-2">معامل البناء الفعلي</div>';
                html += '<div class="text-3xl font-bold ' + farColorClass + '">' + actualFAR + '</div>';
                html += '</div>';
                html += '</div>';
                html += '<div class="bg-white/5 backdrop-filter backdrop-blur-sm/10 rounded-lg p-4">';
                html += '<div class="text-white/70 text-sm mb-2">نسبة الاستخدام</div>';
                html += '<div class="flex items-center justify-between mb-2">';
                html += '<span class="text-2xl font-bold">' + farUtilization + '%</span>';
                html += '<span class="text-sm bg-white/5 backdrop-filter backdrop-blur-sm/20 px-3 py-1 rounded-full">' + statusIcon + ' ' + statusText + '</span>';
                html += '</div>';
                html += '<div class="w-full bg-white/5 backdrop-filter backdrop-blur-sm/20 rounded-full h-4 overflow-hidden">';
                html += '<div class="' + barColor + ' h-4 rounded-full transition-all duration-500" style="width: ' + progressWidth + '%"></div>';
                html += '</div>';
                html += '</div>';
                html += '<div class="grid grid-cols-2 gap-4">';
                html += '<div class="bg-white/5 backdrop-filter backdrop-blur-sm/10 rounded-lg p-4">';
                html += '<div class="text-white/70 text-sm mb-2">إجمالي المساحة المبنية</div>';
                html += '<div class="text-xl font-bold">' + Math.round(totalBuiltArea).toLocaleString('en-US') + ' م²</div>';
                html += '</div>';
                html += '<div class="bg-white/5 backdrop-filter backdrop-blur-sm/10 rounded-lg p-4">';
                html += '<div class="text-white/70 text-sm mb-2">عدد الأدوار المحسوبة</div>';
                html += '<div class="text-xl font-bold">' + totalFloorsCount + ' دور</div>';
                html += '</div>';
                html += '</div>';
                html += '<div class="bg-white/5 backdrop-filter backdrop-blur-sm/10 rounded-lg p-4">';
                html += '<div class="text-white/70 text-sm mb-2">مساحة الأرض</div>';
                html += '<div class="text-xl font-bold">' + landArea.toLocaleString('en-US') + ' م²</div>';
                html += '</div>';
                html += '</div>';

                container.innerHTML = html;
            }

            // 🔄 Update FAR in Project Info automatically from actual FAR
            function updateProjectInfoFAR() {
                const farInput = document.getElementById('far');
                if (!farInput) return;
                
                // Get actual FAR from window (calculated in updateFARAnalysis)
                const actualFAR = window.calculatedActualFAR;
                
                if (actualFAR !== undefined && actualFAR !== null) {
                    // Round to 2 decimal places
                    const roundedFAR = Math.round(actualFAR * 100) / 100;
                    
                    // Update the input field
                    farInput.value = roundedFAR.toFixed(1);
                    
                    console.log('🔄 [updateProjectInfoFAR] معامل البناء (FAR) محدّث تلقائياً:', roundedFAR);
                }
            }

            // 3️⃣ Pie Chart: Usage Distribution
            function updateUsagePieChart() {
                const canvas = document.getElementById('usageDistributionPieChart');
                if (!canvas) return;

                const countedFloors = floorsData.filter(f => {
                    const countInFAR = f.countInFAR !== undefined ? f.countInFAR : true;
                    return countInFAR;
                });

                const usageData = {};
                countedFloors.forEach(floor => {
                    const usageType = getUsageType(floor.usage);
                    const usageId = floor.usage;
                    const repeat = floor.repeatCount || 1;
                    const area = floor.calculatedArea * repeat;

                    if (!usageData[usageId]) {
                        usageData[usageId] = {
                            name: currentLanguage === 'ar' ? usageType.nameAr : usageType.nameEn,
                            icon: usageType.icon,
                            color: usageType.color,
                            area: 0
                        };
                    }
                    usageData[usageId].area += area;
                });

                const labels = Object.values(usageData).map(u => u.icon + ' ' + u.name);
                const data = Object.values(usageData).map(u => u.area);
                const colors = Object.values(usageData).map(u => u.color);

                if (usagePieChart) {
                    usagePieChart.destroy();
                }

                usagePieChart = new Chart(canvas, {
                    type: 'pie',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: data,
                            backgroundColor: colors,
                            borderWidth: 2,
                            borderColor: '#fff'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    font: { size: 11 },
                                    padding: 10
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const label = context.label || '';
                                        const value = context.parsed;
                                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                        const percentage = ((value / total) * 100).toFixed(1);
                                        return label + ': ' + value.toLocaleString('en-US') + ' م² (' + percentage + '%)';
                                    }
                                }
                            }
                        }
                    }
                });
            }

            // 4️⃣ Radar Chart: Usage Analysis
            function updateUsageRadarChart() {
                const canvas = document.getElementById('usageRadarChart');
                if (!canvas) return;

                const countedFloors = floorsData.filter(f => {
                    const countInFAR = f.countInFAR !== undefined ? f.countInFAR : true;
                    return countInFAR;
                });

                const usageData = {};
                countedFloors.forEach(floor => {
                    const usageType = getUsageType(floor.usage);
                    const usageId = floor.usage;
                    const repeat = floor.repeatCount || 1;

                    if (!usageData[usageId]) {
                        usageData[usageId] = {
                            name: currentLanguage === 'ar' ? usageType.nameAr : usageType.nameEn,
                            icon: usageType.icon,
                            gfa: 0,
                            gla: 0,
                            efficiency: 0,
                            floors: 0
                        };
                    }

                    usageData[usageId].gfa += floor.calculatedArea * repeat;
                    usageData[usageId].gla += floor.netArea * repeat;
                    usageData[usageId].floors += repeat;
                });

                // Calculate efficiency for each usage
                Object.keys(usageData).forEach(key => {
                    const usage = usageData[key];
                    usage.efficiency = usage.gfa > 0 ? ((usage.gla / usage.gfa) * 100) : 0;
                });

                const labels = Object.values(usageData).map(u => u.icon + ' ' + u.name);
                const gfaData = Object.values(usageData).map(u => u.gfa);
                const glaData = Object.values(usageData).map(u => u.gla);

                // Normalize data for radar chart (0-100 scale)
                const maxGFA = Math.max(...gfaData);
                const normalizedGFA = gfaData.map(v => (v / maxGFA) * 100);
                const normalizedGLA = glaData.map(v => (v / maxGFA) * 100);

                if (usageRadarChart) {
                    usageRadarChart.destroy();
                }

                usageRadarChart = new Chart(canvas, {
                    type: 'radar',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'GFA (المساحة الإجمالية)',
                                data: normalizedGFA,
                                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                borderColor: 'rgba(59, 130, 246, 1)',
                                borderWidth: 2,
                                pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                                pointBorderColor: '#fff',
                                pointHoverBackgroundColor: '#fff',
                                pointHoverBorderColor: 'rgba(59, 130, 246, 1)'
                            },
                            {
                                label: 'GLA (المساحة الصافية)',
                                data: normalizedGLA,
                                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                                borderColor: 'rgba(16, 185, 129, 1)',
                                borderWidth: 2,
                                pointBackgroundColor: 'rgba(16, 185, 129, 1)',
                                pointBorderColor: '#fff',
                                pointHoverBackgroundColor: '#fff',
                                pointHoverBorderColor: 'rgba(16, 185, 129, 1)'
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            r: {
                                beginAtZero: true,
                                max: 100,
                                ticks: {
                                    stepSize: 20,
                                    callback: function(value) {
                                        return value + '%';
                                    }
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    font: { size: 11 },
                                    padding: 10
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const index = context.dataIndex;
                                        const usage = Object.values(usageData)[index];
                                        const datasetLabel = context.dataset.label;
                                        const actualValue = context.dataset.label.includes('GFA') ? 
                                            usage.gfa : usage.gla;
                                        return datasetLabel + ': ' + Math.round(actualValue).toLocaleString('en-US') + ' م²';
                                    }
                                }
                            }
                        }
                    }
                });
            }

            // Update floors translations when language changes
            function updateFloorsTranslations() {
                const isArabic = currentLanguage === 'ar';
                const t = translations[isArabic ? 'ar' : 'en'];

                // Update all text elements
                document.getElementById('floorsManagementTitle').textContent = t.floorsManagement;
                document.getElementById('landAreaLabel').textContent = t.landArea + ':';
                document.getElementById('allowedFARLabel').textContent = t.allowedFAR + ':';
                document.getElementById('addFloorText').textContent = t.addFloor;
                document.getElementById('resetFloorsText').textContent = t.reset;
                document.getElementById('addNewFloorTitle').textContent = t.addNewFloor;
                
                // Update form labels
                document.getElementById('floorNumberLabel').textContent = t.floorNumber;
                document.getElementById('floorUsageLabel').textContent = t.floorUsage;
                document.getElementById('floorReferenceLabel').textContent = t.floorReference;
                document.getElementById('floorPercentageLabel').textContent = t.floorPercentage;
                document.getElementById('calculatedAreaLabel').textContent = t.calculatedArea + ' (م²)';
                
                // Update form labels
                document.getElementById('servicePercentageLabel').textContent = t.servicePercentage;

                // Update table headers
                document.getElementById('floorNumberHeader').textContent = t.floorNumber;
                document.getElementById('floorUsageHeader').textContent = t.floorUsage;
                document.getElementById('floorReferenceHeader').textContent = t.floorReference;
                document.getElementById('floorPercentageHeader').textContent = t.floorPercentage;
                document.getElementById('servicePercentageHeader').textContent = t.servicePercentage;
                document.getElementById('calculatedAreaHeader').textContent = t.calculatedArea;
                document.getElementById('netAreaHeader').textContent = t.netArea;
                document.getElementById('serviceAreaHeader').textContent = t.serviceArea;
                document.getElementById('floorOrderHeader').textContent = t.floorOrder;
                document.getElementById('floorActionsHeader').textContent = t.floorActions;
                
                // Update summary titles
                document.getElementById('usageDistributionTitle').textContent = t.usageDistribution;
                document.getElementById('efficiencySummaryTitle').textContent = t.efficiencySummary;
                document.getElementById('farAnalysisTitle').textContent = t.farAnalysis;
                
                // Update summary labels
                document.getElementById('averageEfficiencyLabel').textContent = t.averageEfficiency + ':';
                document.getElementById('totalNetAreaLabel').textContent = t.totalNetArea + ':';
                document.getElementById('totalServiceAreaLabel').textContent = t.totalServiceArea + ':';
                document.getElementById('allowedFARSummaryLabel').textContent = t.allowedFAR + ':';
                document.getElementById('usedFARLabel').textContent = t.usedFAR + ':';
                document.getElementById('farUsagePercentageLabel').textContent = t.farUsagePercentage;
                
                // Update enhanced efficiency summary labels
                if (document.getElementById('usageEfficiencyBreakdownLabel')) {
                    document.getElementById('usageEfficiencyBreakdownLabel').textContent = t.usageEfficiencyBreakdown + ':';
                }
                if (document.getElementById('retailEfficiencyLabel')) {
                    document.getElementById('retailEfficiencyLabel').textContent = t.retailEfficiency + ':';
                }
                if (document.getElementById('hotelEfficiencyLabel')) {
                    document.getElementById('hotelEfficiencyLabel').textContent = t.hotelEfficiency + ':';
                }
                if (document.getElementById('residentialEfficiencyLabel')) {
                    document.getElementById('residentialEfficiencyLabel').textContent = t.residentialEfficiency + ':';
                }
                if (document.getElementById('officeEfficiencyLabel')) {
                    document.getElementById('officeEfficiencyLabel').textContent = t.officeEfficiency + ':';
                }
                
                // Update options
                document.getElementById('parkingOption').textContent = t.parking;
                document.getElementById('servicesOption').textContent = t.services;
                document.getElementById('receptionOption').textContent = t.reception;
                document.getElementById('hotelOption').textContent = t.hotel;
                document.getElementById('retailOption').textContent = t.retail;
                document.getElementById('officeOption').textContent = t.office;
                document.getElementById('residentialOption').textContent = t.residential;
                document.getElementById('landAreaOption').textContent = t.landArea;
                
                // Update buttons
                document.getElementById('saveFloorText').textContent = currentLanguage === 'ar' ? 'حفظ' : 'Save';
                document.getElementById('cancelFloorText').textContent = currentLanguage === 'ar' ? 'إلغاء' : 'Cancel';
                
                // Update editable table notice
                document.getElementById('editableTableNotice').textContent = t.editableTableNotice;
                document.getElementById('editableTableInstructions').textContent = t.editableTableInstructions;
                
                // Refresh table display with new language
                updateFloorsDisplay();
                updateAllSummaries();
                
                // Update Component 7 translations
                updateInvestmentFinancingTranslations();
            }

            // Component 7 Translation Updates
            function updateInvestmentFinancingTranslations() {
                const isArabic = currentLanguage === 'ar';
                const t = translations[isArabic ? 'ar' : 'en'];

                // Update main titles
                if (document.getElementById('investmentFinancingTitle')) {
                    document.getElementById('investmentFinancingTitle').textContent = t.investmentFinancing;
                }

                // Update section titles
                if (document.getElementById('landAcquisitionTitle')) {
                    document.getElementById('landAcquisitionTitle').textContent = t.landAcquisition;
                }
                if (document.getElementById('financingStructureTitle')) {
                    document.getElementById('financingStructureTitle').textContent = t.financingStructure;
                }
                if (document.getElementById('investmentParametersTitle')) {
                    document.getElementById('investmentParametersTitle').textContent = t.investmentParameters;
                }

                if (document.getElementById('integrationSummaryTitle')) {
                    document.getElementById('integrationSummaryTitle').textContent = 'ملخص التكامل';
                }

                // Update land acquisition options
                if (document.getElementById('landPurchaseTitle')) {
                    document.getElementById('landPurchaseTitle').textContent = t.landPurchase;
                }
                if (document.getElementById('landLeaseTitle')) {
                    document.getElementById('landLeaseTitle').textContent = t.landLease;
                }
                if (document.getElementById('landPartnershipTitle')) {
                    document.getElementById('landPartnershipTitle').textContent = t.landPartnership;
                }

                // Update financing options
                if (document.getElementById('islamicFinancingTitle')) {
                    document.getElementById('islamicFinancingTitle').textContent = t.islamicFinancing;
                }
                if (document.getElementById('conventionalFinancingTitle')) {
                    document.getElementById('conventionalFinancingTitle').textContent = t.conventionalFinancing;
                }

                // Update investment parameter labels
                if (document.getElementById('equityRatioLabel')) {
                    document.getElementById('equityRatioLabel').textContent = t.equityRatio;
                }
                if (document.getElementById('interestRateLabel')) {
                    document.getElementById('interestRateLabel').textContent = t.interestRate;
                }
                if (document.getElementById('financingTermLabel')) {
                    document.getElementById('financingTermLabel').textContent = t.financingTerm;
                }
                if (document.getElementById('constructionPeriodLabel')) {
                    document.getElementById('constructionPeriodLabel').textContent = t.constructionPeriod;
                }
                if (document.getElementById('operatingPeriodLabel')) {
                    document.getElementById('operatingPeriodLabel').textContent = t.operatingPeriod;
                }

                // Update KPI labels
                if (document.getElementById('npvLabel')) {
                    document.getElementById('npvLabel').textContent = t.npv;
                }
                if (document.getElementById('irrLabel')) {
                    document.getElementById('irrLabel').textContent = t.irr;
                }
                if (document.getElementById('paybackLabel')) {
                    document.getElementById('paybackLabel').textContent = t.paybackPeriod;
                }
                if (document.getElementById('dscrLabel')) {
                    document.getElementById('dscrLabel').textContent = t.dscr;
                }
                if (document.getElementById('roiLabel')) {
                    document.getElementById('roiLabel').textContent = t.roi;
                }
                if (document.getElementById('moicLabel')) {
                    document.getElementById('moicLabel').textContent = t.moic;
                }

                // Update cash flow labels
                if (document.getElementById('initialInvestmentLabel')) {
                    document.getElementById('initialInvestmentLabel').textContent = t.initialInvestment;
                }
                if (document.getElementById('annualCashFlowLabel')) {
                    document.getElementById('annualCashFlowLabel').textContent = t.annualCashFlow;
                }
                if (document.getElementById('terminalValueLabel')) {
                    document.getElementById('terminalValueLabel').textContent = t.terminalValue;
                }

                // Update integration labels
                if (document.getElementById('landAreaIntegrationLabel')) {
                    document.getElementById('landAreaIntegrationLabel').textContent = 'مساحة الأرض من المكون 1';
                }
                if (document.getElementById('constructionCostIntegrationLabel')) {
                    document.getElementById('constructionCostIntegrationLabel').textContent = 'تكلفة البناء من المكونات 2-4';
                }
                if (document.getElementById('revenueIntegrationLabel')) {
                    document.getElementById('revenueIntegrationLabel').textContent = 'الإيرادات من المكونات 5-6';
                }
                if (document.getElementById('totalProjectCostLabel')) {
                    document.getElementById('totalProjectCostLabel').textContent = 'إجمالي تكلفة المشروع';
                }
            }

            // Component 7: Investment, Financing & Land Costs JavaScript
            
            // Global variables for Component 7
            // 🔄 RESET ALL INVESTMENT DATA for step-by-step modification
            let investmentData = {
                landAcquisition: {
                    mode: 'purchase', // purchase, lease, partnership
                    purchasePrice: 1500, // SAR per sqm
                    annualRent: 150, // SAR per sqm per year
                    leaseTerm: 25, // years
                    rentIncreasePercentage: 5, // percentage increase
                    rentIncreaseFrequency: 3, // years between increases
                    partnershipShare: 50, // percentage of profits/revenue for partner
                    autoCalculateProfitShare: true, // auto calculate profit share based on capital contribution
                    partnerContribution: 'land', // land, cash, both
                    landValuePerSqm: 2000, // SAR per sqm (for partnership valuation)
                    partnerCashContribution: 0, // SAR (when contribution is cash or both)
                    developerCashContribution: 0, // SAR (developer's cash input)
                    profitSharingModel: 'revenue', // revenue, profit, hybrid
                    hybridRevenueWeight: 50, // percentage weight for revenue in hybrid model (default 50%)
                    hybridProfitWeight: 50, // percentage weight for profit in hybrid model (default 50%)
                    managementFeePercentage: 5, // percentage for developer management fee
                    partners: [] // array of additional partners {name, type, landArea, cashAmount, share}
                },
                financing: {
                    equityRatio: 30, // percentage
                    debtRatio: 70, // percentage
                    interestRate: 5.5, // percentage
                    financingTerm: 15, // years
                    constructionPeriod: 3, // years
                    operatingPeriod: 20 // years
                },
                // NEW: Debt Service parameters
                debtFinancing: {
                    enabled: false, // toggle debt financing on/off
                    loanAmount: 50000000, // SAR - total loan amount
                    interestRate: 5.5, // percentage - annual interest rate
                    loanPeriod: 15, // years - loan term
                    amortizationType: 'annuity', // 'annuity' (fixed payment) or 'linear' (decreasing payment)
                    loanStartYear: 1, // year when loan starts
                    gracePeriod: 0, // years - grace period length
                    gracePeriodType: 'none', // 'none', 'interest-only', 'full'
                    schedule: [] // calculated debt service schedule
                },
                // NEW: Capital Expenditure (CAPEX) structure
                capitalExpenditure: {
                    // Land Acquisition
                    landCost: 0, // SAR - total land cost (calculated from landAcquisition)
                    landPaymentYear: 0, // year when land is purchased (typically year 0)
                    
                    // Construction Costs
                    totalConstructionCost: 0, // SAR - from integration.constructionCost
                    constructionSchedule: [], // يتم حسابه ديناميكياً بناءً على constructionPeriod
                    
                    // Financing
                    loanAmount: 0, // SAR - from debtFinancing.loanAmount
                    loanDisbursementYear: 0, // year when loan is received (typically year 0)
                    
                    // Totals
                    totalCapitalRequired: 0, // landCost + totalConstructionCost
                    equityRequired: 0, // totalCapitalRequired - loanAmount
                    
                    // Flags
                    calculated: false // indicates if CAPEX has been calculated
                },
                // NEW: Discounting parameters for WACC calculation
                discounting: {
                    costOfEquity: 12.0, // percentage - required return on equity
                    costOfDebt: 5.5, // percentage - synced with interestRate
                    taxRate: 0, // percentage - corporate tax rate (0% in Saudi currently)
                    calculatedWACC: 7.5 // percentage - weighted average cost of capital
                },
                // NEW: Exit strategy parameters
                exit: {
                    strategy: 'sell', // sell, hold, refinance
                    year: 10, // exit year
                    method: 'capRate', // capRate, multiple, appraisal, gordon
                    expectedNOI: 10000000, // SAR - expected NOI at exit year (user input until OPEX integration)
                    capRate: 6.5, // percentage
                    multiple: 12, // NOI multiple
                    appraisal: 150000000, // SAR - direct appraisal value
                    gordonGrowthRate: 2.5, // percentage - perpetual growth rate
                    sellingCosts: 2.0, // percentage - transaction costs
                    calculatedValue: 0 // SAR - calculated exit value
                },
                // NEW: Growth and assumptions parameters
                assumptions: {
                    inflationEnabled: true,
                    inflationRate: 2.5, // percentage - applies to OPEX
                    revenueGrowthEnabled: true,
                    revenueGrowthRate: 3.0, // percentage - annual revenue growth
                    revenueGrowthMethod: 'compound', // compound or simple
                    occupancyRampUpEnabled: true,
                    stabilizedOccupancy: 90, // percentage
                    occupancyYear1: 40, // percentage
                    occupancyYear2: 70, // percentage
                    occupancyYear3: 90, // percentage - then stabilized
                    vacancyAllowanceEnabled: true,
                    vacancyAllowance: 5.0 // percentage - reserve for vacancies
                },
                kpis: {
                    npv: 0,
                    irr: 0,
                    paybackPeriod: 0,
                    dscr: 0,
                    roi: 0,
                    moic: 0
                },
                cashFlow: [], // ⚠️ CLEARED - Will show zeros
                integration: {
                    landArea: 0,
                    constructionCost: 0,
                    annualRevenue: 0,
                    totalProjectCost: 0
                }
            };

            let cashFlowChart = null;

            // Initialize Component 7
            function initializeInvestmentFinancing() {
                console.log('🎯 بدء تهيئة المكون السابع للاستثمار والتمويل...');
                
                try {
                    console.log('🔧 إعداد مستمعي طرق الحصول على الأرض...');
                    setupLandAcquisitionListeners();
                    
                    console.log('🔧 إعداد مستمعي معاملات الاستثمار...');
                    setupInvestmentParametersListeners();
                    
                    console.log('🏞️ تحديث تفاصيل تكلفة الأرض...');
                    updateLandCostDetails();
                    
                    console.log('🔗 تحديث ملخص التكامل...');
                    updateIntegrationSummary();
                    
                    console.log('💰 حساب المؤشرات المالية...');

                    
                    console.log('📊 رسم مخطط التدفق النقدي...');
                    renderCashFlowChart(); // ✅ RE-ENABLED - Will show empty/zero chart
                    
                    console.log('📈 حساب معدل الخصم الأولي (WACC)...');
                    calculateWACC();
                    
                    console.log('🚪 حساب قيمة الخروج الأولية...');
                    calculateExitValue();
                    
                    console.log('🔗 بناء جدول التدفقات النقدية الأولي...');
                    buildCashFlowTable();
                    
                    console.log('🔄 تحديث NOIاً من OPEX والإيرادات...');
                    updateExpectedNOIAutomatically();
                    
                    console.log('✅ تم تهيئة المكون السابع بنجاح!');
                } catch (error) {
                    console.error('❌ خطأ في تهيئة المكون السابع:', error);
                }
            }
            
            // ==========================================
            // NEW FUNCTIONS: WACC & Exit Value Calculation
            // ==========================================
            
            /**
             * حساب معدل الخصم (WACC) بناءً على تكلفة رأس المال والدين
             * WACC = (E/V × Re) + (D/V × Rd × (1 - Tc))
             * حيث:
             * E = رأس المال (Equity)
             * D = الدين (Debt)
             * V = إجمالي التمويل (E + D)
             * Re = تكلفة رأس المال (Cost of Equity)
             * Rd = تكلفة الدين (Cost of Debt)
             * Tc = معدل الضريبة (Tax Rate)
             */
            function calculateWACC() {
                try {
                    // الحصول على القيم من الحقول
                    const costOfEquity = parseFloat(document.getElementById('costOfEquity')?.value) || 12.0;
                    const interestRate = parseFloat(document.getElementById('interestRate')?.value) || 5.5;
                    const taxRate = parseFloat(document.getElementById('taxRate')?.value) || 0;
                    const equityRatio = parseFloat(document.getElementById('equityRatio')?.value) || 30;
                    const debtRatio = 100 - equityRatio;
                    
                    // ✅ FIX: إذا كان التمويل بالدين معطل، اجعل تكلفة الدين = 0
                    const isDebtEnabled = investmentData.debtFinancing?.enabled || false;
                    const effectiveInterestRate = isDebtEnabled ? interestRate : 0;
                    
                    // تحديث حقل تكلفة الدين (مزامنة مع معدل الفائدة)
                    if (document.getElementById('costOfDebt')) {
                        document.getElementById('costOfDebt').value = effectiveInterestRate.toFixed(1);
                    }
                    
                    // حساب WACC
                    // WACC = (E/V × Re) + (D/V × Rd × (1 - Tc))
                    // ✅ إذا كان التمويل بالدين معطل، debtComponent = 0
                    const equityComponent = (equityRatio / 100) * costOfEquity;
                    const debtComponent = isDebtEnabled ? (debtRatio / 100) * interestRate * (1 - taxRate / 100) : 0;
                    const wacc = equityComponent + debtComponent;
                    
                    // تحديث العرض
                    if (document.getElementById('calculatedWACC')) {
                        document.getElementById('calculatedWACC').textContent = wacc.toFixed(2) + '%';
                    }
                    
                    // ✅ NEW: تحديث تفصيل مكونات WACC
                    if (document.getElementById('equityContribution')) {
                        document.getElementById('equityContribution').textContent = equityComponent.toFixed(2) + '%';
                    }
                    if (document.getElementById('debtContribution')) {
                        document.getElementById('debtContribution').textContent = debtComponent.toFixed(2) + '%';
                    }
                    if (document.getElementById('equityCalc')) {
                        document.getElementById('equityCalc').textContent = 
                            \`\${equityRatio}% × \${costOfEquity.toFixed(1)}% = \${equityComponent.toFixed(2)}%\`;
                    }
                    if (document.getElementById('debtCalc')) {
                        const taxAdjustment = (1 - taxRate / 100);
                        // ✅ عرض "0%" إذا كان التمويل بالدين معطل
                        const debtCalcText = isDebtEnabled 
                            ? \`\${debtRatio}% × \${interestRate.toFixed(1)}% × \${taxAdjustment.toFixed(2)} = \${debtComponent.toFixed(2)}%\`
                            : \`\${debtRatio}% × 0.0% × \${taxAdjustment.toFixed(2)} = 0.00% (معطل)\`;
                        document.getElementById('debtCalc').textContent = debtCalcText;
                    }
                    
                    // ✅ NEW: تحديث عرض الأشرطة البيانية
                    const totalContribution = equityComponent + debtComponent;
                    const equityPercent = totalContribution > 0 ? (equityComponent / totalContribution) * 100 : 100;
                    const debtPercent = totalContribution > 0 ? (debtComponent / totalContribution) * 100 : 0;
                    
                    if (document.getElementById('equityBar')) {
                        document.getElementById('equityBar').style.width = equityPercent.toFixed(0) + '%';
                    }
                    if (document.getElementById('debtBar')) {
                        document.getElementById('debtBar').style.width = debtPercent.toFixed(0) + '%';
                    }
                    
                    // تحديث البيانات
                    investmentData.discounting.costOfEquity = costOfEquity;
                    investmentData.discounting.costOfDebt = effectiveInterestRate; // ✅ استخدام القيمة الفعالة (0 إذا معطل)
                    investmentData.discounting.taxRate = taxRate;
                    investmentData.discounting.calculatedWACC = wacc;
                    
                    console.log('📊 [calculateWACC] معدل الخصم:', {
                        debtFinancingEnabled: isDebtEnabled ? 'مفعّل' : 'معطّل ✅',
                        equityRatio: equityRatio + '%',
                        debtRatio: debtRatio + '%',
                        costOfEquity: costOfEquity + '%',
                        costOfDebt: interestRate + '%',
                        taxRate: taxRate + '%',
                        equityComponent: equityComponent.toFixed(2) + '%',
                        debtComponent: debtComponent.toFixed(2) + '%',
                        WACC: wacc.toFixed(2) + '%'
                    });
                    
                    return wacc;
                } catch (error) {
                    console.error('❌ خطأ في حساب WACC:', error);
                    return 7.5; // قيمة افتراضية
                }
            }
            
            // تصدير الدالة
            window.calculateWACC = calculateWACC;
            
            /**
             * تبديل عرض قسم التمويل بالدين
             */
            function toggleDebtFinancing() {
                try {
                    const checkbox = document.getElementById('enableDebtFinancing');
                    const section = document.getElementById('debtFinancingSection');
                    
                    if (checkbox && section) {
                        const isEnabled = checkbox.checked;
                        section.style.display = isEnabled ? 'block' : 'none';
                        investmentData.debtFinancing.enabled = isEnabled;
                        
                        console.log(\`💰 [toggleDebtFinancing] التمويل بالدين: \${isEnabled ? 'مفعّل' : 'معطّل'}\`);
                        
                        // تحديث الحسابات
                        if (isEnabled) {
                            updateDebtService();
                        } else {
                            // مسح القيم
                            investmentData.debtFinancing.schedule = [];
                            if (document.getElementById('firstYearPayment')) {
                                document.getElementById('firstYearPayment').textContent = '0 ريال';
                            }
                            if (document.getElementById('totalInterest')) {
                                document.getElementById('totalInterest').textContent = '0 ريال';
                            }
                            if (document.getElementById('totalPayments')) {
                                document.getElementById('totalPayments').textContent = '0 ريال';
                            }
                            if (document.getElementById('expectedDSCR')) {
                                document.getElementById('expectedDSCR').textContent = 'N/A';
                            }
                        }
                        
                        // ✅ FIX: إعادة حساب WACC لتحديث تكلفة الدين
                        if (typeof calculateWACC === 'function') {
                            calculateWACC();
                        }
                    }
                } catch (error) {
                    console.error('❌ خطأ في تبديل قسم التمويل بالدين:', error);
                }
            }
            
            /**
             * تحديث حسابات خدمة الدين
             */
            function updateDebtService() {
                try {
                    if (!investmentData.debtFinancing.enabled) {
                        return;
                    }
                    
                    // قراءة القيم من الحقول
                    const loanAmount = parseFloat(document.getElementById('loanAmount')?.value) || 0;
                    const interestRate = parseFloat(document.getElementById('interestRate')?.value) || 0;
                    const loanPeriod = parseInt(document.getElementById('loanPeriod')?.value) || 0;
                    const amortizationType = document.getElementById('amortizationType')?.value || 'annuity';
                    const gracePeriod = parseInt(document.getElementById('gracePeriod')?.value) || 0;
                    const gracePeriodType = document.getElementById('gracePeriodType')?.value || 'none';
                    
                    // تحديث investmentData
                    investmentData.debtFinancing.loanAmount = loanAmount;
                    investmentData.debtFinancing.interestRate = interestRate;
                    investmentData.debtFinancing.loanPeriod = loanPeriod;
                    investmentData.debtFinancing.amortizationType = amortizationType;
                    investmentData.debtFinancing.gracePeriod = gracePeriod;
                    investmentData.debtFinancing.gracePeriodType = gracePeriodType;
                    
                    if (loanAmount <= 0 || loanPeriod <= 0) {
                        console.warn('⚠️ مبلغ القرض أو فترة القرض غير صالحة');
                        return;
                    }
                    
                    // حساب جدول السداد
                    let schedule;
                    if (amortizationType === 'annuity') {
                        schedule = calculateAnnuitySchedule(loanAmount, interestRate, loanPeriod);
                    } else {
                        // حساب Linear لكل سنة
                        schedule = [];
                        for (let year = 1; year <= loanPeriod; year++) {
                            const payment = calculateLinearPayment(loanAmount, interestRate, loanPeriod, year);
                            schedule.push({
                                year,
                                payment: payment.payment,
                                principal: payment.principal,
                                interest: payment.interest,
                                balance: payment.balance
                            });
                        }
                    }
                    
                    investmentData.debtFinancing.schedule = schedule;
                    
                    // حساب الإجماليات
                    let totalInterest = 0;
                    let totalPayments = 0;
                    
                    schedule.forEach(s => {
                        totalInterest += s.interest;
                        totalPayments += s.payment;
                    });
                    
                    // تحديث العرض
                    const formatCurrency = (value) => {
                        return value.toLocaleString('en-US', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }) + ' ريال';
                    };
                    
                    if (document.getElementById('firstYearPayment')) {
                        document.getElementById('firstYearPayment').textContent = 
                            formatCurrency(schedule[0]?.payment || 0);
                    }
                    
                    if (document.getElementById('totalInterest')) {
                        document.getElementById('totalInterest').textContent = 
                            formatCurrency(totalInterest);
                    }
                    
                    if (document.getElementById('totalPayments')) {
                        document.getElementById('totalPayments').textContent = 
                            formatCurrency(totalPayments);
                    }
                    
                    // حساب DSCR المتوقع للسنة 3
                    if (typeof window.calculateNOIForYear === 'function') {
                        const noi3 = calculateNOIForYear(3);
                        const debt3 = calculateDebtServiceForYear(3);
                        
                        if (debt3.payment > 0) {
                            const dscr = noi3.noi / debt3.payment;
                            if (document.getElementById('expectedDSCR')) {
                                let dscrColor = 'text-white/90';
                                if (dscr < 1.0) dscrColor = 'text-red-300';
                                else if (dscr < 1.25) dscrColor = 'text-amber-300';
                                
                                document.getElementById('expectedDSCR').textContent = dscr.toFixed(2) + 'x';
                                document.getElementById('expectedDSCR').className = 
                                    'text-lg font-bold ' + dscrColor;
                            }
                        }
                    }
                    
                    console.log('✅ [updateDebtService] تم تحديث حسابات خدمة الدين', {
                        loanAmount: loanAmount.toLocaleString(),
                        firstYearPayment: schedule[0]?.payment.toLocaleString(),
                        totalInterest: totalInterest.toLocaleString(),
                        totalPayments: totalPayments.toLocaleString()
                    });
                    
                } catch (error) {
                    console.error('❌ خطأ في تحديث خدمة الدين:', error);
                }
            }
            
            // تصدير الدوال
            window.toggleDebtFinancing = toggleDebtFinancing;
            window.updateDebtService = updateDebtService;
            
            /**
             * تحديث حقول استراتيجية الخروج بناءً على الاختيار
             */
            function updateExitStrategyFields() {
                try {
                    const strategy = document.getElementById('exitStrategy')?.value || 'sell';
                    investmentData.exit.strategy = strategy;
                    
                    console.log('🚪 [updateExitStrategyFields] استراتيجية الخروج:', strategy);
                    
                    // إظهار/إخفاء الحقول بناءً على الاستراتيجية
                    const sellingCostsField = document.getElementById('sellingCostsField');
                    const refinanceLTVField = document.getElementById('refinanceLTVField');
                    
                    if (sellingCostsField && refinanceLTVField) {
                        switch (strategy) {
                            case 'sell':
                                sellingCostsField.style.display = 'block';
                                refinanceLTVField.style.display = 'none';
                                break;
                            case 'hold':
                                sellingCostsField.style.display = 'none';
                                refinanceLTVField.style.display = 'none';
                                break;
                            case 'refinance':
                                sellingCostsField.style.display = 'none';
                                refinanceLTVField.style.display = 'block';
                                break;
                        }
                    }
                    
                    calculateExitValue();
                } catch (error) {
                    console.error('❌ خطأ في تحديث حقول الاستراتيجية:', error);
                }
            }
            
            // تصدير الدالة
            window.updateExitStrategyFields = updateExitStrategyFields;
            
            /**
             * تحديث حسابات إعادة التمويل
             */
            function updateRefinanceCalculations() {
                try {
                    const refinanceLTV = parseFloat(document.getElementById('refinanceLTV')?.value) || 70;
                    investmentData.exit.refinanceLTV = refinanceLTV;
                    
                    console.log('🔄 [updateRefinanceCalculations] نسبة التمويل الجديدة:', refinanceLTV + '%');
                    
                    // إعادة حساب جدول التدفقات النقدية
                    if (typeof renderCashFlowTable === 'function') {
                        renderCashFlowTable();
                    }
                } catch (error) {
                    console.error('❌ خطأ في تحديث حسابات التمويل:', error);
                }
            }
            
            // تصدير الدالة
            window.updateRefinanceCalculations = updateRefinanceCalculations;
            
            /**
             * تحديث حقول طريقة التقييم وإظهار/إخفاء الحقول المناسبة
             */
            function updateExitMethodFields() {
                try {
                    const method = document.getElementById('exitMethod')?.value || 'capRate';
                    investmentData.exit.method = method;
                    
                    // إخفاء جميع الحقول
                    const fields = ['capRateField', 'multipleField', 'appraisalField', 'gordonField'];
                    fields.forEach(fieldId => {
                        const field = document.getElementById(fieldId);
                        if (field) field.style.display = 'none';
                    });
                    
                    // إظهار الحقل المناسب
                    const fieldMap = {
                        'capRate': 'capRateField',
                        'multiple': 'multipleField',
                        'appraisal': 'appraisalField',
                        'gordon': 'gordonField'
                    };
                    
                    const targetFieldId = fieldMap[method];
                    if (targetFieldId) {
                        const targetField = document.getElementById(targetFieldId);
                        if (targetField) targetField.style.display = 'block';
                    }
                    
                    console.log('🎯 [updateExitMethodFields] طريقة التقييم:', method);
                    
                    calculateExitValue();
                } catch (error) {
                    console.error('❌ خطأ في تحديث حقول الطريقة:', error);
                }
            }
            
            // تصدير الدالة
            window.updateExitMethodFields = updateExitMethodFields;
            
            /**
             * حساب قيمة الخروج (Terminal/Exit Value) بناءً على الطريقة المختارة
             */
            function calculateExitValue() {
                try {
                    const method = document.getElementById('exitMethod')?.value || 'capRate';
                    const exitYear = parseFloat(document.getElementById('exitYear')?.value) || 10;
                    
                    // ✅ FIX: السماح بقيمة 0 لتكاليف البيع
                    const sellingCostsInput = document.getElementById('sellingCosts')?.value;
                    const sellingCosts = sellingCostsInput === '' ? 2.0 : parseFloat(sellingCostsInput);
                    
                    let exitValue = 0;
                    
                    // الحصول على NOI - يمكن تغييره من الواجهة الآن
                    // ملاحظة: سيتم حسابهاً من نظام OPEX في المرحلة القادمة
                    const noi = parseFloat(document.getElementById('expectedNOI')?.value) || 10000000;
                    
                    switch (method) {
                        case 'capRate':
                            // Exit Value = NOI / Cap Rate
                            const capRate = parseFloat(document.getElementById('exitCapRate')?.value) || 6.5;
                            exitValue = noi / (capRate / 100);
                            investmentData.exit.capRate = capRate;
                            break;
                            
                        case 'multiple':
                            // Exit Value = NOI × Multiple
                            const multiple = parseFloat(document.getElementById('exitMultiple')?.value) || 12;
                            exitValue = noi * multiple;
                            investmentData.exit.multiple = multiple;
                            break;
                            
                        case 'appraisal':
                            // ✅ FIX: السماح بقيمة 0 للتقدير المباشر
                            const appraisalInput = document.getElementById('exitAppraisal')?.value;
                            exitValue = appraisalInput === '' ? 150000000 : parseFloat(appraisalInput);
                            investmentData.exit.appraisal = exitValue;
                            break;
                            
                        case 'gordon':
                            // Gordon Growth Model: Terminal Value = CF × (1+g) / (r-g)
                            const gordonGrowthRate = parseFloat(document.getElementById('gordonGrowthRate')?.value) || 2.5;
                            const wacc = investmentData.discounting.calculatedWACC || 7.5;
                            
                            // ✅ NEW: التحقق من الشرط الأساسي لنموذج جوردون (r > g)
                            if (wacc <= gordonGrowthRate) {
                                console.error('❌ [Gordon Growth] خطأ: WACC يجب أن يكون أكبر من معدل النمو');
                                console.error('   WACC = ' + wacc + '%, Growth Rate = ' + gordonGrowthRate + '%');
                                
                                // عرض تحذير للمستخدم
                                alert('⚠️ تحذير: نموذج جوردون غير صالح!\\n\\nمعدل الخصم (WACC = ' + wacc + '%) يجب أن يكون أكبر من معدل النمو الدائم (' + gordonGrowthRate + '%).\\n\\nسيتم استخدام طريقة Cap Rate البديلة.');
                                
                                // استخدام Cap Rate كبديل
                                const fallbackCapRate = 6.5;
                                exitValue = noi / (fallbackCapRate / 100);
                                investmentData.exit.capRate = fallbackCapRate;
                                
                                console.warn('🔄 [Gordon Growth] تم التحويل إلى Cap Rate = ' + fallbackCapRate + '%');
                                break;
                            }
                            
                            // ✅ NEW: تحذير إذا كان معدل النمو مرتفع جداً
                            if (gordonGrowthRate > 5) {
                                console.warn('⚠️ [Gordon Growth] تحذير: معدل نمو دائم > 5% قد يكون غير واقعي');
                            }
                            
                            const cfNextYear = noi * (1 + gordonGrowthRate / 100);
                            exitValue = cfNextYear / ((wacc - gordonGrowthRate) / 100);
                            investmentData.exit.gordonGrowthRate = gordonGrowthRate;
                            
                            console.log('📊 [Gordon Growth] الحساب:', {
                                noi: noi.toLocaleString(),
                                growthRate: gordonGrowthRate + '%',
                                wacc: wacc + '%',
                                cfNextYear: cfNextYear.toLocaleString(),
                                terminalValue: exitValue.toLocaleString()
                            });
                            break;
                    }
                    
                    // خصم تكاليف البيع (فقط لاستراتيجية Sell)
                    const strategy = document.getElementById('exitStrategy')?.value || 'sell';
                    let netExitValue;
                    let displayLabel;
                    
                    if (strategy === 'sell') {
                        netExitValue = exitValue * (1 - sellingCosts / 100);
                        displayLabel = 'قيمة البيع (بعد التكاليف)';
                    } else if (strategy === 'hold') {
                        netExitValue = exitValue; // Terminal Value without selling costs
                        displayLabel = 'القيمة النهائية (Perpetuity)';
                    } else if (strategy === 'refinance') {
                        netExitValue = exitValue; // Property value for refinancing
                        displayLabel = 'قيمة المشروع (للتمويل)';
                    }
                    
                    // تحديث العرض
                    if (document.getElementById('calculatedExitValue')) {
                        document.getElementById('calculatedExitValue').textContent = 
                            netExitValue.toLocaleString('ar-SA') + ' ريال';
                    }
                    
                    if (document.getElementById('displayExitYear')) {
                        document.getElementById('displayExitYear').textContent = exitYear.toString();
                    }
                    
                    // تحديث تسمية العرض
                    const exitValueLabel = document.querySelector('#calculatedExitValue')?.parentElement?.previousElementSibling?.querySelector('.text-sm');
                    if (exitValueLabel) {
                        exitValueLabel.textContent = displayLabel;
                    }
                    
                    // تحديث البيانات
                    investmentData.exit.year = exitYear;
                    investmentData.exit.expectedNOI = noi;
                    investmentData.exit.sellingCosts = sellingCosts;
                    investmentData.exit.calculatedValue = netExitValue;
                    
                    console.log('💰 [calculateExitValue] قيمة الخروج:', {
                        strategy,
                        method,
                        exitYear,
                        noi: noi.toLocaleString('ar-SA'),
                        grossValue: exitValue.toLocaleString('ar-SA'),
                        sellingCosts: strategy === 'sell' ? sellingCosts + '%' : 'N/A',
                        netValue: netExitValue.toLocaleString('ar-SA'),
                        displayLabel
                    });
                    
                    return netExitValue;
                } catch (error) {
                    console.error('❌ خطأ في حساب قيمة الخروج:', error);
                    return 0;
                }
            }
            
            // تصدير الدالة
            window.calculateExitValue = calculateExitValue;
            
            // ==========================================
            // NEW FUNCTIONS: Growth & Assumptions Toggles
            // ==========================================
            
            /**
             * تفعيل/تعطيل حقل التضخم
             */
            function toggleInflation() {
                try {
                    const enabled = document.getElementById('inflationEnabled')?.checked || false;
                    const rateField = document.getElementById('inflationRate');
                    
                    if (rateField) {
                        rateField.disabled = !enabled;
                        rateField.style.opacity = enabled ? '1' : '0.5';
                    }
                    
                    investmentData.assumptions.inflationEnabled = enabled;
                    
                    console.log('📊 [toggleInflation] التضخم:', enabled ? 'مفعّل' : 'معطّل');
                } catch (error) {
                    console.error('❌ خطأ في تفعيل/تعطيل التضخم:', error);
                }
            }
            
            // تصدير الدالة
            window.toggleInflation = toggleInflation;
            
            /**
             * تفعيل/تعطيل حقل نمو الإيرادات
             */
            function toggleRevenueGrowth() {
                try {
                    const enabled = document.getElementById('revenueGrowthEnabled')?.checked || false;
                    const rateField = document.getElementById('revenueGrowthRate');
                    const methodField = document.getElementById('revenueGrowthMethod');
                    
                    if (rateField) {
                        rateField.disabled = !enabled;
                        rateField.style.opacity = enabled ? '1' : '0.5';
                    }
                    
                    if (methodField) {
                        methodField.disabled = !enabled;
                        methodField.style.opacity = enabled ? '1' : '0.5';
                    }
                    
                    investmentData.assumptions.revenueGrowthEnabled = enabled;
                    
                    console.log('📈 [toggleRevenueGrowth] نمو الإيرادات:', enabled ? 'مفعّل' : 'معطّل');
                } catch (error) {
                    console.error('❌ خطأ في تفعيل/تعطيل نمو الإيرادات:', error);
                }
            }
            
            // تصدير الدالة
            window.toggleRevenueGrowth = toggleRevenueGrowth;
            
            /**
             * تفعيل/تعطيل حقول الإشغال التدريجي
             */
            function toggleOccupancyRampUp() {
                try {
                    const enabled = document.getElementById('occupancyRampUpEnabled')?.checked || false;
                    const fieldsContainer = document.getElementById('occupancyRampUpFields');
                    
                    if (fieldsContainer) {
                        const inputs = fieldsContainer.querySelectorAll('input[type="number"]');
                        inputs.forEach(input => {
                            input.disabled = !enabled;
                            input.style.opacity = enabled ? '1' : '0.5';
                        });
                    }
                    
                    investmentData.assumptions.occupancyRampUpEnabled = enabled;
                    
                    console.log('🏢 [toggleOccupancyRampUp] الإشغال التدريجي:', enabled ? 'مفعّل' : 'معطّل');
                } catch (error) {
                    console.error('❌ خطأ في تفعيل/تعطيل الإشغال التدريجي:', error);
                }
            }
            
            // تصدير الدالة
            window.toggleOccupancyRampUp = toggleOccupancyRampUp;
            
            /**
             * تفعيل/تعطيل حقل بدل الشواغر
             */
            function toggleVacancyAllowance() {
                try {
                    const enabled = document.getElementById('vacancyAllowanceEnabled')?.checked || false;
                    const rateField = document.getElementById('vacancyAllowance');
                    
                    if (rateField) {
                        rateField.disabled = !enabled;
                        rateField.style.opacity = enabled ? '1' : '0.5';
                    }
                    
                    investmentData.assumptions.vacancyAllowanceEnabled = enabled;
                    
                    console.log('🏚️ [toggleVacancyAllowance] بدل الشواغر:', enabled ? 'مفعّل' : 'معطّل');
                } catch (error) {
                    console.error('❌ خطأ في تفعيل/تعطيل بدل الشواغر:', error);
                }
            }
            
            // تصدير الدالة
            window.toggleVacancyAllowance = toggleVacancyAllowance;
            
            /**
             * حفظ قيم افتراضات النمو والتضخم في investmentData
             */
            function saveGrowthAssumptions() {
                try {
                    // Inflation
                    investmentData.assumptions.inflationEnabled = 
                        document.getElementById('inflationEnabled')?.checked || false;
                    investmentData.assumptions.inflationRate = 
                        parseFloat(document.getElementById('inflationRate')?.value) || 2.5;
                    
                    // Revenue Growth
                    investmentData.assumptions.revenueGrowthEnabled = 
                        document.getElementById('revenueGrowthEnabled')?.checked || false;
                    investmentData.assumptions.revenueGrowthRate = 
                        parseFloat(document.getElementById('revenueGrowthRate')?.value) || 3.0;
                    investmentData.assumptions.revenueGrowthMethod = 
                        document.getElementById('revenueGrowthMethod')?.value || 'compound';
                    
                    // Occupancy Ramp-Up
                    investmentData.assumptions.occupancyRampUpEnabled = 
                        document.getElementById('occupancyRampUpEnabled')?.checked || false;
                    investmentData.assumptions.stabilizedOccupancy = 
                        parseFloat(document.getElementById('stabilizedOccupancy')?.value) || 90;
                    investmentData.assumptions.occupancyYear1 = 
                        parseFloat(document.getElementById('occupancyYear1')?.value) || 40;
                    investmentData.assumptions.occupancyYear2 = 
                        parseFloat(document.getElementById('occupancyYear2')?.value) || 70;
                    investmentData.assumptions.occupancyYear3 = 
                        parseFloat(document.getElementById('occupancyYear3')?.value) || 90;
                    
                    // Vacancy Allowance
                    investmentData.assumptions.vacancyAllowanceEnabled = 
                        document.getElementById('vacancyAllowanceEnabled')?.checked || false;
                    investmentData.assumptions.vacancyAllowance = 
                        parseFloat(document.getElementById('vacancyAllowance')?.value) || 5.0;
                    
                    console.log('✅ [saveGrowthAssumptions] تم حفظ افتراضات النمو:', investmentData.assumptions);
                } catch (error) {
                    console.error('❌ خطأ في حفظ افتراضات النمو:', error);
                }
            }
            
            // تصدير الدالة
            window.saveGrowthAssumptions = saveGrowthAssumptions;
            
            // ==========================================
            // INTEGRATION: OPEX + Revenue = NOI + Cash Flow
            // ==========================================
            
            /**
             * حساب إيجار الأرض السنوي لسنة معينة (في حالة استئجار الأرض)
             * @param {number} year - السنة (1-based)
             * @returns {number} إيجار الأرض لتلك السنة
             */
            function calculateLandRentForYear(year) {
                try {
                    // التحقق من أن طريقة الحصول على الأرض هي استئجار
                    if (investmentData.landAcquisition.mode !== 'lease') {
                        return 0; // لا يوجد إيجار في حالة الشراء أو الشراكة
                    }
                    
                    const baseRentPerSqm = investmentData.landAcquisition.annualRent || 150;
                    const landArea = investmentData.integration.landArea || 
                                    (parseFloat(document.getElementById('landArea')?.value) || 10000);
                    const increasePercentage = investmentData.landAcquisition.rentIncreasePercentage || 0;
                    const increaseFrequency = investmentData.landAcquisition.rentIncreaseFrequency || 0;
                    
                    // حساب الإيجار بناءً على السنة مع مراعاة الزيادات التراكمية
                    let currentRentPerSqm = baseRentPerSqm;
                    
                    if (increasePercentage > 0 && increaseFrequency > 0) {
                        // حساب عدد الزيادات التي حدثت حتى هذه السنة
                        const numberOfIncreases = Math.floor((year - 1) / increaseFrequency);
                        
                        // تطبيق الزيادات التراكمية
                        for (let i = 0; i < numberOfIncreases; i++) {
                            currentRentPerSqm = currentRentPerSqm * (1 + increasePercentage / 100);
                        }
                    }
                    
                    const yearlyRent = currentRentPerSqm * landArea;
                    
                    console.log(\`🏞️ [calculateLandRentForYear] السنة \${year}: \${currentRentPerSqm.toFixed(2)} ريال/م² × \${landArea.toLocaleString()} م² = \${yearlyRent.toLocaleString()} ريال\`);
                    
                    return yearlyRent;
                } catch (error) {
                    console.error('❌ خطأ في حساب إيجار الأرض للسنة:', error);
                    return 0;
                }
            }
            
            // تصدير الدالة
            window.calculateLandRentForYear = calculateLandRentForYear;
            
            /**
             * حساب الإيرادات السنوية لسنة معينة مع تطبيق النمو والإشغال
             * @param {number} year - السنة (1-based)
             * @returns {number} الإيرادات السنوية المعدلة
             */
            function calculateRevenueForYear(year) {
                try {
                    // الحصول على الإيرادات الأساسية من نظام الإيرادات المتقدم
                    let baseRevenue = 0;
                    
                    if (typeof window.calculateIntegratedAnnualRevenue === 'function') {
                        baseRevenue = window.calculateIntegratedAnnualRevenue();
                    } else {
                        // Fallback: استخدام قيمة من investmentData إن وجدت
                        baseRevenue = investmentData.integration.annualRevenue || 0;
                    }
                    
                    // تطبيق نمو الإيرادات
                    let revenue = baseRevenue;
                    
                    if (investmentData.assumptions.revenueGrowthEnabled && year > 1) {
                        const growthRate = investmentData.assumptions.revenueGrowthRate / 100;
                        const method = investmentData.assumptions.revenueGrowthMethod;
                        
                        if (method === 'compound') {
                            // نمو مركب: Revenue(t) = BaseRevenue × (1 + g)^(t-1)
                            revenue = baseRevenue * Math.pow(1 + growthRate, year - 1);
                        } else {
                            // نمو بسيط: Revenue(t) = BaseRevenue × (1 + g × (t-1))
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
                    
                    // تطبيق بدل الشواغر (خصم من الإيرادات)
                    if (investmentData.assumptions.vacancyAllowanceEnabled) {
                        const vacancyRate = investmentData.assumptions.vacancyAllowance / 100;
                        revenue = revenue * (1 - vacancyRate);
                    }
                    
                    console.log(\`💰 [calculateRevenueForYear] السنة \${year}:\`, {
                        baseRevenue: baseRevenue.toLocaleString(),
                        afterGrowth: (revenue / occupancyFactor * (1 + (investmentData.assumptions.vacancyAllowanceEnabled ? investmentData.assumptions.vacancyAllowance / 100 : 0))).toLocaleString(),
                        occupancyFactor: \`\${(occupancyFactor * 100).toFixed(1)}%\`,
                        afterOccupancy: (revenue / (1 - (investmentData.assumptions.vacancyAllowanceEnabled ? investmentData.assumptions.vacancyAllowance / 100 : 0))).toLocaleString(),
                        vacancyAdjustment: investmentData.assumptions.vacancyAllowanceEnabled ? \`-\${investmentData.assumptions.vacancyAllowance}%\` : 'N/A',
                        finalRevenue: revenue.toLocaleString()
                    });
                    
                    return revenue;
                } catch (error) {
                    console.error('❌ خطأ في حساب الإيرادات للسنة:', error);
                    return 0;
                }
            }
            
            // تصدير الدالة
            window.calculateRevenueForYear = calculateRevenueForYear;
            
            /**
             * حساب OPEX السنوي لسنة معينة مع تطبيق التضخم
             * @param {number} year - السنة (1-based)
             * @returns {number} OPEX السنوي المعدل
             */
            function calculateOpexForYear(year) {
                try {
                    // الحصول على OPEX الأساسي من نظام OPEX
                    let baseOpex = 0;
                    
                    if (typeof window.calculateOpexSummary === 'function') {
                        const opexSummary = window.calculateOpexSummary();
                        baseOpex = opexSummary.totalOpex || 0;
                    } else {
                        console.warn('⚠️ نظام OPEX غير متاح، استخدام قيمة افتراضية');
                        baseOpex = 5000000; // قيمة افتراضية للاختبار
                    }
                    
                    // تطبيق التضخم
                    let opex = baseOpex;
                    
                    if (investmentData.assumptions.inflationEnabled && year > 1) {
                        const inflationRate = investmentData.assumptions.inflationRate / 100;
                        // OPEX(t) = BaseOPEX × (1 + inflation)^(t-1)
                        opex = baseOpex * Math.pow(1 + inflationRate, year - 1);
                    }
                    
                    console.log(\`📊 [calculateOpexForYear] السنة \${year}:\`, {
                        baseOpex: baseOpex.toLocaleString(),
                        inflationRate: investmentData.assumptions.inflationEnabled ? \`\${investmentData.assumptions.inflationRate}%\` : 'معطّل',
                        adjustedOpex: opex.toLocaleString()
                    });
                    
                    return opex;
                } catch (error) {
                    console.error('❌ خطأ في حساب OPEX للسنة:', error);
                    return 0;
                }
            }
            
            // تصدير الدالة
            window.calculateOpexForYear = calculateOpexForYear;
            
            /**
             * حساب NOI (صافي الدخل التشغيلي) لسنة معينة
             * NOI = Revenue - OPEX - Land Rent (if lease)
             * @param {number} year - السنة (1-based)
             * @returns {object} تفاصيل NOI
             */
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
                    
                    console.log(\`✅ [calculateNOIForYear] السنة \${year}:\`, {
                        revenue: revenue.toLocaleString(),
                        opex: opex.toLocaleString(),
                        landRent: landRent.toLocaleString(),
                        noiBeforePartnership: noi.toLocaleString(),
                        mainPartnerShare: partnershipAdj ? partnershipAdj.partnerShare.toLocaleString() : '0',
                        additionalPartnersShare: partnershipAdj ? (partnershipAdj.additionalPartnersShare || 0).toLocaleString() : '0',
                        totalPartnersShare: partnershipAdj ? (partnershipAdj.totalPartnersShare || 0).toLocaleString() : '0',
                        managementFee: partnershipAdj ? partnershipAdj.managementFee.toLocaleString() : '0',
                        noiAfterPartnership: finalNOI.toLocaleString(),
                        noiMargin: revenue > 0 ? \`\${((finalNOI / revenue) * 100).toFixed(1)}%\` : 'N/A',
                        partnershipAdjObject: partnershipAdj
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
            
            // تصدير الدالة
            window.calculateNOIForYear = calculateNOIForYear;
            
            /**
             * بناء جدول التدفقات النقدية الكامل
             * @returns {Array} مصفوفة التدفقات النقدية السنوية
             */
            /**
             * بناء جدول التدفقات النقدية الموسع (Expanded Cash Flow Table)
             * يتضمن: فترة البناء (negative years) + فترة التشغيل (positive years)
             * 
             * @returns {Array} مصفوفة من كائنات التدفقات النقدية لجميع السنوات
             */
            function buildCashFlowTable() {
                try {
                    console.log('📊 [buildCashFlowTable] بدء بناء جدول التدفقات النقدية الموسع...');
                    
                    // حساب النفقات الرأسمالية (CAPEX)
                    const capex = calculateCapitalExpenditure();
                    
                    const constructionPeriod = investmentData.financing.constructionPeriod || 3;
                    const operatingPeriod = investmentData.financing.operatingPeriod || 20;
                    const cashFlows = [];
                    
                    let cumulativeCashFlow = 0;
                    
                    // ==========================================
                    // 1. فترة البناء (Construction Phase)
                    // ==========================================
                    
                    // السنة 0: الحصول على الأرض + صرف القرض
                    const landCost = capex.landCost || 0;
                    const loanAmount = capex.loanAmount || 0;
                    const equityInvestedYear0 = landCost - loanAmount;
                    const netCashFlowYear0 = -landCost + loanAmount; // سالب لأنها تكلفة
                    cumulativeCashFlow += netCashFlowYear0;
                    
                    cashFlows.push({
                        year: 0,
                        phase: 'construction',
                        // Capital Expenditure
                        landCost: landCost,
                        constructionCost: 0,
                        loanDisbursement: loanAmount,
                        equityInvested: equityInvestedYear0,
                        // Operations (zeros during construction)
                        revenue: 0,
                        opex: 0,
                        landRent: 0,
                        noi: 0,
                        // Debt Service (no payments during construction)
                        debtService: 0,
                        debtPrincipal: 0,
                        debtInterest: 0,
                        debtBalance: loanAmount,
                        // Cash Flow
                        freeCashFlow: netCashFlowYear0,
                        cashFlow: netCashFlowYear0,
                        cumulativeCashFlow: cumulativeCashFlow,
                        noiMargin: 0,
                        dscr: null
                    });
                    
                    console.log('🏗️ [Year 0] الحصول على الأرض + صرف القرض:', {
                        landCost,
                        loanAmount,
                        equityInvested: equityInvestedYear0,
                        netCashFlow: netCashFlowYear0
                    });
                    
                    // السنوات السالبة: تكاليف البناء (-3، -2، -1)
                    capex.constructionSchedule.forEach((item) => {
                        const equityInvested = item.amount; // كل تكاليف البناء من رأس المال
                        const netCashFlow = -item.amount; // سالب لأنها تكلفة
                        cumulativeCashFlow += netCashFlow;
                        
                        cashFlows.push({
                            year: item.year,
                            phase: 'construction',
                            // Capital Expenditure
                            landCost: 0,
                            constructionCost: item.amount,
                            loanDisbursement: 0,
                            equityInvested: equityInvested,
                            // Operations (zeros during construction)
                            revenue: 0,
                            opex: 0,
                            landRent: 0,
                            noi: 0,
                            // Debt Service (no payments during construction)
                            debtService: 0,
                            debtPrincipal: 0,
                            debtInterest: 0,
                            debtBalance: loanAmount,
                            // Cash Flow
                            freeCashFlow: netCashFlow,
                            cashFlow: netCashFlow,
                            cumulativeCashFlow: cumulativeCashFlow,
                            noiMargin: 0,
                            dscr: null
                        });
                        
                        console.log(\`🏗️ [Year \${item.year}] تكلفة البناء: \${item.amount.toLocaleString()} ريال (\${item.percentage}%)\`);
                    });
                    
                    // ==========================================
                    // 2. فترة التشغيل (Operating Phase)
                    // ==========================================
                    
                    // الحصول على بيانات الخروج
                    const exitYear = investmentData.exit?.year || 10;
                    const exitStrategy = investmentData.exit?.strategy || 'sell';
                    
                    for (let year = 1; year <= operatingPeriod; year++) {
                        const noiData = calculateNOIForYear(year);
                        
                        // ✅ حساب خدمة الدين (Debt Service)
                        const debtServiceData = calculateDebtServiceForYear(year);
                        
                        // التدفق النقدي الحر الأساسي = NOI - خدمة الدين
                        let freeCashFlow = noiData.noi - debtServiceData.payment;
                        
                        // ✅ NEW: دمج Exit Value في سنة الخروج
                        let exitValue = 0;
                        let exitGrossValue = 0;
                        let exitSellingCosts = 0;
                        let exitLoanPayoff = 0;
                        let exitNetProceeds = 0;
                        
                        // Exit Split data
                        let exitSplit = null;
                        
                        // Refinance-specific data
                        let exitTerminalValue = 0;
                        let exitNewLoan = 0;
                        let exitRefinanceCash = 0;
                        
                        // ✅ NEW: معالجة جميع استراتيجيات الخروج (Sell, Hold, Refinance)
                        if (year === exitYear) {
                            console.log('🚪 [Exit Year ' + year + '] استراتيجية الخروج: ' + exitStrategy);
                            
                            switch (exitStrategy) {
                                case 'sell':
                                    // ========================================
                                    // 1. بيع المشروع (Sell)
                                    // ========================================
                                    // حساب قيمة الخروج الإجمالية
                                    exitGrossValue = calculateExitValue();
                                    
                                    // حساب تكاليف البيع
                                    const sellingCostsPercent = investmentData.exit?.sellingCosts !== undefined 
                                        ? investmentData.exit.sellingCosts 
                                        : 2.0;
                                    exitSellingCosts = exitGrossValue * (sellingCostsPercent / 100);
                                    
                                    // صافي قيمة الخروج بعد تكاليف البيع
                                    exitValue = exitGrossValue - exitSellingCosts;
                                    
                                    // سداد القرض المتبقي
                                    exitLoanPayoff = debtServiceData.remainingBalance;
                                    
                                    // صافي العائد قبل التقسيم مع الشريك
                                    let exitNetProceedsBeforeSplit = exitValue - exitLoanPayoff;
                                    
                                    // تقسيم عوائد الخروج مع الشريك
                                    if (typeof window.calculatePartnershipExitSplit === 'function') {
                                        exitSplit = window.calculatePartnershipExitSplit(
                                            exitNetProceedsBeforeSplit,
                                            investmentData.landAcquisition,
                                            capex
                                        );
                                        exitNetProceeds = exitSplit.investorShare;
                                    } else {
                                        exitNetProceeds = exitNetProceedsBeforeSplit;
                                    }
                                    
                                    // إضافة Exit Net Proceeds إلى التدفق النقدي
                                    freeCashFlow += exitNetProceeds;
                                    
                                    console.log('💰 [Sell] تفاصيل الخروج:', {
                                        grossValue: exitGrossValue.toLocaleString(),
                                        sellingCosts: exitSellingCosts.toLocaleString(),
                                        netValue: exitValue.toLocaleString(),
                                        loanPayoff: exitLoanPayoff.toLocaleString(),
                                        netProceedsBeforeSplit: exitNetProceedsBeforeSplit.toLocaleString(),
                                        investorShare: exitNetProceeds.toLocaleString(),
                                        partnerShare: exitSplit ? exitSplit.partnerShare.toLocaleString() : '0',
                                        splitRatio: exitSplit ? exitSplit.splitRatio : '100% / 0%'
                                    });
                                    break;
                                    
                                case 'hold':
                                    // ========================================
                                    // 2. الاحتفاظ (Hold - Perpetuity)
                                    // ========================================
                                    // حساب Terminal Value بافتراض استمرار NOI إلى الأبد
                                    const capRateForHold = investmentData.exit?.capRate || 6.5;
                                    const terminalValue = noiData.noi / (capRateForHold / 100);
                                    
                                    exitGrossValue = terminalValue;
                                    exitSellingCosts = 0; // لا توجد تكاليف بيع
                                    exitValue = terminalValue;
                                    exitLoanPayoff = 0; // لا يتم سداد القرض
                                    exitTerminalValue = terminalValue;
                                    
                                    // التقسيم مع الشريك (إن وُجد)
                                    let holdProceedsBeforeSplit = terminalValue;
                                    if (typeof window.calculatePartnershipExitSplit === 'function') {
                                        exitSplit = window.calculatePartnershipExitSplit(
                                            holdProceedsBeforeSplit,
                                            investmentData.landAcquisition,
                                            capex
                                        );
                                        exitNetProceeds = exitSplit.investorShare;
                                    } else {
                                        exitNetProceeds = holdProceedsBeforeSplit;
                                    }
                                    
                                    // إضافة Terminal Value للتدفق النقدي
                                    freeCashFlow += exitNetProceeds;
                                    
                                    console.log('♾️ [Hold] Terminal Value (Perpetuity):', {
                                        lastYearNOI: noiData.noi.toLocaleString(),
                                        capRate: capRateForHold + '%',
                                        terminalValue: terminalValue.toLocaleString(),
                                        investorShare: exitNetProceeds.toLocaleString(),
                                        partnerShare: exitSplit ? exitSplit.partnerShare.toLocaleString() : '0'
                                    });
                                    break;
                                    
                                case 'refinance':
                                    // ========================================
                                    // 3. إعادة التمويل (Refinance)
                                    // ========================================
                                    // حساب القيمة السوقية للمشروع
                                    const propertyValue = calculateExitValue();
                                    
                                    // نسبة التمويل الجديدة (LTV)
                                    const newLTV = investmentData.exit?.refinanceLTV || 70;
                                    const newLoanAmount = propertyValue * (newLTV / 100);
                                    const oldLoanBalance = debtServiceData.remainingBalance;
                                    
                                    // صافي السيولة من إعادة التمويل
                                    const netRefinanceProceeds = newLoanAmount - oldLoanBalance;
                                    
                                    exitGrossValue = propertyValue;
                                    exitSellingCosts = 0; // لا توجد تكاليف بيع
                                    exitValue = propertyValue;
                                    exitLoanPayoff = oldLoanBalance; // يُسدد القرض القديم
                                    exitNewLoan = newLoanAmount;
                                    exitRefinanceCash = netRefinanceProceeds;
                                    
                                    // إضافة Terminal Value (المستثمر يحتفظ بالمشروع)
                                    const capRateForRefinance = investmentData.exit?.capRate || 6.5;
                                    const terminalValueRefinance = noiData.noi / (capRateForRefinance / 100);
                                    exitTerminalValue = terminalValueRefinance;
                                    
                                    // إجمالي العائد = السيولة من التمويل + Terminal Value
                                    let refinanceTotalValue = netRefinanceProceeds + terminalValueRefinance;
                                    
                                    // التقسيم مع الشريك
                                    if (typeof window.calculatePartnershipExitSplit === 'function') {
                                        exitSplit = window.calculatePartnershipExitSplit(
                                            refinanceTotalValue,
                                            investmentData.landAcquisition,
                                            capex
                                        );
                                        exitNetProceeds = exitSplit.investorShare;
                                    } else {
                                        exitNetProceeds = refinanceTotalValue;
                                    }
                                    
                                    // إضافة العوائد للتدفق النقدي
                                    freeCashFlow += exitNetProceeds;
                                    
                                    console.log('🔄 [Refinance] تفاصيل إعادة التمويل:', {
                                        propertyValue: propertyValue.toLocaleString(),
                                        newLTV: newLTV + '%',
                                        newLoan: newLoanAmount.toLocaleString(),
                                        oldLoan: oldLoanBalance.toLocaleString(),
                                        netCash: netRefinanceProceeds.toLocaleString(),
                                        terminalValue: terminalValueRefinance.toLocaleString(),
                                        totalValue: refinanceTotalValue.toLocaleString(),
                                        investorShare: exitNetProceeds.toLocaleString(),
                                        partnerShare: exitSplit ? exitSplit.partnerShare.toLocaleString() : '0'
                                    });
                                    break;
                                    
                                default:
                                    console.warn('⚠️ استراتيجية خروج غير معروفة:', exitStrategy);
                                    break;
                            }
                            
                            console.log('✅ [Exit Year ' + year + '] إجمالي التدفق النقدي: ' + freeCashFlow.toLocaleString());
                        }
                        
                        cumulativeCashFlow += freeCashFlow;
                        
                        // حساب DSCR (Debt Service Coverage Ratio)
                        const dscr = debtServiceData.payment > 0 ? 
                                     noiData.noi / debtServiceData.payment : null;
                        
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
                            partnerShare: (() => {
                                const total = noiData.partnershipAdjustment?.totalPartnersShare || noiData.partnershipAdjustment?.partnerShare || 0;
                                console.log(\`💰 [Year \${year}] Partner Share Calculation:\`, {
                                    totalPartnersShare: noiData.partnershipAdjustment?.totalPartnersShare,
                                    mainPartnerShare: noiData.partnershipAdjustment?.partnerShare,
                                    additionalPartnersShare: noiData.partnershipAdjustment?.additionalPartnersShare,
                                    finalValue: total
                                });
                                return total;
                            })(),
                            mainPartnerShare: noiData.partnershipAdjustment?.partnerShare || 0,
                            additionalPartnersShare: noiData.partnershipAdjustment?.additionalPartnersShare || 0,
                            managementFee: noiData.partnershipAdjustment?.managementFee || 0,
                            noi: noiData.noi, // NOI بعد تعديلات الشراكة
                            // Debt Service
                            debtService: debtServiceData.payment,
                            debtPrincipal: debtServiceData.principal,
                            debtInterest: debtServiceData.interest,
                            debtBalance: debtServiceData.remainingBalance,
                            // ✅ NEW: Exit Data with Partnership Split & Strategy
                            exitStrategy: year === exitYear ? exitStrategy : '',
                            exitGrossValue: exitGrossValue,
                            exitSellingCosts: exitSellingCosts,
                            exitNetValue: exitValue,
                            exitLoanPayoff: exitLoanPayoff,
                            exitProceedsBeforeSplit: (exitValue - exitLoanPayoff) || 0,
                            exitPartnerShare: exitSplit?.partnerShare || 0,
                            exitAdditionalPartnersShares: exitSplit?.additionalPartnersShares || [],
                            exitTotalPartnersShare: exitSplit?.totalPartnersShare || 0,
                            exitInvestorShare: exitNetProceeds,
                            exitSplitRatio: exitSplit?.splitRatio || 'N/A',
                            // Refinance/Hold specific
                            exitTerminalValue: exitTerminalValue,
                            exitNewLoan: exitNewLoan,
                            exitRefinanceCash: exitRefinanceCash,
                            // Cash Flow (يتضمن Exit Net Proceeds بعد التقسيم)
                            freeCashFlow: freeCashFlow,
                            cashFlow: freeCashFlow,
                            cumulativeCashFlow: cumulativeCashFlow,
                            noiMargin: noiData.noiMargin,
                            dscr: dscr
                        });
                    }
                    
                    console.log(\`✅ [buildCashFlowTable] تم بناء جدول موسع لـ \${constructionPeriod+1} سنوات بناء + \${operatingPeriod} سنة تشغيل\`);
                    console.log(\`💰 التدفق النقدي التراكمي النهائي: \${cumulativeCashFlow.toLocaleString()} ريال\`);
                    
                    // حفظ في investmentData
                    investmentData.cashFlow = cashFlows;
                    
                    return cashFlows;
                } catch (error) {
                    console.error('❌ خطأ في بناء جدول التدفقات النقدية:', error);
                    return [];
                }
            }
            
            // تصدير الدالة
            window.buildCashFlowTable = buildCashFlowTable;
            
            /**
             * تحديث حقل NOI المتوقعاً بناءً على سنة الخروج
             */
            function updateExpectedNOIAutomatically() {
                try {
                    const exitYear = parseFloat(document.getElementById('exitYear')?.value) || 10;
                    
                    // حساب NOI لسنة الخروج
                    const noiData = calculateNOIForYear(exitYear);
                    
                    // تحديث الحقل
                    if (document.getElementById('expectedNOI')) {
                        document.getElementById('expectedNOI').value = Math.round(noiData.noi);
                    }
                    
                    // إعادة حساب قيمة الخروج
                    calculateExitValue();
                    
                    console.log(\`🔄 [updateExpectedNOIAutomatically] تم تحديث NOIاً للسنة \${exitYear}: \${noiData.noi.toLocaleString()} ريال\`);
                    
                } catch (error) {
                    console.error('❌ خطأ في تحديث NOIاً:', error);
                }
            }
            
            // تصدير الدالة
            window.updateExpectedNOIAutomatically = updateExpectedNOIAutomatically;
            
            /**
             * عرض جدول التدفقات النقدية الموسع في الواجهة
             * يدعم فترة البناء (negative years) + فترة التشغيل (positive years)
             * يعرض 14 عمود بدلاً من 8
             */
            function renderCashFlowTable() {
                try {
                    console.log('🎨 [renderCashFlowTable] بدء عرض جدول التدفقات النقدية الموسع...');
                    
                    // بناء البيانات
                    const cashFlows = buildCashFlowTable();
                    
                    if (!cashFlows || cashFlows.length === 0) {
                        console.warn('⚠️ لا توجد بيانات تدفقات نقدية');
                        return;
                    }
                    
                    // الحصول على عناصر الجدول
                    const tableBody = document.getElementById('cashFlowTableBody');
                    const summaryDiv = document.getElementById('cashFlowSummary');
                    const landRentColumn = document.getElementById('landRentColumn');
                    
                    if (!tableBody) {
                        console.error('❌ لم يتم العثور على عنصر جسم الجدول');
                        return;
                    }
                    
                    // تحديد ما إذا كان هناك إيجار أرض
                    const hasLandRent = investmentData.landAcquisition.mode === 'lease';
                    
                    // تحديد ما إذا كان هناك شراكة
                    const hasPartnership = investmentData.landAcquisition.mode === 'partnership';
                    
                    // إخفاء/إظهار عمود إيجار الأرض
                    if (landRentColumn) {
                        landRentColumn.style.display = hasLandRent ? 'table-cell' : 'none';
                    }
                    
                    // إخفاء/إظهار أعمدة الشراكة
                    const partnershipHeader = document.getElementById('partnershipColumnsHeader');
                    const partnershipColumns = document.querySelectorAll('.partnership-column');
                    
                    if (partnershipHeader) {
                        partnershipHeader.style.display = hasPartnership ? 'table-cell' : 'none';
                    }
                    
                    partnershipColumns.forEach(col => {
                        col.style.display = hasPartnership ? 'table-cell' : 'none';
                    });
                    
                    // مسح المحتوى السابق
                    tableBody.innerHTML = '';
                    
                    // متغيرات للإجماليات
                    let totalLandCost = 0;
                    let totalConstructionCost = 0;
                    let totalLoanDisbursement = 0;
                    let totalEquityInvested = 0;
                    let totalRevenue = 0;
                    let totalOpex = 0;
                    let totalLandRent = 0;
                    let totalNOI = 0;
                    let totalDebtService = 0;
                    let totalCashFlow = 0;
                    
                    // دالات التنسيق
                    const formatCurrency = (value) => {
                        return value.toLocaleString('en-US', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }) + ' ريال';
                    };
                    
                    const formatPercent = (value) => {
                        if (value === null || value === undefined) return 'N/A';
                        return value.toFixed(1) + '%';
                    };
                    
                    const getCashFlowColor = (value) => {
                        if (value > 0) return 'text-white/90 font-semibold';
                        if (value < 0) return 'text-red-300 font-semibold';
                        return 'text-white/80';
                    };
                    
                    const getNOIMarginColor = (value) => {
                        if (value >= 50) return 'text-white/90 font-semibold';
                        if (value >= 30) return 'text-amber-300 font-semibold';
                        return 'text-red-300 font-semibold';
                    };
                    
                    const getDSCRColor = (value) => {
                        if (value === null) return 'text-gray-400';
                        if (value >= 1.25) return 'text-white/90 font-semibold';
                        if (value >= 1.0) return 'text-amber-300 font-semibold';
                        return 'text-red-300 font-semibold';
                    };
                    
                    const formatDSCR = (value) => {
                        if (value === null || value === undefined) return 'N/A';
                        return value.toFixed(2) + 'x';
                    };
                    
                    // ملء الجدول
                    cashFlows.forEach((row, index) => {
                        const isConstruction = row.phase === 'construction';
                        const isBreakEven = row.cumulativeCashFlow >= 0 && 
                                           (index === 0 || cashFlows[index-1].cumulativeCashFlow < 0);
                        
                        const tr = document.createElement('tr');
                        
                        // تلوين خاص لصف نقطة التعادل
                        if (isBreakEven && !isConstruction) {
                            tr.className = 'bg-white/10 hover:bg-gray-300 border-2 border-gray-600';
                        } else if (isConstruction) {
                            tr.className = index % 2 === 0 ? 
                                'bg-red-500/25 hover:bg-red-500/25' : 
                                'bg-red-500/25 hover:bg-red-150';
                        } else {
                            tr.className = index % 2 === 0 ? 
                                'bg-white hover:bg-white/5' : 
                                'bg-white/5 hover:bg-white/8';
                        }
                        
                        tr.style.transition = 'background-color 0.2s';
                        
                        // بناء الصفوف - عدد متغير حسب الأعمدة المرئية
                        // ✅ FIX: Use totalPartnersShare instead of partnerShare to include ALL partners
                        const partnerShare = row.partnerShare || 0; // This is the value stored (totalPartnersShare)
                        const managementFee = row.managementFee || 0;
                        const noiBeforePartnership = row.noiBeforePartnership || row.noi;
                        
                        tr.innerHTML = \`
                            <td class="px-3 py-2 text-center font-bold \${isConstruction ? 'text-red-300' : 'text-white/90'}">\${row.year}</td>
                            <td class="px-3 py-2 text-right text-red-200 text-xs">\${formatCurrency(row.landCost)}</td>
                            <td class="px-3 py-2 text-right text-red-200 text-xs">\${formatCurrency(row.constructionCost)}</td>
                            <td class="px-3 py-2 text-right text-white/90 text-xs">\${formatCurrency(row.loanDisbursement)}</td>
                            <td class="px-3 py-2 text-right bg-red-500/25 font-semibold text-red-100 text-xs">\${formatCurrency(row.equityInvested)}</td>
                            <td class="px-3 py-2 text-right text-white/90 text-xs">\${formatCurrency(row.revenue)}</td>
                            <td class="px-3 py-2 text-right text-red-300 text-xs">\${formatCurrency(row.opex)}</td>
                            \${hasLandRent ? \`<td class="px-3 py-2 text-right text-orange-300 text-xs">\${formatCurrency(row.landRent)}</td>\` : ''}
                            <td class="px-3 py-2 text-right bg-amber-500/20 font-semibold text-amber-200 text-xs">\${formatCurrency(noiBeforePartnership)}</td>
                            \${hasPartnership ? \`
                                <td class="px-3 py-2 text-right text-red-300 text-xs partnership-column" 
                                    title="حصة جميع الشركاء: \${formatCurrency(partnerShare)}
الشريك الرئيسي: \${formatCurrency(row.mainPartnerShare || 0)}
الشركاء الإضافيون: \${formatCurrency(row.additionalPartnersShare || 0)}">
                                    \${formatCurrency(partnerShare)}
                                    \${row.additionalPartnersShare > 0 ? '<span class="text-xs opacity-75">*</span>' : ''}
                                </td>
                                <td class="px-3 py-2 text-right text-white/90 text-xs partnership-column">\${formatCurrency(managementFee)}</td>
                                <td class="px-3 py-2 text-right bg-white/5 backdrop-filter backdrop-blur-sm/8 font-semibold text-white/90 text-xs partnership-column">\${formatCurrency(row.noi)}</td>
                            \` : ''}
                            <td class="px-3 py-2 text-right text-white/90 text-xs">\${formatCurrency(row.debtService)}</td>
                            <td class="px-3 py-2 text-right bg-white/5 backdrop-filter backdrop-blur-sm/8 \${getCashFlowColor(row.freeCashFlow)} text-xs">\${formatCurrency(row.freeCashFlow)}</td>
                            <td class="px-3 py-2 text-right bg-white/5 backdrop-filter backdrop-blur-sm/8 font-bold \${getCashFlowColor(row.cumulativeCashFlow)} text-xs">
                                \${formatCurrency(row.cumulativeCashFlow)}
                                \${isBreakEven && !isConstruction ? '<br/><span class="text-xs text-white/90">🎯 التعادل</span>' : ''}
                            </td>
                            <td class="px-3 py-2 text-center \${getNOIMarginColor(row.noiMargin)} text-xs">\${formatPercent(row.noiMargin)}</td>
                            <td class="px-3 py-2 text-center \${getDSCRColor(row.dscr)} text-xs">\${formatDSCR(row.dscr)}</td>
                        \`;
                        
                        tableBody.appendChild(tr);
                        
                        // ✅ NEW: إضافة صف تفاصيل Exit في الجدول المرئي
                        if (row.exitStrategy) {
                            const exitDetailRow = document.createElement('tr');
                            exitDetailRow.className = 'bg-gradient-to-r from-gray-100 to-gray-200 border-t-2 border-gray-600';
                            
                            let exitDetailsHTML = '';
                            
                            // تحديد الأيقونة والنص حسب الاستراتيجية
                            let strategyIcon = '';
                            let strategyLabel = '';
                            
                            switch(row.exitStrategy) {
                                case 'sell':
                                    strategyIcon = '💰';
                                    strategyLabel = 'بيع المشروع';
                                    exitDetailsHTML = \`
                                        <div class="text-xs space-y-1">
                                            <div class="font-bold text-white/90">📊 القيمة الإجمالية: \${formatCurrency(row.exitGrossValue)}</div>
                                            <div class="text-red-300">➖ تكاليف البيع: \${formatCurrency(row.exitSellingCosts)}</div>
                                            <div class="text-white/90">= صافي القيمة: \${formatCurrency(row.exitNetValue)}</div>
                                            <div class="text-white/90">➖ سداد القرض: \${formatCurrency(row.exitLoanPayoff)}</div>
                                            <div class="border-t border-white/20 my-2"></div>
                                            <div class="font-bold text-white/90 text-sm">✅ حصة المطور: \${formatCurrency(row.exitInvestorShare)}</div>
                                            \${row.exitPartnerShare > 0 ? \`<div class="text-white/90 text-xs">👥 حصة الشريك الرئيسي: \${formatCurrency(row.exitPartnerShare)}</div>\` : ''}
                                            \${(row.exitAdditionalPartnersShares && row.exitAdditionalPartnersShares.length > 0) ? 
                                                row.exitAdditionalPartnersShares.map(p => \`<div class="text-white/90 text-xs">👤 \${p.name}: \${formatCurrency(p.shareAmount)}</div>\`).join('') 
                                                : ''}
                                            \${row.exitTotalPartnersShare > 0 ? \`<div class="font-semibold text-white/90 text-xs mt-1">📊 إجمالي حصة الشركاء: \${formatCurrency(row.exitTotalPartnersShare)}</div>\` : ''}
                                        </div>
                                    \`;
                                    break;
                                    
                                case 'hold':
                                    strategyIcon = '♾️';
                                    strategyLabel = 'الاحتفاظ (Perpetuity)';
                                    exitDetailsHTML = \`
                                        <div class="text-xs space-y-1">
                                            <div class="font-bold text-white/90">♾️ القيمة النهائية (Terminal Value)</div>
                                            <div class="text-white/80">📊 NOI السنة الأخيرة: \${formatCurrency(row.noi)}</div>
                                            <div class="text-white/90">➗ Cap Rate: استخدم معدل الرسملة</div>
                                            <div class="font-bold text-white/90 text-sm">= \${formatCurrency(row.exitTerminalValue)}</div>
                                            <div class="text-white/70 text-xs mt-1">⚠️ لا يتم سداد القرض</div>
                                            <div class="border-t border-white/20 my-2"></div>
                                            <div class="font-bold text-white/90 text-sm">✅ حصة المطور: \${formatCurrency(row.exitInvestorShare)}</div>
                                            \${row.exitPartnerShare > 0 ? \`<div class="text-white/90 text-xs">👥 حصة الشريك الرئيسي: \${formatCurrency(row.exitPartnerShare)}</div>\` : ''}
                                            \${(row.exitAdditionalPartnersShares && row.exitAdditionalPartnersShares.length > 0) ? 
                                                row.exitAdditionalPartnersShares.map(p => \`<div class="text-white/90 text-xs">👤 \${p.name}: \${formatCurrency(p.shareAmount)}</div>\`).join('') 
                                                : ''}
                                            \${row.exitTotalPartnersShare > 0 ? \`<div class="font-semibold text-white/90 text-xs mt-1">📊 إجمالي حصة الشركاء: \${formatCurrency(row.exitTotalPartnersShare)}</div>\` : ''}
                                            <div class="border-t border-amber-300 my-2"></div>
                                            <div class="bg-amber-500/20 p-2 rounded border border-amber-200">
                                                <div class="font-semibold text-amber-100 text-xs mb-1">💡 ملاحظة هامة:</div>
                                                <div class="text-amber-200 text-xs leading-relaxed">
                                                    Terminal Value هو <strong>تقييم نظري</strong> لقيمة المشروع بافتراض استمراره للأبد، وليس سيولة نقدية فعلية.
                                                    <br/>المستثمر يحصل على التدفق السنوي فقط، ويحتفظ بأصل المشروع.
                                                </div>
                                            </div>
                                        </div>
                                    \`;
                                    break;
                                    
                                case 'refinance':
                                    strategyIcon = '🔄';
                                    strategyLabel = 'إعادة التمويل';
                                    exitDetailsHTML = \`
                                        <div class="text-xs space-y-1">
                                            <div class="font-bold text-white/90">🔄 إعادة التمويل + Perpetuity</div>
                                            <div class="text-white/80">🏢 قيمة المشروع: \${formatCurrency(row.exitGrossValue)}</div>
                                            <div class="text-white/90">💰 القرض الجديد: \${formatCurrency(row.exitNewLoan)}</div>
                                            <div class="text-red-300">➖ القرض القديم: \${formatCurrency(row.exitLoanPayoff)}</div>
                                            <div class="text-white/80 font-semibold">= صافي السيولة: \${formatCurrency(row.exitRefinanceCash)}</div>
                                            <div class="border-t border-white/20 my-1"></div>
                                            <div class="text-white/90">♾️ Terminal Value: \${formatCurrency(row.exitTerminalValue)}</div>
                                            <div class="border-t border-white/20 my-2"></div>
                                            <div class="font-bold text-white/90 text-sm">✅ حصة المطور: \${formatCurrency(row.exitInvestorShare)}</div>
                                            \${row.exitPartnerShare > 0 ? \`<div class="text-white/90 text-xs">👥 حصة الشريك الرئيسي: \${formatCurrency(row.exitPartnerShare)}</div>\` : ''}
                                            \${(row.exitAdditionalPartnersShares && row.exitAdditionalPartnersShares.length > 0) ? 
                                                row.exitAdditionalPartnersShares.map(p => \`<div class="text-white/90 text-xs">👤 \${p.name}: \${formatCurrency(p.shareAmount)}</div>\`).join('') 
                                                : ''}
                                            \${row.exitTotalPartnersShare > 0 ? \`<div class="font-semibold text-white/90 text-xs mt-1">📊 إجمالي حصة الشركاء: \${formatCurrency(row.exitTotalPartnersShare)}</div>\` : ''}
                                            <div class="border-t border-white/20 my-2"></div>
                                            <div class="bg-white/5 backdrop-filter backdrop-blur-sm/8 p-2 rounded border border-white/20">
                                                <div class="font-semibold text-white text-xs mb-1">💡 ملاحظة هامة:</div>
                                                <div class="text-white/90 text-xs leading-relaxed">
                                                    التدفق النقدي يشمل: <strong>سيولة فعلية</strong> من القرض الجديد + <strong>تقييم نظري</strong> (Terminal Value) للمشروع.
                                                    <br/>المستثمر يحصل على السيولة نقداً ويحتفظ بالمشروع (مع التزام بالقرض الجديد).
                                                </div>
                                            </div>
                                        </div>
                                    \`;
                                    break;
                            }
                            
                            // بناء صف التفاصيل (يمتد على جميع الأعمدة)
                            const totalColumns = hasPartnership ? 17 : 14;
                            exitDetailRow.innerHTML = \`
                                <td colspan="\${totalColumns}" class="px-4 py-3">
                                    <div class="flex items-start gap-4">
                                        <div class="text-3xl">\${strategyIcon}</div>
                                        <div class="flex-1">
                                            <div class="text-sm font-bold text-white mb-2">
                                                استراتيجية الخروج: \${strategyLabel}
                                            </div>
                                            \${exitDetailsHTML}
                                        </div>
                                    </div>
                                </td>
                            \`;
                            
                            tableBody.appendChild(exitDetailRow);
                            
                            // عرض في Console أيضاً
                            console.log(\`📊 [Year \${row.year}] استراتيجية الخروج: \${row.exitStrategy}\`);
                            console.log('  • Exit Gross Value: ' + formatCurrency(row.exitGrossValue));
                            if (row.exitStrategy === 'sell') {
                                console.log('  • Selling Costs: ' + formatCurrency(row.exitSellingCosts));
                            }
                            console.log('  • Exit Net Value: ' + formatCurrency(row.exitNetValue));
                            console.log('  • Loan Payoff: ' + formatCurrency(row.exitLoanPayoff));
                            
                            if (row.exitStrategy === 'hold') {
                                console.log('  • Terminal Value (Perpetuity): ' + formatCurrency(row.exitTerminalValue));
                            }
                            
                            if (row.exitStrategy === 'refinance') {
                                console.log('  • New Loan: ' + formatCurrency(row.exitNewLoan));
                                console.log('  • Refinance Cash: ' + formatCurrency(row.exitRefinanceCash));
                                console.log('  • Terminal Value: ' + formatCurrency(row.exitTerminalValue));
                            }
                            
                            console.log('  • Investor Share: ' + formatCurrency(row.exitInvestorShare));
                            if (row.exitPartnerShare > 0) {
                                console.log('  • Main Partner Share: ' + formatCurrency(row.exitPartnerShare));
                            }
                            if (row.exitAdditionalPartnersShares && row.exitAdditionalPartnersShares.length > 0) {
                                console.log('  • Additional Partners:');
                                row.exitAdditionalPartnersShares.forEach(p => {
                                    console.log('    - ' + p.name + ': ' + formatCurrency(p.shareAmount));
                                });
                            }
                            if (row.exitTotalPartnersShare > 0) {
                                console.log('  • Total Partners Share: ' + formatCurrency(row.exitTotalPartnersShare));
                            }
                            console.log('  ✅ Total Free Cash Flow: ' + formatCurrency(row.freeCashFlow));
                        }
                        
                        // تجميع الإجماليات
                        totalLandCost += row.landCost || 0;
                        totalConstructionCost += row.constructionCost || 0;
                        totalLoanDisbursement += row.loanDisbursement || 0;
                        totalEquityInvested += row.equityInvested || 0;
                        totalRevenue += row.revenue || 0;
                        totalOpex += row.opex || 0;
                        totalLandRent += row.landRent || 0;
                        totalNOI += row.noi || 0;
                        totalDebtService += row.debtService || 0;
                        totalCashFlow += row.cashFlow || 0;
                    });
                    
                    // تحديث الملخص
                    if (summaryDiv) {
                        summaryDiv.style.display = 'block';
                        
                        document.getElementById('totalRevenueSummary').textContent = formatCurrency(totalRevenue);
                        document.getElementById('totalOpexSummary').textContent = formatCurrency(totalOpex);
                        document.getElementById('totalNOISummary').textContent = formatCurrency(totalNOI);
                        document.getElementById('totalCashFlowSummary').textContent = formatCurrency(totalCashFlow);
                        
                        // إضافة إجماليات جديدة إذا كانت العناصر موجودة
                        if (document.getElementById('totalLandCostSummary')) {
                            document.getElementById('totalLandCostSummary').textContent = formatCurrency(totalLandCost);
                        }
                        if (document.getElementById('totalConstructionCostSummary')) {
                            document.getElementById('totalConstructionCostSummary').textContent = formatCurrency(totalConstructionCost);
                        }
                        if (document.getElementById('totalEquityInvestedSummary')) {
                            document.getElementById('totalEquityInvestedSummary').textContent = formatCurrency(totalEquityInvested);
                        }
                    }
                    
                    console.log(\`✅ [renderCashFlowTable] تم عرض \${cashFlows.length} صف في الجدول الموسع\`, {
                        totalLandCost: totalLandCost.toLocaleString(),
                        totalConstructionCost: totalConstructionCost.toLocaleString(),
                        totalEquityInvested: totalEquityInvested.toLocaleString(),
                        totalRevenue: totalRevenue.toLocaleString(),
                        totalOpex: totalOpex.toLocaleString(),
                        totalNOI: totalNOI.toLocaleString(),
                        totalCashFlow: totalCashFlow.toLocaleString()
                    });
                    
                    // تحديث واجهة KPIs Dashboardاً
                    if (typeof updateKPIDashboard === 'function') {
                        updateKPIDashboard();
                    }
                    
                } catch (error) {
                    console.error('❌ خطأ في عرض جدول التدفقات النقدية:', error);
                    
                    // عرض رسالة خطأ في الجدول
                    const tableBody = document.getElementById('cashFlowTableBody');
                    if (tableBody) {
                        tableBody.innerHTML = \`
                            <tr>
                                <td colspan="20" class="px-4 py-12 text-center text-red-300">
                                    <i class="fas fa-exclamation-triangle text-4xl mb-3"></i>
                                    <p>حدث خطأ أثناء عرض جدول التدفقات النقدية</p>
                                    <p class="text-xs mt-2">\${error.message}</p>
                                </td>
                            </tr>
                        \`;
                    }
                }
            }
            
            // تصدير الدالة
            window.renderCashFlowTable = renderCashFlowTable;
            
            // تصدير الدالة
            window.updateExpectedNOIAutomatically = updateExpectedNOIAutomatically;
            
            // ═══════════════════════════════════════════════════════════════════════════
            // DEBT SERVICE CALCULATIONS
            // ═══════════════════════════════════════════════════════════════════════════
            
            /**
             * حساب القسط السنوي الثابت (Annuity Payment)
             * @param {number} loanAmount - مبلغ القرض
             * @param {number} interestRate - معدل الربح السنوي (%)
             * @param {number} loanPeriod - فترة القرض (سنوات)
             * @returns {number} القسط السنوي الثابت
             */
            function calculateAnnuityPayment(loanAmount, interestRate, loanPeriod) {
                if (loanAmount <= 0 || loanPeriod <= 0) return 0;
                
                const r = interestRate / 100;
                
                // إذا كانت الفائدة = 0، القسط = القرض / الفترة
                if (r === 0) {
                    return loanAmount / loanPeriod;
                }
                
                // المعادلة: PMT = P × [r(1+r)^n] / [(1+r)^n - 1]
                const numerator = r * Math.pow(1 + r, loanPeriod);
                const denominator = Math.pow(1 + r, loanPeriod) - 1;
                const annuityPayment = loanAmount * (numerator / denominator);
                
                console.log(\`💰 [calculateAnnuityPayment] قرض: \${loanAmount.toLocaleString()}, فائدة: \${interestRate}%, فترة: \${loanPeriod} سنة → قسط: \${annuityPayment.toLocaleString()} ريال\`);
                
                return annuityPayment;
            }
            
            /**
             * حساب جدول السداد الكامل (Annuity Schedule)
             * @param {number} loanAmount - مبلغ القرض
             * @param {number} interestRate - معدل الربح السنوي (%)
             * @param {number} loanPeriod - فترة القرض (سنوات)
             * @returns {Array} مصفوفة تفاصيل السداد السنوية
             */
            function calculateAnnuitySchedule(loanAmount, interestRate, loanPeriod) {
                const schedule = [];
                let remainingBalance = loanAmount;
                const annuityPayment = calculateAnnuityPayment(loanAmount, interestRate, loanPeriod);
                const r = interestRate / 100;
                
                for (let year = 1; year <= loanPeriod; year++) {
                    const interestPayment = remainingBalance * r;
                    const principalPayment = annuityPayment - interestPayment;
                    remainingBalance -= principalPayment;
                    
                    // تصحيح الأخطاء العددية في السنة الأخيرة
                    if (year === loanPeriod) {
                        remainingBalance = 0;
                    }
                    
                    schedule.push({
                        year,
                        payment: annuityPayment,
                        principal: principalPayment,
                        interest: interestPayment,
                        balance: Math.max(0, remainingBalance)
                    });
                }
                
                console.log(\`📅 [calculateAnnuitySchedule] تم إنشاء جدول سداد لـ \${loanPeriod} سنة\`);
                
                return schedule;
            }
            
            /**
             * حساب القسط المتناقص (Linear Payment)
             * @param {number} loanAmount - مبلغ القرض
             * @param {number} interestRate - معدل الربح السنوي (%)
             * @param {number} loanPeriod - فترة القرض (سنوات)
             * @param {number} year - السنة الحالية (1-based)
             * @returns {object} تفاصيل الدفع للسنة
             */
            function calculateLinearPayment(loanAmount, interestRate, loanPeriod, year) {
                if (loanAmount <= 0 || loanPeriod <= 0 || year < 1 || year > loanPeriod) {
                    return {
                        payment: 0,
                        principal: 0,
                        interest: 0,
                        balance: 0
                    };
                }
                
                const r = interestRate / 100;
                
                // القسط الثابت من الأصل
                const principalPayment = loanAmount / loanPeriod;
                
                // الرصيد المتبقي في بداية السنة
                const remainingBalance = loanAmount - (principalPayment * (year - 1));
                
                // الفائدة على الرصيد المتبقي
                const interestPayment = remainingBalance * r;
                
                // إجمالي الدفع
                const totalPayment = principalPayment + interestPayment;
                
                // الرصيد بعد الدفع
                const newBalance = remainingBalance - principalPayment;
                
                return {
                    payment: totalPayment,
                    principal: principalPayment,
                    interest: interestPayment,
                    balance: Math.max(0, newBalance)
                };
            }
            
            /**
             * تطبيق فترة السماح (Grace Period)
             * @param {number} year - السنة النسبية للقرض (1-based)
             * @param {number} gracePeriod - فترة السماح (سنوات)
             * @param {string} gracePeriodType - نوع فترة السماح
             * @param {object} normalPayment - الدفع العادي
             * @returns {object} الدفع بعد تطبيق فترة السماح
             */
            function applyGracePeriod(year, gracePeriod, gracePeriodType, normalPayment) {
                // إذا انتهت فترة السماح، الدفع عادي
                if (year > gracePeriod) {
                    return normalPayment;
                }
                
                switch (gracePeriodType) {
                    case 'none':
                        // لا توجد فترة سماح
                        return normalPayment;
                        
                    case 'interest-only':
                        // فقط الفوائد خلال فترة السماح
                        return {
                            payment: normalPayment.interest,
                            principal: 0,
                            interest: normalPayment.interest,
                            balance: normalPayment.balance + normalPayment.principal // الأصل لا يُسدد
                        };
                        
                    case 'full':
                        // لا دفع خلال فترة السماح (تتراكم الفوائد)
                        return {
                            payment: 0,
                            principal: 0,
                            interest: 0,
                            balance: normalPayment.balance + normalPayment.principal + normalPayment.interest
                        };
                        
                    default:
                        return normalPayment;
                }
            }
            
            /**
             * حساب خدمة الدين لسنة معينة
             * @param {number} year - السنة (1-based من بداية التشغيل)
             * @returns {object} تفاصيل خدمة الدين
             */
            function calculateDebtServiceForYear(year) {
                try {
                    const debtFinancing = investmentData.debtFinancing;
                    
                    // التحقق من تفعيل التمويل بالدين
                    if (!debtFinancing.enabled || !debtFinancing.loanAmount || debtFinancing.loanAmount === 0) {
                        return {
                            year,
                            payment: 0,
                            principal: 0,
                            interest: 0,
                            remainingBalance: 0
                        };
                    }
                    
                    // التحقق من السنة ضمن فترة القرض
                    const loanStartYear = debtFinancing.loanStartYear || 1;
                    const loanEndYear = loanStartYear + debtFinancing.loanPeriod - 1;
                    
                    if (year < loanStartYear || year > loanEndYear) {
                        return {
                            year,
                            payment: 0,
                            principal: 0,
                            interest: 0,
                            remainingBalance: 0
                        };
                    }
                    
                    // حساب السنة النسبية للقرض
                    const loanYear = year - loanStartYear + 1;
                    
                    // حساب حسب نوع السداد
                    let debtService;
                    
                    if (debtFinancing.amortizationType === 'annuity') {
                        // القسط الثابت
                        if (!debtFinancing.schedule || debtFinancing.schedule.length === 0) {
                            // إنشاء الجدول إذا لم يكن موجوداً
                            debtFinancing.schedule = calculateAnnuitySchedule(
                                debtFinancing.loanAmount,
                                debtFinancing.interestRate,
                                debtFinancing.loanPeriod
                            );
                        }
                        debtService = debtFinancing.schedule[loanYear - 1];
                    } else {
                        // القسط المتناقص
                        debtService = calculateLinearPayment(
                            debtFinancing.loanAmount,
                            debtFinancing.interestRate,
                            debtFinancing.loanPeriod,
                            loanYear
                        );
                    }
                    
                    // تطبيق فترة السماح
                    if (debtFinancing.gracePeriod > 0) {
                        debtService = applyGracePeriod(
                            loanYear,
                            debtFinancing.gracePeriod,
                            debtFinancing.gracePeriodType,
                            debtService
                        );
                    }
                    
                    return {
                        year,
                        payment: debtService.payment || 0,
                        principal: debtService.principal || 0,
                        interest: debtService.interest || 0,
                        remainingBalance: debtService.balance || 0
                    };
                    
                } catch (error) {
                    console.error('❌ خطأ في حساب خدمة الدين للسنة:', error);
                    return {
                        year,
                        payment: 0,
                        principal: 0,
                        interest: 0,
                        remainingBalance: 0
                    };
                }
            }
            
            // تصدير الدوال
            window.calculateAnnuityPayment = calculateAnnuityPayment;
            window.calculateAnnuitySchedule = calculateAnnuitySchedule;
            window.calculateLinearPayment = calculateLinearPayment;
            window.applyGracePeriod = applyGracePeriod;
            window.calculateDebtServiceForYear = calculateDebtServiceForYear;

            // ==========================================
            // CAPITAL EXPENDITURE (CAPEX) CALCULATION
            // ==========================================
            
            /**
             * حساب النفقات الرأسمالية (CAPEX) للمشروع
             * يشمل: تكلفة الأرض + تكلفة البناء + توزيعها على فترة البناء
             * 
             * @returns {Object} CAPEX details with construction schedule
             */
            function calculateCapitalExpenditure() {
                try {
                    console.log('📊 [calculateCapitalExpenditure] بدء حساب النفقات الرأسمالية...');
                    
                    const capex = investmentData.capitalExpenditure;
                    const integration = investmentData.integration;
                    const landAcq = investmentData.landAcquisition;
                    const financing = investmentData.financing;
                    const debtFinancing = investmentData.debtFinancing;
                    
                    // ==========================================
                    // 1. حساب تكلفة الأرض
                    // ==========================================
                    let landCost = 0;
                    
                    if (landAcq.mode === 'purchase') {
                        // شراء: سعر المتر × المساحة
                        landCost = landAcq.purchasePrice * integration.landArea;
                        console.log('🏞️ [CAPEX] شراء الأرض:', {
                            pricePerSqm: landAcq.purchasePrice,
                            landArea: integration.landArea,
                            totalCost: landCost
                        });
                    } else if (landAcq.mode === 'partnership') {
                        // شراكة: قيمة الأرض للشريك
                        landCost = landAcq.landValuePerSqm * integration.landArea;
                        console.log('🤝 [CAPEX] شراكة - قيمة الأرض:', {
                            valuePerSqm: landAcq.landValuePerSqm,
                            landArea: integration.landArea,
                            totalValue: landCost
                        });
                    } else {
                        // إيجار: لا توجد تكلفة رأسمالية للأرض
                        landCost = 0;
                        console.log('📋 [CAPEX] إيجار الأرض - لا توجد تكلفة رأسمالية');
                    }
                    
                    capex.landCost = landCost;
                    capex.landPaymentYear = 0; // السنة 0 (قبل بدء التشغيل)
                    
                    // ==========================================
                    // 2. حساب تكلفة البناء
                    // ==========================================
                    const totalConstructionCost = integration.constructionCost || 0;
                    capex.totalConstructionCost = totalConstructionCost;
                    
                    console.log('🏗️ [CAPEX] تكلفة البناء الإجمالية:', totalConstructionCost);
                    
                    // ==========================================
                    // 3. توزيع تكلفة البناء على فترة البناء
                    // ==========================================
                    const constructionPeriod = financing.constructionPeriod || 3;
                    
                    // استخدام التوزيع المحفوظ من واجهة توزيع التكاليف إن وجد
                    let distributionPattern = [];
                    
                    if (capex.constructionSchedule && capex.constructionSchedule.length > 0) {
                        // استخدام التوزيع المحفوظ من الواجهة
                        console.log('📊 [CAPEX] استخدام التوزيع المحفوظ من الواجهة');
                        const scheduleLength = capex.constructionSchedule.length;
                        capex.constructionSchedule.forEach((item, index) => {
                            // 🔄 إصلاح الترتيب: السنة 1 في الواجهة = أقدم سنة في التدفقات النقدية
                            // السنة 1 (index=0) → -scheduleLength = -3
                            // السنة 2 (index=1) → -(scheduleLength-1) = -2  
                            // السنة 3 (index=2) → -(scheduleLength-2) = -1
                            const negativeYear = -(scheduleLength - index);
                            console.log('📊 [CAPEX] ترتيب السنوات - السنة ' + (index + 1) + ' في الواجهة → السنة ' + negativeYear + ' في التدفقات النقدية');
                            distributionPattern.push({
                                year: negativeYear,
                                percentage: item.percentage || 0
                            });
                        });
                        // ترتيب حسب السنة (من الأقدم إلى الأحدث)
                        distributionPattern.sort((a, b) => a.year - b.year);
                        
                    } else {
                        // استخدام التوزيع الافتراضي إذا لم يكن هناك توزيع محفوظ
                        console.log('📊 [CAPEX] استخدام التوزيع الافتراضي');
                        
                        switch (constructionPeriod) {
                            case 1:
                                // سنة واحدة: 100%
                                distributionPattern = [
                                    { year: -1, percentage: 100 }
                                ];
                                break;
                            case 2:
                                // سنتان: 40%-60%
                                distributionPattern = [
                                    { year: -2, percentage: 40 },
                                    { year: -1, percentage: 60 }
                                ];
                                break;
                            case 3:
                                // 3 سنوات: 30%-50%-20% (الافتراضي)
                                distributionPattern = [
                                    { year: -3, percentage: 30 },
                                    { year: -2, percentage: 50 },
                                    { year: -1, percentage: 20 }
                                ];
                                break;
                            case 4:
                                // 4 سنوات: 20%-30%-30%-20%
                                distributionPattern = [
                                    { year: -4, percentage: 20 },
                                    { year: -3, percentage: 30 },
                                    { year: -2, percentage: 30 },
                                    { year: -1, percentage: 20 }
                                ];
                                break;
                            case 5:
                                // 5 سنوات: 15%-20%-30%-20%-15%
                                distributionPattern = [
                                    { year: -5, percentage: 15 },
                                    { year: -4, percentage: 20 },
                                    { year: -3, percentage: 30 },
                                    { year: -2, percentage: 20 },
                                    { year: -1, percentage: 15 }
                                ];
                                break;
                            default:
                                // أكثر من 5 سنوات: توزيع متساوي
                                const equalPercentage = 100 / constructionPeriod;
                                for (let i = constructionPeriod; i >= 1; i--) {
                                    distributionPattern.push({
                                        year: -i,
                                        percentage: equalPercentage
                                    });
                                }
                                break;
                        }
                    }
                    
                    // حساب المبالغ الفعلية من النسب
                    capex.constructionSchedule = distributionPattern.map(item => ({
                        year: item.year,
                        percentage: item.percentage,
                        amount: (totalConstructionCost * item.percentage) / 100,
                        description: 'السنة ' + Math.abs(item.year) + ' من البناء'
                    }));
                    
                    console.log('📅 [CAPEX] جدول تكلفة البناء:', capex.constructionSchedule);
                    
                    // ==========================================
                    // 4. حساب التمويل بالقرض
                    // ==========================================
                    const loanAmount = debtFinancing.enabled ? (debtFinancing.loanAmount || 0) : 0;
                    capex.loanAmount = loanAmount;
                    capex.loanDisbursementYear = 0; // صرف القرض في السنة 0
                    
                    console.log('💰 [CAPEX] مبلغ القرض:', loanAmount);
                    
                    // ==========================================
                    // 5. حساب الإجماليات
                    // ==========================================
                    capex.totalCapitalRequired = landCost + totalConstructionCost;
                    capex.equityRequired = capex.totalCapitalRequired - loanAmount;
                    capex.calculated = true;
                    
                    console.log('✅ [CAPEX] الإجماليات:', {
                        landCost,
                        constructionCost: totalConstructionCost,
                        totalCapitalRequired: capex.totalCapitalRequired,
                        loanAmount,
                        equityRequired: capex.equityRequired
                    });
                    
                    return capex;
                    
                } catch (error) {
                    console.error('❌ خطأ في حساب النفقات الرأسمالية:', error);
                    return investmentData.capitalExpenditure;
                }
            }
            
            // تصدير الدالة
            window.calculateCapitalExpenditure = calculateCapitalExpenditure;

            // ==========================================
            // FINANCIAL KPIs CALCULATION
            // ==========================================
            
            /**
             * حساب NPV (Net Present Value) - القيمة الحالية الصافية
             * NPV = Σ [CF_t / (1 + WACC)^t] - Initial Investment
             * 
             * @returns {number} NPV in SAR
             */
            function calculateNPV() {
                try {
                    console.log('📊 [calculateNPV] بدء حساب القيمة الحالية الصافية...');
                    
                    const cashFlows = investmentData.cashFlow;
                    if (!cashFlows || cashFlows.length === 0) {
                        console.warn('⚠️ لا توجد تدفقات نقدية');
                        return 0;
                    }
                    
                    const wacc = investmentData.discounting.calculatedWACC / 100; // تحويل إلى decimal
                    let npv = 0;
                    
                    // حساب PV لكل تدفق نقدي
                    cashFlows.forEach(cf => {
                        // للسنوات السالبة (فترة البناء): t = 0 للسنة 0، و abs(year) للسنوات السالبة
                        // للسنوات الموجبة (فترة التشغيل): t = year + constructionPeriod + 1
                        let t;
                        if (cf.year <= 0) {
                            // فترة البناء: نستخدم المسافة من السنة 0
                            t = Math.abs(cf.year);
                        } else {
                            // فترة التشغيل: نضيف سنوات البناء
                            const constructionPeriod = investmentData.financing.constructionPeriod || 3;
                            t = cf.year + constructionPeriod + 1;
                        }
                        
                        const discountFactor = Math.pow(1 + wacc, t);
                        const presentValue = cf.freeCashFlow / discountFactor;
                        npv += presentValue;
                        
                        if (cf.year === 0 || cf.year === 1 || cf.year === -1) {
                            console.log(\`  السنة \${cf.year}: CF=\${cf.freeCashFlow.toLocaleString()}, t=\${t}, PV=\${presentValue.toLocaleString()}\`);
                        }
                    });
                    
                    console.log(\`✅ [calculateNPV] NPV = \${npv.toLocaleString()} ريال\`);
                    
                    investmentData.kpis.npv = npv;
                    return npv;
                    
                } catch (error) {
                    console.error('❌ خطأ في حساب NPV:', error);
                    return 0;
                }
            }
            
            /**
             * حساب IRR (Internal Rate of Return) - معدل العائد الداخلي
             * يبحث عن معدل الخصم الذي يجعل NPV = 0
             * يستخدم Newton-Raphson method
             * 
             * @returns {number} IRR as percentage
             */
            function calculateIRR() {
                try {
                    console.log('📊 [calculateIRR] بدء حساب معدل العائد الداخلي...');
                    
                    const cashFlows = investmentData.cashFlow;
                    if (!cashFlows || cashFlows.length === 0) {
                        console.warn('⚠️ لا توجد تدفقات نقدية');
                        return 0;
                    }
                    
                    // دالة لحساب NPV عند معدل معين
                    const npvAtRate = (rate) => {
                        let npv = 0;
                        const constructionPeriod = investmentData.financing.constructionPeriod || 3;
                        
                        cashFlows.forEach(cf => {
                            let t;
                            if (cf.year <= 0) {
                                t = Math.abs(cf.year);
                            } else {
                                t = cf.year + constructionPeriod + 1;
                            }
                            npv += cf.freeCashFlow / Math.pow(1 + rate, t);
                        });
                        return npv;
                    };
                    
                    // البحث عن IRR باستخدام bisection method
                    let lowerRate = -0.9; // -90%
                    let upperRate = 5.0;   // 500%
                    let irr = 0.1;         // تخمين أولي: 10%
                    let npv = npvAtRate(irr);
                    let iterations = 0;
                    const maxIterations = 100;
                    const tolerance = 1000; // 1000 ريال
                    
                    while (Math.abs(npv) > tolerance && iterations < maxIterations) {
                        npv = npvAtRate(irr);
                        
                        if (npv > 0) {
                            lowerRate = irr;
                        } else {
                            upperRate = irr;
                        }
                        
                        irr = (lowerRate + upperRate) / 2;
                        iterations++;
                    }
                    
                    const irrPercent = irr * 100;
                    
                    console.log(\`✅ [calculateIRR] IRR = \${irrPercent.toFixed(2)}% (بعد \${iterations} محاولة)\`);
                    
                    investmentData.kpis.irr = irrPercent;
                    return irrPercent;
                    
                } catch (error) {
                    console.error('❌ خطأ في حساب IRR:', error);
                    return 0;
                }
            }
            
            /**
             * حساب ROI (Return on Investment) - العائد على الاستثمار
             * ROI = (Total Return - Total Investment) / Total Investment × 100%
             * 
             * @returns {number} ROI as percentage
             */
            function calculateROI() {
                try {
                    console.log('📊 [calculateROI] بدء حساب العائد على الاستثمار...');
                    
                    // استخدام الدالة الصحيحة المحدثة
                    let roi = 0;
                    
                    if (typeof window.calculateCorrectROI === 'function') {
                        roi = window.calculateCorrectROI();
                        console.log(\`✅ [calculateROI] استخدام الدالة الصحيحة - ROI = \${roi.toFixed(2)}%\`);
                    } else {
                        // Fallback: استخدام طريقة محسّنة من التدفقات النقدية
                        console.warn('⚠️ الدالة الصحيحة غير متاحة، استخدام الطريقة الاحتياطية المحسّنة');
                        
                        const cashFlows = investmentData.cashFlow;
                        if (!cashFlows || cashFlows.length === 0) {
                            console.warn('⚠️ لا توجد تدفقات نقدية');
                            return 0;
                        }
                        
                        // Total Investment = جميع التدفقات السالبة (فترة البناء)
                        let totalInvestment = 0;
                        cashFlows.forEach(cf => {
                            if (cf.freeCashFlow < 0) {
                                totalInvestment += Math.abs(cf.freeCashFlow);
                            }
                        });
                        
                        // Total Return = جميع التدفقات الموجبة (فترة التشغيل + Exit Value)
                        let totalReturn = 0;
                        cashFlows.forEach(cf => {
                            if (cf.freeCashFlow > 0) {
                                totalReturn += cf.freeCashFlow;
                            }
                        });
                        
                        if (totalInvestment === 0) {
                            console.warn('⚠️ إجمالي الاستثمار = 0');
                            return 0;
                        }
                        
                        // Total ROI = (Total Returns - Total Investment) / Total Investment × 100
                        const totalROI = ((totalReturn - totalInvestment) / totalInvestment) * 100;
                        
                        // حساب عدد سنوات التشغيل
                        const operationYears = cashFlows.filter(cf => cf.year > 0 && cf.freeCashFlow > 0).length;
                        
                        // Annualized ROI (العائد السنوي المعادل)
                        roi = operationYears > 0 ? totalROI / operationYears : totalROI;
                        
                        console.log(\`  الاستثمار الكلي: \${totalInvestment.toLocaleString()} ريال\`);
                        console.log(\`  العائد الكلي: \${totalReturn.toLocaleString()} ريال\`);
                        console.log(\`  Total ROI: \${totalROI.toFixed(2)}%\`);
                        console.log(\`  سنوات التشغيل: \${operationYears}\`);
                        console.log(\`✅ [calculateROI] Annualized ROI = \${roi.toFixed(2)}%\`);
                    }
                    
                    investmentData.kpis.roi = roi;
                    return roi;
                    
                } catch (error) {
                    console.error('❌ خطأ في حساب ROI:', error);
                    return 0;
                }
            }
            
            /**
             * حساب DSCR (Debt Service Coverage Ratio) - نسبة تغطية خدمة الدين
             * DSCR = NOI / Debt Service
             * يحسب المتوسط والحد الأدنى
             * 
             * @returns {object} {average, minimum, allYears}
             */
            function calculateDSCRAnalysis() {
                try {
                    console.log('📊 [calculateDSCRAnalysis] بدء تحليل DSCR...');
                    
                    const cashFlows = investmentData.cashFlow;
                    if (!cashFlows || cashFlows.length === 0) {
                        console.warn('⚠️ لا توجد تدفقات نقدية');
                        return { average: 0, minimum: 0, allYears: [] };
                    }
                    
                    // جمع قيم DSCR من فترة التشغيل فقط
                    const dscrValues = [];
                    cashFlows.forEach(cf => {
                        if (cf.year > 0 && cf.dscr !== null && cf.dscr !== undefined && !isNaN(cf.dscr)) {
                            dscrValues.push({
                                year: cf.year,
                                dscr: cf.dscr,
                                noi: cf.noi,
                                debtService: cf.debtService
                            });
                        }
                    });
                    
                    if (dscrValues.length === 0) {
                        console.warn('⚠️ لا توجد قيم DSCR (ربما لا يوجد تمويل بالدين)');
                        return { average: null, minimum: null, allYears: [] };
                    }
                    
                    // حساب المتوسط
                    const sum = dscrValues.reduce((acc, item) => acc + item.dscr, 0);
                    const average = sum / dscrValues.length;
                    
                    // إيجاد الحد الأدنى
                    const minimum = Math.min(...dscrValues.map(item => item.dscr));
                    const minYear = dscrValues.find(item => item.dscr === minimum);
                    
                    console.log(\`  عدد السنوات المحسوبة: \${dscrValues.length}\`);
                    console.log(\`  متوسط DSCR: \${average.toFixed(2)}x\`);
                    console.log(\`  الحد الأدنى DSCR: \${minimum.toFixed(2)}x (السنة \${minYear?.year})\`);
                    console.log(\`✅ [calculateDSCRAnalysis] اكتمل التحليل\`);
                    
                    investmentData.kpis.dscr = average;
                    investmentData.kpis.minDSCR = minimum;
                    
                    return {
                        average: average,
                        minimum: minimum,
                        minYear: minYear?.year,
                        allYears: dscrValues
                    };
                    
                } catch (error) {
                    console.error('❌ خطأ في تحليل DSCR:', error);
                    return { average: 0, minimum: 0, allYears: [] };
                }
            }
            
            /**
             * حساب Payback Period - فترة الاسترداد
             * السنة التي يصبح فيها التدفق النقدي التراكمي موجباً
             * 
             * @returns {number} Payback period in years
             */
            function calculatePaybackPeriod() {
                try {
                    console.log('📊 [calculatePaybackPeriod] بدء حساب فترة الاسترداد...');
                    
                    const cashFlows = investmentData.cashFlow;
                    if (!cashFlows || cashFlows.length === 0) {
                        console.warn('⚠️ لا توجد تدفقات نقدية');
                        return 0;
                    }
                    
                    // البحث عن أول سنة يصبح فيها التدفق التراكمي موجباً
                    for (let i = 0; i < cashFlows.length; i++) {
                        const cf = cashFlows[i];
                        if (cf.cumulativeCashFlow >= 0 && cf.year > 0) {
                            // وجدنا نقطة التعادل
                            const paybackPeriod = cf.year;
                            
                            console.log(\`  نقطة التعادل: السنة \${paybackPeriod}\`);
                            console.log(\`  التدفق التراكمي: \${cf.cumulativeCashFlow.toLocaleString()} ریال\`);
                            console.log(\`✅ [calculatePaybackPeriod] فترة الاسترداد = \${paybackPeriod} سنة\`);
                            
                            investmentData.kpis.paybackPeriod = paybackPeriod;
                            return paybackPeriod;
                        }
                    }
                    
                    // لم يتم الوصول لنقطة التعادل خلال فترة المشروع
                    // استخدام Extrapolation (الاستكمال الخطي) لتقدير فترة الاسترداد
                    const lastYear = cashFlows[cashFlows.length - 1];
                    console.warn(\`⚠️ لم يتم الوصول لنقطة التعادل حتى السنة \${lastYear.year}\`);
                    console.warn(\`  التدفق التراكمي النهائي: \${lastYear.cumulativeCashFlow.toLocaleString()} ریال\`);
                    
                    // حساب معدل التدفق النقدي السنوي للسنوات التشغيلية
                    const operationalYears = cashFlows.filter(cf => cf.year > 0 && cf.freeCashFlow > 0);
                    
                    if (operationalYears.length > 0 && lastYear.freeCashFlow > 0) {
                        // حساب متوسط التدفق النقدي السنوي الموجب
                        const avgAnnualCashFlow = operationalYears.reduce((sum, cf) => sum + cf.freeCashFlow, 0) / operationalYears.length;
                        
                        // حساب المبلغ المتبقي للوصول لنقطة التعادل
                        const remainingAmount = Math.abs(lastYear.cumulativeCashFlow);
                        
                        // تقدير عدد السنوات الإضافية المطلوبة
                        const additionalYears = remainingAmount / avgAnnualCashFlow;
                        
                        // فترة الاسترداد المقدرة = آخر سنة + سنوات إضافية
                        const estimatedPayback = lastYear.year + additionalYears;
                        
                        console.log(\`🔮 [Extrapolation] تقدير فترة الاسترداد:\`);
                        console.log(\`  📊 متوسط التدفق النقدي السنوي: \${avgAnnualCashFlow.toLocaleString()} ریال\`);
                        console.log(\`  💰 المبلغ المتبقي: \${remainingAmount.toLocaleString()} ریال\`);
                        console.log(\`  ➕ سنوات إضافية مقدرة: \${additionalYears.toFixed(1)} سنة\`);
                        console.log(\`  📅 فترة الاسترداد المقدرة: \${estimatedPayback.toFixed(1)} سنة\`);
                        console.log(\`✅ [calculatePaybackPeriod] فترة الاسترداد (مقدرة) = \${estimatedPayback.toFixed(1)} سنة\`);
                        
                        // حفظ القيمة المقدرة (مقربة لأقرب 0.1)
                        const roundedPayback = Math.round(estimatedPayback * 10) / 10;
                        investmentData.kpis.paybackPeriod = roundedPayback;
                        return roundedPayback;
                    }
                    
                    // إذا لم يكن هناك تدفقات نقدية موجبة، فالمشروع غير مربح
                    console.warn(\`⚠️ لا توجد تدفقات نقدية موجبة - المشروع غير مربح أو البيانات غير مكتملة\`);
                    investmentData.kpis.paybackPeriod = null; // غير قابل للحساب
                    return null;
                    
                } catch (error) {
                    console.error('❌ خطأ في حساب فترة الاسترداد:', error);
                    return 0;
                }
            }
            
            /**
             * حساب MOIC (Multiple on Invested Capital) - مضاعف رأس المال المستثمر
             * MOIC = Total Distributions / Total Invested Capital
             * 
             * @returns {number} MOIC as multiple (e.g., 2.5x)
             */
            function calculateMOIC() {
                try {
                    console.log('📊 [calculateMOIC] بدء حساب مضاعف رأس المال...');
                    
                    const cashFlows = investmentData.cashFlow;
                    if (!cashFlows || cashFlows.length === 0) {
                        console.warn('⚠️ لا توجد تدفقات نقدية');
                        return 0;
                    }
                    
                    // Total Invested Capital = رأس المال المدفوع فقط (equity)
                    let totalEquityInvested = 0;
                    cashFlows.forEach(cf => {
                        if (cf.equityInvested && cf.equityInvested > 0) {
                            totalEquityInvested += cf.equityInvested;
                        }
                    });
                    
                    // Total Distributions = جميع التدفقات النقدية الموجبة
                    let totalDistributions = 0;
                    cashFlows.forEach(cf => {
                        if (cf.freeCashFlow > 0) {
                            totalDistributions += cf.freeCashFlow;
                        }
                    });
                    
                    // MOIC = Distributions / Equity
                    const moic = totalEquityInvested > 0 ? totalDistributions / totalEquityInvested : 0;
                    
                    console.log(\`  رأس المال المستثمر: \${totalEquityInvested.toLocaleString()} ريال\`);
                    console.log(\`  التوزيعات الكلية: \${totalDistributions.toLocaleString()} ریال\`);
                    console.log(\`✅ [calculateMOIC] MOIC = \${moic.toFixed(2)}x\`);
                    
                    investmentData.kpis.moic = moic;
                    return moic;
                    
                } catch (error) {
                    console.error('❌ خطأ في حساب MOIC:', error);
                    return 0;
                }
            }
            
            /**
             * حساب جميع المؤشرات المالية دفعة واحدة
             */
            function calculateAllKPIs() {
                try {
                    console.log('🎯 [calculateAllKPIs] بدء حساب جميع المؤشرات المالية...');
                    console.log('='.repeat(60));
                    
                    const npv = calculateNPV();
                    const irr = calculateIRR();
                    const roi = calculateROI();
                    const dscrAnalysis = calculateDSCRAnalysis();
                    const paybackPeriod = calculatePaybackPeriod();
                    const moic = calculateMOIC();
                    
                    console.log('='.repeat(60));
                    console.log('📊 ملخص المؤشرات المالية:');
                    console.log(\`  NPV: \${npv.toLocaleString()} ريال\`);
                    console.log(\`  IRR: \${irr.toFixed(2)}%\`);
                    console.log(\`  ROI: \${roi.toFixed(2)}%\`);
                    console.log(\`  DSCR (متوسط): \${dscrAnalysis.average?.toFixed(2) || 'N/A'}x\`);
                    console.log(\`  DSCR (أدنى): \${dscrAnalysis.minimum?.toFixed(2) || 'N/A'}x\`);
                    console.log(\`  فترة الاسترداد: \${paybackPeriod || 'لم تتحقق'} سنة\`);
                    console.log(\`  MOIC: \${moic.toFixed(2)}x\`);
                    console.log('='.repeat(60));
                    console.log('✅ [calculateAllKPIs] اكتمل حساب جميع المؤشرات!');
                    
                    return {
                        npv,
                        irr,
                        roi,
                        dscrAverage: dscrAnalysis.average,
                        dscrMinimum: dscrAnalysis.minimum,
                        paybackPeriod,
                        moic
                    };
                    
                } catch (error) {
                    console.error('❌ خطأ في حساب المؤشرات المالية:', error);
                    return null;
                }
            }
            
            /**
             * ✅ NEW: تحليل حساسية Exit Value
             * يختبر تأثير تغيرات Exit Value على NPV و IRR
             * 
             * @returns {Array} مصفوفة من السيناريوهات مع النتائج
             */
            function runExitSensitivityAnalysis() {
                try {
                    console.log('🔬 [Sensitivity Analysis] بدء تحليل حساسية Exit Value...');
                    console.log('='.repeat(60));
                    
                    // حفظ القيم الأصلية
                    const originalExitValue = investmentData.exit?.calculatedValue || calculateExitValue();
                    const originalCashFlows = [...investmentData.cashFlow];
                    
                    // السيناريوهات
                    const scenarios = [
                        { name: 'متشائم جداً', factor: 0.7, color: '#DC2626' },  // -30%
                        { name: 'متشائم', factor: 0.85, color: '#F59E0B' },      // -15%
                        { name: 'متوقع (الأساس)', factor: 1.0, color: '#6B7280' }, // الأساس
                        { name: 'متفائل', factor: 1.15, color: '#9CA3AF' },      // +15%
                        { name: 'متفائل جداً', factor: 1.3, color: '#D1D5DB' }   // +30%
                    ];
                    
                    const results = scenarios.map(scenario => {
                        // تعديل Exit Value مؤقتاً
                        const adjustedExitValue = originalExitValue * scenario.factor;
                        investmentData.exit.calculatedValue = adjustedExitValue;
                        
                        // إعادة بناء الجدول مع Exit Value الجديد
                        buildCashFlowTable();
                        
                        // حساب KPIs
                        const npv = calculateNPV();
                        const irr = calculateIRR();
                        const moic = calculateMOIC();
                        
                        console.log(\`  \${scenario.name}: Exit=\${adjustedExitValue.toLocaleString()}, NPV=\${npv.toLocaleString()}, IRR=\${irr.toFixed(2)}%\`);
                        
                        return {
                            scenario: scenario.name,
                            factor: scenario.factor,
                            color: scenario.color,
                            exitValue: adjustedExitValue,
                            npv: npv,
                            irr: irr,
                            moic: moic,
                            change: ((scenario.factor - 1) * 100).toFixed(0) + '%'
                        };
                    });
                    
                    // استعادة القيم الأصلية
                    investmentData.exit.calculatedValue = originalExitValue;
                    investmentData.cashFlow = originalCashFlows;
                    buildCashFlowTable();
                    
                    console.log('='.repeat(60));
                    console.log('✅ [Sensitivity Analysis] اكتمل التحليل!');
                    
                    return results;
                    
                } catch (error) {
                    console.error('❌ خطأ في تحليل الحساسية:', error);
                    return [];
                }
            }
            
            /**
             * ✅ NEW: اختبار جميع طرق Exit Strategy
             * يقارن النتائج بين الطرق الأربعة
             * 
             * @returns {Array} مصفوفة من النتائج لكل طريقة
             */
            function testExitScenarios() {
                try {
                    console.log('🧪 [Test Exit Scenarios] بدء اختبار طرق الخروج...');
                    console.log('='.repeat(60));
                    
                    // حفظ القيم الأصلية
                    const originalMethod = document.getElementById('exitMethod')?.value || 'capRate';
                    const originalCashFlows = [...investmentData.cashFlow];
                    
                    // الطرق المتاحة
                    const methods = [
                        { value: 'capRate', name: 'معدل الرسملة (Cap Rate)', icon: '📊' },
                        { value: 'multiple', name: 'المضاعف (Multiple)', icon: '✖️' },
                        { value: 'appraisal', name: 'تقدير مباشر (Appraisal)', icon: '🏷️' },
                        { value: 'gordon', name: 'نموذج جوردون (Gordon Growth)', icon: '📈' }
                    ];
                    
                    const results = methods.map(method => {
                        // تغيير الطريقة مؤقتاً
                        if (document.getElementById('exitMethod')) {
                            document.getElementById('exitMethod').value = method.value;
                        }
                        
                        // تحديث الحقول
                        if (typeof updateExitMethodFields === 'function') {
                            updateExitMethodFields();
                        }
                        
                        // حساب Exit Value
                        const exitValue = calculateExitValue();
                        
                        // إعادة بناء الجدول
                        buildCashFlowTable();
                        
                        // حساب KPIs
                        const npv = calculateNPV();
                        const irr = calculateIRR();
                        const moic = calculateMOIC();
                        
                        console.log(\`  \${method.icon} \${method.name}:\`);
                        console.log(\`     Exit Value: \${exitValue.toLocaleString()} ريال\`);
                        console.log(\`     NPV: \${npv.toLocaleString()} ريال\`);
                        console.log(\`     IRR: \${irr.toFixed(2)}%\`);
                        
                        return {
                            method: method.value,
                            name: method.name,
                            icon: method.icon,
                            exitValue: exitValue,
                            npv: npv,
                            irr: irr,
                            moic: moic
                        };
                    });
                    
                    // استعادة القيمة الأصلية
                    if (document.getElementById('exitMethod')) {
                        document.getElementById('exitMethod').value = originalMethod;
                    }
                    if (typeof updateExitMethodFields === 'function') {
                        updateExitMethodFields();
                    }
                    investmentData.cashFlow = originalCashFlows;
                    buildCashFlowTable();
                    
                    console.log('='.repeat(60));
                    console.log('✅ [Test Exit Scenarios] اكتمل الاختبار!');
                    
                    // عرض جدول المقارنة في Console
                    console.table(results.map(r => ({
                        'الطريقة': r.name,
                        'Exit Value': r.exitValue.toLocaleString(),
                        'NPV': r.npv.toLocaleString(),
                        'IRR': r.irr.toFixed(2) + '%',
                        'MOIC': r.moic.toFixed(2) + 'x'
                    })));
                    
                    return results;
                    
                } catch (error) {
                    console.error('❌ خطأ في اختبار طرق الخروج:', error);
                    return [];
                }
            }
            
            /**
             * ✅ NEW: التحقق من معاملات Exit Strategy
             * يعرض تحذيرات للمدخلات غير المنطقية
             * 
             * @returns {Array} مصفوفة من التحذيرات
             */
            function validateExitParameters() {
                try {
                    const warnings = [];
                    
                    const exitMethod = document.getElementById('exitMethod')?.value || 'capRate';
                    const exitYear = parseFloat(document.getElementById('exitYear')?.value) || 10;
                    const sellingCosts = parseFloat(document.getElementById('sellingCosts')?.value) || 2.0;
                    const operatingPeriod = investmentData.financing?.operatingPeriod || 20;
                    
                    // تحقق 1: Gordon Growth vs WACC
                    if (exitMethod === 'gordon') {
                        const gordonGrowthRate = parseFloat(document.getElementById('gordonGrowthRate')?.value) || 2.5;
                        const wacc = investmentData.discounting?.calculatedWACC || 7.5;
                        
                        if (wacc <= gordonGrowthRate) {
                            warnings.push({
                                type: 'error',
                                message: '⛔ معدل الخصم (WACC) يجب أن يكون أكبر من معدل النمو الدائم',
                                details: \`WACC = \${wacc}%, Growth Rate = \${gordonGrowthRate}%\`
                            });
                        }
                        
                        if (gordonGrowthRate > 5) {
                            warnings.push({
                                type: 'warning',
                                message: '⚠️ معدل نمو دائم > 5% قد يكون غير واقعي',
                                details: 'معدلات النمو الدائم عادة تكون 2-3% (معدل التضخم)'
                            });
                        }
                    }
                    
                    // تحقق 2: Exit Year vs Operating Period
                    if (exitYear > operatingPeriod) {
                        warnings.push({
                            type: 'error',
                            message: '⛔ سنة الخروج خارج فترة التشغيل',
                            details: \`Exit Year = \${exitYear}, Operating Period = \${operatingPeriod}\`
                        });
                    }
                    
                    if (exitYear < 3) {
                        warnings.push({
                            type: 'warning',
                            message: '⚠️ سنة خروج مبكرة جداً (< 3 سنوات)',
                            details: 'قد لا يكفي الوقت لتحقيق عائد جيد'
                        });
                    }
                    
                    // تحقق 3: Selling Costs
                    if (sellingCosts > 10) {
                        warnings.push({
                            type: 'warning',
                            message: '⚠️ تكاليف البيع مرتفعة جداً (> 10%)',
                            details: \`Selling Costs = \${sellingCosts}%\`
                        });
                    }
                    
                    if (sellingCosts < 1) {
                        warnings.push({
                            type: 'info',
                            message: 'ℹ️ تكاليف البيع منخفضة جداً (< 1%)',
                            details: 'تأكد من تضمين جميع التكاليف (عمولة، رسوم قانونية، إلخ)'
                        });
                    }
                    
                    // تحقق 4: Cap Rate
                    if (exitMethod === 'capRate') {
                        const capRate = parseFloat(document.getElementById('exitCapRate')?.value) || 6.5;
                        
                        if (capRate < 3 || capRate > 15) {
                            warnings.push({
                                type: 'warning',
                                message: '⚠️ معدل رسملة غير معتاد',
                                details: \`Cap Rate = \${capRate}% (العادي: 4-12%)\`
                            });
                        }
                    }
                    
                    // تحقق 5: Multiple
                    if (exitMethod === 'multiple') {
                        const multiple = parseFloat(document.getElementById('exitMultiple')?.value) || 12;
                        
                        if (multiple < 5 || multiple > 20) {
                            warnings.push({
                                type: 'warning',
                                message: '⚠️ مضاعف غير معتاد',
                                details: \`Multiple = \${multiple}x (العادي: 8-15x)\`
                            });
                        }
                    }
                    
                    // عرض التحذيرات في Console
                    if (warnings.length > 0) {
                        console.log('⚠️ [Validation] تم اكتشاف تحذيرات:');
                        warnings.forEach(w => {
                            console.log(\`   \${w.message}\`);
                            console.log(\`      \${w.details}\`);
                        });
                    } else {
                        console.log('✅ [Validation] جميع المعاملات صحيحة');
                    }
                    
                    return warnings;
                    
                } catch (error) {
                    console.error('❌ خطأ في التحقق من المعاملات:', error);
                    return [];
                }
            }
            
            // تصدير الدوال
            window.calculateNPV = calculateNPV;
            window.calculateIRR = calculateIRR;
            window.calculateROI = calculateROI;
            window.calculateDSCRAnalysis = calculateDSCRAnalysis;
            window.calculatePaybackPeriod = calculatePaybackPeriod;
            window.calculateMOIC = calculateMOIC;
            window.calculateAllKPIs = calculateAllKPIs;
            
            /**
             * ✅ NEW: فتح Modal النتائج
             */
            function openAnalysisModal(title, subtitle) {
                const modal = document.getElementById('analysisModal');
                const modalTitle = document.getElementById('modalTitle');
                const modalSubtitle = document.getElementById('modalSubtitle');
                
                if (modalTitle) modalTitle.textContent = title;
                if (modalSubtitle) modalSubtitle.textContent = subtitle;
                
                if (modal) {
                    modal.classList.remove('hidden');
                    document.body.style.overflow = 'hidden';
                }
            }
            
            /**
             * ✅ NEW: إغلاق Modal النتائج
             */
            function closeAnalysisModal() {
                const modal = document.getElementById('analysisModal');
                if (modal) {
                    modal.classList.add('hidden');
                    document.body.style.overflow = 'auto';
                }
            }
            
            /**
             * ✅ NEW: عرض نتائج Sensitivity Analysis في Modal
             */
            function showSensitivityAnalysisModal() {
                try {
                    // تشغيل التحليل
                    const results = runExitSensitivityAnalysis();
                    
                    if (!results || results.length === 0) {
                        alert('⚠️ لا توجد نتائج للعرض');
                        return;
                    }
                    
                    // بناء محتوى Modal
                    let html = \`
                        <div class="space-y-6">
                            <!-- Summary Cards -->
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div class="bg-white/5 backdrop-filter backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                    <div class="text-sm text-white/90 font-medium mb-1">عدد السيناريوهات</div>
                                    <div class="text-3xl font-bold text-white">\${results.length}</div>
                                </div>
                                <div class="bg-white/5 backdrop-filter backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                    <div class="text-sm text-white/90 font-medium mb-1">أفضل NPV</div>
                                    <div class="text-2xl font-bold text-white">\${Math.max(...results.map(r => r.npv)).toLocaleString('ar-SA')} ر.س</div>
                                    <div class="text-xs text-white/90 mt-1">\${results.find(r => r.npv === Math.max(...results.map(r => r.npv))).scenario}</div>
                                </div>
                                <div class="bg-white/5 backdrop-filter backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                    <div class="text-sm text-white/90 font-medium mb-1">أعلى IRR</div>
                                    <div class="text-2xl font-bold text-white">\${Math.max(...results.map(r => r.irr)).toFixed(2)}%</div>
                                    <div class="text-xs text-white/90 mt-1">\${results.find(r => r.irr === Math.max(...results.map(r => r.irr))).scenario}</div>
                                </div>
                            </div>
                            
                            <!-- Results Table -->
                            <div class="bg-white/5 backdrop-filter backdrop-blur-sm/5 backdrop-filter backdrop-blur-sm rounded-xl shadow-sm border overflow-hidden">
                                <table class="w-full">
                                    <thead class="bg-gradient-to-r from-gray-800 to-black text-white">
                                        <tr>
                                            <th class="px-4 py-3 text-right text-sm font-semibold">السيناريو</th>
                                            <th class="px-4 py-3 text-right text-sm font-semibold">التغيير</th>
                                            <th class="px-4 py-3 text-right text-sm font-semibold">Exit Value</th>
                                            <th class="px-4 py-3 text-right text-sm font-semibold">NPV</th>
                                            <th class="px-4 py-3 text-right text-sm font-semibold">IRR</th>
                                            <th class="px-4 py-3 text-right text-sm font-semibold">MOIC</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-200">
                    \`;
                    
                    results.forEach((result, index) => {
                        const isBase = result.factor === 1.0;
                        const rowClass = isBase ? 'bg-white/8' : (index % 2 === 0 ? 'bg-white/5' : 'bg-white');
                        const changeClass = result.factor > 1 ? 'text-white/90' : (result.factor < 1 ? 'text-red-300' : 'text-white/80');
                        
                        html += \`
                            <tr class="\${rowClass} hover:bg-white/5 backdrop-filter backdrop-blur-sm/8 transition-colors">
                                <td class="px-4 py-3">
                                    <div class="flex items-center gap-2">
                                        <div class="w-3 h-3 rounded-full" style="background-color: \${result.color}"></div>
                                        <span class="font-medium \${isBase ? 'text-white/90' : ''}">\${result.scenario}</span>
                                        \${isBase ? '<span class="text-xs bg-gray-300 text-white px-2 py-1 rounded-full mr-2">الأساس</span>' : ''}
                                    </div>
                                </td>
                                <td class="px-4 py-3">
                                    <span class="font-bold \${changeClass}">\${result.change}</span>
                                </td>
                                <td class="px-4 py-3 text-white/90 font-mono">\${result.exitValue.toLocaleString('ar-SA')} ر.س</td>
                                <td class="px-4 py-3">
                                    <div class="font-mono font-bold \${result.npv >= 0 ? 'text-white/90' : 'text-red-300'}">
                                        \${result.npv.toLocaleString('ar-SA')} ر.س
                                    </div>
                                </td>
                                <td class="px-4 py-3">
                                    <div class="font-mono font-bold \${result.irr >= 10 ? 'text-white/90' : 'text-orange-300'}">
                                        \${result.irr.toFixed(2)}%
                                    </div>
                                </td>
                                <td class="px-4 py-3">
                                    <div class="font-mono \${result.moic >= 2 ? 'text-white/90' : 'text-white/80'}">
                                        \${result.moic.toFixed(2)}x
                                    </div>
                                </td>
                            </tr>
                        \`;
                    });
                    
                    html += \`
                                    </tbody>
                                </table>
                            </div>
                            
                            <!-- Insights -->
                            <div class="bg-white/5 backdrop-filter backdrop-blur-sm/8 border border-white/20 rounded-xl p-4">
                                <h4 class="font-semibold text-white mb-3 flex items-center">
                                    <i class="fas fa-lightbulb mr-2"></i>
                                    رؤى التحليل
                                </h4>
                                <ul class="space-y-2 text-sm text-white/90">
                                    <li class="flex items-start gap-2">
                                        <i class="fas fa-check-circle mt-1"></i>
                                        <span>تغيير Exit Value بنسبة ±30% يؤثر على NPV بمقدار <strong>\${(Math.max(...results.map(r => r.npv)) - Math.min(...results.map(r => r.npv))).toLocaleString('ar-SA')} ر.س</strong></span>
                                    </li>
                                    <li class="flex items-start gap-2">
                                        <i class="fas fa-check-circle mt-1"></i>
                                        <span>IRR يتراوح بين <strong>\${Math.min(...results.map(r => r.irr)).toFixed(2)}%</strong> و <strong>\${Math.max(...results.map(r => r.irr)).toFixed(2)}%</strong></span>
                                    </li>
                                    <li class="flex items-start gap-2">
                                        <i class="fas fa-check-circle mt-1"></i>
                                        <span>حتى في السيناريو المتشائم، NPV = <strong>\${Math.min(...results.map(r => r.npv)).toLocaleString('ar-SA')} ر.س</strong></span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    \`;
                    
                    // عرض في Modal
                    const modalContent = document.getElementById('modalContent');
                    if (modalContent) {
                        modalContent.innerHTML = html;
                    }
                    
                    openAnalysisModal('تحليل الحساسية', 'تأثير تغيرات Exit Value على ربحية المشروع');
                    
                } catch (error) {
                    console.error('❌ خطأ في عرض تحليل الحساسية:', error);
                    alert('⚠️ حدث خطأ في عرض النتائج');
                }
            }
            
            /**
             * ✅ NEW: عرض نتائج Test Exit Scenarios في Modal
             */
            function showExitScenariosModal() {
                try {
                    // تشغيل التحليل
                    const results = testExitScenarios();
                    
                    if (!results || results.length === 0) {
                        alert('⚠️ لا توجد نتائج للعرض');
                        return;
                    }
                    
                    // بناء محتوى Modal
                    let html = \`
                        <div class="space-y-6">
                            <!-- Method Cards -->
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    \`;
                    
                    results.forEach(result => {
                        const colors = {
                            capRate: { bg: 'from-gray-600/30 to-gray-700/30', border: 'border-white/20', text: 'text-white', icon: 'text-white/90' },
                            multiple: { bg: 'from-gray-600/30 to-gray-700/30', border: 'border-white/20', text: 'text-white', icon: 'text-white/90' },
                            appraisal: { bg: 'from-orange-600/30 to-orange-700/30', border: 'border-orange-400/30', text: 'text-orange-100', icon: 'text-orange-300' },
                            gordon: { bg: 'from-gray-600/30 to-gray-700/30', border: 'border-white/20', text: 'text-white', icon: 'text-white/90' }
                        };
                        const color = colors[result.method] || colors.capRate;
                        
                        html += \`
                            <div class="bg-gradient-to-br \${color.bg} rounded-xl p-4 border \${color.border}">
                                <div class="text-2xl mb-2 \${color.icon}">\${result.icon}</div>
                                <div class="text-sm font-medium \${color.text} mb-2">\${result.name}</div>
                                <div class="text-xs text-white/80 mb-1">Exit Value</div>
                                <div class="text-lg font-bold \${color.text} mb-2">\${(result.exitValue / 1000000).toFixed(1)}M ر.س</div>
                                <div class="flex justify-between text-xs">
                                    <span class="text-white/80">IRR:</span>
                                    <span class="font-bold \${color.text}">\${result.irr.toFixed(2)}%</span>
                                </div>
                            </div>
                        \`;
                    });
                    
                    html += \`
                            </div>
                            
                            <!-- Comparison Table -->
                            <div class="bg-white/5 backdrop-filter backdrop-blur-sm/5 backdrop-filter backdrop-blur-sm rounded-xl shadow-sm border overflow-hidden">
                                <div class="bg-gradient-to-r from-gray-700 to-gray-800 text-white px-4 py-3">
                                    <h4 class="font-semibold flex items-center">
                                        <i class="fas fa-table mr-2"></i>
                                        جدول المقارنة التفصيلي
                                    </h4>
                                </div>
                                <table class="w-full">
                                    <thead class="bg-white/5 backdrop-filter backdrop-blur-sm/5">
                                        <tr>
                                            <th class="px-4 py-3 text-right text-sm font-semibold text-white/90">الطريقة</th>
                                            <th class="px-4 py-3 text-right text-sm font-semibold text-white/90">Exit Value</th>
                                            <th class="px-4 py-3 text-right text-sm font-semibold text-white/90">NPV</th>
                                            <th class="px-4 py-3 text-right text-sm font-semibold text-white/90">IRR</th>
                                            <th class="px-4 py-3 text-right text-sm font-semibold text-white/90">MOIC</th>
                                            <th class="px-4 py-3 text-center text-sm font-semibold text-white/90">الأفضل</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-200">
                    \`;
                    
                    const maxNPV = Math.max(...results.map(r => r.npv));
                    const maxIRR = Math.max(...results.map(r => r.irr));
                    const maxMOIC = Math.max(...results.map(r => r.moic));
                    
                    results.forEach((result, index) => {
                        const rowClass = index % 2 === 0 ? 'bg-white' : 'bg-white/5';
                        const isBestNPV = result.npv === maxNPV;
                        const isBestIRR = result.irr === maxIRR;
                        const isBestMOIC = result.moic === maxMOIC;
                        
                        html += \`
                            <tr class="\${rowClass} hover:bg-white/5 backdrop-filter backdrop-blur-sm/8 transition-colors">
                                <td class="px-4 py-3">
                                    <div class="flex items-center gap-2">
                                        <span class="text-xl">\${result.icon}</span>
                                        <span class="font-medium">\${result.name}</span>
                                    </div>
                                </td>
                                <td class="px-4 py-3 font-mono text-white/90">\${result.exitValue.toLocaleString('ar-SA')} ر.س</td>
                                <td class="px-4 py-3">
                                    <div class="font-mono font-bold \${result.npv >= 0 ? 'text-white/90' : 'text-red-300'}">
                                        \${result.npv.toLocaleString('ar-SA')} ر.س
                                    </div>
                                </td>
                                <td class="px-4 py-3">
                                    <div class="font-mono font-bold \${result.irr >= 10 ? 'text-white/90' : 'text-orange-300'}">
                                        \${result.irr.toFixed(2)}%
                                    </div>
                                </td>
                                <td class="px-4 py-3 font-mono \${result.moic >= 2 ? 'text-white/90' : 'text-white/80'}">
                                    \${result.moic.toFixed(2)}x
                                </td>
                                <td class="px-4 py-3 text-center">
                                    <div class="flex justify-center gap-1">
                                        \${isBestNPV ? '<span class="text-xs bg-gray-300 text-white px-2 py-1 rounded-full">NPV</span>' : ''}
                                        \${isBestIRR ? '<span class="text-xs bg-gray-300 text-white px-2 py-1 rounded-full">IRR</span>' : ''}
                                        \${isBestMOIC ? '<span class="text-xs bg-gray-300 text-white px-2 py-1 rounded-full">MOIC</span>' : ''}
                                    </div>
                                </td>
                            </tr>
                        \`;
                    });
                    
                    html += \`
                                    </tbody>
                                </table>
                            </div>
                            
                            <!-- Recommendations -->
                            <div class="bg-white/5 backdrop-filter backdrop-blur-sm border border-white/20 rounded-xl p-4">
                                <h4 class="font-semibold text-white mb-3 flex items-center">
                                    <i class="fas fa-award mr-2"></i>
                                    التوصيات
                                </h4>
                                <div class="space-y-2 text-sm text-white/90">
                                    <div class="flex items-start gap-2">
                                        <i class="fas fa-star mt-1 text-white/90"></i>
                                        <span><strong>أفضل NPV:</strong> \${results.find(r => r.npv === maxNPV).name} (\${maxNPV.toLocaleString('ar-SA')} ر.س)</span>
                                    </div>
                                    <div class="flex items-start gap-2">
                                        <i class="fas fa-star mt-1 text-white/90"></i>
                                        <span><strong>أعلى IRR:</strong> \${results.find(r => r.irr === maxIRR).name} (\${maxIRR.toFixed(2)}%)</span>
                                    </div>
                                    <div class="flex items-start gap-2">
                                        <i class="fas fa-info-circle mt-1 text-white/90"></i>
                                        <span>الفرق بين أفضل وأسوأ Exit Value: <strong>\${(Math.max(...results.map(r => r.exitValue)) - Math.min(...results.map(r => r.exitValue))).toLocaleString('ar-SA')} ر.س</strong></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    \`;
                    
                    // عرض في Modal
                    const modalContent = document.getElementById('modalContent');
                    if (modalContent) {
                        modalContent.innerHTML = html;
                    }
                    
                    openAnalysisModal('مقارنة طرق الخروج', 'تحليل للطرق الأربعة لتقييم Exit Value');
                    
                } catch (error) {
                    console.error('❌ خطأ في عرض مقارنة طرق الخروج:', error);
                    alert('⚠️ حدث خطأ في عرض النتائج');
                }
            }
            
            /**
             * ✅ NEW: عرض نتائج Validation في Modal
             */
            function showValidationModal() {
                try {
                    // تشغيل التحليل
                    const warnings = validateExitParameters();
                    
                    // بناء محتوى Modal
                    let html = '';
                    
                    if (warnings.length === 0) {
                        html = \`
                            <div class="text-center py-12">
                                <div class="inline-block p-6 bg-white/10 rounded-full mb-4">
                                    <i class="fas fa-check-circle text-6xl text-white/90"></i>
                                </div>
                                <h3 class="text-2xl font-bold text-white mb-2">✅ جميع المعاملات صحيحة!</h3>
                                <p class="text-white/80">لا توجد تحذيرات أو أخطاء. يمكنك المتابعة بثقة.</p>
                            </div>
                        \`;
                    } else {
                        const errors = warnings.filter(w => w.type === 'error');
                        const warningsOnly = warnings.filter(w => w.type === 'warning');
                        const info = warnings.filter(w => w.type === 'info');
                        
                        html = \`
                            <div class="space-y-6">
                                <!-- Summary -->
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div class="bg-red-500/25 border border-red-400/30 rounded-xl p-4">
                                        <div class="flex items-center gap-3">
                                            <i class="fas fa-times-circle text-3xl text-red-300"></i>
                                            <div>
                                                <div class="text-2xl font-bold text-red-100">\${errors.length}</div>
                                                <div class="text-sm text-red-300">أخطاء حرجة</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="bg-amber-500/20 border border-amber-400/30 rounded-xl p-4">
                                        <div class="flex items-center gap-3">
                                            <i class="fas fa-exclamation-triangle text-3xl text-amber-300"></i>
                                            <div>
                                                <div class="text-2xl font-bold text-amber-100">\${warningsOnly.length}</div>
                                                <div class="text-sm text-amber-300">تحذيرات</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="bg-white/5 backdrop-filter backdrop-blur-sm/8 border border-white/20 rounded-xl p-4">
                                        <div class="flex items-center gap-3">
                                            <i class="fas fa-info-circle text-3xl text-white/90"></i>
                                            <div>
                                                <div class="text-2xl font-bold text-white">\${info.length}</div>
                                                <div class="text-sm text-white/90">ملاحظات</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Warnings List -->
                                <div class="space-y-3">
                        \`;
                        
                        warnings.forEach((warning, index) => {
                            const colors = {
                                error: { bg: 'bg-red-500/25', border: 'border-red-400/40', text: 'text-red-100', icon: 'text-red-300', iconName: 'times-circle' },
                                warning: { bg: 'bg-amber-500/20', border: 'border-amber-400/40', text: 'text-amber-100', icon: 'text-amber-300', iconName: 'exclamation-triangle' },
                                info: { bg: 'bg-white/8', border: 'border-white/20', text: 'text-white', icon: 'text-white/90', iconName: 'info-circle' }
                            };
                            const color = colors[warning.type] || colors.info;
                            
                            html += \`
                                <div class="\${color.bg} border \${color.border} rounded-lg p-4">
                                    <div class="flex items-start gap-3">
                                        <i class="fas fa-\${color.iconName} text-xl \${color.icon} mt-1"></i>
                                        <div class="flex-1">
                                            <div class="font-semibold \${color.text} mb-1">\${warning.message}</div>
                                            <div class="text-sm \${color.text} opacity-80">\${warning.details}</div>
                                        </div>
                                    </div>
                                </div>
                            \`;
                        });
                        
                        html += \`
                                </div>
                                
                                <!-- Action Required -->
                                \${errors.length > 0 ? \`
                                    <div class="bg-red-500/25 border border-red-400/40 rounded-xl p-4">
                                        <h4 class="font-semibold text-red-100 mb-2 flex items-center">
                                            <i class="fas fa-exclamation-circle mr-2"></i>
                                            إجراءات مطلوبة
                                        </h4>
                                        <p class="text-sm text-red-200">يجب إصلاح الأخطاء الحرجة قبل الاعتماد على نتائج التحليل.</p>
                                    </div>
                                \` : ''}
                            </div>
                        \`;
                    }
                    
                    // عرض في Modal
                    const modalContent = document.getElementById('modalContent');
                    if (modalContent) {
                        modalContent.innerHTML = html;
                    }
                    
                    openAnalysisModal(
                        'التحقق من المعاملات',
                        warnings.length === 0 ? 'جميع المعاملات صحيحة' : \`تم اكتشاف \${warnings.length} تحذير/خطأ\`
                    );
                    
                } catch (error) {
                    console.error('❌ خطأ في عرض التحقق:', error);
                    alert('⚠️ حدث خطأ في عرض النتائج');
                }
            }
            
            // ✅ NEW: تصدير الدوال الجديدة
            window.runExitSensitivityAnalysis = runExitSensitivityAnalysis;
            window.testExitScenarios = testExitScenarios;
            window.validateExitParameters = validateExitParameters;
            window.showSensitivityAnalysisModal = showSensitivityAnalysisModal;
            window.showExitScenariosModal = showExitScenariosModal;
            window.showValidationModal = showValidationModal;
            window.openAnalysisModal = openAnalysisModal;
            window.closeAnalysisModal = closeAnalysisModal;
            
            // ✅ تصدير investmentData إلى window للوصول من الدوال الأخرى
            window.investmentData = investmentData;

            // ====================================================================
            // KPI Dashboard UI Functions
            // ====================================================================

            /**
             * دالة مباشرة لإظهار وتحديث KPIs Dashboard
             */
            function showKPIDashboardDirectly() {
                console.log('🎯 [showKPIDashboardDirectly] طلب مباشر لإظهار Dashboard...');
                
                // التأكد من وجود بيانات التدفقات النقدية
                if (!investmentData.cashFlow || investmentData.cashFlow.length === 0) {
                    console.warn('⚠️ [showKPIDashboardDirectly] لا توجد بيانات تدفقات نقدية، سأقوم بإنشائها...');
                    
                    // إنشاء البيانات أولاً
                    if (typeof calculateCapitalExpenditure === 'function') {
                        calculateCapitalExpenditure();
                    } else if (typeof window.calculateCapitalExpenditure === 'function') {
                        window.calculateCapitalExpenditure();
                    }
                    
                    if (typeof buildCashFlowTable === 'function') {
                        buildCashFlowTable();
                    } else if (typeof window.buildCashFlowTable === 'function') {
                        window.buildCashFlowTable();
                    }
                }
                
                // تحديث Dashboard
                updateKPIDashboard();
                
                // التمرير إلى Dashboard
                setTimeout(() => {
                    const dashboardSection = document.getElementById('kpiDashboardSection');
                    if (dashboardSection) {
                        console.log('📍 [showKPIDashboardDirectly] التمرير إلى Dashboard...');
                        dashboardSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 500);
            }
            
            // تصدير للاستخدام الخارجي
            window.showKPIDashboardDirectly = showKPIDashboardDirectly;
            
            /**
             * Navigate to standalone KPI Dashboard page
             */
            
            /**
             * تحديث واجهة KPIs Dashboard - نسخة محسّنة مع معالجة أفضل
             */
            function updateKPIDashboard() {
                console.log('🎨 ═══════════════════════════════════════════');
                console.log('🎨 [updateKPIDashboard] بدء تحديث واجهة المؤشرات...');
                console.log('🎨 ═══════════════════════════════════════════');
                
                try {
                    // Step 0: إظهار resultsSection أولاً (الحاوي الخارجي)
                    const resultsSection = document.getElementById('resultsSection');
                    if (resultsSection) {
                        resultsSection.classList.remove('hidden');
                        resultsSection.style.display = 'block';
                        console.log('✅ [Step 0] تم إظهار resultsSection');
                    } else {
                        console.warn('⚠️ [Step 0] لم يتم العثور على resultsSection');
                    }
                    
                    // Step 1: إظهار القسم أولاً (مهم جداً!)
                    const dashboardSection = document.getElementById('kpiDashboardSection');
                    if (!dashboardSection) {
                        console.error('❌ [updateKPIDashboard] لم يتم العثور على #kpiDashboardSection');
                        alert('خطأ: لم يتم العثور على قسم المؤشرات في الصفحة!');
                        return;
                    }
                    
                    console.log('✅ [Step 1] تم العثور على #kpiDashboardSection');
                    
                    // إظهار القسم بشكل قوي
                    dashboardSection.style.display = 'block';
                    dashboardSection.style.opacity = '1';
                    dashboardSection.style.visibility = 'visible';
                    console.log('✅ [Step 1] تم إظهار قسم Dashboard بنجاح');
                    
                    // Step 2: حساب جميع المؤشرات
                    console.log('📊 [Step 2] حساب المؤشرات...');
                    
                    if (typeof calculateAllKPIs !== 'function') {
                        console.error('❌ [updateKPIDashboard] دالة calculateAllKPIs غير موجودة!');
                        alert('خطأ: دالة calculateAllKPIs غير متوفرة!');
                        return;
                    }
                    
                    const kpis = calculateAllKPIs();
                    
                    if (!kpis) {
                        console.error('❌ [updateKPIDashboard] فشل حساب المؤشرات - النتيجة null أو undefined');
                        alert('خطأ: فشل حساب المؤشرات. يرجى التأكد من إدخال جميع البيانات المطلوبة.');
                        // إظهار رسالة خطأ في البطاقات بدلاً من الإخفاء
                        const errorMsg = 'خطأ في الحساب';
                        document.querySelectorAll('.kpi-card .text-3xl').forEach(el => {
                            el.textContent = errorMsg;
                            el.className = 'text-3xl font-bold text-red-300 mb-2';
                        });
                        return;
                    }
                    
                    console.log('✅ [Step 2] تم حساب المؤشرات بنجاح:', kpis);
                    
                    console.log('✅ [Step 2] المؤشرات المحسوبة:', {
                        npv: kpis.npv?.toLocaleString() || 'N/A',
                        irr: (kpis.irr !== undefined ? kpis.irr.toFixed(2) + '%' : 'N/A'),
                        roi: (kpis.roi !== undefined ? kpis.roi.toFixed(2) + '%' : 'N/A'),
                        dscrAvg: kpis.dscrAverage?.toFixed(2) || 'N/A',
                        dscrMin: kpis.dscrMinimum?.toFixed(2) || 'N/A',
                        payback: kpis.paybackPeriod || 'N/A',
                        moic: (kpis.moic !== undefined ? kpis.moic.toFixed(2) + 'x' : 'N/A')
                    });
                    
                    // Step 3: تحديث كل بطاقة مع معالجة الأخطاء
                    console.log('🔄 [Step 3] تحديث البطاقات...');
                    
                    try { updateNPVCard(kpis.npv || 0); } catch (e) { console.error('خطأ في NPV:', e); }
                    try { updateIRRCard(kpis.irr || 0); } catch (e) { console.error('خطأ في IRR:', e); }
                    try { updateROICard(kpis.roi || 0); } catch (e) { console.error('خطأ في ROI:', e); }
                    try { updateDSCRCard(kpis.dscrAverage, kpis.dscrMinimum); } catch (e) { console.error('خطأ في DSCR:', e); }
                    try { updatePaybackCard(kpis.paybackPeriod); } catch (e) { console.error('خطأ في Payback:', e); }
                    try { updateMOICCard(kpis.moic || 0); } catch (e) { console.error('خطأ في MOIC:', e); }
                    
                    // Step 4: تحديث قرار الاستثمار
                    try {
                        updateInvestmentDecision(kpis);
                    } catch (e) {
                        console.error('خطأ في Investment Decision:', e);
                    }
                    
                    console.log('✅ ═══════════════════════════════════════════');
                    console.log('✅ [updateKPIDashboard] تم تحديث الواجهة بنجاح!');
                    console.log('✅ ═══════════════════════════════════════════');
                    
                    // Step 5: حفظ البيانات في sessionStorage للرسوم
                    try {
                        const kpiData = {
                            npv: kpis.npv || 0,
                            irr: kpis.irr || 0,
                            roi: kpis.roi || 0,
                            dscrAverage: kpis.dscrAverage || null,
                            dscrMinimum: kpis.dscrMinimum || null,
                            paybackPeriod: kpis.paybackPeriod || null,
                            moic: kpis.moic || 0,
                            timestamp: Date.now()
                        };
                        
                        const cashFlowData = {
                            years: [],
                            cashFlows: [],
                            cumulativeCashFlows: [],
                            studyPeriod: 20,
                            constructionPeriod: 3
                        };
                        
                        if (typeof window.investmentData !== 'undefined' && window.investmentData) {
                            if (window.investmentData.analysis) {
                                cashFlowData.studyPeriod = window.investmentData.analysis.studyPeriod || 20;
                            }
                            if (window.investmentData.financing) {
                                cashFlowData.constructionPeriod = window.investmentData.financing.constructionPeriod || 3;
                            }
                            
                            if (window.investmentData.cashFlow && window.investmentData.cashFlow.length > 0) {
                                let cumulative = 0;
                                window.investmentData.cashFlow.forEach(cf => {
                                    cashFlowData.years.push('سنة ' + cf.year);
                                    cashFlowData.cashFlows.push(cf.freeCashFlow || 0);
                                    cumulative += (cf.freeCashFlow || 0);
                                    cashFlowData.cumulativeCashFlows.push(cumulative);
                                });
                            }
                        }
                        
                        sessionStorage.setItem('kpiCalculations', JSON.stringify(kpiData));
                        sessionStorage.setItem('cashFlowData', JSON.stringify(cashFlowData));
                        
                        window.baseKpiData = JSON.parse(JSON.stringify(kpiData));
                        console.log('✅ تم حفظ بيانات الرسوم في sessionStorage');
                    } catch (e) {
                        console.error('❌ خطأ في حفظ البيانات:', e);
                    }
                    
                    // Step 6: رسم الرسوم البيانية وتحليل الحساسية
                    setTimeout(() => {
                        try {
                            console.log('📊 [Step 6] بدء رسم الرسوم البيانية...');
                            
                            console.log('  🔹 رسم التدفقات النقدية...');
                            createMainCashFlowChart();
                            
                            console.log('  🔹 رسم مقارنة المؤشرات...');
                            createMainKPIComparisonChart(kpis);
                            
                            console.log('  🔹 رسم التدفقات التراكمية...');
                            createMainCumulativeCashFlowChart();
                            
                            console.log('  🔹 تهيئة تحليل الحساسية...');
                            initializeMainSensitivityAnalysis(kpis);
                            
                            console.log('✅ [Step 6] اكتملت الرسوم البيانية بنجاح');
                        } catch (e) {
                            console.error('❌ خطأ في الرسوم البيانية:', e);
                            console.error('Stack trace:', e.stack);
                            alert('تنبيه: حدث خطأ في رسم بعض الرسوم البيانية. المؤشرات الأساسية تعمل بشكل صحيح.');
                        }
                    }, 500);
                    
                    // تمرير إلى Dashboard بعد التحديث
                    setTimeout(() => {
                        dashboardSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 300);
                    
                } catch (error) {
                    console.error('❌ ═══════════════════════════════════════════');
                    console.error('❌ خطأ في تحديث واجهة KPIs:', error);
                    console.error('❌ Stack:', error.stack);
                    console.error('❌ ═══════════════════════════════════════════');
                }
            }

            /**
             * تحديث بطاقة NPV
             */
            function updateNPVCard(npv) {
                const valueElement = document.getElementById('npvValue');
                const indicator = document.getElementById('npvIndicator');
                
                if (valueElement) {
                    valueElement.textContent = npv.toLocaleString('ar-SA') + ' ريال';
                }
                
                if (indicator) {
                    if (npv > 0) {
                        indicator.innerHTML = '<i class="fas fa-check-circle text-white/70 text-lg"></i>';
                        if (valueElement) valueElement.className = 'text-3xl font-bold text-white/90 mb-2';
                    } else {
                        indicator.innerHTML = '<i class="fas fa-times-circle text-red-500 text-lg"></i>';
                        if (valueElement) valueElement.className = 'text-3xl font-bold text-red-300 mb-2';
                    }
                }
            }

            /**
             * تحديث بطاقة IRR
             */
            function updateIRRCard(irr) {
                const valueElement = document.getElementById('irrValue');
                const indicator = document.getElementById('irrIndicator');
                const waccComparison = document.getElementById('waccComparison');
                
                const wacc = investmentData.discounting.calculatedWACC || 0;
                
                if (valueElement) {
                    valueElement.textContent = irr.toFixed(2) + '%';
                }
                
                if (waccComparison) {
                    waccComparison.textContent = wacc.toFixed(2) + '%';
                }
                
                if (indicator) {
                    if (irr > wacc + 0.5) {
                        indicator.innerHTML = '<i class="fas fa-arrow-up text-white/70 text-lg"></i>';
                        if (valueElement) valueElement.className = 'text-3xl font-bold text-white/90 mb-2';
                    } else if (irr < wacc - 0.5) {
                        indicator.innerHTML = '<i class="fas fa-arrow-down text-red-500 text-lg"></i>';
                        if (valueElement) valueElement.className = 'text-3xl font-bold text-red-300 mb-2';
                    } else {
                        indicator.innerHTML = '<i class="fas fa-minus text-yellow-500 text-lg"></i>';
                        if (valueElement) valueElement.className = 'text-3xl font-bold text-amber-300 mb-2';
                    }
                }
            }

            /**
             * تحديث بطاقة ROI
             */
            function updateROICard(roi) {
                const valueElement = document.getElementById('roiValue');
                const indicator = document.getElementById('roiIndicator');
                
                if (valueElement) {
                    valueElement.textContent = roi.toFixed(2) + '%';
                }
                
                if (indicator) {
                    if (roi > 20) {
                        indicator.innerHTML = '<i class="fas fa-star text-white/70 text-lg"></i>';
                        if (valueElement) valueElement.className = 'text-3xl font-bold text-white/90 mb-2';
                    } else if (roi >= 10) {
                        indicator.innerHTML = '<i class="fas fa-check text-yellow-500 text-lg"></i>';
                        if (valueElement) valueElement.className = 'text-3xl font-bold text-amber-300 mb-2';
                    } else {
                        indicator.innerHTML = '<i class="fas fa-exclamation text-red-500 text-lg"></i>';
                        if (valueElement) valueElement.className = 'text-3xl font-bold text-red-300 mb-2';
                    }
                }
            }

            /**
             * تحديث بطاقة DSCR
             */
            function updateDSCRCard(dscrAvg, dscrMin) {
                const valueElement = document.getElementById('dscrValue');
                const indicator = document.getElementById('dscrIndicator');
                const avgSpan = document.getElementById('dscrAvg');
                const minSpan = document.getElementById('dscrMin');
                
                if (dscrAvg === null || dscrAvg === undefined) {
                    if (valueElement) valueElement.textContent = 'N/A';
                    if (avgSpan) avgSpan.textContent = 'N/A';
                    if (minSpan) minSpan.textContent = 'N/A';
                    return;
                }
                
                if (valueElement) {
                    valueElement.textContent = dscrAvg.toFixed(2) + 'x';
                }
                
                if (avgSpan) {
                    avgSpan.textContent = dscrAvg.toFixed(2) + 'x';
                }
                
                if (minSpan) {
                    minSpan.textContent = dscrMin.toFixed(2) + 'x';
                }
                
                if (indicator) {
                    if (dscrMin >= 1.25) {
                        indicator.innerHTML = '<i class="fas fa-shield-alt text-white/70 text-lg"></i>';
                        if (valueElement) valueElement.className = 'text-3xl font-bold text-white/90 mb-2';
                    } else if (dscrMin >= 1.0) {
                        indicator.innerHTML = '<i class="fas fa-shield-alt text-yellow-500 text-lg"></i>';
                        if (valueElement) valueElement.className = 'text-3xl font-bold text-amber-300 mb-2';
                    } else {
                        indicator.innerHTML = '<i class="fas fa-exclamation-triangle text-red-500 text-lg"></i>';
                        if (valueElement) valueElement.className = 'text-3xl font-bold text-red-300 mb-2';
                    }
                }
            }

            /**
             * تحديث بطاقة Payback Period
             */
            function updatePaybackCard(payback) {
                const valueElement = document.getElementById('paybackValue');
                const indicator = document.getElementById('paybackIndicator');
                const interpretation = document.getElementById('paybackInterpretation');
                
                if (valueElement) {
                    if (payback === null || payback === undefined) {
                        // غير قابل للحساب - مشروع غير مربح
                        valueElement.textContent = 'غير محقق';
                        valueElement.className = 'text-2xl font-bold text-red-300 mb-2';
                        if (interpretation) {
                            interpretation.textContent = 'المشروع لا يحقق استرداد للاستثمار';
                        }
                    } else if (payback === 0) {
                        // القيمة القديمة للتوافق
                        valueElement.textContent = 'لم يتحقق';
                        valueElement.className = 'text-2xl font-bold text-red-300 mb-2';
                        if (interpretation) {
                            interpretation.textContent = 'لم يتحقق الاسترداد خلال فترة التشغيل';
                        }
                    } else {
                        // تحديد إذا كانت القيمة مقدرة (تحتوي على كسور عشرية)
                        const isEstimated = payback % 1 !== 0;
                        const operationPeriod = parseInt(document.getElementById('operatingPeriod')?.value) || 10;
                        const isExtrapolated = payback > operationPeriod;
                        
                        valueElement.textContent = payback.toFixed(1) + ' سنة' + (isExtrapolated ? ' *' : '');
                        
                        if (interpretation && isExtrapolated) {
                            interpretation.textContent = '* مقدرة بالاستكمال الخطي (خارج فترة التشغيل)';
                            interpretation.className = 'text-xs text-orange-300 font-semibold';
                        }
                    }
                }
                
                if (indicator && payback > 0) {
                    if (payback <= 10) {
                        indicator.innerHTML = '<i class="fas fa-thumbs-up text-white/70 text-lg"></i>';
                        if (valueElement) valueElement.className = 'text-3xl font-bold text-white/90 mb-2';
                    } else if (payback <= 15) {
                        indicator.innerHTML = '<i class="fas fa-meh text-yellow-500 text-lg"></i>';
                        if (valueElement) valueElement.className = 'text-3xl font-bold text-amber-300 mb-2';
                    } else {
                        indicator.innerHTML = '<i class="fas fa-thumbs-down text-orange-500 text-lg"></i>';
                        if (valueElement) valueElement.className = 'text-3xl font-bold text-orange-300 mb-2';
                    }
                } else if (indicator) {
                    indicator.innerHTML = '<i class="fas fa-times-circle text-red-500 text-lg"></i>';
                }
            }

            /**
             * تحديث بطاقة MOIC
             */
            function updateMOICCard(moic) {
                const valueElement = document.getElementById('moicValue');
                const indicator = document.getElementById('moicIndicator');
                
                if (valueElement) {
                    valueElement.textContent = moic.toFixed(2) + 'x';
                }
                
                if (indicator) {
                    if (moic > 2.0) {
                        indicator.innerHTML = '<i class="fas fa-trophy text-white/70 text-lg"></i>';
                        if (valueElement) valueElement.className = 'text-3xl font-bold text-white/90 mb-2';
                    } else if (moic >= 1.5) {
                        indicator.innerHTML = '<i class="fas fa-medal text-yellow-500 text-lg"></i>';
                        if (valueElement) valueElement.className = 'text-3xl font-bold text-amber-300 mb-2';
                    } else {
                        indicator.innerHTML = '<i class="fas fa-flag text-red-500 text-lg"></i>';
                        if (valueElement) valueElement.className = 'text-3xl font-bold text-red-300 mb-2';
                    }
                }
            }

            /**
             * تحديث قرار الاستثمار
             */
            function updateInvestmentDecision(kpis) {
                let score = 0;
                const strengths = [];
                const weaknesses = [];
                
                const wacc = investmentData.discounting.calculatedWACC || 0;
                
                // فحص NPV
                if (kpis.npv > 0) {
                    score++;
                    strengths.push('NPV موجب (' + kpis.npv.toLocaleString('ar-SA') + ' ريال)');
                } else {
                    weaknesses.push('NPV سالب (' + kpis.npv.toLocaleString('ar-SA') + ' ريال)');
                }
                
                // فحص IRR
                if (kpis.irr > wacc) {
                    score++;
                    strengths.push('IRR (' + kpis.irr.toFixed(2) + '%) أعلى من WACC (' + wacc.toFixed(2) + '%)');
                } else {
                    weaknesses.push('IRR (' + kpis.irr.toFixed(2) + '%) أقل من WACC (' + wacc.toFixed(2) + '%)');
                }
                
                // فحص ROI
                if (kpis.roi > 20) {
                    score++;
                    strengths.push('ROI ممتاز (' + kpis.roi.toFixed(2) + '%)');
                } else if (kpis.roi >= 10) {
                    score += 0.5;
                    strengths.push('ROI جيد (' + kpis.roi.toFixed(2) + '%)');
                } else {
                    weaknesses.push('ROI ضعيف (' + kpis.roi.toFixed(2) + '%)');
                }
                
                // فحص DSCR
                if (kpis.dscrMinimum !== null && kpis.dscrMinimum !== undefined) {
                    if (kpis.dscrMinimum >= 1.25) {
                        score++;
                        strengths.push('DSCR آمن (أدنى: ' + kpis.dscrMinimum.toFixed(2) + 'x)');
                    } else if (kpis.dscrMinimum >= 1.0) {
                        score += 0.5;
                        strengths.push('DSCR مقبول (أدنى: ' + kpis.dscrMinimum.toFixed(2) + 'x)');
                    } else {
                        weaknesses.push('DSCR خطر (أدنى: ' + kpis.dscrMinimum.toFixed(2) + 'x)');
                    }
                }
                
                // فحص Payback
                if (kpis.paybackPeriod > 0) {
                    if (kpis.paybackPeriod <= 10) {
                        score++;
                        strengths.push('فترة استرداد ممتازة (' + kpis.paybackPeriod + ' سنة)');
                    } else if (kpis.paybackPeriod <= 15) {
                        score += 0.5;
                        strengths.push('فترة استرداد مقبولة (' + kpis.paybackPeriod + ' سنة)');
                    } else {
                        weaknesses.push('فترة استرداد طويلة (' + kpis.paybackPeriod + ' سنة)');
                    }
                } else {
                    weaknesses.push('لم تتحقق نقطة التعادل خلال فترة المشروع');
                }
                
                // فحص MOIC
                if (kpis.moic > 2.0) {
                    score++;
                    strengths.push('MOIC ممتاز (' + kpis.moic.toFixed(2) + 'x)');
                } else if (kpis.moic >= 1.5) {
                    score += 0.5;
                    strengths.push('MOIC جيد (' + kpis.moic.toFixed(2) + 'x)');
                } else {
                    weaknesses.push('MOIC ضعيف (' + kpis.moic.toFixed(2) + 'x)');
                }
                
                // تحديد القرار
                let decision, decisionClass, decisionIcon;
                if (score >= 5) {
                    decision = '✅ موصى به بشدة';
                    decisionClass = 'bg-white/10 border-white/20';
                    decisionIcon = '<i class="fas fa-thumbs-up text-white/70"></i>';
                } else if (score >= 3.5) {
                    decision = '👍 موصى به';
                    decisionClass = 'bg-white/8 border-gray-400';
                    decisionIcon = '<i class="fas fa-check-circle text-gray-400"></i>';
                } else if (score >= 2) {
                    decision = '⚠️ مقبول مع تحفظات';
                    decisionClass = 'bg-amber-500/25 border-amber-400/40';
                    decisionIcon = '<i class="fas fa-exclamation-circle text-yellow-500"></i>';
                } else {
                    decision = '❌ غير موصى به';
                    decisionClass = 'bg-red-500/25 border-red-400/40';
                    decisionIcon = '<i class="fas fa-times-circle text-red-500"></i>';
                }
                
                // تحديث الواجهة
                const decisionPanel = document.getElementById('overallDecision');
                if (decisionPanel) {
                    decisionPanel.className = 'mb-6 p-6 rounded-lg border-2 ' + decisionClass;
                }
                
                const decisionText = document.getElementById('decisionText');
                if (decisionText) {
                    decisionText.textContent = decision;
                }
                
                const decisionIconElement = document.getElementById('decisionIcon');
                if (decisionIconElement) {
                    decisionIconElement.innerHTML = decisionIcon;
                }
                
                const scoreValue = document.getElementById('scoreValue');
                if (scoreValue) {
                    scoreValue.textContent = score.toFixed(1) + '/6';
                }
                
                // تحديث نقاط القوة
                const strengthsList = document.getElementById('strengthsList');
                if (strengthsList) {
                    if (strengths.length > 0) {
                        strengthsList.innerHTML = strengths.map(s => 
                            '<li class="flex items-start gap-2"><i class="fas fa-check-circle mt-1"></i><span>' + s + '</span></li>'
                        ).join('');
                    } else {
                        strengthsList.innerHTML = '<li class="flex items-start gap-2"><i class="fas fa-info-circle mt-1"></i><span>لا توجد نقاط قوة بارزة</span></li>';
                    }
                }
                
                // تحديث نقاط الضعف
                const weaknessesList = document.getElementById('weaknessesList');
                if (weaknessesList) {
                    if (weaknesses.length > 0) {
                        weaknessesList.innerHTML = weaknesses.map(w => 
                            '<li class="flex items-start gap-2"><i class="fas fa-exclamation-triangle mt-1"></i><span>' + w + '</span></li>'
                        ).join('');
                    } else {
                        weaknessesList.innerHTML = '<li class="flex items-start gap-2"><i class="fas fa-check-circle mt-1"></i><span>لا توجد نقاط ضعف ملحوظة</span></li>';
                    }
                }
            }

            // تصدير دوال الواجهة
            window.updateKPIDashboard = updateKPIDashboard;
            window.updateNPVCard = updateNPVCard;
            window.updateIRRCard = updateIRRCard;
            window.updateROICard = updateROICard;
            window.updateDSCRCard = updateDSCRCard;
            window.updatePaybackCard = updatePaybackCard;
            window.updateMOICCard = updateMOICCard;
            window.updateInvestmentDecision = updateInvestmentDecision;

            // ═══════════════════════════════════════════════════════════════════
            // CHARTS AND SENSITIVITY ANALYSIS FUNCTIONS
            // ═══════════════════════════════════════════════════════════════════
            
            let mainCashFlowChartInstance = null;
            let mainKpiComparisonChartInstance = null;
            let mainCumulativeCashFlowChartInstance = null;
            let mainNpvSensitivityChartInstance = null;
            let mainIrrSensitivityChartInstance = null;
            
            function createMainCashFlowChart() {
                console.log('📊 [createMainCashFlowChart] بدء الرسم...');
                
                const cashFlowDataStr = sessionStorage.getItem('cashFlowData');
                if (!cashFlowDataStr) {
                    console.error('❌ لا توجد بيانات تدفقات نقدية');
                    return;
                }
                
                const cashFlowData = JSON.parse(cashFlowDataStr);
                const years = cashFlowData.years || [];
                const cashFlows = cashFlowData.cashFlows || [];
                
                const ctx = document.getElementById('mainCashFlowChart');
                if (!ctx) return;
                
                if (mainCashFlowChartInstance) {
                    mainCashFlowChartInstance.destroy();
                }
                
                mainCashFlowChartInstance = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: years,
                        datasets: [{
                            label: 'التدفق النقدي (ريال)',
                            data: cashFlows,
                            backgroundColor: cashFlows.map(cf => cf >= 0 ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)'),
                            borderColor: cashFlows.map(cf => cf >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'),
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: true, position: 'top' },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return context.dataset.label + ': ' + context.parsed.y.toLocaleString('ar-SA') + ' ريال';
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: function(value) {
                                        return value.toLocaleString('ar-SA');
                                    }
                                }
                            }
                        }
                    }
                });
                
                console.log('✅ تم إنشاء رسم التدفقات النقدية');
            }
            
            function createMainKPIComparisonChart(kpiData) {
                console.log('📊 [createMainKPIComparisonChart] بدء الرسم...');
                
                const ctx = document.getElementById('mainKpiComparisonChart');
                if (!ctx) return;
                
                if (mainKpiComparisonChartInstance) {
                    mainKpiComparisonChartInstance.destroy();
                }
                
                const npvScore = kpiData.npv >= 0 ? Math.min(100, Math.max(0, (kpiData.npv / 50000000) * 100)) : 0;
                const irrScore = Math.min(100, Math.max(0, (kpiData.irr / 25) * 100));
                const roiScore = Math.min(100, Math.max(0, (kpiData.roi / 100) * 100));
                const dscrScore = kpiData.dscrAverage ? Math.min(100, Math.max(0, (kpiData.dscrAverage / 2.5) * 100)) : 0;
                const moicScore = Math.min(100, Math.max(0, (kpiData.moic / 5) * 100));
                
                mainKpiComparisonChartInstance = new Chart(ctx, {
                    type: 'radar',
                    data: {
                        labels: ['NPV', 'IRR', 'ROI', 'DSCR', 'MOIC'],
                        datasets: [{
                            label: 'أداء المؤشرات',
                            data: [npvScore, irrScore, roiScore, dscrScore, moicScore],
                            backgroundColor: 'rgba(99, 102, 241, 0.2)',
                            borderColor: 'rgb(99, 102, 241)',
                            borderWidth: 2,
                            pointBackgroundColor: 'rgb(99, 102, 241)',
                            pointBorderColor: '#fff',
                            pointHoverBackgroundColor: '#fff',
                            pointHoverBorderColor: 'rgb(99, 102, 241)'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            r: {
                                beginAtZero: true,
                                max: 100,
                                ticks: { stepSize: 20 }
                            }
                        },
                        plugins: {
                            legend: { display: true, position: 'top' }
                        }
                    }
                });
                
                console.log('✅ تم إنشاء رسم مقارنة المؤشرات');
            }
            
            function createMainCumulativeCashFlowChart() {
                console.log('📊 [createMainCumulativeCashFlowChart] بدء الرسم...');
                
                const cashFlowDataStr = sessionStorage.getItem('cashFlowData');
                if (!cashFlowDataStr) return;
                
                const cashFlowData = JSON.parse(cashFlowDataStr);
                const years = cashFlowData.years || [];
                const cumulativeCashFlows = cashFlowData.cumulativeCashFlows || [];
                
                const ctx = document.getElementById('mainCumulativeCashFlowChart');
                if (!ctx) return;
                
                if (mainCumulativeCashFlowChartInstance) {
                    mainCumulativeCashFlowChartInstance.destroy();
                }
                
                mainCumulativeCashFlowChartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: years,
                        datasets: [{
                            label: 'التدفق النقدي التراكمي (ريال)',
                            data: cumulativeCashFlows,
                            borderColor: 'rgb(99, 102, 241)',
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: true, position: 'top' },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return 'التراكمي: ' + context.parsed.y.toLocaleString('ar-SA') + ' ريال';
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                ticks: {
                                    callback: function(value) {
                                        return value.toLocaleString('ar-SA');
                                    }
                                }
                            }
                        }
                    }
                });
                
                console.log('✅ تم إنشاء رسم التدفقات التراكمية');
            }
            
            function initializeMainSensitivityAnalysis(kpiData) {
                console.log('🔍 [initializeMainSensitivityAnalysis] بدء التهيئة...');
                
                createMainNPVSensitivityChart();
                createMainIRRSensitivityChart();
                updateMainSensitivityTable();
                
                console.log('✅ تم تهيئة تحليل الحساسية');
            }
            
            function createMainNPVSensitivityChart() {
                const ctx = document.getElementById('mainNpvSensitivityChart');
                if (!ctx) return;
                
                if (mainNpvSensitivityChartInstance) {
                    mainNpvSensitivityChartInstance.destroy();
                }
                
                const cashFlowDataStr = sessionStorage.getItem('cashFlowData');
                const baseNPV = window.baseKpiData?.npv || 0;
                
                const discountRates = [5, 8, 10, 12, 15, 18, 20];
                const npvValues = discountRates.map(rate => {
                    if (cashFlowDataStr) {
                        const cashFlowData = JSON.parse(cashFlowDataStr);
                        let npv = 0;
                        cashFlowData.cashFlows.forEach((cf, index) => {
                            npv += cf / Math.pow(1 + rate / 100, index);
                        });
                        return npv;
                    }
                    return baseNPV * (1 - (rate - 12) / 100);
                });
                
                mainNpvSensitivityChartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: discountRates.map(r => r + '%'),
                        datasets: [{
                            label: 'NPV (ريال)',
                            data: npvValues,
                            borderColor: 'rgb(59, 130, 246)',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return 'NPV: ' + context.parsed.y.toLocaleString('ar-SA') + ' ريال';
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                ticks: {
                                    callback: function(value) {
                                        return value.toLocaleString('ar-SA');
                                    }
                                }
                            }
                        }
                    }
                });
            }
            
            function createMainIRRSensitivityChart() {
                const ctx = document.getElementById('mainIrrSensitivityChart');
                if (!ctx) return;
                
                if (mainIrrSensitivityChartInstance) {
                    mainIrrSensitivityChartInstance.destroy();
                }
                
                const baseIRR = window.baseKpiData?.irr || 0;
                const changes = [-30, -20, -10, 0, 10, 20, 30];
                const irrValues = changes.map(change => baseIRR + (change * 0.15));
                
                mainIrrSensitivityChartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: changes.map(c => (c >= 0 ? '+' : '') + c + '%'),
                        datasets: [{
                            label: 'IRR (%)',
                            data: irrValues,
                            borderColor: 'rgb(168, 85, 247)',
                            backgroundColor: 'rgba(168, 85, 247, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return 'IRR: ' + context.parsed.y.toFixed(2) + '%';
                                    }
                                }
                            }
                        }
                    }
                });
            }
            
            function updateMainSensitivityAnalysis() {
                const discountRate = parseFloat(document.getElementById('mainDiscountRateSlider').value);
                const revenueChange = parseFloat(document.getElementById('mainRevenueChangeSlider').value);
                const costChange = parseFloat(document.getElementById('mainCostChangeSlider').value);
                
                document.getElementById('mainDiscountRateValue').textContent = discountRate.toFixed(1) + '%';
                document.getElementById('mainRevenueChangeValue').textContent = (revenueChange >= 0 ? '+' : '') + revenueChange + '%';
                document.getElementById('mainCostChangeValue').textContent = (costChange >= 0 ? '+' : '') + costChange + '%';
                
                const baseNPV = window.baseKpiData?.npv || 0;
                const baseIRR = window.baseKpiData?.irr || 0;
                
                const newNPV = baseNPV * (1 + revenueChange / 100) * (1 - costChange / 100) * (1 - (discountRate - 12) / 50);
                const newIRR = baseIRR * (1 + revenueChange / 100) * (1 - costChange / 100);
                
                document.getElementById('mainNpvSensitivityValue').innerHTML = 
                    '<p class="text-sm text-white/80">NPV الحالي:</p>' +
                    '<p class="text-2xl font-bold ' + (newNPV >= 0 ? 'text-white/90' : 'text-red-300') + '">' +
                    (newNPV >= 0 ? '+' : '') + newNPV.toLocaleString('ar-SA', {maximumFractionDigits: 0}) + ' ريال</p>';
                
                document.getElementById('mainIrrSensitivityValue').innerHTML = 
                    '<p class="text-sm text-white/80">IRR الحالي:</p>' +
                    '<p class="text-2xl font-bold text-white/90">' + newIRR.toFixed(2) + '%</p>';
                
                updateMainSensitivityTable();
            }
            
            function updateMainSensitivityTable() {
                const discountRate = parseFloat(document.getElementById('mainDiscountRateSlider')?.value || 12);
                const revenueChange = parseFloat(document.getElementById('mainRevenueChangeSlider')?.value || 0);
                const costChange = parseFloat(document.getElementById('mainCostChangeSlider')?.value || 0);
                
                const baseNPV = window.baseKpiData?.npv || 0;
                const baseIRR = window.baseKpiData?.irr || 0;
                
                const tableRows = [
                    {
                        variable: 'معدل الخصم',
                        base: '12.0%',
                        change: discountRate.toFixed(1) + '%',
                        npv: baseNPV * (1 - (discountRate - 12) / 50),
                        irr: baseIRR,
                        impact: discountRate !== 12 ? 'متوسط' : '-'
                    },
                    {
                        variable: 'الإيرادات',
                        base: '100%',
                        change: (revenueChange >= 0 ? '+' : '') + revenueChange + '%',
                        npv: baseNPV * (1 + revenueChange / 100),
                        irr: baseIRR * (1 + revenueChange / 100),
                        impact: revenueChange !== 0 ? 'عالي' : '-'
                    },
                    {
                        variable: 'التكاليف',
                        base: '100%',
                        change: (costChange >= 0 ? '+' : '') + costChange + '%',
                        npv: baseNPV * (1 - costChange / 100),
                        irr: baseIRR * (1 - costChange / 100),
                        impact: costChange !== 0 ? 'عالي' : '-'
                    }
                ];
                
                const tbody = document.getElementById('mainSensitivityTableBody');
                if (tbody) {
                    tbody.innerHTML = tableRows.map(row => 
                        '<tr class="border-b hover:bg-white/5 backdrop-filter backdrop-blur-sm/5">' +
                        '<td class="p-3 font-medium">' + row.variable + '</td>' +
                        '<td class="p-3 text-center">' + row.base + '</td>' +
                        '<td class="p-3 text-center font-semibold">' + row.change + '</td>' +
                        '<td class="p-3 text-center ' + (row.npv >= 0 ? 'text-white/90' : 'text-red-300') + '">' + 
                        row.npv.toLocaleString('ar-SA', {maximumFractionDigits: 0}) + '</td>' +
                        '<td class="p-3 text-center text-white/90">' + row.irr.toFixed(2) + '%</td>' +
                        '<td class="p-3 text-center">' +
                        '<span class="px-2 py-1 rounded text-xs ' + 
                        (row.impact === 'عالي' ? 'bg-red-500/25 text-red-200' :
                         row.impact === 'متوسط' ? 'bg-amber-500/25 text-amber-200' :
                         'bg-white/8 text-white/80') + '">' + row.impact + '</span>' +
                        '</td></tr>'
                    ).join('');
                }
            }
            
            window.createMainCashFlowChart = createMainCashFlowChart;
            window.createMainKPIComparisonChart = createMainKPIComparisonChart;
            window.createMainCumulativeCashFlowChart = createMainCumulativeCashFlowChart;
            window.initializeMainSensitivityAnalysis = initializeMainSensitivityAnalysis;
            window.updateMainSensitivityAnalysis = updateMainSensitivityAnalysis;

            // Land Acquisition Functions
            
            /**
             * حساب الإيجار التراكمي مع الزيادات الدورية
             * @param {number} baseRentPerSqm - الإيجار السنوي الأساسي للمتر المربع
             * @param {number} landArea - مساحة الأرض بالمتر المربع
             * @param {number} leaseTerm - مدة الإيجار بالسنوات
             * @param {number} increasePercentage - نسبة الزيادة (مثال: 5 تعني 5%)
             * @param {number} increaseFrequency - تكرار الزيادة بالسنوات (مثال: 3 تعني كل 3 سنوات)
             * @returns {object} كائن يحتوي على التفاصيل المالية
             */
            function calculateCumulativeRent(baseRentPerSqm, landArea, leaseTerm, increasePercentage, increaseFrequency) {
                console.log('📊 [calculateCumulativeRent] البيانات المدخلة:', {
                    baseRentPerSqm,
                    landArea,
                    leaseTerm,
                    increasePercentage,
                    increaseFrequency
                });
                
                let totalCost = 0;
                let currentRentPerSqm = baseRentPerSqm;
                let numberOfIncreases = 0;
                const yearlyBreakdown = [];
                
                // إذا لم تكن هناك زيادة، استخدم الحساب البسيط
                if (increasePercentage <= 0 || increaseFrequency <= 0) {
                    const simpleTotal = baseRentPerSqm * landArea * leaseTerm;
                    return {
                        total: simpleTotal,
                        totalWithoutIncrease: simpleTotal,
                        increaseDifference: 0,
                        numberOfIncreases: 0,
                        averageAnnual: simpleTotal / leaseTerm,
                        yearlyBreakdown: []
                    };
                }
                
                // حساب تراكمي سنة بسنة
                for (let year = 1; year <= leaseTerm; year++) {
                    // تحقق من موعد الزيادة
                    if (year > 1 && (year - 1) % increaseFrequency === 0) {
                        // تطبيق الزيادة بشكل تراكمي
                        currentRentPerSqm = currentRentPerSqm * (1 + increasePercentage / 100);
                        numberOfIncreases++;
                        console.log(\`   📈 زيادة في السنة \${year}: الإيجار الجديد = \${currentRentPerSqm.toFixed(2)} ريال/م²\`);
                    }
                    
                    const yearlyRent = currentRentPerSqm * landArea;
                    totalCost += yearlyRent;
                    
                    yearlyBreakdown.push({
                        year: year,
                        rentPerSqm: currentRentPerSqm,
                        totalRent: yearlyRent,
                        isIncreaseYear: year > 1 && (year - 1) % increaseFrequency === 0
                    });
                }
                
                // حساب الإيجار بدون زيادات للمقارنة
                const totalWithoutIncrease = baseRentPerSqm * landArea * leaseTerm;
                const increaseDifference = totalCost - totalWithoutIncrease;
                const averageAnnual = totalCost / leaseTerm;
                
                console.log('✅ [calculateCumulativeRent] النتائج:', {
                    total: totalCost.toLocaleString(),
                    numberOfIncreases,
                    increaseDifference: increaseDifference.toLocaleString()
                });
                
                return {
                    total: totalCost,
                    totalWithoutIncrease: totalWithoutIncrease,
                    increaseDifference: increaseDifference,
                    numberOfIncreases: numberOfIncreases,
                    averageAnnual: averageAnnual,
                    yearlyBreakdown: yearlyBreakdown
                };
            }
            
            // تصدير الدالة لـ window لتستخدمها app.js
            window.calculateCumulativeRent = calculateCumulativeRent;
            
            /**
             * حساب تفاصيل الشراكةة
             * @param {string} contributionType - نوع المساهمة (land, cash, both)
             * @param {number} landArea - مساحة الأرض
             * @param {number} landValuePerSqm - قيمة الأرض للمتر
             * @param {number} partnershipShare - نسبة الشريك من الأرباح
             * @param {number} partnerCashContribution - المساهمة النقدية للشريك
             * @param {number} developerCashContribution - المساهمة النقدية للمطور
             * @param {number} totalProjectCost - إجمالي تكلفة المشروع
             * @param {string} profitSharingModel - نموذج توزيع الأرباح
             * @param {number} managementFee - رسوم الإدارة للمطور
             * @param {boolean} autoCalculate - حساب لنسبة الأرباح من رأس المال
             * @param {Array} additionalPartners - شركاء إضافيون
             * @returns {object} تفاصيل الشراكة الكاملة
             */
            function calculatePartnershipDetails(
                contributionType,
                landArea,
                landValuePerSqm,
                partnershipShare,
                partnerCashContribution,
                developerCashContribution,
                totalProjectCost,
                profitSharingModel,
                managementFee,
                autoCalculate = false,
                additionalPartners = []
            ) {
                console.log('🤝 [calculatePartnershipDetails] حساب تفاصيل الشراكة...');
                
                // حساب قيمة الأرض
                const landValue = landArea * landValuePerSqm;
                
                // حساب المساهمات بناءً على النوع
                let partnerLandContribution = 0;
                let partnerTotalContribution = 0;
                let developerLandContribution = 0;
                let developerTotalContribution = 0;
                
                switch (contributionType) {
                    case 'land':
                        // الشريك يساهم بالأرض فقط
                        partnerLandContribution = landValue;
                        partnerTotalContribution = landValue;
                        developerLandContribution = 0;
                        developerTotalContribution = developerCashContribution || totalProjectCost;
                        break;
                        
                    case 'cash':
                        // الشريك يساهم نقداً فقط
                        partnerLandContribution = 0;
                        partnerTotalContribution = partnerCashContribution;
                        developerLandContribution = landValue; // المطور يشتري الأرض
                        developerTotalContribution = (totalProjectCost - partnerCashContribution) + landValue;
                        break;
                        
                    case 'both':
                        // الشريك يساهم بالأرض + نقد
                        partnerLandContribution = landValue;
                        partnerTotalContribution = landValue + partnerCashContribution;
                        developerLandContribution = 0;
                        developerTotalContribution = totalProjectCost - partnerCashContribution;
                        break;
                }
                
                // حساب مساهمات الشركاء الإضافيين
                let additionalPartnersContribution = 0;
                const partnersDetails = (additionalPartners || []).map(partner => {
                    const contribution = calculatePartnerContribution(partner, landValuePerSqm);
                    additionalPartnersContribution += contribution;
                    return {
                        name: partner.name,
                        type: partner.type,
                        landArea: partner.landArea || 0,
                        cashAmount: partner.cashAmount || 0,
                        contribution: contribution
                    };
                });
                
                // حساب إجمالي رأس المال (بما في ذلك الشركاء الإضافيين)
                const totalCapital = partnerTotalContribution + developerTotalContribution + additionalPartnersContribution;
                
                // حساب نسب المساهمة الفعلية (بناءً على رأس المال)
                const partnerCapitalShare = totalCapital > 0 ? (partnerTotalContribution / totalCapital) * 100 : 0;
                const developerCapitalShare = totalCapital > 0 ? (developerTotalContribution / totalCapital) * 100 : 0;
                
                // حساب نسب الشركاء الإضافيين
                partnersDetails.forEach((p, index) => {
                    p.capitalSharePercentage = totalCapital > 0 ? (p.contribution / totalCapital) * 100 : 0;
                    p.profitSharePercentage = autoCalculate ? p.capitalSharePercentage : (p.share || 0);
                    
                    // ✅ FIX: تحديث نسبة الحصة في البيانات الأصلية إذا كان الحساب
                    if (autoCalculate && additionalPartners[index]) {
                        additionalPartners[index].share = p.profitSharePercentage;
                    }
                });
                
                // إذا كان الحساب، نستخدم نسبة رأس المال كنسبة للأرباح
                const finalPartnershipShare = autoCalculate ? partnerCapitalShare : partnershipShare;
                
                // ✅ FIX: تحديث نسبة الشريك الرئيسي في البيانات الأصلية إذا كان الحساب
                if (autoCalculate) {
                    // لا نحدث partnershipShare مباشرة لأنه قد يكون من input readonly
                    // سيتم استخدام finalPartnershipShare في الحسابات
                }
                
                // حساب تكلفة الأرض للمشروع (ما يُحسب ضمن تكلفة المشروع)
                let landCostForProject = 0;
                switch (contributionType) {
                    case 'land':
                        landCostForProject = landValue; // قيمة الأرض تُحسب كتكلفة
                        break;
                    case 'cash':
                        landCostForProject = landValue; // المطور اشترى الأرض
                        break;
                    case 'both':
                        landCostForProject = landValue; // قيمة الأرض تُحسب كتكلفة
                        break;
                }
                
                const result = {
                    contributionType,
                    
                    // قيم الأرض
                    landValue,
                    landCostForProject,
                    
                    // مساهمات الشريك الرئيسي
                    partner: {
                        landContribution: partnerLandContribution,
                        cashContribution: partnerCashContribution,
                        totalContribution: partnerTotalContribution,
                        capitalSharePercentage: partnerCapitalShare,
                        profitSharePercentage: finalPartnershipShare
                    },
                    
                    // مساهمات المطور
                    developer: {
                        landContribution: developerLandContribution,
                        cashContribution: developerTotalContribution - developerLandContribution,
                        totalContribution: developerTotalContribution,
                        capitalSharePercentage: developerCapitalShare,
                        profitSharePercentage: autoCalculate ? developerCapitalShare : (100 - finalPartnershipShare - partnersDetails.reduce((sum, p) => sum + (p.profitSharePercentage || 0), 0)),
                        managementFeePercentage: managementFee
                    },
                    
                    // الشركاء الإضافيون
                    additionalPartners: partnersDetails,
                    
                    // الإجماليات
                    totals: {
                        capital: totalCapital,
                        projectCost: totalProjectCost,
                        landCost: landCostForProject,
                        additionalPartnersContribution: additionalPartnersContribution,
                        numberOfPartners: 2 + partnersDetails.length // الشريك الرئيسي + المطور + الشركاء الإضافيون
                    },
                    
                    // نموذج توزيع الأرباح
                    profitSharing: {
                        model: profitSharingModel,
                        partnerShare: finalPartnershipShare,
                        developerShare: autoCalculate ? developerCapitalShare : (100 - finalPartnershipShare - partnersDetails.reduce((sum, p) => sum + (p.profitSharePercentage || 0), 0)),
                        managementFee: managementFee,
                        autoCalculated: autoCalculate
                    }
                };
                
                console.log('✅ [calculatePartnershipDetails] النتائج:', {
                    landValue: result.landValue.toLocaleString(),
                    partnerContribution: result.partner.totalContribution.toLocaleString(),
                    developerContribution: result.developer.totalContribution.toLocaleString(),
                    totalCapital: result.totals.capital.toLocaleString()
                });
                
                return result;
            }
            
            // تصدير الدالة
            window.calculatePartnershipDetails = calculatePartnershipDetails;
            
            function setupLandAcquisitionListeners() {
                document.querySelectorAll('input[name="landAcquisition"]').forEach(radio => {
                    radio.addEventListener('change', function() {
                        console.log('🟡 تغيير طريقة الحصول على الأرض إلى:', this.value);
                        investmentData.landAcquisition.mode = this.value;
                        updateLandCostDetails();
                        updateIntegrationSummary();
                        updateFinancialKPIs();
                        
                        // تحديث المكونات الأخرى
                        if (typeof updateCostsSummary === 'function') {
                            console.log('💰 تحديث ملخص التكاليف بعد تغيير طريقة الأرض...');
                            updateCostsSummary();
                        }
                    });
                });
            }

            function updateLandCostDetails() {
                const container = document.getElementById('landCostDetails');
                const mode = investmentData.landAcquisition.mode;
                const landArea = parseFloat(document.getElementById('landArea')?.value) || 10000;
                
                let html = '';
                
                if (mode === 'purchase') {
                    html = \`
                        <div>
                            <label class="block text-sm font-medium text-white/90 mb-2">سعر الشراء (ريال/م²)</label>
                            <input type="number" id="purchasePrice" class="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-gray-500" 
                                   value="\${investmentData.landAcquisition.purchasePrice}" min="0" onchange="updateLandCostCalculation()">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-white/90 mb-2">تكلفة الأرض الإجمالية</label>
                            <input type="text" class="w-full px-4 py-3 border border-white/20 rounded-lg bg-white/5 backdrop-filter backdrop-blur-sm/5 font-bold" 
                                   value="\${(investmentData.landAcquisition.purchasePrice * landArea).toLocaleString()} ريال" readonly>
                        </div>
                    \`;
                } else if (mode === 'lease') {
                    // حساب الإيجار التراكمي مع الزيادات
                    const totalLeaseCalculation = calculateCumulativeRent(
                        investmentData.landAcquisition.annualRent,
                        landArea,
                        investmentData.landAcquisition.leaseTerm,
                        investmentData.landAcquisition.rentIncreasePercentage || 0,
                        investmentData.landAcquisition.rentIncreaseFrequency || 0
                    );
                    
                    html = \`
                        <div>
                            <label class="block text-sm font-medium text-white/90 mb-2">الإيجار السنوي الأساسي (ريال/م²/سنة)</label>
                            <input type="number" id="annualRent" class="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500" 
                                   value="\${investmentData.landAcquisition.annualRent}" min="0" step="0.01" onchange="updateLandCostCalculation()">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-white/90 mb-2">مدة الإيجار (سنة)</label>
                            <input type="number" id="leaseTerm" class="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500" 
                                   value="\${investmentData.landAcquisition.leaseTerm}" min="1" max="99" onchange="updateLandCostCalculation()">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-white/90 mb-2">نسبة الزيادة السنوية (%)</label>
                            <input type="number" id="rentIncreasePercentage" class="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500" 
                                   value="\${investmentData.landAcquisition.rentIncreasePercentage || 0}" min="0" max="100" step="0.1" onchange="updateLandCostCalculation()">
                            <p class="text-xs text-white/70 mt-1">ضع 0 لعدم وجود زيادة</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-white/90 mb-2">تكرار الزيادة (كل كم سنة)</label>
                            <input type="number" id="rentIncreaseFrequency" class="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500" 
                                   value="\${investmentData.landAcquisition.rentIncreaseFrequency || 0}" min="0" max="50" onchange="updateLandCostCalculation()">
                            <p class="text-xs text-white/70 mt-1">مثال: 3 تعني زيادة كل 3 سنوات</p>
                        </div>
                        <div class="col-span-2">
                            <label class="block text-sm font-medium text-white/90 mb-2">إجمالي الإيجارات التراكمية</label>
                            <input type="text" class="w-full px-4 py-3 border border-white/20 rounded-lg bg-orange-500/20 text-orange-200 font-bold text-lg" 
                                   value="\${totalLeaseCalculation.total.toLocaleString()} ريال" readonly>
                            <div class="mt-2 text-xs text-white/80 space-y-1">
                                <p>📊 عدد الزيادات المتوقعة: \${totalLeaseCalculation.numberOfIncreases} مرة</p>
                                <p>📈 متوسط الإيجار السنوي: \${totalLeaseCalculation.averageAnnual.toLocaleString()} ريال</p>
                                <p>💰 إجمالي الإيجار بدون زيادات: \${totalLeaseCalculation.totalWithoutIncrease.toLocaleString()} ريال</p>
                                <p class="text-orange-300 font-medium">💸 الفرق (قيمة الزيادات): \${totalLeaseCalculation.increaseDifference.toLocaleString()} ريال</p>
                            </div>
                        </div>
                    \`;
                } else if (mode === 'partnership') {
                    // حساب تفاصيل الشراكة
                    const partnershipData = calculatePartnershipDetails(
                        investmentData.landAcquisition.partnerContribution,
                        landArea,
                        investmentData.landAcquisition.landValuePerSqm || 2000,
                        investmentData.landAcquisition.partnershipShare,
                        investmentData.landAcquisition.partnerCashContribution || 0,
                        investmentData.landAcquisition.developerCashContribution || 0,
                        0, // سيتم حسابه من النظام
                        investmentData.landAcquisition.profitSharingModel || 'revenue',
                        investmentData.landAcquisition.managementFeePercentage || 5,
                        investmentData.landAcquisition.autoCalculateProfitShare || false,
                        investmentData.landAcquisition.partners || []
                    );
                    
                    const contributionType = investmentData.landAcquisition.partnerContribution;
                    
                    html = \`
                        <!-- نوع مساهمة الشريك -->
                        <div class="col-span-full mb-4">
                            <label class="block text-sm font-medium text-white/90 mb-2">نوع مساهمة الشريك</label>
                            <select id="partnerContribution" class="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-gray-500" onchange="updateLandCostCalculation()">
                                <option value="land" \${contributionType === 'land' ? 'selected' : ''}>🏞️ الأرض فقط (الشريك يساهم بالأرض)</option>
                                <option value="cash" \${contributionType === 'cash' ? 'selected' : ''}>💰 نقد فقط (الشريك يساهم نقداً)</option>
                                <option value="both" \${contributionType === 'both' ? 'selected' : ''}>🏞️💰 أرض ونقد (الشريك يساهم بالأرض + نقد)</option>
                            </select>
                        </div>
                        
                        <!-- قيمة الأرض -->
                        <div>
                            <label class="block text-sm font-medium text-white/90 mb-2">قيمة الأرض (ريال/م²)</label>
                            <input type="number" id="landValuePerSqm" class="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-gray-500" 
                                   value="\${investmentData.landAcquisition.landValuePerSqm || 2000}" min="0" step="1" onchange="updateLandCostCalculation()">
                            <p class="text-xs text-white/70 mt-1">القيمة السوقية المقدرة للأرض</p>
                        </div>
                        
                        <!-- إجمالي قيمة الأرض -->
                        <div>
                            <label class="block text-sm font-medium text-white/90 mb-2">إجمالي قيمة الأرض</label>
                            <input type="text" class="w-full px-4 py-3 border border-white/20 rounded-lg bg-white/5 backdrop-filter backdrop-blur-sm/8 font-bold" 
                                   value="\${partnershipData.landValue.toLocaleString()} ريال" readonly>
                        </div>
                        
                        <!-- مساهمة الشريك النقدية (يظهر للنقد وكلاهما) -->
                        \${contributionType === 'cash' || contributionType === 'both' ? \`
                        <div>
                            <label class="block text-sm font-medium text-white/90 mb-2">المساهمة النقدية للشريك</label>
                            <input type="number" id="partnerCashContribution" class="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-gray-500" 
                                   value="\${investmentData.landAcquisition.partnerCashContribution || 0}" min="0" step="1000" onchange="updateLandCostCalculation()">
                            <p class="text-xs text-white/70 mt-1">المبلغ النقدي الذي يساهم به الشريك</p>
                        </div>
                        \` : ''}
                        
                        <!-- نموذج توزيع الأرباح -->
                        <div>
                            <label class="block text-sm font-medium text-white/90 mb-2">نموذج توزيع الأرباح</label>
                            <select id="profitSharingModel" class="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-gray-500" onchange="updateProfitSharingModel()">
                                <option value="revenue" \${investmentData.landAcquisition.profitSharingModel === 'revenue' ? 'selected' : ''}>حسب الإيرادات (Revenue Share)</option>
                                <option value="profit" \${investmentData.landAcquisition.profitSharingModel === 'profit' ? 'selected' : ''}>حسب الأرباح (Profit Share)</option>
                                <option value="hybrid" \${investmentData.landAcquisition.profitSharingModel === 'hybrid' ? 'selected' : ''}>نموذج مختلط (Hybrid)</option>
                            </select>
                            <!-- وصف تفاعلي للنموذج -->
                            <div id="profitSharingModelDescription" class="mt-2 p-3 rounded-lg text-sm">
                                <!-- سيتم تعبئته ديناميكياً -->
                            </div>
                        </div>
                        
                        <!-- نسب النموذج المختلط (تظهر فقط عند اختيار Hybrid) -->
                        <div id="hybridWeightsContainer" class="col-span-2 \${investmentData.landAcquisition.profitSharingModel === 'hybrid' ? '' : 'hidden'} bg-white/5 backdrop-filter backdrop-blur-sm/8 p-4 rounded-lg border border-white/20">
                            <h5 class="text-sm font-bold text-white mb-3 flex items-center">
                                <i class="fas fa-sliders-h mr-2"></i>
                                تخصيص نسب النموذج المختلط
                            </h5>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-xs font-medium text-white/90 mb-1">وزن الإيرادات (%)</label>
                                    <input type="number" id="hybridRevenueWeight" 
                                           class="w-full px-3 py-2 border border-white/20 rounded-lg focus:ring-2 focus:ring-gray-500" 
                                           value="\${investmentData.landAcquisition.hybridRevenueWeight || 50}" 
                                           min="0" max="100" step="1" 
                                           onchange="updateHybridWeights()">
                                    <p class="text-xs text-white/90 mt-1">نسبة الإيرادات في الحساب</p>
                                </div>
                                <div>
                                    <label class="block text-xs font-medium text-white/90 mb-1">وزن الأرباح (%)</label>
                                    <input type="number" id="hybridProfitWeight" 
                                           class="w-full px-3 py-2 border border-white/20 rounded-lg focus:ring-2 focus:ring-gray-500" 
                                           value="\${investmentData.landAcquisition.hybridProfitWeight || 50}" 
                                           min="0" max="100" step="1" 
                                           onchange="updateHybridWeights()">
                                    <p class="text-xs text-white/90 mt-1">نسبة الأرباح في الحساب</p>
                                </div>
                            </div>
                            <div class="mt-2 text-xs text-white/90 bg-white/5 backdrop-filter backdrop-blur-sm bg-opacity-50 p-2 rounded">
                                <strong>المجموع:</strong> <span id="hybridWeightsTotal">\${(investmentData.landAcquisition.hybridRevenueWeight || 50) + (investmentData.landAcquisition.hybridProfitWeight || 50)}</span>%
                                <span class="mr-2">\${((investmentData.landAcquisition.hybridRevenueWeight || 50) + (investmentData.landAcquisition.hybridProfitWeight || 50)) === 100 ? '✅' : '⚠️ يجب أن يكون المجموع = 100%'}</span>
                            </div>
                        </div>
                        
                        <!-- خيار الحساب ال-->
                        <div class="col-span-full">
                            <label class="flex items-center space-x-2 space-x-reverse cursor-pointer">
                                <input type="checkbox" id="autoCalculateProfitShare" class="w-5 h-5 text-white/90 rounded focus:ring-2 focus:ring-gray-500" 
                                       \${investmentData.landAcquisition.autoCalculateProfitShare ? 'checked' : ''} onchange="updateLandCostCalculation()">
                                <span class="text-sm font-medium text-white/90">🧮 حساب نسبة الأرباحاً بناءً على نسبة المساهمة في رأس المال</span>
                            </label>
                            <p class="text-xs text-white/70 mt-1 mr-7">عند التفعيل، سيتم حساب نسبة الأرباحاً = نسبة المساهمة في رأس المال</p>
                        </div>
                        
                        <!-- نسبة الشريك من الأرباح/الإيرادات -->
                        <div>
                            <label class="block text-sm font-medium text-white/90 mb-2">
                                نسبة الشريك من الأرباح (%)
                                \${investmentData.landAcquisition.autoCalculateProfitShare ? '<span class="text-xs text-white/90">(محسوبةاً)</span>' : ''}
                            </label>
                            <input type="number" id="partnershipShare" 
                                   class="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-gray-500 \${investmentData.landAcquisition.autoCalculateProfitShare ? 'bg-white/5 backdrop-filter backdrop-blur-sm/8' : ''}" 
                                   value="\${investmentData.landAcquisition.autoCalculateProfitShare ? partnershipData.partner.capitalSharePercentage.toFixed(1) : investmentData.landAcquisition.partnershipShare}" 
                                   min="0" max="100" step="0.1" 
                                   \${investmentData.landAcquisition.autoCalculateProfitShare ? 'readonly' : ''} 
                                   onchange="updateLandCostCalculation()">
                            <p class="text-xs text-white/70 mt-1">
                                \${investmentData.landAcquisition.autoCalculateProfitShare ? 
                                  'محسوبة من: (مساهمة الشريك ÷ إجمالي رأس المال) × 100' : 
                                  'يمكن تعديلها حسب الاتفاق'}
                            </p>
                        </div>
                        
                        <!-- نسبة المطور من الأرباح -->
                        <div>
                            <label class="block text-sm font-medium text-white/90 mb-2">نسبة المطور من الأرباح</label>
                            <input type="text" class="w-full px-4 py-3 border border-white/20 rounded-lg bg-white/5 backdrop-filter backdrop-blur-sm/5 font-bold" 
                                   value="\${investmentData.landAcquisition.autoCalculateProfitShare ? 
                                          (100 - partnershipData.partner.capitalSharePercentage).toFixed(1) : 
                                          (100 - investmentData.landAcquisition.partnershipShare)}%" readonly>
                        </div>
                        
                        <!-- رسوم إدارة المطور -->
                        <div>
                            <label class="block text-sm font-medium text-white/90 mb-2">رسوم إدارة المطور (%)</label>
                            <input type="number" id="managementFeePercentage" class="w-full px-4 py-3 border border-white/20 rounded-lg focus:ring-2 focus:ring-gray-500" 
                                   value="\${investmentData.landAcquisition.managementFeePercentage || 5}" min="0" max="20" step="0.1" onchange="updateLandCostCalculation()">
                            <p class="text-xs text-white/70 mt-1">من الإيرادات الإجمالية</p>
                        </div>
                        
                        <!-- قسم الشركاء المتعددين -->
                        <div class="col-span-full mt-6">
                            <div class="bg-white/5 backdrop-filter backdrop-blur-sm p-6 rounded-xl border border-white/20">
                                <div class="flex items-center justify-between mb-4">
                                    <h4 class="text-lg font-bold text-white flex items-center">
                                        <i class="fas fa-users text-white/90 mr-2"></i>
                                        شركاء إضافيون
                                        <span class="text-sm font-normal text-white/80 mr-2">(اختياري)</span>
                                    </h4>
                                    <button type="button" onclick="addPartner()" class="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition flex items-center text-sm">
                                        <i class="fas fa-plus mr-2"></i>
                                        إضافة شريك
                                    </button>
                                </div>
                                
                                <div id="partnersContainer" class="space-y-4">
                                    \${(investmentData.landAcquisition.partners || []).length === 0 ? \`
                                        <div class="text-center py-8 text-white/70">
                                            <i class="fas fa-user-plus text-4xl mb-2 opacity-50"></i>
                                            <p class="text-sm">لم يتم إضافة شركاء إضافيين بعد</p>
                                            <p class="text-xs mt-1">اضغط على "إضافة شريك" لإضافة شركاء جدد للمشروع</p>
                                        </div>
                                    \` : (investmentData.landAcquisition.partners || []).map((partner, index) => \`
                                        <div class="bg-white/5 backdrop-filter backdrop-blur-sm p-4 rounded-lg border border-white/20 partner-card" data-index="\${index}">
                                            <div class="flex items-start justify-between mb-3">
                                                <h5 class="font-semibold text-white flex items-center">
                                                    <i class="fas fa-user-circle text-white/90 mr-2"></i>
                                                    شريك #\${index + 2}
                                                </h5>
                                                <button type="button" onclick="removePartner(\${index})" class="text-red-500 hover:text-red-200 transition">
                                                    <i class="fas fa-times"></i>
                                                </button>
                                            </div>
                                            
                                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                                                <div>
                                                    <label class="block text-xs text-white/80 mb-1">اسم الشريك</label>
                                                    <input type="text" class="w-full px-3 py-2 border border-white/20 rounded-lg text-sm" 
                                                           value="\${partner.name || 'شريك ' + (index + 2)}" 
                                                           onchange="updatePartner(\${index}, 'name', this.value)">
                                                </div>
                                                
                                                <div>
                                                    <label class="block text-xs text-white/80 mb-1">نوع المساهمة</label>
                                                    <select class="w-full px-3 py-2 border border-white/20 rounded-lg text-sm" 
                                                            onchange="updatePartner(\${index}, 'type', this.value)">
                                                        <option value="land" \${partner.type === 'land' ? 'selected' : ''}>أرض</option>
                                                        <option value="cash" \${partner.type === 'cash' ? 'selected' : ''}>نقد</option>
                                                        <option value="both" \${partner.type === 'both' ? 'selected' : ''}>أرض ونقد</option>
                                                    </select>
                                                </div>
                                                
                                                \${partner.type === 'land' || partner.type === 'both' ? \`
                                                <div>
                                                    <label class="block text-xs text-white/80 mb-1">مساحة الأرض (م²)</label>
                                                    <input type="number" class="w-full px-3 py-2 border border-white/20 rounded-lg text-sm" 
                                                           value="\${partner.landArea || 0}" min="0" 
                                                           onchange="updatePartner(\${index}, 'landArea', parseFloat(this.value))">
                                                </div>
                                                \` : ''}
                                                
                                                \${partner.type === 'cash' || partner.type === 'both' ? \`
                                                <div>
                                                    <label class="block text-xs text-white/80 mb-1">المبلغ النقدي (ريال)</label>
                                                    <input type="number" class="w-full px-3 py-2 border border-white/20 rounded-lg text-sm" 
                                                           value="\${partner.cashAmount || 0}" min="0" step="1000" 
                                                           onchange="updatePartner(\${index}, 'cashAmount', parseFloat(this.value))">
                                                </div>
                                                \` : ''}
                                                
                                                <div class="col-span-full">
                                                    <div class="flex items-center justify-between text-xs mt-2 pt-2 border-t border-white/15">
                                                        <span class="text-white/80">المساهمة الإجمالية:</span>
                                                        <span class="font-bold text-white/90">\${calculatePartnerContribution(partner, investmentData.landAcquisition.landValuePerSqm).toLocaleString()} ريال</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    \`).join('')}
                                </div>
                            </div>
                        </div>
                        
                        <!-- ملخص المساهمات -->
                        <div class="col-span-full mt-6 p-6 bg-white/5 backdrop-filter backdrop-blur-sm rounded-xl border border-white/20">
                            <h4 class="text-lg font-bold text-white mb-4 flex items-center">
                                <i class="fas fa-handshake text-white/90 mr-2"></i>
                                ملخص الشراكة
                            </h4>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <!-- مساهمة الشريك الرئيسي -->
                                <div class="bg-white/5 backdrop-filter backdrop-blur-sm p-4 rounded-lg border-2 border-white/20 shadow-sm">
                                    <h5 class="font-semibold text-white/90 mb-3 flex items-center">
                                        <i class="fas fa-user-tie text-white/90 mr-2"></i>
                                        الشريك الرئيسي
                                    </h5>
                                    <div class="space-y-2 text-sm">
                                        <div class="flex justify-between">
                                            <span class="text-white/80">مساهمة الأرض:</span>
                                            <span class="font-medium">\${partnershipData.partner.landContribution.toLocaleString()} ريال</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-white/80">مساهمة نقدية:</span>
                                            <span class="font-medium">\${partnershipData.partner.cashContribution.toLocaleString()} ريال</span>
                                        </div>
                                        <div class="flex justify-between border-t border-white/15 pt-2 mt-2">
                                            <span class="text-white/90 font-semibold">إجمالي المساهمة:</span>
                                            <span class="font-bold text-white/90">\${partnershipData.partner.totalContribution.toLocaleString()} ريال</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-white/80">نسبة رأس المال:</span>
                                            <span class="font-medium text-white/90">\${partnershipData.partner.capitalSharePercentage.toFixed(1)}%</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-white/80">نسبة الأرباح:</span>
                                            <span class="font-medium text-white/90">\${partnershipData.partner.profitSharePercentage}%</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- مساهمة المطور -->
                                <div class="bg-white/5 backdrop-filter backdrop-blur-sm p-4 rounded-lg border-2 border-white/20 shadow-sm">
                                    <h5 class="font-semibold text-white/90 mb-3 flex items-center">
                                        <i class="fas fa-hard-hat text-white/90 mr-2"></i>
                                        المطور
                                    </h5>
                                    <div class="space-y-2 text-sm">
                                        <div class="flex justify-between">
                                            <span class="text-white/80">مساهمة الأرض:</span>
                                            <span class="font-medium">\${partnershipData.developer.landContribution.toLocaleString()} ريال</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-white/80">مساهمة نقدية:</span>
                                            <span class="font-medium">\${partnershipData.developer.cashContribution.toLocaleString()} ريال</span>
                                        </div>
                                        <div class="flex justify-between border-t border-white/15 pt-2 mt-2">
                                            <span class="text-white/90 font-semibold">إجمالي المساهمة:</span>
                                            <span class="font-bold text-white/90">\${partnershipData.developer.totalContribution.toLocaleString()} ريال</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-white/80">نسبة رأس المال:</span>
                                            <span class="font-medium text-white/90">\${partnershipData.developer.capitalSharePercentage.toFixed(1)}%</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-white/80">نسبة الأرباح:</span>
                                            <span class="font-medium text-white/90">\${partnershipData.developer.profitSharePercentage}%</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-white/80">رسوم الإدارة:</span>
                                            <span class="font-medium text-orange-300">\${partnershipData.developer.managementFeePercentage}%</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- الشركاء الإضافيون -->
                                \${(partnershipData.additionalPartners || []).map((partner, idx) => \`
                                    <div class="bg-white/5 backdrop-filter backdrop-blur-sm p-4 rounded-lg border-2 border-white/20 shadow-sm">
                                        <h5 class="font-semibold text-white/90 mb-3 flex items-center">
                                            <i class="fas fa-user-friends text-white/90 mr-2"></i>
                                            \${partner.name || 'شريك إضافي #' + (idx + 1)}
                                        </h5>
                                        <div class="space-y-2 text-sm">
                                            <div class="flex justify-between">
                                                <span class="text-white/80">نوع المساهمة:</span>
                                                <span class="font-medium text-white/90">
                                                    \${partner.type === 'land' ? '🏞️ أرض' : partner.type === 'cash' ? '💵 نقدية' : '🏞️💵 أرض + نقدية'}
                                                </span>
                                            </div>
                                            \${partner.landArea > 0 ? \`
                                            <div class="flex justify-between">
                                                <span class="text-white/80">مساهمة الأرض:</span>
                                                <span class="font-medium">\${partner.contribution.toLocaleString()} ريال</span>
                                            </div>
                                            <div class="flex justify-between text-xs">
                                                <span class="text-white/70">المساحة:</span>
                                                <span>\${partner.landArea.toLocaleString()} م²</span>
                                            </div>
                                            \` : ''}
                                            \${partner.cashAmount > 0 ? \`
                                            <div class="flex justify-between">
                                                <span class="text-white/80">مساهمة نقدية:</span>
                                                <span class="font-medium">\${partner.cashAmount.toLocaleString()} ريال</span>
                                            </div>
                                            \` : ''}
                                            <div class="flex justify-between border-t border-white/15 pt-2 mt-2">
                                                <span class="text-white/90 font-semibold">إجمالي المساهمة:</span>
                                                <span class="font-bold text-white/90">\${partner.contribution.toLocaleString()} ريال</span>
                                            </div>
                                            <div class="flex justify-between">
                                                <span class="text-white/80">نسبة رأس المال:</span>
                                                <span class="font-medium text-white/90">\${partner.capitalSharePercentage.toFixed(1)}%</span>
                                            </div>
                                            <div class="flex justify-between">
                                                <span class="text-white/80">نسبة الأرباح:</span>
                                                <span class="font-medium text-white/90">\${partner.profitSharePercentage.toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    </div>
                                \`).join('')}
                            </div>
                            
                            <!-- الإجماليات -->
                            <div class="mt-4 p-4 bg-white/5 backdrop-filter backdrop-blur-sm/5 backdrop-filter backdrop-blur-sm rounded-lg border-2 border-white/20 shadow-sm">
                                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                    <div class="text-center">
                                        <div class="text-white/80 mb-1">عدد الشركاء</div>
                                        <div class="text-xl font-bold text-white/90">\${partnershipData.totals.numberOfPartners || 2}</div>
                                    </div>
                                    <div class="text-center">
                                        <div class="text-white/80 mb-1">إجمالي رأس المال</div>
                                        <div class="text-xl font-bold text-white">\${partnershipData.totals.capital.toLocaleString()} ريال</div>
                                    </div>
                                    <div class="text-center">
                                        <div class="text-white/80 mb-1">قيمة الأرض</div>
                                        <div class="text-xl font-bold text-white/90">\${partnershipData.landValue.toLocaleString()} ريال</div>
                                    </div>
                                    <div class="text-center">
                                        <div class="text-white/80 mb-1">نموذج التوزيع</div>
                                        <div class="text-xl font-bold text-white/90">\${partnershipData.profitSharing.model === 'revenue' ? 'إيرادات' : partnershipData.profitSharing.model === 'profit' ? 'أرباح' : 'مختلط'}</div>
                                    </div>
                                </div>
                                
                                <!-- تفصيل المساهمات حسب النوع -->
                                \${(partnershipData.additionalPartners && partnershipData.additionalPartners.length > 0) ? \`
                                <div class="mt-4 pt-4 border-t border-white/15">
                                    <h6 class="text-xs font-semibold text-white/80 mb-2">تفصيل المساهمات:</h6>
                                    <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                        <div class="flex justify-between">
                                            <span class="text-white/70">الشريك الرئيسي:</span>
                                            <span class="font-medium">\${partnershipData.partner.totalContribution.toLocaleString()} ريال</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-white/70">المطور:</span>
                                            <span class="font-medium">\${partnershipData.developer.totalContribution.toLocaleString()} ريال</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-white/70">الشركاء الإضافيون:</span>
                                            <span class="font-medium">\${(partnershipData.totals.additionalPartnersContribution || 0).toLocaleString()} ريال</span>
                                        </div>
                                        <div class="flex justify-between font-semibold">
                                            <span class="text-white/90">الإجمالي:</span>
                                            <span>\${partnershipData.totals.capital.toLocaleString()} ريال</span>
                                        </div>
                                    </div>
                                </div>
                                \` : ''}
                            </div>
                        </div>
                    \`;
                }
                
                container.innerHTML = html;
            }

            /**
             * حساب مساهمة شريك واحد
             */
            function calculatePartnerContribution(partner, landValuePerSqm) {
                let contribution = 0;
                if (partner.type === 'land') {
                    contribution = (partner.landArea || 0) * landValuePerSqm;
                } else if (partner.type === 'cash') {
                    contribution = partner.cashAmount || 0;
                } else if (partner.type === 'both') {
                    contribution = ((partner.landArea || 0) * landValuePerSqm) + (partner.cashAmount || 0);
                }
                return contribution;
            }
            
            /**
             * إضافة شريك جديد
             */
            function addPartner() {
                if (!investmentData.landAcquisition.partners) {
                    investmentData.landAcquisition.partners = [];
                }
                
                investmentData.landAcquisition.partners.push({
                    name: 'شريك ' + (investmentData.landAcquisition.partners.length + 2),
                    type: 'cash',
                    landArea: 0,
                    cashAmount: 0,
                    share: 0
                });
                
                updateLandCostDetails();
                updateIntegrationSummary();
            }
            
            /**
             * حذف شريك
             */
            function removePartner(index) {
                if (confirm('هل أنت متأكد من حذف هذا الشريك؟')) {
                    investmentData.landAcquisition.partners.splice(index, 1);
                    updateLandCostDetails();
                    updateIntegrationSummary();
                }
            }
            
            /**
             * تحديث بيانات شريك
             */
            function updatePartner(index, field, value) {
                if (!investmentData.landAcquisition.partners[index]) return;
                
                investmentData.landAcquisition.partners[index][field] = value;
                
                // إعادة رسم واجهة الشركاء
                updateLandCostDetails();
                updateIntegrationSummary();
            }
            
            // تصدير الدوال إلى window (سيتم تصدير updateProfitSharingModel بعد تعريفها)
            window.addPartner = addPartner;
            window.removePartner = removePartner;
            window.updatePartner = updatePartner;
            window.calculatePartnerContribution = calculatePartnerContribution;
            
            /**
             * تحديث نموذج توزيع الأرباح مع عرض الوصف التفاعلي
             */
            function updateProfitSharingModel() {
                const modelSelect = document.getElementById('profitSharingModel');
                const descriptionDiv = document.getElementById('profitSharingModelDescription');
                
                if (!modelSelect || !descriptionDiv) return;
                
                const selectedModel = modelSelect.value;
                
                // تحديث البيانات
                investmentData.landAcquisition.profitSharingModel = selectedModel;
                
                // أوصاف النماذج
                const modelDescriptions = {
                    'revenue': {
                        title: '📊 نموذج توزيع حسب الإيرادات',
                        description: 'يحصل الشريك على نسبة محددة من إجمالي إيرادات المشروع (قبل خصم المصاريف)',
                        example: 'مثال: إذا كانت الإيرادات = 30 مليون ريال ونسبة الشريك = 40%، فإن حصة الشريك = 12 مليون ريال',
                        color: 'bg-white/8 border-white/20',
                        textColor: 'text-white',
                        icon: '💰'
                    },
                    'profit': {
                        title: '💼 نموذج توزيع حسب الأرباح',
                        description: 'يحصل الشريك على نسبة محددة من صافي الأرباح (NOI = الإيرادات - المصاريف)',
                        example: 'مثال: إذا كان NOI = 20 مليون ريال ونسبة الشريك = 40%، فإن حصة الشريك = 8 مليون ريال',
                        color: 'bg-white/8 border-gray-400',
                        textColor: 'text-white',
                        icon: '📈'
                    },
                    'hybrid': {
                        title: '⚖️ نموذج مختلط (هجين)',
                        description: 'يحصل الشريك على مزيج قابل للتخصيص من الإيرادات والأرباح (يمكنك تعديل النسب أدناه)',
                        example: \`مثال بالنسب الحالية: (إيرادات 30م × 40% × \${investmentData.landAcquisition.hybridRevenueWeight || 50}%) + (أرباح 20م × 40% × \${investmentData.landAcquisition.hybridProfitWeight || 50}%) = \${((30000000 * 0.4 * ((investmentData.landAcquisition.hybridRevenueWeight || 50) / 100)) + (20000000 * 0.4 * ((investmentData.landAcquisition.hybridProfitWeight || 50) / 100))) / 1000000}م ريال\`,
                        color: 'bg-white/8 border-white/20',
                        textColor: 'text-white',
                        icon: '🔀'
                    }
                };
                
                const modelInfo = modelDescriptions[selectedModel];
                
                if (modelInfo) {
                    descriptionDiv.className = \`mt-2 p-3 rounded-lg text-sm border-2 \${modelInfo.color}\`;
                    descriptionDiv.innerHTML = \`
                        <div class="flex items-start">
                            <span class="text-2xl ml-2">\${modelInfo.icon}</span>
                            <div class="flex-1">
                                <h5 class="font-bold \${modelInfo.textColor} mb-1">\${modelInfo.title}</h5>
                                <p class="\${modelInfo.textColor} mb-2">\${modelInfo.description}</p>
                                <div class="text-xs \${modelInfo.textColor} opacity-75 bg-white/5 backdrop-filter backdrop-blur-sm bg-opacity-50 p-2 rounded">
                                    \${modelInfo.example}
                                </div>
                            </div>
                        </div>
                    \`;
                }
                
                // إظهار/إخفاء حقول النموذج المختلط
                toggleHybridWeightsContainer();
                
                // تحديث الحسابات
                updateLandCostCalculation();
                
                console.log('✅ تم تحديث نموذج توزيع الأرباح:', selectedModel);
            }
            
            /**
             * تحديث نسب النموذج المختلط وإظهار/إخفاء حقول الإدخال
             */
            function updateHybridWeights() {
                const revenueWeight = parseFloat(document.getElementById('hybridRevenueWeight')?.value) || 50;
                const profitWeight = parseFloat(document.getElementById('hybridProfitWeight')?.value) || 50;
                const total = revenueWeight + profitWeight;
                
                // تحديث البيانات
                investmentData.landAcquisition.hybridRevenueWeight = revenueWeight;
                investmentData.landAcquisition.hybridProfitWeight = profitWeight;
                
                // تحديث عرض المجموع
                const totalSpan = document.getElementById('hybridWeightsTotal');
                if (totalSpan) {
                    totalSpan.textContent = total;
                    const parentDiv = totalSpan.closest('div');
                    if (parentDiv) {
                        const warningSpan = parentDiv.querySelector('span:last-child');
                        if (warningSpan) {
                            warningSpan.textContent = total === 100 ? '✅' : '⚠️ يجب أن يكون المجموع = 100%';
                            warningSpan.className = total === 100 ? 'mr-2 text-white/90' : 'mr-2 text-orange-300';
                        }
                    }
                }
                
                // تحديث الحسابات
                updateLandCostCalculation();
                
                console.log('✅ تم تحديث نسب النموذج المختلط:', {
                    revenueWeight: revenueWeight + '%',
                    profitWeight: profitWeight + '%',
                    total: total + '%'
                });
            }
            
            /**
             * إظهار/إخفاء حقول النموذج المختلط بناءً على النموذج المختار
             */
            function toggleHybridWeightsContainer() {
                const model = investmentData.landAcquisition.profitSharingModel;
                const container = document.getElementById('hybridWeightsContainer');
                
                if (container) {
                    if (model === 'hybrid') {
                        container.classList.remove('hidden');
                    } else {
                        container.classList.add('hidden');
                    }
                }
            }
            
            // تصدير الدوال إلى window بعد تعريفها
            window.updateProfitSharingModel = updateProfitSharingModel;
            window.updateHybridWeights = updateHybridWeights;
            window.toggleHybridWeightsContainer = toggleHybridWeightsContainer;
            
            function updateLandCostCalculation() {
                const mode = investmentData.landAcquisition.mode;
                
                if (mode === 'purchase') {
                    investmentData.landAcquisition.purchasePrice = parseFloat(document.getElementById('purchasePrice')?.value) || 0;
                } else if (mode === 'lease') {
                    investmentData.landAcquisition.annualRent = parseFloat(document.getElementById('annualRent')?.value) || 0;
                    investmentData.landAcquisition.leaseTerm = parseFloat(document.getElementById('leaseTerm')?.value) || 0;
                    investmentData.landAcquisition.rentIncreasePercentage = parseFloat(document.getElementById('rentIncreasePercentage')?.value) || 0;
                    investmentData.landAcquisition.rentIncreaseFrequency = parseFloat(document.getElementById('rentIncreaseFrequency')?.value) || 0;
                } else if (mode === 'partnership') {
                    const landArea = parseFloat(document.getElementById('landArea')?.value) || 10000;
                    investmentData.landAcquisition.autoCalculateProfitShare = document.getElementById('autoCalculateProfitShare')?.checked || false;
                    investmentData.landAcquisition.partnershipShare = parseFloat(document.getElementById('partnershipShare')?.value) || 50;
                    investmentData.landAcquisition.partnerContribution = document.getElementById('partnerContribution')?.value || 'land';
                    investmentData.landAcquisition.landValuePerSqm = parseFloat(document.getElementById('landValuePerSqm')?.value) || 2000;
                    investmentData.landAcquisition.partnerCashContribution = parseFloat(document.getElementById('partnerCashContribution')?.value) || 0;
                    investmentData.landAcquisition.profitSharingModel = document.getElementById('profitSharingModel')?.value || 'revenue';
                    investmentData.landAcquisition.hybridRevenueWeight = parseFloat(document.getElementById('hybridRevenueWeight')?.value) || 50;
                    investmentData.landAcquisition.hybridProfitWeight = parseFloat(document.getElementById('hybridProfitWeight')?.value) || 50;
                    investmentData.landAcquisition.managementFeePercentage = parseFloat(document.getElementById('managementFeePercentage')?.value) || 5;
                    
                    // ✅ FIX: إعادة حساب وتحديث نسب الشركاء الإضافيين عند تفعيل الحساب التلقائي
                    if (investmentData.landAcquisition.autoCalculateProfitShare) {
                        // استدعاء calculatePartnershipDetails لإعادة حساب النسب
                        const partnershipData = calculatePartnershipDetails(
                            investmentData.landAcquisition.partnerContribution,
                            landArea,
                            investmentData.landAcquisition.landValuePerSqm || 2000,
                            investmentData.landAcquisition.partnershipShare,
                            investmentData.landAcquisition.partnerCashContribution || 0,
                            0,
                            0,
                            investmentData.landAcquisition.profitSharingModel || 'revenue',
                            investmentData.landAcquisition.managementFeePercentage || 5,
                            true,
                            investmentData.landAcquisition.partners || []
                        );
                        
                        // تحديث نسبة الشريك الرئيسي (readonly في الواجهة)
                        investmentData.landAcquisition.partnershipShare = partnershipData.partner.profitSharePercentage;
                        
                        console.log('✅ [updateLandCostCalculation] تم تحديث نسب الشركاءاً:', {
                            mainPartner: partnershipData.partner.profitSharePercentage.toFixed(2) + '%',
                            additionalPartnersCount: partnershipData.additionalPartners.length,
                            additionalPartnersShares: partnershipData.additionalPartners.map(p => 
                                p.name + ': ' + (p.profitSharePercentage || 0).toFixed(2) + '%'
                            )
                        });
                    }
                }
                
                // تحديث جميع الحسابات المرتبطة
                console.log('✅ تم تغيير طريقة الحصول على الأرض - جاري تحديث الحسابات...');
                updateLandCostDetails();
                updateIntegrationSummary();
                updateFinancialKPIs();
                
                // تحديث المكونات الأخرى في النظام
                if (typeof updateCostsSummary === 'function') {
                    console.log('✅ تحديث ملخص التكاليف...');
                    updateCostsSummary();
                }
                
                console.log('✅ تم تحديث جميع الحسابات بعد تغيير طريقة الحصول على الأرض');
            }

            // تم إزالة دوال هيكل التمويل غير المؤثرة

            function updateFinancingRate(rate) {
                investmentData.financing.interestRate = parseFloat(rate) || 0;
                updateFinancialKPIs();
            }

            // Investment Parameters Functions
            function setupInvestmentParametersListeners() {
                // Add listeners for investment parameter inputs
                const paramInputs = ['equityRatio', 'interestRate', 'financingTerm', 'constructionPeriod', 'operatingPeriod'];
                paramInputs.forEach(inputId => {
                    const element = document.getElementById(inputId);
                    if (element) {
                        element.addEventListener('change', updateInvestmentParameters);
                    }
                });
                
                // NEW: Add listeners for WACC calculation parameters
                const waccInputs = ['costOfEquity', 'taxRate'];
                waccInputs.forEach(inputId => {
                    const element = document.getElementById(inputId);
                    if (element) {
                        element.addEventListener('change', calculateWACC);
                    }
                });
                
                // NEW: Add listeners for exit value parameters
                const exitInputs = ['exitYear', 'expectedNOI', 'exitCapRate', 'exitMultiple', 'exitAppraisal', 'gordonGrowthRate', 'sellingCosts'];
                exitInputs.forEach(inputId => {
                    const element = document.getElementById(inputId);
                    if (element) {
                        element.addEventListener('change', calculateExitValue);
                    }
                });
                
                // NEW: Add listeners for growth assumptions parameters
                const growthInputs = ['inflationRate', 'revenueGrowthRate', 'stabilizedOccupancy', 
                                     'occupancyYear1', 'occupancyYear2', 'occupancyYear3', 'vacancyAllowance'];
                growthInputs.forEach(inputId => {
                    const element = document.getElementById(inputId);
                    if (element) {
                        element.addEventListener('change', saveGrowthAssumptions);
                    }
                });
                
                // NEW: Add listener for revenue growth method
                const methodSelect = document.getElementById('revenueGrowthMethod');
                if (methodSelect) {
                    methodSelect.addEventListener('change', saveGrowthAssumptions);
                }
            }

            function updateInvestmentParameters() {
                // Update data from inputs
                investmentData.financing.equityRatio = parseFloat(document.getElementById('equityRatio')?.value) || 30;
                investmentData.financing.debtRatio = 100 - investmentData.financing.equityRatio;
                investmentData.financing.interestRate = parseFloat(document.getElementById('interestRate')?.value) || 5.5;
                investmentData.financing.financingTerm = parseFloat(document.getElementById('financingTerm')?.value) || 15;
                investmentData.financing.constructionPeriod = parseInt(document.getElementById('constructionPeriod')?.value) || 3;
                investmentData.financing.operatingPeriod = parseFloat(document.getElementById('operatingPeriod')?.value) || 20;
                
                updateFinancingStructure();
                updateFinancialKPIs();
                
                // NEW: Recalculate WACC when equity ratio or interest rate changes
                calculateWACC();
            }
            
            /**
             * معالج تغيير فترة البناء
             * يُستدعى عند تغيير قيمة constructionPeriod
             * يعيد حساب توزيع تكاليف البناءاً
             */
            function handleConstructionPeriodChange() {
                console.log('🔄 [handleConstructionPeriodChange] تغيير فترة البناء...');
                
                // تحديث القيمة في investmentData
                const newPeriod = parseInt(document.getElementById('constructionPeriod')?.value) || 3;
                investmentData.financing.constructionPeriod = newPeriod;
                
                console.log('📅 فترة البناء الجديدة:', newPeriod, 'سنة');
                
                // تحديث عرض التوزيع
                updateDistributionPreview(newPeriod);
                
                // تحديث توزيع تكاليف البناء
                updateConstructionCostDistribution();
                
                // إعادة حساب CAPEX (سيُعيد توليد constructionScheduleاً)
                calculateCapitalExpenditure();
                
                // إعادة بناء جدول التدفقات النقدية
                buildCashFlowTable();
                
                // إعادة عرض الجدول
                renderCashFlowTable();
                
                console.log('✅ تم تحديث جدول التدفقات النقدية بناءً على فترة البناء الجديدة');
            }
            
            /**
             * تحديث عرض توزيع تكاليف البناء
             */
            function updateDistributionPreview(period) {
                const previewDiv = document.getElementById('distributionPreview');
                if (!previewDiv) return;
                
                let distributionText = '';
                
                switch (period) {
                    case 1:
                        distributionText = '<span class="text-white/90">سنة واحدة:</span> 100%';
                        break;
                    case 2:
                        distributionText = '<span class="text-white/90">سنتان:</span> 40% - 60%';
                        break;
                    case 3:
                        distributionText = '<span class="text-white/90">3 سنوات:</span> 30% - 50% - 20%';
                        break;
                    case 4:
                        distributionText = '<span class="text-white/90">4 سنوات:</span> 20% - 30% - 30% - 20%';
                        break;
                    case 5:
                        distributionText = '<span class="text-white/90">5 سنوات:</span> 15% - 20% - 30% - 20% - 15%';
                        break;
                    default:
                        const equalPercentage = (100 / period).toFixed(1);
                        distributionText = '<span class="text-white/90">' + period + ' سنوات:</span> توزيع متساوي (' + equalPercentage + '% لكل سنة)';
                        break;
                }
                
                previewDiv.innerHTML = distributionText;
            }
            
            // تصدير الدوال
            window.handleConstructionPeriodChange = handleConstructionPeriodChange;
            window.updateDistributionPreview = updateDistributionPreview;

            /**
             * تحديث توزيع تكاليف البناء بناءً على عدد سنوات البناء
             */
            function updateConstructionCostDistribution() {
                try {
                    const constructionPeriod = parseInt(document.getElementById('constructionPeriod')?.value) || 3;
                    const totalDevelopmentCost = calculateTotalDevelopmentCost(); // سنحتاج لتنفيذ هذه الدالة
                    
                    // تحديث عرض فترة البناء
                    if (document.getElementById('distributionPeriodDisplay')) {
                        document.getElementById('distributionPeriodDisplay').textContent = constructionPeriod + ' سنوات';
                    }
                    
                    // تحديث التكاليف الإجمالية
                    if (document.getElementById('totalDevelopmentCost')) {
                        document.getElementById('totalDevelopmentCost').textContent = 
                            totalDevelopmentCost.toLocaleString('ar-SA') + ' ريال';
                    }
                    
                    if (document.getElementById('averageAnnualCost')) {
                        document.getElementById('averageAnnualCost').textContent = 
                            (totalDevelopmentCost / constructionPeriod).toLocaleString('ar-SA') + ' ريال';
                    }
                    
                    // تحديد نسب التوزيع بناءً على عدد السنوات
                    let distributionPercentages = [];
                    switch (constructionPeriod) {
                        case 1:
                            distributionPercentages = [100];
                            break;
                        case 2:
                            distributionPercentages = [40, 60];
                            break;
                        case 3:
                            distributionPercentages = [30, 50, 20];
                            break;
                        case 4:
                            distributionPercentages = [20, 30, 30, 20];
                            break;
                        case 5:
                            distributionPercentages = [15, 20, 30, 20, 15];
                            break;
                        default:
                            // توزيع متساوي للسنوات الإضافية
                            const equalPercentage = 100 / constructionPeriod;
                            distributionPercentages = Array(constructionPeriod).fill(equalPercentage);
                            break;
                    }
                    
                    // إنشاء شبكة التوزيع مع إمكانية التعديل اليدوي
                    const gridContainer = document.getElementById('costDistributionGrid');
                    if (gridContainer) {
                        let gridHTML = '';
                        
                        distributionPercentages.forEach((percentage, index) => {
                            const yearNumber = index + 1;
                            const inputId = 'costYear' + yearNumber;
                            
                            gridHTML += 
                                '<div class="bg-white/5 backdrop-filter backdrop-blur-sm p-4 rounded-lg border border-orange-400/30 text-center">' +
                                    '<div class="text-xs text-white/80 mb-2">السنة ' + yearNumber + '</div>' +
                                    '<div class="mb-2">' +
                                        '<input type="number" id="' + inputId + '" ' +
                                        'class="w-full px-2 py-1 text-center border border-orange-400/40 rounded text-lg font-bold text-orange-300" ' +
                                        'value="' + percentage.toFixed(1) + '" min="0" max="100" step="0.1" ' +
                                        'onchange="updateCostDistributionFromInput()" oninput="updateCostDistributionFromInput()">' +
                                        '<div class="text-xs text-white/70 mt-1">%</div>' +
                                    '</div>' +
                                    '<div class="text-sm text-white/90 font-semibold" id="costAmount' + yearNumber + '">0 ريال</div>' +
                                '</div>';
                        });
                        
                        gridContainer.innerHTML = gridHTML;
                        
                        // تحديث css grid للتوافق مع عدد السنوات
                        if (constructionPeriod <= 3) {
                            gridContainer.className = 'grid grid-cols-1 md:grid-cols-' + constructionPeriod + ' gap-4';
                        } else if (constructionPeriod <= 5) {
                            gridContainer.className = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-' + Math.min(constructionPeriod, 5) + ' gap-4';
                        } else {
                            gridContainer.className = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4';
                        }
                        
                        // تحديث المبالغ المحسوبة
                        updateCostDistributionFromInput();
                    }
                    
                    console.log('📊 [updateConstructionCostDistribution] تم تحديث توزيع التكاليف:', {
                        period: constructionPeriod + ' سنوات',
                        totalCost: totalDevelopmentCost.toLocaleString('ar-SA') + ' ريال',
                        percentages: distributionPercentages.map(p => p.toFixed(1) + '%').join(', ')
                    });
                    
                } catch (error) {
                    console.error('❌ خطأ في تحديث توزيع التكاليف:', error);
                }
            }

            /**
             * حساب إجمالي تكلفة التطوير - مطابقة تماماً لحساب تكلفة التطوير في ملخص التكامل
             * 📋 تستخدم نفس معادلة getIntegrationData() بدون تعديل
             */
            function calculateTotalDevelopmentCost() {
                try {
                    console.log('📊 [calculateTotalDevelopmentCost] استخدام نفس معادلة ملخص التكامل...');
                    
                    // 🎯 استخدام نفس المعادلة الموجودة في getIntegrationData()
                    // بيانات تكلفة التطوير من نظام التكاليف
                    if (typeof window.calculateAccurateTotalCosts === 'function') {
                        const developmentCost = window.calculateAccurateTotalCosts(); // تكلفة التطويرة من جميع الأقسام
                        console.log('🏗️ [calculateTotalDevelopmentCost] تكلفة التطوير من النظام:', developmentCost.toLocaleString());
                        return developmentCost;
                    }
                    
                    // بديل: محاولة قراءة من بيانات التكامل المحفوظة
                    if (investmentData && investmentData.integration && investmentData.integration.constructionCost > 0) {
                        const constructionCost = investmentData.integration.constructionCost;
                        console.log('📊 [calculateTotalDevelopmentCost] تكلفة التطوير من بيانات التكامل:', constructionCost.toLocaleString());
                        return constructionCost;
                    }
                    
                    // قيمة افتراضية (80 مليون ريال)
                    const defaultCost = 80000000; 
                    console.log('📊 [calculateTotalDevelopmentCost] استخدام قيمة افتراضية:', defaultCost.toLocaleString());
                    return defaultCost;
                    
                } catch (error) {
                    console.error('❌ خطأ في حساب تكلفة التطوير:', error);
                    return 80000000; // قيمة افتراضية آمنة
                }
            }

            /**
             * تحديث توزيع التكاليف من الإدخال اليدوي
             */
            function updateCostDistributionFromInput() {
                try {
                    const constructionPeriod = parseInt(document.getElementById('constructionPeriod')?.value) || 3;
                    const totalDevelopmentCost = calculateTotalDevelopmentCost();
                    
                    let totalPercentage = 0;
                    let actualTotalCost = 0;
                    
                    // حساب المجاميع من الإدخال اليدوي
                    for (let year = 1; year <= constructionPeriod; year++) {
                        const inputId = 'costYear' + year;
                        const amountId = 'costAmount' + year;
                        
                        const percentage = parseFloat(document.getElementById(inputId)?.value || '0');
                        const yearCost = (totalDevelopmentCost * percentage / 100);
                        
                        totalPercentage += percentage;
                        actualTotalCost += yearCost;
                        
                        // تحديث عرض المبلغ
                        const amountElement = document.getElementById(amountId);
                        if (amountElement) {
                            amountElement.textContent = yearCost.toLocaleString('ar-SA') + ' ريال';
                            
                            // تغيير لون الحقل حسب صحة النسبة
                            const inputElement = document.getElementById(inputId);
                            if (inputElement) {
                                if (percentage < 0 || percentage > 100) {
                                    inputElement.style.borderColor = '#dc2626'; // أحمر للقيم الخاطئة
                                } else {
                                    inputElement.style.borderColor = '#ea580c'; // برتقالي عادي
                                }
                            }
                        }
                    }
                    
                    // تحديث المجاميع
                    if (document.getElementById('totalDevelopmentCost')) {
                        document.getElementById('totalDevelopmentCost').textContent = 
                            totalDevelopmentCost.toLocaleString('ar-SA') + ' ريال';
                    }
                    
                    if (document.getElementById('averageAnnualCost')) {
                        document.getElementById('averageAnnualCost').textContent = 
                            (totalDevelopmentCost / constructionPeriod).toLocaleString('ar-SA') + ' ريال';
                    }
                    
                    // إضافة تحذير إذا كان المجموع لا يساوي 100%
                    updatePercentageWarning(totalPercentage);
                    
                    // حفظ التوزيع في investmentData.capitalExpenditure.constructionSchedule
                    if (investmentData && investmentData.capitalExpenditure) {
                        investmentData.capitalExpenditure.constructionSchedule = [];
                        
                        for (let year = 1; year <= constructionPeriod; year++) {
                            const inputId = 'costYear' + year;
                            const percentage = parseFloat(document.getElementById(inputId)?.value || '0');
                            const yearCost = (totalDevelopmentCost * percentage / 100);
                            
                            investmentData.capitalExpenditure.constructionSchedule.push({
                                year: year,
                                percentage: percentage,
                                cost: yearCost,
                                description: 'السنة ' + year + ' من البناء'
                            });
                        }
                        
                        // تحديث إجمالي تكلفة البناء
                        investmentData.capitalExpenditure.totalConstructionCost = totalDevelopmentCost;
                    }
                    
                    console.log('🔄 [updateCostDistributionFromInput] تم تحديث التوزيع:', {
                        totalPercentage: totalPercentage.toFixed(1) + '%',
                        totalCost: actualTotalCost.toLocaleString('ar-SA') + ' ريال',
                        constructionSchedule: investmentData?.capitalExpenditure?.constructionSchedule
                    });
                    
                    // إعادة حساب النفقات الرأسمالية وجدول التدفقات النقدية
                    if (typeof calculateCapitalExpenditure === 'function') {
                        calculateCapitalExpenditure();
                    }
                    
                    if (typeof buildCashFlowTable === 'function') {
                        buildCashFlowTable();
                        console.log('📊 تم إعادة بناء جدول التدفقات النقدية بناءً على التوزيع المحدث');
                    }
                    
                } catch (error) {
                    console.error('❌ خطأ في تحديث توزيع التكاليف من الإدخال:', error);
                }
            }

            /**
             * تحديث تحذير النسبة المئوية
             */
            function updatePercentageWarning(totalPercentage) {
                let warningContainer = document.getElementById('percentageWarning');
                
                // إنشاء عنصر التحذير إذا لم يكن موجوداً
                if (!warningContainer) {
                    const distributionContainer = document.querySelector('#costDistributionGrid').parentNode;
                    warningContainer = document.createElement('div');
                    warningContainer.id = 'percentageWarning';
                    warningContainer.className = 'mt-2 p-2 rounded text-sm font-medium text-center';
                    distributionContainer.insertBefore(warningContainer, document.getElementById('costDistributionGrid').nextSibling);
                }
                
                if (Math.abs(totalPercentage - 100) > 0.1) {
                    warningContainer.className = 'mt-2 p-2 rounded text-sm font-medium text-center bg-amber-500/25 border border-amber-400/40 text-amber-200';
                    warningContainer.innerHTML = 
                        '<i class="fas fa-exclamation-triangle mr-1"></i>' +
                        'تحذير: مجموع النسب = ' + totalPercentage.toFixed(1) + '% (يجب أن يكون 100%)';
                    warningContainer.style.display = 'block';
                } else {
                    warningContainer.className = 'mt-2 p-2 rounded text-sm font-medium text-center bg-white/10 border border-white/20 text-white/90';
                    warningContainer.innerHTML = 
                        '<i class="fas fa-check-circle mr-1"></i>' +
                        'ممتاز: مجموع النسب = 100%';
                    warningContainer.style.display = 'block';
                }
            }



            window.updateConstructionCostDistribution = updateConstructionCostDistribution;
            window.updateCostDistributionFromInput = updateCostDistributionFromInput;


            function updateFinancingStructure() {
                // الحصول على نسبة رأس المال من الحقل
                const equityRatio = parseFloat(document.getElementById('equityRatio')?.value) || 30;
                const debtRatio = 100 - equityRatio;
                
                // تحديث البيانات
                investmentData.financing.equityRatio = equityRatio;
                investmentData.financing.debtRatio = debtRatio;
                
                // تحديث حقل نسبة الدين في الواجهة
                if (document.getElementById('debtRatio')) {
                    document.getElementById('debtRatio').value = debtRatio.toFixed(0);
                }
                
                console.log('🔄 [updateFinancingStructure] تم تحديث هيكل التمويل:', {
                    equityRatio: equityRatio + '%',
                    debtRatio: debtRatio + '%'
                });
            }









            // Cash Flow Analysis Functions


            function calculateCashFlow() {
                console.warn('ℹ️ calculateCashFlow is disabled until the new cash flow system is integrated.');
                investmentData.cashFlow = [];

                const summaryFields = [
                    'initialInvestmentValue',
                    'annualCashFlowValue',
                    'terminalValueValue'
                ];

                summaryFields.forEach((id) => {
                    const element = document.getElementById(id);
                    if (element) {
                        element.textContent = '—';
                    }
                });

                updateCashFlowTable();
                return null;
            }

            function renderCashFlowChart() {
                console.info('ℹ️ renderCashFlowChart is disabled until the new cash flow system is integrated.');
                cashFlowChart = null;

                const canvas = document.getElementById('cashFlowChart');
                if (canvas && typeof canvas.getContext === 'function') {
                    const ctx = canvas.getContext('2d');
                    if (ctx && typeof ctx.clearRect === 'function') {
                        ctx.clearRect(0, 0, canvas.width || 0, canvas.height || 0);
                    }
                }

                return null;
            }

            function updateCashFlowTable() {
                const tbody = document.getElementById('cashFlowTableBody');
                if (!tbody) {
                    return;
                }

                const disabledRow = [
                    '<tr class="bg-amber-500/20">',
                    '<td colspan="6" class="border border-white/20 px-4 py-3 text-center text-sm text-white/80">',
                    '🚫 تم تعطيل جدول التدفقات النقدية مؤقتاً حتى يتم إطلاق النظام الجديد للتدفقات النقدية.',
                    '</td>',
                    '</tr>'
                ].join('');

                tbody.innerHTML = disabledRow;
            }

            // 🎯 ملحوظة: تم حذف getIntegrationData() المكررة - استخدام النسخة من النظام المرجعي الموحد في app.js
            // الدالة متاحة عبر window.getFinancialFunction('getIntegrationData') أو window.CORE_FINANCIAL_FUNCTIONS.getIntegrationData

            // 🆕 NEW COMPOUND ANNUAL REVENUE CALCULATION
            function calculateCompoundAnnualRevenue(operatingYear) {
                let yearlyRevenue = 0;
                
                try {
                    // Check if revenuesData is available (from main system)
                    if (typeof window.revenuesData !== 'undefined' && window.revenuesData) {
                        console.log('📊 حساب الإيرادات للسنة التشغيلية ' + operatingYear + ' بالمعادلة التراكمية...');
                        
                        // Calculate base rental revenues (annual)
                        let totalRentalRevenues = 0;
                        if (window.revenuesData.rentalRevenues?.subUnits) {
                            Object.values(window.revenuesData.rentalRevenues.subUnits).forEach(subUnit => {
                                if (typeof window.getSubUnitRentalTotal === 'function') {
                                    totalRentalRevenues += window.getSubUnitRentalTotal(subUnit);
                                }
                            });
                        }
                        
                        // Calculate additional revenues (annual) - استبعاد إيرادات المبيعات
                        let totalAdditionalRevenues = 0;
                        if (window.revenuesData.additionalRevenues?.revenues) {
                            totalAdditionalRevenues = window.revenuesData.additionalRevenues.revenues.reduce((sum, revenue) => 
                                sum + (revenue.amount || 0), 0);
                        }
                        
                        // الإيرادات الأساسية = إيرادات الإيجار + الإيرادات الإضافية (بدون المبيعات)
                        const baseRevenues = totalRentalRevenues + totalAdditionalRevenues;
                        
                        // نسبة التحسين السنوي من النظام
                        let annualImprovementRate = 0;
                        if (window.revenuesData.revenueOptimization?.strategies) {
                            annualImprovementRate = window.revenuesData.revenueOptimization.strategies.reduce((sum, strategy) => 
                                sum + (strategy.impact || 0), 0);
                        }
                        
                        // 🎯 المعادلة التراكمية الجديدة:
                        // الإيرادات السنوية = (إيرادات_الإيجار + الإيرادات_الإضافية) × (1 + تحسين/100)^عدد_السنوات
                        const compoundFactor = Math.pow(1 + annualImprovementRate / 100, operatingYear);
                        yearlyRevenue = baseRevenues * compoundFactor;
                        
                        console.log('💰 تفاصيل الإيرادات التراكمية - السنة ' + operatingYear + ':', {
                            rentalRevenues: totalRentalRevenues.toLocaleString(),
                            additionalRevenues: totalAdditionalRevenues.toLocaleString(),
                            baseRevenues: baseRevenues.toLocaleString(),
                            annualImprovementRate: annualImprovementRate + '%',
                            operatingYear: operatingYear,
                            compoundFactor: compoundFactor.toFixed(4),
                            yearlyRevenue: yearlyRevenue.toLocaleString(),
                            formula: baseRevenues.toLocaleString() + ' × (1 + ' + annualImprovementRate + '%)^' + operatingYear + ' = ' + yearlyRevenue.toLocaleString()
                        });
                        
                    } else {
                        throw new Error('Revenue management system not available');
                    }
                } catch (error) {
                    console.warn('⚠️ لا يمكن الوصول لنظام الإيرادات للسنة ' + operatingYear + '، استخدام الحساب الافتراضي:', error);
                    
                    // Fallback calculation using GLA
                    const landArea = parseFloat(document.getElementById('landArea')?.value) || 10000;
                    if (typeof calculateTotalGLA === 'function') {
                        const totalGLA = calculateTotalGLA() || 0;
                        if (totalGLA > 0) {
                            const baseRevenue = totalGLA * 400; // 400 SAR per sqm per year
                            // Apply 3% compound growth as fallback
                            yearlyRevenue = baseRevenue * Math.pow(1.03, operatingYear);
                        } else {
                            const baseRevenue = landArea * 300; // Fallback
                            yearlyRevenue = baseRevenue * Math.pow(1.03, operatingYear);
                        }
                    } else {
                        const baseRevenue = landArea * 300; // Final fallback
                        yearlyRevenue = baseRevenue * Math.pow(1.03, operatingYear);
                    }
                }
                
                return yearlyRevenue;
            }

            // KPI calculations function - استخدام النسخة الرئيسية من Registry
            function calculateIntegratedAnnualRevenue() {
                // 🎯 استخدام النسخة الرئيسية من النظام المرجعي (الأولوية العليا)
                if (window.CORE_FINANCIAL_FUNCTIONS?.calculateIntegratedAnnualRevenue) {
                    return window.CORE_FINANCIAL_FUNCTIONS.calculateIntegratedAnnualRevenue();
                }
                
                // 🔄 Fallback بسيط وآمن لتجنب المراجع الدائرية
                console.warn('⚠️ النسخة الرئيسية غير متاحة، استخدام fallback بسيط');
                const landArea = parseFloat(document.getElementById('landArea')?.value) || 10000;
                return landArea * 300; // Fallback calculation
            }

            // 🎯 حساب تكلفة الأرض - استخدام النظام المتكامل من app.js
            // ✅ DUPLICATE REMOVED: calculateLandCost 
            // Delegating to advanced version in app.js (line 17112)
            // The advanced version includes integrated land acquisition cost calculations
            // while this was just a delegation stub with fallbacks

            function updateIntegrationSummary() {
                console.log('🔗 بدء تحديث ملخص التكامل...');
                if (typeof getIntegrationData !== 'function') {
                    console.warn('⚠️ getIntegrationData not available yet, skipping integration update');
                    return;
                }
                const integration = getIntegrationData();
                const landCost = calculateLandCost();
                
                console.log('📊 بيانات التكامل:', {
                    landArea: integration.landArea,
                    constructionCost: integration.constructionCost,
                    annualRevenue: integration.annualRevenue,
                    landCost: landCost,
                    totalProjectCost: integration.totalProjectCost
                });
                
                // Update integration cards with error handling
                const updateElement = (id, value) => {
                    const element = document.getElementById(id);
                    if (element) {
                        element.textContent = value;
                        console.log('✅ تم تحديث', id, ':', value);
                    } else {
                        console.warn('⚠️ لم يتم العثور على العنصر:', id);
                    }
                };
                
                updateElement('landAreaIntegrationValue', integration.landArea.toLocaleString() + ' م²');
                updateElement('landAreaCostValue', 'تكلفة: ' + landCost.toLocaleString() + ' ريال');
                
                updateElement('constructionCostIntegrationValue', integration.constructionCost.toLocaleString() + ' ريال');
                updateElement('costPerSqmValue', 'للمتر المربع: ' + (integration.constructionCost / integration.landArea).toLocaleString() + ' ريال');
                
                updateElement('revenueIntegrationValue', integration.annualRevenue.toLocaleString() + ' ريال/سنة');
                updateElement('revenuePerSqmValue', 'للمتر المربع: ' + (integration.annualRevenue / integration.landArea).toLocaleString() + ' ريال/سنة');
                
                updateElement('totalProjectCostValue', integration.totalProjectCost.toLocaleString() + ' ريال');
                updateElement('projectCostBreakdownValue', 'أرض (' + ((landCost / integration.totalProjectCost) * 100).toFixed(1) + '%) + بناء (' + ((integration.constructionCost / integration.totalProjectCost) * 100).toFixed(1) + '%)');
                
                // تحديث حقل إجمالي الاستثمار
                updateElement('totalInvestment', integration.totalProjectCost.toLocaleString() + ' ريال');
                updateElement('totalInvestmentBreakdown', 
                    'أرض (' + ((landCost / integration.totalProjectCost) * 100).toFixed(1) + '%) + ' +
                    'تطوير (' + ((integration.constructionCost / integration.totalProjectCost) * 100).toFixed(1) + '%)');
                
                investmentData.integration = integration;
                console.log('✅ تم تحديث ملخص التكامل بنجاح');
                
                // تحديث توزيع تكاليف البناء إذا كان معروضاً
                if (typeof updateConstructionCostDistribution === 'function') {
                    updateConstructionCostDistribution();
                }
            }

            // Control Functions




            // Initialize Component 7 when document loads - multiple methods for reliability
            document.addEventListener('DOMContentLoaded', function() {
                console.log('🎯 DOMContentLoaded - تهيئة المكون السابع...');
                setTimeout(() => {
                    console.log('🎯 Starting initializeInvestmentFinancing...');
                    initializeInvestmentFinancing();
                }, 1000);
            });
            
            // Backup initialization method
            window.addEventListener('load', function() {
                console.log('🎯 Window loaded - تحقق من تهيئة المكون السابع...');
                setTimeout(() => {
                    if (!document.getElementById('landAreaIntegrationValue').textContent || 
                        document.getElementById('landAreaIntegrationValue').textContent === '0 م²') {
                        console.log('🔧 إعادة تهيئة المكون السابع...');
                        initializeInvestmentFinancing();
                    }
                }, 2000);
            });

            // Update Component 7 when other parameters change
            function updateFinancialKPIs() {
                calculateFinancialKPIs();
            }

            // ═══════════════════════════════════════════════════════════════
            // ⚡ Performance Enhancement: Loading Spinner System
            // ═══════════════════════════════════════════════════════════════
            
            /**
             * إظهار شاشة تحميل أثناء الحسابات
             */
            window.showCalculationLoader = function() {
                const oldLoader = document.getElementById('calc-loader');
                if (oldLoader) oldLoader.remove();
                
                const loader = document.createElement('div');
                loader.id = 'calc-loader';
                loader.innerHTML = \`
                    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center" style="animation: fadeIn 0.2s; z-index: 9999;">
                        <div class="bg-white/5 backdrop-filter backdrop-blur-sm/5 backdrop-filter backdrop-blur-sm rounded-2xl p-8 shadow-2xl max-w-md transform" style="animation: slideUp 0.3s;">
                            <div class="flex flex-col items-center">
                                <div class="relative mb-6">
                                    <div class="w-20 h-20 border-4 border-white/20 rounded-full"></div>
                                    <div class="w-20 h-20 border-4 border-gray-600 rounded-full absolute top-0 left-0 animate-spin border-t-transparent"></div>
                                </div>
                                
                                <h3 class="text-xl font-bold text-white mb-2">
                                    🧮 جاري الحساب...
                                </h3>
                                <p class="text-white/80 text-center text-sm">
                                    معالجة البيانات المالية والحسابات المعقدة
                                </p>
                                
                                <div class="w-full mt-6 bg-white/10 rounded-full h-2 overflow-hidden">
                                    <div class="bg-gradient-to-r from-gray-700 to-gray-800 h-2 rounded-full animate-pulse" style="width: 70%; animation: progressBar 1.5s ease-in-out infinite;"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <style>
                        @keyframes fadeIn {
                            from { opacity: 0; }
                            to { opacity: 1; }
                        }
                        @keyframes slideUp {
                            from { transform: translateY(20px); opacity: 0; }
                            to { transform: translateY(0); opacity: 1; }
                        }
                        @keyframes progressBar {
                            0%, 100% { transform: translateX(-100%); }
                            50% { transform: translateX(100%); }
                        }
                    </style>
                \`;
                document.body.appendChild(loader);
            };
            
            /**
             * إخفاء شاشة التحميل
             */
            window.hideCalculationLoader = function() {
                const loader = document.getElementById('calc-loader');
                if (loader) {
                    loader.style.opacity = '0';
                    loader.style.transition = 'opacity 0.3s ease-out';
                    setTimeout(() => loader.remove(), 300);
                }
            };
            
            /**
             * معالج محسّن للحسابات مع Loading Spinner
             */
            window.handleCalculateOptimized = function() {
                console.log('⚡ [handleCalculateOptimized] بدء الحسابات مع Loading Spinner...');
                
                // إظهار شاشة التحميل
                showCalculationLoader();
                
                // تنفيذ الحسابات بعد delay صغير (للسماح بظهور الـ loader)
                setTimeout(() => {
                    try {
                        // استدعاء دالة الحساب الأصلية
                        if (typeof handleCalculateWithValidation === 'function') {
                            handleCalculateWithValidation();
                        } else if (typeof handleCalculate === 'function') {
                            handleCalculate();
                        } else {
                            console.error('❌ لم يتم العثور على دالة الحساب');
                        }
                        
                        console.log('✅ [handleCalculateOptimized] اكتملت الحسابات بنجاح');
                        
                    } catch (error) {
                        console.error('❌ [handleCalculateOptimized] خطأ في الحسابات:', error);
                        alert('حدث خطأ أثناء الحسابات. يرجى التحقق من البيانات المدخلة والمحاولة مرة أخرى.');
                        
                    } finally {
                        // إخفاء شاشة التحميل
                        setTimeout(() => {
                            hideCalculationLoader();
                        }, 500); // delay إضافي للسماح بإكمال تحديثات DOM
                    }
                }, 100);
            };
            
            // تصدير الدوال
            window.showLoader = window.showCalculationLoader;
            window.hideLoader = window.hideCalculationLoader;
            
            console.log('✅ تم تحميل نظام Loading Spinner للأداء المحسّن');

            // ═══════════════════════════════════════════════════════════════
            // 🎯 Auto-Display KPI Dashboard on Page Load
            // ═══════════════════════════════════════════════════════════════
            
            /**
             * إظهار Dashboardاً عند تحميل الصفحة
             * مع ملء البطاقات بقيم تجريبية إذا لم تكن هناك بيانات
             */
            window.addEventListener('load', function() {
                console.log('🎯 [Auto-Display] تحقق من إظهار Dashboard...');
                
                setTimeout(() => {
                    const dashboardSection = document.getElementById('kpiDashboardSection');
                    if (dashboardSection) {
                        // التأكد من أن Dashboard ظاهر
                        dashboardSection.style.display = 'block';
                        dashboardSection.style.opacity = '1';
                        dashboardSection.style.visibility = 'visible';
                        
                        console.log('✅ [Auto-Display] Dashboard معروض الآن!');
                        console.log('💡 [Auto-Display] انقر "احسب دراسة الجدوى" لعرض المؤشرات الفعلية');
                    }
                }, 1000);
            });

            // تهيئة توزيع تكاليف البناء عند تحميل الصفحة
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(() => {
                    try {
                        updateConstructionCostDistribution();
                        console.log('✅ تم تهيئة توزيع تكاليف البناء بنجاح');
                        
                        // تهيئة عرض نموذج توزيع الأرباح
                        if (typeof updateProfitSharingModel === 'function') {
                            updateProfitSharingModel();
                            console.log('✅ تم تهيئة نموذج توزيع الأرباح');
                        }
                        
                        // تهيئة حقول النموذج المختلط
                        if (typeof toggleHybridWeightsContainer === 'function') {
                            toggleHybridWeightsContainer();
                            console.log('✅ تم تهيئة حقول النموذج المختلط');
                        }
                        
                        // تهيئة الخريطة الرئيسية
                        initializeMainMap();
                        
                    } catch (error) {
                        console.error('❌ خطأ في تهيئة التوزيعات:', error);
                    }
                }, 500);
            });
            
            /**
             * تهيئة الخريطة الرئيسية في Tab 1
             */
            function initializeMainMap() {
                try {
                    console.log('🗺️ بدء تهيئة الخريطة الرئيسية...');
                    
                    const mapContainer = document.getElementById('map');
                    if (!mapContainer) {
                        console.warn('⚠️ عنصر الخريطة غير موجود');
                        return;
                    }
                    
                    // الحصول على الإحداثيات الحالية
                    const latField = document.getElementById('currentLatitude');
                    const lngField = document.getElementById('currentLongitude');
                    
                    let lat = latField ? parseFloat(latField.value) : 24.7136;
                    let lng = lngField ? parseFloat(lngField.value) : 46.6753;
                    
                    if (isNaN(lat) || isNaN(lng)) {
                        lat = 24.7136;
                        lng = 46.6753;
                    }
                    
                    // إنشاء الخريطة (مع منع التهيئة المزدوجة)
                    if (typeof L !== 'undefined') {
                        // إذا كانت الخريطة مهيأة مسبقاً، فقط حدّث العرض
                        if (window.mainMap && window.mainMap.getContainer) {
                            try {
                                window.mainMap.setView([lat, lng], 13);
                                if (window.mainMarker) window.mainMarker.setLatLng([lat, lng]);
                                console.log('🗺️ الخريطة محملة مسبقاً - تم تحديث العرض فقط');
                            } catch(e) { /* تجاهل أخطاء التحديث */ }
                            return;
                        }
                        window.mainMap = L.map('map').setView([lat, lng], 13);
                        
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            attribution: '© OpenStreetMap contributors',
                            maxZoom: 19
                        }).addTo(window.mainMap);
                        
                        // إضافة العلامة (marker)
                        window.mainMarker = L.marker([lat, lng], {
                            draggable: true
                        }).addTo(window.mainMap);
                        
                        const locationName = document.getElementById('currentLocationName')?.textContent || 'الرياض';
                        window.mainMarker.bindPopup('<b>' + locationName + '</b>').openPopup();
                        
                        // حدث عند سحب العلامة
                        window.mainMarker.on('dragend', function(event) {
                            const position = event.target.getLatLng();
                            const latField = document.getElementById('currentLatitude');
                            const lngField = document.getElementById('currentLongitude');
                            const nameField = document.getElementById('currentLocationName');
                            
                            if (latField) latField.value = position.lat.toFixed(6);
                            if (lngField) lngField.value = position.lng.toFixed(6);
                            if (nameField) nameField.textContent = 'موقع مخصص';
                            
                            console.log('📍 تم تحديث الموقع: (' + position.lat.toFixed(6) + ', ' + position.lng.toFixed(6) + ')');
                        });
                        
                        // حدث عند النقر على الخريطة
                        window.mainMap.on('click', function(e) {
                            const lat = e.latlng.lat;
                            const lng = e.latlng.lng;
                            
                            // تحديث العلامة
                            window.mainMarker.setLatLng([lat, lng]);
                            
                            // تحديث الحقول
                            const latField = document.getElementById('currentLatitude');
                            const lngField = document.getElementById('currentLongitude');
                            const nameField = document.getElementById('currentLocationName');
                            
                            if (latField) latField.value = lat.toFixed(6);
                            if (lngField) lngField.value = lng.toFixed(6);
                            if (nameField) nameField.textContent = 'موقع مخصص';
                            
                            window.mainMarker.bindPopup('<b>موقع مخصص</b>').openPopup();
                            
                            console.log('📍 تم اختيار موقع جديد: (' + lat.toFixed(6) + ', ' + lng.toFixed(6) + ')');
                        });
                        
                        console.log('✅ تم تهيئة الخريطة الرئيسية بنجاح');
                    } else {
                        console.warn('⚠️ مكتبة Leaflet غير محملة');
                        mapContainer.innerHTML = '<div class="flex items-center justify-center h-full bg-white/5 backdrop-filter backdrop-blur-sm/8 text-white/70"><i class="fas fa-map-marked-alt text-4xl"></i><p class="ml-3">الخريطة غير متوفرة</p></div>';
                    }
                } catch (error) {
                    console.error('❌ خطأ في تهيئة الخريطة الرئيسية:', error);
                }
            }
            
            // ربط الدالة بالنطاق العام
            window.initializeMainMap = initializeMainMap;

        </script>
        
        <!-- AI Report Modal -->
        <div id="aiReportModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style="z-index: 9999;" onclick="if(event.target === this) closeAIReportModal()">
            <div class="bg-white/5 backdrop-filter backdrop-blur-sm/5 backdrop-filter backdrop-blur-sm rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col" onclick="event.stopPropagation()">
                <!-- Header -->
                <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
                    <h2 class="text-2xl font-bold flex items-center gap-2">
                        <i class="fas fa-file-alt"></i>
                        التقرير لدراسة الجدوى
                    </h2>
                    <button onclick="closeAIReportModal()" class="text-white hover:text-gray-200 text-2xl">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <!-- Content -->
                <div id="aiReportContent" class="flex-1 overflow-y-auto p-6">
                    <!-- سيتم ملؤه ديناميكياً -->
                </div>
                
                <!-- Footer Actions -->
                <div class="bg-white/5 backdrop-filter backdrop-blur-sm/5 px-6 py-4 rounded-b-lg flex items-center justify-between border-t">
                    <div class="flex gap-3">
                        <button onclick="printAIReport()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                            <i class="fas fa-print mr-2"></i>
                            طباعة
                        </button>
                        <button onclick="copyAIReport()" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors">
                            <i class="fas fa-copy mr-2"></i>
                            نسخ
                        </button>
                    </div>
                    <button onclick="closeAIReportModal()" class="bg-white/5 backdrop-filter backdrop-blur-sm/50 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors">
                        <i class="fas fa-times mr-2"></i>
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    </body>
    </html>
  `)
})

// Test API endpoint for cash flow system validation
app.get('/api/test-cashflow', (c) => {
  return c.json({
    message: 'Cash flow system temporarily disabled pending new integration',
    status: 'disabled',
    components: {
      integration: 'Disabled - awaiting redesigned cash flow integration',
      calculations: 'Disabled - legacy cash flow calculations removed',
      kpis: 'Partially available - ROI and other KPI utilities remain active',
      visualization: 'Disabled - charts temporarily offline',
      autoUpdate: 'Disabled - auto-update system paused'
    },
    features: {
      revenueIntegration: 'calculateIntegratedAnnualRevenue() remains available',
      cashFlowCalculation: 'calculateCashFlow() temporarily returns null',
      chartRendering: 'renderCashFlowChart() returns null until reinstated',
      tableRendering: 'updateCashFlowTable() displays disabled state',
      systemIntegration: 'getIntegrationData() still provides cost and revenue context'
    }
  })
})

// Test page for investment parameters root fix
app.get('/investment-root-fix-test', (c) => {
  return c.html(renderDeprecatedPage('صفحة اختبار الحل الجذري لمعاملات الاستثمار', 'تم إيقاف هذه الصفحة لأن آليات الاستثمار يتم إعادة تصميمها مع النظام الجديد.'))
})

app.get('/investment-stability-test', (c) => {
  return c.html(renderDeprecatedPage('صفحة اختبار استقرار الاستثمار', 'تم تعطيل اختبار استقرار الاستثمار أثناء إعادة بناء نموذج التدفقات النقدية.'))
})

app.get('/debug-investment-value', (c) => {
  return c.html(renderDeprecatedPage('صفحة تصحيح قيم الاستثمار', 'تم تعطيل لوحة تصحيح قيم الاستثمار بعد إزالة وظائف التدفقات النقدية.'))
})

export default app
