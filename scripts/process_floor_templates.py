#!/usr/bin/env python3
"""
معالج قوالب الأدوار - Floor Templates Processor
يقوم بمعالجة جميع ملفات JSON لقوالب الأدوار وإنشاء مكتبة موحدة
مع توليد أسماء تلقائية بناءً على عدد الأدوار وأنواع الاستخدامات
"""

import json
import os
from pathlib import Path
from collections import Counter
from datetime import datetime

# مسارات الملفات
UPLOADS_DIR = Path('/home/user/uploaded_files')
OUTPUT_DIR = Path('/home/user/webapp/public/static/data')
OUTPUT_FILE = OUTPUT_DIR / 'floor_templates_library.json'

# أنواع الاستخدامات وترجماتها
USAGE_NAMES = {
    'residential': 'سكني',
    'commercial': 'تجاري',
    'retail': 'تجاري',
    'office': 'مكتبي',
    'hotel': 'فندقي',
    'parking': 'مواقف',
    'services': 'خدمات'
}

USAGE_ICONS = {
    'residential': '🏠',
    'commercial': '🏪',
    'retail': '🛒',
    'office': '🏢',
    'hotel': '🏨',
    'parking': '🅿️',
    'services': '🔧'
}

def generate_template_name(floors_data, metadata):
    """توليد اسم تلقائي للقالب بناءً على المحتوى"""
    
    # حساب عدد كل نوع استخدام (مع احتساب repeatCount)
    usage_counts = Counter()
    total_floors = 0
    
    for floor in floors_data:
        if not floor.get('enabled', True):
            continue
            
        usage = floor.get('usage', 'unknown')
        repeat_count = floor.get('repeatCount', 1)
        usage_counts[usage] += repeat_count
        total_floors += repeat_count
    
    # بناء جزء أنواع الاستخدامات (أكثر 3 أنواع شيوعاً)
    usage_parts = []
    for usage, count in usage_counts.most_common(3):
        usage_label = USAGE_NAMES.get(usage, usage)
        if count > 1:
            usage_parts.append(f"{usage_label}({count})")
        else:
            usage_parts.append(usage_label)
    
    # بناء الاسم النهائي
    usage_text = " + ".join(usage_parts)
    floors_text = f"{total_floors} أدوار" if total_floors > 2 else f"{total_floors} دور"
    
    template_name = f"{usage_text} - {floors_text}"
    
    return template_name, total_floors, list(usage_counts.keys())

def get_template_icon(usage_types):
    """اختيار أيقونة مناسبة بناءً على أنواع الاستخدامات"""
    if not usage_types:
        return '🏢'
    
    # الأيقونة الافتراضية حسب النوع الأكثر شيوعاً
    primary_usage = usage_types[0]
    return USAGE_ICONS.get(primary_usage, '🏢')

def extract_description(metadata):
    """استخراج وصف من البيانات الوصفية"""
    parts = []
    
    if 'projectName' in metadata and metadata['projectName']:
        parts.append(metadata['projectName'])
    
    if 'landArea' in metadata:
        parts.append(f"مساحة الأرض: {metadata['landArea']} م²")
    
    return " - ".join(parts) if parts else "قالب أدوار متعدد الاستخدامات"

def generate_tags(usage_types, total_floors):
    """توليد تاجات للقالب"""
    tags = []
    
    # تاجات أنواع الاستخدام
    for usage in usage_types[:3]:
        usage_name = USAGE_NAMES.get(usage, usage)
        if usage_name not in tags:
            tags.append(usage_name)
    
    # تاج حجم المشروع
    if total_floors <= 5:
        tags.append('صغير')
    elif total_floors <= 10:
        tags.append('متوسط')
    else:
        tags.append('كبير')
    
    return tags

def process_floor_template(file_path):
    """معالجة ملف قالب أدوار واحد"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        floors_data = data.get('floorsData', [])
        metadata = data.get('metadata', {})
        export_info = data.get('exportInfo', {})
        
        # توليد الاسم التلقائي
        template_name, total_floors, usage_types = generate_template_name(floors_data, metadata)
        
        # إنشاء معرف فريد
        timestamp = export_info.get('timestamp', '')
        template_id = f"floor_template_{file_path.stem.split('_')[-1]}"
        
        # بناء بيانات القالب
        template = {
            'id': template_id,
            'name': template_name,
            'description': extract_description(metadata),
            'tags': generate_tags(usage_types, total_floors),
            'icon': get_template_icon(usage_types),
            'floorsCount': total_floors,
            'usageTypes': usage_types,
            'floorsData': floors_data,
            'metadata': metadata,
            'exportInfo': export_info,
            'createdAt': timestamp,
            'isDefault': True
        }
        
        return template
        
    except Exception as e:
        print(f"خطأ في معالجة {file_path.name}: {e}")
        return None

def main():
    """الدالة الرئيسية"""
    print("🚀 بدء معالجة قوالب الأدوار...")
    print(f"📁 مسار الملفات المرفوعة: {UPLOADS_DIR}")
    
    # البحث عن جميع ملفات قوالب الأدوار
    floor_files = list(UPLOADS_DIR.glob('floors_management_data_*.json.txt'))
    print(f"📊 عدد الملفات المكتشفة: {len(floor_files)}")
    
    if not floor_files:
        print("❌ لم يتم العثور على ملفات قوالب أدوار!")
        return
    
    # معالجة جميع القوالب
    templates = []
    for i, file_path in enumerate(floor_files, 1):
        print(f"\n⚙️  معالجة ({i}/{len(floor_files)}): {file_path.name}")
        template = process_floor_template(file_path)
        
        if template:
            templates.append(template)
            print(f"   ✅ الاسم: {template['name']}")
            print(f"   📊 الأدوار: {template['floorsCount']}")
            print(f"   🏗️  الاستخدامات: {', '.join([USAGE_NAMES.get(u, u) for u in template['usageTypes'][:3]])}")
    
    print(f"\n✅ تمت معالجة {len(templates)} قالب بنجاح")
    
    # إنشاء مجلد الإخراج إذا لم يكن موجوداً
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # إنشاء ملف المكتبة الموحد
    library = {
        'version': '1.0.0',
        'lastUpdated': datetime.now().strftime('%Y-%m-%d'),
        'totalTemplates': len(templates),
        'templates': templates
    }
    
    # حفظ المكتبة
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(library, f, ensure_ascii=False, indent=2)
    
    file_size = OUTPUT_FILE.stat().st_size / 1024  # KB
    print(f"\n💾 تم حفظ مكتبة القوالب: {OUTPUT_FILE}")
    print(f"📦 حجم الملف: {file_size:.1f} KB")
    print(f"📚 إجمالي القوالب: {len(templates)}")
    
    # عرض أمثلة من الأسماء المولدة
    print("\n📋 أمثلة من الأسماء المولدة:")
    for template in templates[:5]:
        print(f"   • {template['name']}")
    
    print("\n✨ اكتمل! جاهز للتكامل مع واجهة المستخدم")

if __name__ == '__main__':
    main()
