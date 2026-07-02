/**
 * نظام جمع البيانات الاحترافي للتقرير الشامل
 * يقرأ البيانات الحقيقية من window.computedExportData
 * 
 * @version 3.0 - Professional Grade for Financial Institutions
 * @precision HIGH - للجهات التمويلية والرسمية
 */

window.collectComprehensiveReportData = function() {
    console.log('📊 [collectComprehensiveReportData v3.0] بدء جمع البيانات الحقيقية...');
    
    try {
        // 1. التأكد من حساب البيانات أولاً
        if (typeof window.computeExportDataTable === 'function') {
            window.computeExportDataTable();
            console.log('✅ تم حساب بيانات التصدير');
        }
        
        // 2. قراءة البيانات المحسوبة من window.computedExportData
        const computedData = window.computedExportData;
        
        if (!computedData) {
            console.error('❌ لا توجد بيانات محسوبة في window.computedExportData');
            return {
                error: 'لا توجد بيانات. يرجى حساب دراسة الجدوى أولاً.',
                errorType: 'NO_COMPUTED_DATA'
            };
        }
        
        console.log('📦 البيانات المحسوبة:', Object.keys(computedData).length, 'حقل');
        
        // 3. جمع البيانات الشاملة من المصدر الصحيح
        const comprehensiveData = {
            // معلومات المشروع الأساسية
            projectInfo: {
                projectName: computedData.project_name || 'مشروع عقاري',
                clientName: computedData.client_name || 'العميل',
                city: computedData.city || computedData.location || 'المدينة',
                projectCode: computedData.project_code || 'PRJ-001',
                
                // المساحات
                landArea: parseFloat(computedData.land_area) || 0,
                far: parseFloat(computedData.far) || 0,
                totalGFA: parseFloat(computedData.total_gfa) || 0,
                totalGLA: parseFloat(computedData.total_gla) || 0,
                totalFootprint: parseFloat(computedData.total_footprint) || 0,
                
                // الموقع
                latitude: computedData.latitude || '',
                longitude: computedData.longitude || '',
                
                // معلومات إضافية
                floorsCount: parseInt(computedData.floors_count) || 0,
                totalUnits: parseInt(computedData.total_units) || 0
            },
            
            // ملخص الأدوار
            floorsSummary: collectFloors(computedData),
            
            // ملخص الاستخدامات
            usesSummary: collectUses(computedData),
            
            // ملخص المواقف
            parkingSummary: {
                requiredParking: parseFloat(computedData.total_required_parking) || 0,
                suppliedParking: parseFloat(computedData.total_supplied_parking) || 0,
                surplus: parseFloat(computedData.parking_surplus) || 0,
                complianceStatus: (parseFloat(computedData.parking_surplus) || 0) >= 0 ? 'مستوفي' : 'عجز',
                compliancePercentage: computedData.total_required_parking > 0 
                    ? ((parseFloat(computedData.total_supplied_parking) || 0) / (parseFloat(computedData.total_required_parking) || 1) * 100) 
                    : 0
            },
            
            // ملخص التكاليف
            costsSummary: collectCosts(computedData),
            
            // ملخص الإيرادات
            revenuesSummary: collectRevenues(computedData),
            
            // ملخص النفقات التشغيلية
            opexSummary: collectOpex(computedData),
            
            // ملخص الاستثمار والتمويل
            investmentSummary: {
                totalInvestment: parseFloat(computedData.total_investment) || 0,
                landCost: parseFloat(computedData.land_cost) || 0,
                constructionCost: parseFloat(computedData.total_construction_cost) || 0,
                additionalCosts: parseFloat(computedData.additional_costs) || 0,
                
                // التمويل
                equityAmount: parseFloat(computedData.equity_amount) || 0,
                debtAmount: parseFloat(computedData.debt_amount) || 0,
                equityPercentage: parseFloat(computedData.equity_percentage) || 0,
                debtPercentage: parseFloat(computedData.debt_percentage) || 0,
                loanInterestRate: parseFloat(computedData.loan_interest_rate) || 0,
                loanTerm: parseInt(computedData.loan_term_years) || 0,
                
                // معدلات الخصم
                discountRate: parseFloat(computedData.discount_rate) || 0,
                wacc: parseFloat(computedData.wacc) || 0,
                
                // استراتيجية الخروج
                exitStrategy: computedData.exit_strategy || 'بيع',
                exitCapRate: parseFloat(computedData.exit_cap_rate) || 0,
                exitValue: parseFloat(computedData.exit_value) || 0
            },
            
            // المؤشرات المالية الرئيسية
            financialKPIs: {
                // المؤشرات الرئيسية
                npv: parseFloat(computedData.npv) || 0,
                irr: parseFloat(computedData.irr) || 0,
                roi: parseFloat(computedData.roi) || 0,
                paybackPeriod: parseFloat(computedData.payback_period) || 0,
                
                // مؤشرات الربحية
                profitMargin: parseFloat(computedData.profit_margin) || 0,
                netProfit: parseFloat(computedData.net_profit) || 0,
                grossProfit: parseFloat(computedData.gross_profit) || 0,
                
                // نسب السيولة والأداء
                cashOnCashReturn: parseFloat(computedData.cash_on_cash_return) || 0,
                dscr: parseFloat(computedData.dscr) || 0,
                capRateEntry: parseFloat(computedData.cap_rate_entry) || 0,
                capRateExit: parseFloat(computedData.cap_rate_exit) || 0,
                yieldOnCost: parseFloat(computedData.yield_on_cost) || 0,
                
                // نسب الكفاءة
                efficiencyRatio: parseFloat(computedData.efficiency_ratio) || 0,
                constructionCostPerSQM: parseFloat(computedData.construction_cost_per_sqm) || 0,
                revenuePerSQM: parseFloat(computedData.revenue_per_sqm) || 0
            },
            
            // ملخص التدفقات النقدية
            cashFlowSummary: collectCashFlow(computedData),
            
            // البيانات الخام (للمرجعية)
            rawData: computedData
        };
        
        console.log('✅ [collectComprehensiveReportData] جمع البيانات اكتمل بنجاح');
        console.log('📊 ملخص البيانات:', {
            projectName: comprehensiveData.projectInfo.projectName,
            totalFloors: comprehensiveData.floorsSummary.totalFloors,
            totalCost: comprehensiveData.costsSummary.totalCost,
            totalRevenue: comprehensiveData.revenuesSummary.totalRevenue,
            npv: comprehensiveData.financialKPIs.npv,
            irr: comprehensiveData.financialKPIs.irr
        });
        
        return comprehensiveData;
        
    } catch (error) {
        console.error('❌ خطأ في جمع البيانات:', error);
        return {
            error: 'فشل في جمع البيانات',
            errorMessage: error.message,
            errorType: 'COLLECTION_ERROR'
        };
    }
};

// ==========================================
// جمع بيانات الأدوار
// ==========================================
function collectFloors(data) {
    const floors = [];
    let totalGFA = 0;
    let totalHeight = 0;
    let floorCount = 0;
    
    // البحث عن جميع حقول الأدوار
    Object.keys(data).forEach(key => {
        if (key.startsWith('floor_') && key.includes('_name')) {
            const floorNum = key.match(/floor_(\d+)_/)?.[1];
            if (floorNum) {
                const floorData = {
                    number: parseInt(floorNum),
                    name: data[`floor_${floorNum}_name`] || `دور ${floorNum}`,
                    area: parseFloat(data[`floor_${floorNum}_area`]) || 0,
                    height: parseFloat(data[`floor_${floorNum}_height`]) || 0,
                    footprint: parseFloat(data[`floor_${floorNum}_footprint_ratio`]) || 0,
                    efficiency: parseFloat(data[`floor_${floorNum}_efficiency_ratio`]) || 0,
                    usage: data[`floor_${floorNum}_usage`] || ''
                };
                
                if (floorData.area > 0) { // فقط الأدوار التي لها مساحة فعلية
                    floors.push(floorData);
                    totalGFA += floorData.area;
                    totalHeight += floorData.height;
                    floorCount++;
                }
            }
        }
    });
    
    return {
        totalFloors: floorCount,
        floors: floors.sort((a, b) => a.number - b.number),
        totalGFA: totalGFA,
        averageHeight: floorCount > 0 ? (totalHeight / floorCount) : 0,
        totalFootprint: parseFloat(data.total_footprint) || 0
    };
}

// ==========================================
// جمع بيانات الاستخدامات
// ==========================================
function collectUses(data) {
    const uses = [];
    let totalGLA = 0;
    let totalUnits = 0;
    let totalRevenue = 0;
    
    // أنواع الاستخدامات المعروفة
    const useTypes = [
        { key: 'residential', name: 'سكني' },
        { key: 'retail', name: 'تجاري' },
        { key: 'office', name: 'إداري' },
        { key: 'hotel', name: 'فندقي' },
        { key: 'mixed', name: 'مختلط' },
        { key: 'industrial', name: 'صناعي' },
        { key: 'warehouse', name: 'مستودعات' },
        { key: 'healthcare', name: 'صحي' },
        { key: 'education', name: 'تعليمي' },
        { key: 'other', name: 'أخرى' }
    ];
    
    useTypes.forEach(type => {
        const gla = parseFloat(data[`${type.key}_gla`]) || 0;
        const units = parseInt(data[`${type.key}_units`]) || 0;
        const avgPrice = parseFloat(data[`${type.key}_avg_price`]) || 0;
        const avgRent = parseFloat(data[`${type.key}_avg_rent`]) || 0;
        const totalUseRevenue = parseFloat(data[`${type.key}_total_revenue`]) || 0;
        
        if (gla > 0 || units > 0 || totalUseRevenue > 0) {
            const useData = {
                type: type.key,
                arabicName: type.name,
                gla: gla,
                units: units,
                avgPrice: avgPrice,
                avgRent: avgRent,
                totalRevenue: totalUseRevenue,
                share: 0 // سيتم حسابها لاحقاً
            };
            
            uses.push(useData);
            totalGLA += gla;
            totalUnits += units;
            totalRevenue += totalUseRevenue;
        }
    });
    
    // حساب النسب المئوية
    if (totalGLA > 0) {
        uses.forEach(use => {
            use.share = (use.gla / totalGLA) * 100;
        });
    }
    
    return {
        totalUses: uses.length,
        uses: uses,
        totalGLA: totalGLA,
        totalUnits: totalUnits,
        totalRevenue: totalRevenue,
        averageRevenuePerUnit: totalUnits > 0 ? (totalRevenue / totalUnits) : 0
    };
}

// ==========================================
// جمع بيانات التكاليف
// ==========================================
function collectCosts(data) {
    // بنود التكاليف التفصيلية
    const costCategories = [
        { key: 'concrete_works_cost', name: 'أعمال الخرسانة' },
        { key: 'masonry_works_cost', name: 'أعمال المباني' },
        { key: 'metal_works_cost', name: 'الأعمال المعدنية' },
        { key: 'wood_plastic_works_cost', name: 'أعمال الخشب والبلاستيك' },
        { key: 'insulation_works_cost', name: 'أعمال العزل' },
        { key: 'doors_windows_cost', name: 'الأبواب والشبابيك' },
        { key: 'finishes_cost', name: 'أعمال التشطيبات' },
        { key: 'specialized_works_cost', name: 'الأعمال التخصصية' },
        { key: 'equipment_cost', name: 'المعدات' },
        { key: 'furnishings_cost', name: 'المفروشات' },
        { key: 'special_construction_cost', name: 'الإنشاءات الخاصة' },
        { key: 'transport_equipment_cost', name: 'معدات النقل' },
        { key: 'fire_resistance_cost', name: 'مقاومة الحريق' },
        { key: 'plumbing_cost', name: 'الصرف والتغذية' },
        { key: 'hvac_cost', name: 'التكييف والتهوية' },
        { key: 'full_automation_cost', name: 'الأتمتة الكاملة' },
        { key: 'electricity_cost', name: 'الكهرباء' }
    ];
    
    const breakdown = [];
    let totalDetailedCost = 0;
    
    costCategories.forEach(cat => {
        const value = parseFloat(data[cat.key]) || 0;
        if (value > 0) {
            breakdown.push({
                category: cat.name,
                cost: value,
                percentage: 0 // سيتم حسابها لاحقاً
            });
            totalDetailedCost += value;
        }
    });
    
    // حساب النسب المئوية
    const totalCost = parseFloat(data.total_construction_cost) || totalDetailedCost;
    if (totalCost > 0) {
        breakdown.forEach(item => {
            item.percentage = (item.cost / totalCost) * 100;
        });
    }
    
    // ترتيب حسب القيمة (من الأكبر للأصغر)
    breakdown.sort((a, b) => b.cost - a.cost);
    
    return {
        categories: breakdown,
        totalCost: totalCost,
        totalItems: breakdown.length,
        largestCategory: breakdown[0] || null,
        costPerSQM: totalCost > 0 && data.total_gfa > 0 ? (totalCost / parseFloat(data.total_gfa)) : 0,
        
        // تفاصيل إضافية
        landCost: parseFloat(data.land_cost) || 0,
        constructionCost: totalCost,
        additionalCosts: parseFloat(data.additional_costs) || 0,
        totalInvestment: parseFloat(data.total_investment) || 0
    };
}

// ==========================================
// جمع بيانات الإيرادات
// ==========================================
function collectRevenues(data) {
    const items = [];
    let totalRevenue = 0;
    
    // الإيرادات حسب نوع الاستخدام
    const useTypes = ['residential', 'retail', 'office', 'hotel', 'mixed', 'industrial', 'warehouse', 'healthcare', 'education', 'other'];
    
    useTypes.forEach(type => {
        const revenue = parseFloat(data[`${type}_total_revenue`]) || 0;
        if (revenue > 0) {
            items.push({
                source: getUsageArabicName(type),
                amount: revenue,
                percentage: 0 // سيتم حسابها لاحقاً
            });
            totalRevenue += revenue;
        }
    });
    
    // إذا لم توجد بيانات تفصيلية، استخدم الإجمالي
    if (totalRevenue === 0) {
        const mainRevenue = parseFloat(data.total_revenue) || 0;
        if (mainRevenue > 0) {
            totalRevenue = mainRevenue;
            items.push({
                source: 'إجمالي الإيرادات',
                amount: mainRevenue,
                percentage: 100
            });
        }
    } else {
        // حساب النسب المئوية
        items.forEach(item => {
            item.percentage = (item.amount / totalRevenue) * 100;
        });
    }
    
    return {
        items: items,
        totalRevenue: totalRevenue,
        itemCount: items.length,
        revenuePerSQM: totalRevenue > 0 && data.total_gla > 0 ? (totalRevenue / parseFloat(data.total_gla)) : 0
    };
}

// ==========================================
// جمع بيانات النفقات التشغيلية
// ==========================================
function collectOpex(data) {
    const categories = [
        { key: 'general_opex_annual', name: 'النفقات العامة' },
        { key: 'maintenance_opex_annual', name: 'الصيانة' },
        { key: 'utilities_opex_annual', name: 'المرافق' },
        { key: 'insurance_opex_annual', name: 'التأمين' },
        { key: 'management_opex_annual', name: 'الإدارة' },
        { key: 'marketing_opex_annual', name: 'التسويق' }
    ];
    
    const items = [];
    let totalAnnualOpex = 0;
    
    categories.forEach(cat => {
        const value = parseFloat(data[cat.key]) || 0;
        if (value > 0) {
            items.push({
                category: cat.name,
                annual: value,
                percentage: 0 // سيتم حسابها لاحقاً
            });
            totalAnnualOpex += value;
        }
    });
    
    // إذا لم توجد بيانات تفصيلية، استخدم الإجمالي
    if (totalAnnualOpex === 0) {
        totalAnnualOpex = parseFloat(data.total_annual_opex) || 0;
    }
    
    // حساب النسب المئوية
    if (totalAnnualOpex > 0) {
        items.forEach(item => {
            item.percentage = (item.annual / totalAnnualOpex) * 100;
        });
    }
    
    return {
        items: items,
        totalAnnualOpex: totalAnnualOpex,
        itemCount: items.length,
        opexPerSQM: totalAnnualOpex > 0 && data.total_gla > 0 ? (totalAnnualOpex / parseFloat(data.total_gla)) : 0
    };
}

// ==========================================
// جمع بيانات التدفقات النقدية
// ==========================================
function collectCashFlow(data) {
    const operatingPeriod = parseInt(data.operating_period_years) || 10;
    const yearlyData = [];
    
    // جمع بيانات كل سنة
    for (let year = 0; year <= operatingPeriod; year++) {
        const yearData = {
            year: year,
            revenue: parseFloat(data[`cf_revenue_year_${year}`]) || 0,
            opex: parseFloat(data[`cf_opex_year_${year}`]) || 0,
            noi: parseFloat(data[`cf_noi_year_${year}`]) || 0,
            capex: parseFloat(data[`cf_capex_year_${year}`]) || 0,
            debtService: parseFloat(data[`cf_debt_service_year_${year}`]) || 0,
            netCashFlow: parseFloat(data[`cf_net_year_${year}`]) || 0,
            cumulativeCashFlow: parseFloat(data[`cf_cumulative_year_${year}`]) || 0
        };
        
        yearlyData.push(yearData);
    }
    
    // حساب الإجماليات
    const totalRevenue = yearlyData.reduce((sum, y) => sum + y.revenue, 0);
    const totalOpex = yearlyData.reduce((sum, y) => sum + y.opex, 0);
    const totalNOI = yearlyData.reduce((sum, y) => sum + y.noi, 0);
    const totalNetCashFlow = yearlyData.reduce((sum, y) => sum + y.netCashFlow, 0);
    
    return {
        operatingPeriod: operatingPeriod,
        yearlyData: yearlyData,
        summary: {
            totalRevenue: totalRevenue,
            totalOpex: totalOpex,
            totalNOI: totalNOI,
            totalNetCashFlow: totalNetCashFlow,
            averageAnnualNOI: operatingPeriod > 0 ? (totalNOI / operatingPeriod) : 0
        }
    };
}

// ==========================================
// دوال مساعدة
// ==========================================
function getUsageArabicName(useType) {
    const names = {
        residential: 'سكني',
        retail: 'تجاري',
        office: 'إداري',
        hotel: 'فندقي',
        mixed: 'مختلط',
        industrial: 'صناعي',
        warehouse: 'مستودعات',
        healthcare: 'صحي',
        education: 'تعليمي',
        other: 'أخرى'
    };
    return names[useType] || useType;
}

console.log('✅ نظام جمع البيانات الاحترافي v3.0 جاهز - يقرأ من window.computedExportData');
