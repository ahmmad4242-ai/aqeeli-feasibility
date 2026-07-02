/**
 * تحديث معلومات المشروع والخريطة في صفحة الملخص
 */

(function() {
    console.log('📍 [Summary Project Info] تحميل...');

    let summaryMap = null;
    let summaryMarker = null;

    /**
     * تحديث معلومات المشروع الأساسية
     */
    function updateProjectBasicInfo() {
        try {
            // اسم المشروع
            const projectName = document.getElementById('projectName')?.value || 'غير محدد';
            const el1 = document.getElementById('summary-project-name');
            if (el1) el1.textContent = projectName;

            // اسم العميل
            const clientName = document.getElementById('clientName')?.value || 'غير محدد';
            const el2 = document.getElementById('summary-client-name');
            if (el2) el2.textContent = clientName;

            // الموقع
            const location = document.getElementById('location')?.value || 'غير محدد';
            const el3 = document.getElementById('summary-location');
            if (el3) el3.textContent = location;

            // مساحة الأرض
            const landArea = parseFloat(document.getElementById('landArea')?.value) || 0;
            const el4 = document.getElementById('summary-land-area');
            if (el4) el4.textContent = landArea > 0 ? `${landArea.toLocaleString('en-US')} م²` : '-';

            // معامل البناء
            const far = parseFloat(document.getElementById('allowedFAR')?.value) || 0;
            const el5 = document.getElementById('summary-far');
            if (el5) el5.textContent = far > 0 ? far.toFixed(2) : '-';

            // المساحة الإجمالية
            const gfa = (typeof calculateTotalGFA === 'function') ? calculateTotalGFA() : 0;
            const el6 = document.getElementById('summary-gfa');
            if (el6) el6.textContent = gfa > 0 ? `${gfa.toLocaleString('en-US')} م²` : '-';

            console.log('✅ تم تحديث معلومات المشروع');
        } catch (e) {
            console.log('❌ خطأ في تحديث معلومات المشروع:', e.message);
        }
    }

    /**
     * تحديث خريطة الموقع
     */
    function updateProjectMap() {
        try {
            const mapContainer = document.getElementById('summary-map');
            if (!mapContainer) return;

            // الحصول على الإحداثيات من حقول الإدخال
            const latInput = document.getElementById('currentLatitude');
            const lngInput = document.getElementById('currentLongitude');
            
            let lat = latInput ? parseFloat(latInput.value) : 24.7136;
            let lng = lngInput ? parseFloat(lngInput.value) : 46.6753;
            
            // إذا كانت القيم غير صحيحة، استخدم الرياض كافتراضي
            if (isNaN(lat) || isNaN(lng)) {
                lat = 24.7136;
                lng = 46.6753;
            }

            // إذا كانت الخريطة موجودة، قم بتحديث الموقع فقط
            if (summaryMap && summaryMarker) {
                summaryMap.setView([lat, lng], 15);
                summaryMarker.setLatLng([lat, lng]);
                console.log('✅ تم تحديث موقع الخريطة:', lat, lng);
                return;
            }

            // إنشاء خريطة جديدة
            if (typeof L !== 'undefined') {
                summaryMap = L.map('summary-map').setView([lat, lng], 15);
                
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors',
                    maxZoom: 19
                }).addTo(summaryMap);

                summaryMarker = L.marker([lat, lng], {
                    draggable: false
                }).addTo(summaryMap);

                summaryMarker.bindPopup('<b>موقع المشروع</b>').openPopup();

                console.log('✅ تم إنشاء الخريطة بنجاح:', lat, lng);
            } else {
                mapContainer.innerHTML = '<div class="flex items-center justify-center h-full bg-gray-100 text-gray-500"><i class="fas fa-map-marked-alt text-4xl"></i><p class="ml-3">الخريطة غير متوفرة</p></div>';
            }
        } catch (e) {
            console.log('❌ خطأ في تحديث الخريطة:', e.message);
        }
    }

    /**
     * تحديث شامل لمعلومات المشروع
     */
    window.updateSummaryProjectInfo = function() {
        updateProjectBasicInfo();
        updateProjectMap();
    };

    /**
     * ربط مع switchTab
     */
    const originalSwitchTab = window.switchTab;
    if (originalSwitchTab) {
        window.switchTab = function(tabId) {
            originalSwitchTab(tabId);
            
            if (tabId === 'tab-summary') {
                setTimeout(() => {
                    window.updateSummaryProjectInfo();
                }, 500);
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
                setTimeout(() => window.updateSummaryProjectInfo(), 2000);
            };
        }
    }

    /**
     * مراقبة التغييرات على حقول الإحداثيات
     */
    function watchCoordinatesChanges() {
        const latInput = document.getElementById('currentLatitude');
        const lngInput = document.getElementById('currentLongitude');
        
        if (latInput) {
            latInput.addEventListener('change', () => {
                console.log('📍 تغيير في خط العرض');
                updateProjectMap();
            });
        }
        
        if (lngInput) {
            lngInput.addEventListener('change', () => {
                console.log('📍 تغيير في خط الطول');
                updateProjectMap();
            });
        }
    }

    /**
     * التحميل الأولي
     */
    setTimeout(() => {
        hookCalculateButton();
        watchCoordinatesChanges();
        // تحديث أولي بعد التحميل
        setTimeout(() => window.updateSummaryProjectInfo(), 2000);
    }, 1000);

    console.log('✅ [Summary Project Info] جاهز');
})();
