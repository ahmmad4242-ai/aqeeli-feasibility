#!/usr/bin/env python3
"""
Script to process cost category templates and create a unified templates library
"""
import json
import os
from pathlib import Path
from datetime import datetime

# Paths
UPLOAD_DIR = Path("/home/user/uploaded_files")
OUTPUT_DIR = Path("/home/user/webapp/public/static/data")
OUTPUT_FILE = OUTPUT_DIR / "cost_templates_library.json"

def process_templates():
    """Process all cost category JSON templates"""
    
    # Ensure output directory exists
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Find all template files
    template_files = sorted(UPLOAD_DIR.glob("cost_category_*.json.txt"))
    
    print(f"📚 Found {len(template_files)} template files")
    
    templates = []
    
    for template_file in template_files:
        print(f"   📄 Processing: {template_file.name}")
        
        try:
            with open(template_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Extract template info
            metadata = data.get('metadata', {})
            category_data = data.get('categoryData', {})
            
            template = {
                "id": f"template_{metadata.get('categoryId', '')}_{int(datetime.now().timestamp() * 1000)}",
                "name": metadata.get('categoryName', ''),
                "nameEn": metadata.get('categoryNameEn', ''),
                "description": f"{metadata.get('categoryName', '')} - {metadata.get('itemsCount', 0)} بند",
                "categoryType": metadata.get('categoryType', 'construction'),
                "isCustom": metadata.get('isCustom', False),
                "isDuplicated": metadata.get('isDuplicated', False),
                "itemsCount": metadata.get('itemsCount', 0),
                "icon": category_data.get('icon', '🏗️'),
                "color": category_data.get('color', 'blue'),
                "categoryData": category_data,
                "metadata": metadata,
                "createdAt": metadata.get('exportDate', datetime.now().isoformat()),
                "tags": []
            }
            
            # Add tags based on name
            name_lower = template['name'].lower()
            if 'سكني' in name_lower:
                template['tags'].append('سكني')
            if 'تجاري' in name_lower:
                template['tags'].append('تجاري')
            if 'مكتبي' in name_lower:
                template['tags'].append('مكتبي')
            if 'فندقي' in name_lower:
                template['tags'].append('فندقي')
            if 'فيلا' in name_lower:
                template['tags'].append('فيلا')
            if 'برج' in name_lower:
                template['tags'].append('برج')
            if 'نصف تشطيب' in name_lower:
                template['tags'].append('نصف تشطيب')
            if 'تشطيب كامل' in name_lower:
                template['tags'].append('تشطيب كامل')
            if 'تشطيب مفروش' in name_lower or 'مفروش' in name_lower:
                template['tags'].append('تشطيب مفروش')
            if 'تشطيب فاخر' in name_lower or 'فاخر' in name_lower:
                template['tags'].append('تشطيب فاخر')
            if 'إدارة' in name_lower:
                template['tags'].append('إدارة')
            if 'طوارئ' in name_lower:
                template['tags'].append('طوارئ')
            if 'تراخيص' in name_lower:
                template['tags'].append('تراخيص')
            if 'رسوم' in name_lower:
                template['tags'].append('رسوم')
                
            templates.append(template)
            
        except Exception as e:
            print(f"   ❌ Error processing {template_file.name}: {e}")
            continue
    
    # Create library structure
    library = {
        "version": "1.0.0",
        "createdAt": datetime.now().isoformat(),
        "totalTemplates": len(templates),
        "categories": {
            "cost": {
                "name": "قوالب التكاليف",
                "nameEn": "Cost Templates",
                "icon": "💰",
                "enabled": True,
                "templates": templates
            },
            "revenue": {
                "name": "قوالب الإيرادات",
                "nameEn": "Revenue Templates",
                "icon": "💵",
                "enabled": False,
                "templates": []
            },
            "operating_expenses": {
                "name": "قوالب النفقات التشغيلية",
                "nameEn": "Operating Expenses Templates",
                "icon": "🔧",
                "enabled": False,
                "templates": []
            },
            "roles": {
                "name": "قوالب الأدوار",
                "nameEn": "Roles Templates",
                "icon": "👥",
                "enabled": False,
                "templates": []
            }
        }
    }
    
    # Save to file
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(library, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Templates library created successfully!")
    print(f"   📁 Output file: {OUTPUT_FILE}")
    print(f"   📊 Total templates: {len(templates)}")
    print(f"   💾 File size: {OUTPUT_FILE.stat().st_size / 1024:.2f} KB")
    
    # Print summary by tags
    tag_counts = {}
    for template in templates:
        for tag in template['tags']:
            tag_counts[tag] = tag_counts.get(tag, 0) + 1
    
    print(f"\n📈 Templates by tags:")
    for tag, count in sorted(tag_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"   {tag}: {count}")

if __name__ == "__main__":
    process_templates()
