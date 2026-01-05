#!/usr/bin/env python3
"""
Organize AFR catalog images and generate SQL updates.

This script:
1. Finds the best image for each AFR part number
2. Copies it to a clean location with simple filename
3. Generates SQL to update the migration
"""

import os
import re
import shutil
from pathlib import Path
from collections import defaultdict

# Source and destination
SRC_DIR = Path(__file__).parent.parent / "public" / "shop" / "afr-images"
DEST_DIR = Path(__file__).parent.parent / "public" / "shop" / "afr-heads"

# Our part numbers grouped by engine family
PARTS_BY_FAMILY = {
    "sbc": ["1011", "1012", "1016", "0911", "0916", "908", "1034", "1036", 
            "1095-716", "1050", "1054", "1100", "1065", "1110", "1068", 
            "1121", "1132-TI", "1137-TI"],
    "sbf": ["1351", "1352", "1402", "1472", "1422", "1420", 
            "1426-716", "1428-716", "1450", "1451"],
    "ls": ["1501", "1502", "1506", "1510", "1530", "1610", "1680"],
    "ls3": ["1803", "1804", "1840", "1845"],
    "bbc": ["2000", "2001", "2010-TI", "2015-TI", "2020-TI", 
            "2100", "2101", "2110"],
    "mopar": ["2401", "2402"],
    "hemi": ["2509", "2510", "2505", "2506", "2513", "2514"],
}

# Flatten for lookup
PART_TO_FAMILY = {}
for family, parts in PARTS_BY_FAMILY.items():
    for part in parts:
        # Normalize part number (remove suffix like -TI, -716)
        base_part = part.split("-")[0]
        PART_TO_FAMILY[base_part] = family
        PART_TO_FAMILY[part] = family

def find_best_image(part_number: str, all_files: list) -> Path | None:
    """Find the best image for a part number."""
    base_part = part_number.split("-")[0]
    
    # Find all matching files
    matches = []
    for f in all_files:
        # Match AFR_XXXX pattern
        if f"AFR_{base_part}" in f.name:
            # Prefer certain image types
            score = 0
            name_lower = f.name.lower()
            
            # Prefer "Cylinder_Head" images
            if "cylinder_head" in name_lower:
                score += 100
            # Then "Specifications_Features" 
            elif "specifications" in name_lower:
                score += 80
            # Then product pages
            elif "_p" in name_lower and "img01" in name_lower:
                score += 50
            else:
                score += 10
            
            # Larger images are better (check file size as proxy)
            try:
                size = f.stat().st_size
                score += min(size // 10000, 50)  # Cap bonus at 50
            except:
                pass
            
            matches.append((f, score))
    
    if not matches:
        return None
    
    # Return highest scored match
    matches.sort(key=lambda x: x[1], reverse=True)
    return matches[0][0]

def main():
    if not SRC_DIR.exists():
        print(f"ERROR: Source directory not found: {SRC_DIR}")
        print("Run this after extracting AFR_catalog_images_png_by_partnumber.zip")
        return
    
    # Create destination
    DEST_DIR.mkdir(parents=True, exist_ok=True)
    
    # Get all source files
    all_files = list(SRC_DIR.glob("*.png"))
    print(f"Found {len(all_files)} source images\n")
    
    # Track what we copy
    copied = {}
    missing = defaultdict(list)
    family_images = defaultdict(list)
    
    # Process each part
    for family, parts in PARTS_BY_FAMILY.items():
        print(f"\n{family.upper()}:")
        for part in parts:
            best = find_best_image(part, all_files)
            if best:
                # Copy with clean filename
                dest_name = f"afr-{part.lower()}.png"
                dest_path = DEST_DIR / dest_name
                shutil.copy2(best, dest_path)
                copied[part] = f"/shop/afr-heads/{dest_name}"
                family_images[family].append(dest_name)
                print(f"  ✓ {part}: {best.name} -> {dest_name}")
            else:
                missing[family].append(part)
                print(f"  ✗ {part}: No image found")
    
    # Also create family-level fallback images (first good one from each family)
    print("\n\nCreating family fallback images...")
    for family, images in family_images.items():
        if images:
            # Copy first image as family fallback
            src = DEST_DIR / images[0]
            dest = DEST_DIR / f"afr-{family}-head.png"
            shutil.copy2(src, dest)
            print(f"  {family}: {dest.name}")
    
    # Generate SQL update snippet
    print("\n" + "="*60)
    print("SQL UPDATE STATEMENTS")
    print("="*60)
    
    sql_file = DEST_DIR / "update_image_urls.sql"
    with open(sql_file, "w") as f:
        f.write("-- Update AFR cylinder head image URLs\n")
        f.write("-- Run this AFTER running 018_seed_afr_cylinder_heads.sql\n\n")
        
        for part, url in sorted(copied.items()):
            f.write(f"UPDATE cse_parts_products SET image_url = '{url}' WHERE part_number = '{part}';\n")
        
        # Add fallbacks for missing parts
        f.write("\n-- Fallback images for parts without specific images\n")
        for family, parts in missing.items():
            fallback_url = f"/shop/afr-heads/afr-{family}-head.png"
            for part in parts:
                f.write(f"UPDATE cse_parts_products SET image_url = '{fallback_url}' WHERE part_number = '{part}';\n")
    
    print(f"\nSQL saved to: {sql_file}")
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"Images copied: {len(copied)}")
    print(f"Missing (will use family fallback): {sum(len(v) for v in missing.values())}")
    
    for family, parts in missing.items():
        if parts:
            print(f"  {family}: {', '.join(parts)}")


if __name__ == "__main__":
    main()
