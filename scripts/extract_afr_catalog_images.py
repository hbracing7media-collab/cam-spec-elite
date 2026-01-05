#!/usr/bin/env python3
"""
AFR Catalog Image Extractor

Extracts images from AFR dealer catalog PDF and attempts to match them
to part numbers for the cylinder heads database.

Requirements:
    pip install pymupdf pillow

Usage:
    python scripts/extract_afr_catalog_images.py <path_to_catalog.pdf>
"""

import sys
import os
import re
import json
from pathlib import Path

try:
    import fitz  # PyMuPDF
except ImportError:
    print("ERROR: PyMuPDF not installed. Run: pip install pymupdf")
    sys.exit(1)

try:
    from PIL import Image
except ImportError:
    print("ERROR: Pillow not installed. Run: pip install pillow")
    sys.exit(1)

# AFR part numbers from our seed file
AFR_PART_NUMBERS = [
    # SBC
    "1011", "1012", "1016", "0911", "0916", "908", "1034", "1036", "1095-716",
    "1050", "1054", "1100", "1065", "1110", "1068", "1121", "1132-TI", "1137-TI",
    # SBF
    "1351", "1352", "1402", "1472", "1422", "1420", "1426-716", "1428-716", "1450", "1451",
    # LS Cathedral
    "1501", "1502", "1506", "1510", "1530", "1610", "1680",
    # LS3 Rectangle
    "1803", "1804", "1840", "1845",
    # BBC
    "2000", "2001", "2010-TI", "2015-TI", "2020-TI", "2100", "2101", "2110",
    # Mopar LA
    "2401", "2402",
    # Gen 3 Hemi
    "2509", "2510", "2505", "2506", "2513", "2514",
]

# Engine family patterns to help categorize images
ENGINE_PATTERNS = {
    "SBC": [r"SBC", r"23°", r"small block chevy", r"enforcer.*chevy"],
    "SBF": [r"SBF", r"20°", r"small block ford", r"windsor"],
    "LS": [r"\bLS\b", r"15°", r"cathedral port", r"LSx"],
    "LS3": [r"LS3", r"12°", r"rectangle port"],
    "BBC": [r"BBC", r"24°", r"big block chevy"],
    "Mopar": [r"mopar", r"LA\b", r"small block mopar"],
    "Hemi": [r"hemi", r"gen 3", r"5\.7", r"6\.1"],
}

OUTPUT_DIR = Path(__file__).parent.parent / "public" / "shop" / "extracted"


def extract_images_from_pdf(pdf_path: str) -> dict:
    """
    Extract all images from PDF along with nearby text context.
    Returns dict mapping image data to potential part numbers.
    """
    doc = fitz.open(pdf_path)
    extracted = []
    
    print(f"Processing {len(doc)} pages...")
    
    for page_num, page in enumerate(doc):
        print(f"  Page {page_num + 1}/{len(doc)}...", end=" ")
        
        # Get all text from the page for context
        page_text = page.get_text()
        
        # Find part numbers mentioned on this page
        found_parts = []
        for part_num in AFR_PART_NUMBERS:
            # Escape special regex chars in part number
            pattern = re.escape(part_num)
            if re.search(pattern, page_text, re.IGNORECASE):
                found_parts.append(part_num)
        
        # Detect engine family from page text
        detected_family = None
        for family, patterns in ENGINE_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, page_text, re.IGNORECASE):
                    detected_family = family
                    break
            if detected_family:
                break
        
        # Extract images from this page
        image_list = page.get_images(full=True)
        
        for img_idx, img_info in enumerate(image_list):
            xref = img_info[0]
            
            try:
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]
                image_ext = base_image["ext"]
                width = base_image["width"]
                height = base_image["height"]
                
                # Skip tiny images (likely icons/logos)
                if width < 100 or height < 100:
                    continue
                
                # Skip very large aspect ratios (likely banners/headers)
                aspect = max(width, height) / min(width, height)
                if aspect > 5:
                    continue
                
                extracted.append({
                    "page": page_num + 1,
                    "index": img_idx,
                    "xref": xref,
                    "width": width,
                    "height": height,
                    "ext": image_ext,
                    "bytes": image_bytes,
                    "found_parts": found_parts,
                    "engine_family": detected_family,
                    "page_text_snippet": page_text[:500],
                })
                
            except Exception as e:
                print(f"Error extracting image {xref}: {e}")
        
        print(f"found {len(image_list)} images, {len(found_parts)} parts")
    
    doc.close()
    return extracted


def save_extracted_images(extracted: list, output_dir: Path) -> list:
    """
    Save extracted images to disk with meaningful filenames.
    Returns list of saved file info.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    saved = []
    
    # Group by engine family for better organization
    family_counts = {}
    
    for item in extracted:
        family = item["engine_family"] or "unknown"
        family_counts[family] = family_counts.get(family, 0) + 1
        
        # Build filename
        parts_str = "-".join(item["found_parts"][:3]) if item["found_parts"] else "no-part"
        filename = f"afr-{family.lower()}-p{item['page']}-{family_counts[family]}.{item['ext']}"
        
        filepath = output_dir / filename
        
        # Save image
        with open(filepath, "wb") as f:
            f.write(item["bytes"])
        
        saved.append({
            "filename": filename,
            "filepath": str(filepath),
            "page": item["page"],
            "size": f"{item['width']}x{item['height']}",
            "engine_family": family,
            "possible_parts": item["found_parts"],
        })
        
        print(f"  Saved: {filename} ({item['width']}x{item['height']}) - Parts: {item['found_parts']}")
    
    return saved


def generate_mapping_report(saved: list, output_dir: Path):
    """Generate a JSON report and SQL update suggestions."""
    
    # JSON mapping file
    mapping_file = output_dir / "image_mapping.json"
    with open(mapping_file, "w") as f:
        json.dump(saved, f, indent=2)
    print(f"\nMapping saved to: {mapping_file}")
    
    # Group images by engine family for easier manual review
    by_family = {}
    for item in saved:
        family = item["engine_family"]
        if family not in by_family:
            by_family[family] = []
        by_family[family].append(item)
    
    # Generate suggested SQL updates
    sql_file = output_dir / "suggested_updates.sql"
    with open(sql_file, "w") as f:
        f.write("-- Suggested image URL updates for AFR cylinder heads\n")
        f.write("-- Review images in public/shop/extracted/ and update paths as needed\n\n")
        
        for family, images in by_family.items():
            f.write(f"\n-- {family.upper()} heads\n")
            
            # Find best candidate image for this family (largest one)
            if images:
                best = max(images, key=lambda x: int(x["size"].split("x")[0]) * int(x["size"].split("x")[1]))
                family_slug = {
                    "SBC": "sbc",
                    "SBF": "sbf", 
                    "LS": "ls",
                    "LS3": "ls3",
                    "BBC": "bbc",
                    "Mopar": "mopar",
                    "Hemi": "hemi",
                }.get(family, family.lower())
                
                f.write(f"-- Best candidate: {best['filename']} ({best['size']})\n")
                f.write(f"-- UPDATE cse_parts_products SET image_url = '/shop/extracted/{best['filename']}'\n")
                f.write(f"--   WHERE category = 'cylinder_head' AND image_url LIKE '%afr-{family_slug}-head%';\n")
    
    print(f"SQL suggestions saved to: {sql_file}")
    
    # Summary
    print("\n" + "="*60)
    print("EXTRACTION SUMMARY")
    print("="*60)
    print(f"Total images extracted: {len(saved)}")
    print("\nBy engine family:")
    for family, images in sorted(by_family.items()):
        print(f"  {family}: {len(images)} images")
    
    print("\n" + "="*60)
    print("NEXT STEPS")
    print("="*60)
    print("1. Review extracted images in: public/shop/extracted/")
    print("2. Select the best product image for each engine family")
    print("3. Rename/copy to public/shop/ with these names:")
    print("   - afr-sbc-head.png")
    print("   - afr-sbf-head.png")
    print("   - afr-ls-head.png")
    print("   - afr-ls3-head.png")
    print("   - afr-bbc-head.png")
    print("   - afr-mopar-head.png")
    print("   - afr-hemi-head.png")
    print("4. Or update the migration SQL to use extracted filenames")


def main():
    if len(sys.argv) < 2:
        print("Usage: python extract_afr_catalog_images.py <path_to_catalog.pdf>")
        print("\nExample:")
        print('  python scripts/extract_afr_catalog_images.py "C:/Users/phill/Downloads/AFR 2020 catalog.pdf"')
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    if not os.path.exists(pdf_path):
        print(f"ERROR: File not found: {pdf_path}")
        sys.exit(1)
    
    print(f"Extracting images from: {pdf_path}")
    print(f"Output directory: {OUTPUT_DIR}")
    print()
    
    # Extract images
    extracted = extract_images_from_pdf(pdf_path)
    
    if not extracted:
        print("No suitable images found in PDF.")
        sys.exit(0)
    
    print(f"\nExtracted {len(extracted)} candidate images")
    print("\nSaving images...")
    
    # Save to disk
    saved = save_extracted_images(extracted, OUTPUT_DIR)
    
    # Generate reports
    generate_mapping_report(saved, OUTPUT_DIR)


if __name__ == "__main__":
    main()
