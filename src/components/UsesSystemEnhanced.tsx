import React, { useState, useEffect } from "react";

interface SubUnit {
  id: string;
  name: string;
  percentage: number;
  efficiency: number;
  areaPerUnit: number;
  units: number;
  totalArea: number;
}

interface UseConfig {
  id: string;
  name: string;
  nameEn: string;
  color: string;
  icon: string;
  share: number;
  efficiency: number;
  subUnits: SubUnit[];
  totalGLA: number;
  totalUnits: number;
}

const initialUses: UseConfig[] = [
  {
    id: "retail",
    name: "تجاري",
    nameEn: "Retail",
    color: "blue",
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
    color: "purple",
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
    color: "green",
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

interface Props {
  onUsesChange?: (uses: UseConfig[]) => void;
  landArea?: number;
  far?: number;
}

const UsesSystemEnhanced: React.FC<Props> = ({ onUsesChange, landArea = 10000, far = 3.5 }) => {
  const [uses, setUses] = useState<UseConfig[]>(initialUses);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [allExpanded, setAllExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState<{ useId: string; subUnitId: string } | null>(null);

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
  }, [landArea, far, onUsesChange]);

  const toggleExpand = (id: string) => {
    setExpanded(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const toggleExpandAll = () => {
    if (allExpanded) {
      setExpanded([]);
    } else {
      setExpanded(uses.map(use => use.id));
    }
    setAllExpanded(!allExpanded);
  };

  const updateUseShare = (useId: string, newShare: number) => {
    setUses(prev => 
      prev.map(use => 
        use.id === useId ? { ...use, share: newShare } : use
      )
    );
  };

  const updateUseEfficiency = (useId: string, newEfficiency: number) => {
    setUses(prev => 
      prev.map(use => 
        use.id === useId ? { ...use, efficiency: newEfficiency } : use
      )
    );
  };

  const updateSubUnit = (useId: string, subUnitId: string, field: keyof SubUnit, value: number | string) => {
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

  const addSubUnit = (useId: string) => {
    const newId = `${useId}_${Date.now()}`;
    const newSubUnit: SubUnit = {
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

  const deleteSubUnit = (useId: string, subUnitId: string) => {
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

  const resetToDefaults = () => {
    if (window.confirm("هل تريد إعادة تعيين جميع الإعدادات إلى القيم الافتراضية؟")) {
      setUses(initialUses);
    }
  };

  const totalSharePercentage = uses.reduce((sum, use) => sum + use.share, 0);
  const hasShareWarning = totalSharePercentage !== 100;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            🏗️ إدارة الاستخدامات
          </h2>
          <p className="text-gray-600">
            إجمالي المساحة المبنية: <span className="font-bold text-blue-600">{(landArea * far).toLocaleString('en-US')}</span> م²
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={toggleExpandAll}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {allExpanded ? "🔼 طي الكل" : "🔽 توسيع الكل"}
          </button>
          
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            🔄 إعادة تعيين
          </button>
        </div>
      </div>

      {/* Share Warning */}
      {hasShareWarning && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <i className="fas fa-exclamation-triangle text-yellow-400"></i>
            </div>
            <div className="ml-3">
              <p className="text-yellow-700">
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
            className={`rounded-lg border-2 shadow-md p-4 transition-all duration-200 ${
              expanded.includes(use.id) 
                ? `bg-${use.color}-50 border-${use.color}-300` 
                : `bg-${use.color}-25 border-${use.color}-200 hover:border-${use.color}-300`
            }`}
          >
            {/* Use Header */}
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => toggleExpand(use.id)}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{use.icon}</span>
                <div>
                  <h3 className={`text-${use.color}-800 font-bold text-lg`}>
                    {use.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {use.totalUnits} وحدة • {use.totalGLA.toLocaleString('en-US')} م²
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`text-${use.color}-600 font-bold`}>
                  {use.share}%
                </span>
                <i className={`fas ${expanded.includes(use.id) ? 'fa-chevron-up' : 'fa-chevron-down'} text-${use.color}-600`}></i>
              </div>
            </div>

            {/* Expanded Content */}
            {expanded.includes(use.id) && (
              <div className="mt-4 space-y-4">
                {/* Main Controls */}
                <div className="grid grid-cols-2 gap-4 p-3 bg-white rounded-lg border">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      النسبة (%)
                    </label>
                    <input
                      type="number"
                      value={use.share}
                      onChange={(e) => updateUseShare(use.id, parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الكفاءة (%)
                    </label>
                    <input
                      type="number"
                      value={use.efficiency}
                      onChange={(e) => updateUseEfficiency(use.id, parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                </div>

                {/* Sub Units */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                    <i className="fas fa-list text-blue-500"></i>
                    أنواع الوحدات
                  </h4>

                  {use.subUnits.map((subUnit) => (
                    <div
                      key={subUnit.id}
                      className="flex items-center gap-2 p-3 border rounded-lg bg-white hover:shadow-sm transition-shadow"
                    >
                      <button
                        onClick={() => deleteSubUnit(use.id, subUnit.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="حذف الوحدة"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>

                      <input
                        type="text"
                        value={subUnit.name}
                        onChange={(e) => updateSubUnit(use.id, subUnit.id, 'name', e.target.value)}
                        className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                        placeholder="اسم الوحدة"
                      />

                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={subUnit.percentage}
                          onChange={(e) => updateSubUnit(use.id, subUnit.id, 'percentage', parseFloat(e.target.value) || 0)}
                          className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-center"
                          min="0"
                          max="100"
                          step="0.1"
                        />
                        <span className="text-xs text-gray-500">%</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={subUnit.areaPerUnit}
                          onChange={(e) => updateSubUnit(use.id, subUnit.id, 'areaPerUnit', parseFloat(e.target.value) || 0)}
                          className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-center"
                          min="0"
                          step="0.1"
                        />
                        <span className="text-xs text-gray-500">م²</span>
                      </div>

                      <div className="flex items-center gap-1 bg-blue-50 rounded px-2 py-1">
                        <span className="font-bold text-blue-700 text-sm">
                          {subUnit.units}
                        </span>
                        <span className="text-xs text-blue-600">وحدة</span>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => addSubUnit(use.id)}
                    className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
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
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-bold text-gray-800 mb-3">📊 ملخص الاستخدامات</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {uses.map((use) => (
            <div key={use.id} className="text-center">
              <div className={`text-2xl font-bold text-${use.color}-600`}>
                {use.totalUnits}
              </div>
              <div className="text-sm text-gray-600">
                {use.name} • {use.share}%
              </div>
              <div className="text-xs text-gray-500">
                {use.totalGLA.toLocaleString('en-US')} م²
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-300">
          <div className="flex justify-between text-sm">
            <span>إجمالي النسب:</span>
            <span className={`font-bold ${hasShareWarning ? 'text-red-600' : 'text-green-600'}`}>
              {totalSharePercentage.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>إجمالي الوحدات:</span>
            <span className="font-bold text-blue-600">
              {uses.reduce((sum, use) => sum + use.totalUnits, 0)} وحدة
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>إجمالي المساحة المؤجرة:</span>
            <span className="font-bold text-purple-600">
              {uses.reduce((sum, use) => sum + use.totalGLA, 0).toLocaleString('en-US')} م²
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsesSystemEnhanced;