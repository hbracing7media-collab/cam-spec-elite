#!/usr/bin/env python3
"""
Extract Ford Small Block Windsor camshaft data from Summit Racing
"""

import requests
from bs4 import BeautifulSoup
import re
import time
from urllib.parse import urljoin
import json

# Base URL for Summit Racing Ford SBF Windsor camshafts
BASE_URL = "https://www.summitracing.com/search/make/ford/engine-family/ford-small-block-windsor/part-type/camshafts"

# Existing part numbers (to avoid duplicates)
EXISTING_PART_NUMBERS = {
    'HRS-220051-08', 'CCA-31-255-5', 'CCA-35-218-3', 'CCA-35-306-8', 'CCA-35-308-8', 
    'MEL-SYB-22', 'CCA-35-302-8', 'CCA-35-242-3', 'EDL-3722', 'CCA-35-234-3', 
    'HRS-220031-12', 'HRS-220275-12', 'MEL-SYB-19', 'HRS-210951-10', 'HRS-217322-14', 
    'CCA-35-556-8', 'CCA-35-780-9', 'MEL-SYB-13', 'MEL-SYB-26', 'CCA-35-238-3', 
    'CCA-35-235-3', 'CCA-31-230-3', 'MEL-24226', 'MEL-24305', 'CCA-35-831-9', 
    'CCA-35-776-8', 'CCA-35-231-3', 'MEL-24107', 'CCA-35-601-4', 'CCA-35-600-4', 
    'CCA-31-234-3', 'SUM-3610', 'CCA-35-562-44', 'CCA-35-871-13', 'CCA-35-312-8', 
    'HRS-210021-12', 'MEL-SYB-8', 'CCA-31-250-4', 'MEL-24224', 'CCA-35-246-3', 
    'CCA-35-239-3', 'MEL-MTF-2', 'MEL-SYB38', 'MEL-24218', 'MEL-24206', 
    'CCA-31-110-5', 'MEL-24211', 'MEL-MTF-6', 'MEL-SYB-24', 'MEL-24108', 
    'CCA-35-602-4', 'CCA-35-230-3', 'HRS-220021-12', 'CCA-35-254-4', 'HRS-220931-10', 
    'MEL-SYB-29', 'MEL-SYB-51', 'MEL-SYB-35', 'CCA-35-827-9', 'CCA-35-782-9', 
    'HRS-220355-10', 'CCA-35-626-5', 'CCA-35-624-5', 'CCA-35-609-5', 'CCA-35-620-5', 
    'CCA-35-635-5', 'MEL-MC1259', 'CCA-35-243-4', 'MEL-24111', 'MEL-24204', 
    'MEL-24280', 'HRS-227571-14', 'HRS-211332-08', 'CCA-31-603-5', 'CCA-35-622-5', 
    'CCA-35-640-5', 'CCA-35-826-9', 'CCA-35-830-9', 'CCA-35-639-5', 'CCA-35-832-9', 
    'HRS-221815-10', 'HRS-222141-10', 'HRS-222313-06', 'HRS-222352-06', 'HRS-222372-08', 
    'HRS-222601-08', 'HRS-222765-13', 'HRS-210991-08', 'HRS-220041-12', 'HRS-220051-12', 
    'HRS-220951-10', 'HRS-221133-12', 'CCA-35-801-9', 'CCA-35-400-8', 'CCA-35-641-5', 
    'CCA-35-828-9', 'HRS-220051-10', 'MEL-FOV-9', 'MEL-24214', 'MEL-24225', 
    'MEL-24227', 'TFS-51403001', 'SUM-8900', 'FMS-M-6250-E303', 'TFS-51403002', 
    'SUM-8901', 'SUM-8902', 'FMS-M-6250-B303', 'TFS-51403005', 'TFS-51403003', 
    'SUM-1790', 'FMS-M-6250-F303', 'SUM-8904', 'SUM-4400', 'CCA-35-522-8', 
    'SUM-3601', 'FMS-M-6250-X303', 'CCA-35-349-8', 'CCA-35-518-8', 'EDL-2281', 
    'MEL-24110', 'CCA-35-600-8', 'SUM-3600', 'CCA-31-422-8', 'HRS-220235-10', 
    'TFS-51403004'
}

def extract_duration_and_lift(text):
    """Extract advertised duration and lift from text"""
    duration_pattern = r'(\d+)[^\d/]*[/\s]+(\d+)\s*(?:Duration|Advertised)'
    lift_pattern = r'Lift\s+\.?(\d+)[^\d/]*[/\s]+\.?(\d+)|(\d+\.?\d*)[^\d/]*[/\s]+(\d+\.?\d*)\s*(?:Lift|lift)'
    
    duration_int = None
    duration_exh = None
    lift_int = None
    lift_exh = None
    
    # Try to find duration (Advertised Duration)
    match = re.search(r'Advertised Duration\s+(\d+)[^\d]*(\d+)', text)
    if match:
        duration_int = int(match.group(1))
        duration_exh = int(match.group(2))
    else:
        # Try alternate pattern
        match = re.search(r'(\d+)[^\d]*Duration[^\d]*(\d+)', text)
        if match:
            duration_int = int(match.group(1))
            duration_exh = int(match.group(2))
    
    # Extract lift values
    lift_matches = list(re.finditer(r'(\d+\.?\d*)[/\s]+(\d+\.?\d*)', text))
    if lift_matches:
        # Usually the last set of decimal numbers in lift section is what we want
        for match in lift_matches:
            val1 = float(match.group(1))
            val2 = float(match.group(2))
            # Lift values are typically between 0.2 and 0.8
            if 0.2 <= val1 <= 0.8 and 0.2 <= val2 <= 0.8:
                lift_int = val1
                lift_exh = val2
    
    return duration_int, duration_exh, lift_int, lift_exh

def extract_lsa(text):
    """Extract Lobe Separation Angle (LSA) from text"""
    # Look for "Lobe Sep.", "Lobe Separation", "LSA"
    patterns = [
        r'Lobe\s+Sep\.?\s+(\d+\.?\d*)',
        r'LSA\s+(\d+\.?\d*)',
        r'Lobe Separation[^\d]*(\d+\.?\d*)',
        r'(\d+\.?\d*)\s*(?:LSA|Lobe)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            lsa = float(match.group(1))
            if 100 <= lsa <= 120:  # Reasonable LSA range
                return int(lsa) if lsa == int(lsa) else lsa
    
    return None

def extract_brand(title):
    """Extract brand name from product title"""
    brands = {
        'COMP Cams': ['COMP Cams', 'Xtreme Energy', 'Thumpr', 'Magnum'],
        'Melling': ['Melling'],
        'Howards Cams': ['Howards', 'Howards Cams'],
        'Trick Flow': ['Trick Flow', 'TFS'],
        'Ford Performance': ['Ford Performance'],
        'Summit Racing': ['Summit Racing', 'SUM-'],
        'Edelbrock': ['Edelbrock', 'EDL-'],
    }
    
    for brand, keywords in brands.items():
        for keyword in keywords:
            if keyword.lower() in title.lower():
                return brand
    
    # Try to extract from beginning of title
    words = title.split()
    if len(words) > 0:
        return words[0]
    
    return 'Unknown'

def parse_product_listing(product_div):
    """Parse a single product listing from the HTML"""
    try:
        # Get product link and URL - look for the main product link
        link = product_div.find('a', class_=re.compile(r'product', re.IGNORECASE))
        if not link:
            # Try all links and find one with part number
            all_links = product_div.find_all('a')
            for candidate_link in all_links:
                href = candidate_link.get('href', '')
                if '/parts/' in href and '/make/' in href and '/reviews' not in href:
                    link = candidate_link
                    break
        
        if not link:
            return None
        
        title = link.get_text(strip=True)
        url = link.get('href', '')
        
        # Clean title and skip if it's just numbering like "( 2 )" or "( 5 )"
        if title.startswith('(') and title.endswith(')') and len(title) < 10:
            return None
        
        if url and not url.startswith('http'):
            url = urljoin(BASE_URL, url)
        
        # Skip review links
        if 'reviews' in url:
            return None
        
        # Get full product text for parsing (just the immediate text, not all child elements)
        product_text = product_div.get_text(' ', strip=True)
        
        # Extract part number
        part_number_match = re.search(r'Part Number[:\s]+([A-Z0-9-]+)', product_text)
        part_number = part_number_match.group(1) if part_number_match else None
        
        if not part_number:
            return None
        
        # Skip if already in database
        if part_number.upper() in EXISTING_PART_NUMBERS:
            return None
        
        # Extract brand from title
        brand = extract_brand(title)
        
        # Skip if brand extraction failed (likely bad parsing)
        if brand in ['(', 'Unknown'] or brand.startswith('('):
            return None
        
        # Extract specs from description text
        duration_int, duration_exh, lift_int, lift_exh = extract_duration_and_lift(product_text)
        lsa = extract_lsa(product_text)
        
        return {
            'brand': brand,
            'part_number': part_number,
            'name': title,
            'duration_int': duration_int,
            'duration_exh': duration_exh,
            'lift_int': lift_int,
            'lift_exh': lift_exh,
            'lsa': lsa,
            'url': url
        }
    except Exception as e:
        print(f"Error parsing product: {e}")
        return None

def fetch_page(page_num=1, items_per_page=25):
    """Fetch a single page of results"""
    # Try different pagination methods
    urls_to_try = [
        f"{BASE_URL}?page={page_num}",
        f"{BASE_URL}?pageNumber={page_num}",
        f"{BASE_URL}?pageIndex={page_num}",
        f"{BASE_URL}?start={(page_num-1)*items_per_page}",
    ]
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    for url in urls_to_try:
        try:
            print(f"Fetching: {url}")
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            return response.text
        except Exception as e:
            print(f"Error fetching {url}: {e}")
            continue
    
    return None

def extract_all_camshafts():
    """Extract all camshafts from all pages"""
    all_camshafts = []
    seen_part_numbers = set()
    page = 1
    max_pages = 20  # Safety limit
    
    while page <= max_pages:
        print(f"\n--- Fetching page {page} ---")
        html = fetch_page(page)
        
        if not html:
            print(f"Failed to fetch page {page}, stopping.")
            break
        
        soup = BeautifulSoup(html, 'html.parser')
        
        # Find all product divs/links - try multiple selectors
        products = []
        
        # Try finding product containers
        for selector in ['div[class*="product"]', 'div[class*="item"]', 'h2', 'a[href*="/parts/"]']:
            if selector == 'h2':
                # Find h2 headers (likely product titles)
                h2s = soup.find_all('h2')
                if h2s:
                    products = h2s
                    break
            elif selector.startswith('a'):
                # Find all product links
                all_links = soup.find_all('a', href=re.compile(r'/parts/.*make/ford'))
                if all_links:
                    products = all_links
                    break
            else:
                found = soup.find_all(selector)
                if found:
                    products = found
                    break
        
        # If still no products, try finding any links with part numbers
        if not products:
            all_links = soup.find_all('a', href=True)
            products = [link for link in all_links if '/parts/' in link.get('href', '') and '/make/ford' in link.get('href', '')]
        
        if not products:
            print(f"No products found on page {page}, might be end of results.")
            break
        
        print(f"Found {len(products)} product elements on page {page}")
        
        page_camshafts = 0
        for product in products:
            # For h2 elements or other non-div elements, get parent or adjacent elements
            if product.name == 'h2':
                # Get parent div
                parent = product.find_parent('div')
                if parent:
                    camshaft = parse_product_listing(parent)
                else:
                    camshaft = parse_product_listing(product)
            else:
                camshaft = parse_product_listing(product)
            
            if camshaft:
                # Deduplicate by part number
                if camshaft['part_number'] not in seen_part_numbers:
                    all_camshafts.append(camshaft)
                    seen_part_numbers.add(camshaft['part_number'])
                    page_camshafts += 1
        
        print(f"Extracted {page_camshafts} new camshafts from page {page}")
        
        if page_camshafts == 0 and page > 1:
            # No new camshafts on this page, might be end
            break
        
        page += 1
        time.sleep(1)  # Be respectful to the server
    
    return all_camshafts

def generate_sql_insert(camshaft):
    """Generate SQL INSERT statement for a camshaft"""
    # Format: ('Ford', 'Ford Small Block Windsor', '[brand]', '[part_number]', '[name]', 
    # [dur_int], [dur_exh], [lsa_value], [lift_int], [lift_exh], 0, 'either', 
    # 'Seed import: Summit Ford SBF Windsor', '[url]', now())
    
    name = camshaft['name'].replace("'", "''")  # Escape single quotes
    url = camshaft['url'].replace("'", "''")
    brand = camshaft['brand'].replace("'", "''")
    
    dur_int = camshaft['duration_int'] if camshaft['duration_int'] else 'NULL'
    dur_exh = camshaft['duration_exh'] if camshaft['duration_exh'] else 'NULL'
    lsa = camshaft['lsa'] if camshaft['lsa'] else 'NULL'
    lift_int = camshaft['lift_int'] if camshaft['lift_int'] else 'NULL'
    lift_exh = camshaft['lift_exh'] if camshaft['lift_exh'] else 'NULL'
    
    return (f"('Ford', 'Ford Small Block Windsor', '{brand}', '{camshaft['part_number']}', "
            f"'{name}', {dur_int}, {dur_exh}, {lsa}, {lift_int}, {lift_exh}, "
            f"0, 'either', 'Seed import: Summit Ford SBF Windsor', '{url}', now())")

def main():
    print("Starting extraction of Ford Small Block Windsor camshafts from Summit Racing...")
    print(f"Base URL: {BASE_URL}")
    print(f"Existing camshafts to skip: {len(EXISTING_PART_NUMBERS)}")
    
    camshafts = extract_all_camshafts()
    
    print(f"\n=== EXTRACTION COMPLETE ===")
    print(f"Total new camshafts extracted: {len(camshafts)}")
    
    if camshafts:
        # Save as JSON for reference
        with open('extracted_camshafts.json', 'w') as f:
            json.dump(camshafts, f, indent=2)
        
        # Generate SQL inserts
        sql_lines = [generate_sql_insert(cam) for cam in camshafts]
        
        # Write SQL file
        with open('summit_new_camshafts.sql', 'w') as f:
            f.write("-- New Ford Small Block Windsor Camshafts from Summit Racing\n")
            f.write("-- Auto-generated extraction\n\n")
            f.write("INSERT INTO public.cse_generic_cams\n")
            f.write("  (make, engine_family, brand, part_number, name, advertised_duration_intake, advertised_duration_exhaust,\n")
            f.write("   lobe_separation_angle, lift_intake, lift_exhaust, rpm_peak, intake_exhaust, notes, product_url, created_at)\n")
            f.write("VALUES\n")
            f.write(",\n".join(sql_lines))
            f.write(";\n")
        
        print(f"\nSQL file saved to: summit_new_camshafts.sql")
        print(f"JSON file saved to: extracted_camshafts.json")
        
        # Print sample SQL
        print(f"\nFirst 5 camshafts to be inserted:")
        for i, sql in enumerate(sql_lines[:5]):
            print(f"  {sql}")
    else:
        print("No new camshafts extracted!")

if __name__ == '__main__':
    main()
