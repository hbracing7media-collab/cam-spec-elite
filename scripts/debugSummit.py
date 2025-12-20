#!/usr/bin/env python3
"""
Debug script to examine HTML structure from Summit Racing
"""

import requests
from bs4 import BeautifulSoup
import re

BASE_URL = "https://www.summitracing.com/search/make/ford/engine-family/ford-small-block-windsor/part-type/camshafts"

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

print("Fetching page...")
response = requests.get(BASE_URL, headers=headers, timeout=10)
response.raise_for_status()

soup = BeautifulSoup(response.text, 'html.parser')

# Find the main product area
print("\n=== Looking for product containers ===")

# Try to find any div with "product" in class
divs_with_product = soup.find_all('div', class_=re.compile(r'product', re.IGNORECASE))
print(f"Divs with 'product' in class: {len(divs_with_product)}")
if divs_with_product:
    print(f"First div: {divs_with_product[0]}")

# Try to find h2 (likely product titles)
h2s = soup.find_all('h2')
print(f"\nH2 elements: {len(h2s)}")
if h2s:
    for i, h2 in enumerate(h2s[:3]):
        print(f"  H2 {i}: {h2.get_text(strip=True)[:100]}")

# Try to find links to product pages
product_links = soup.find_all('a', href=re.compile(r'/parts/.*make/ford'))
print(f"\nLinks to product pages: {len(product_links)}")
if product_links:
    for i, link in enumerate(product_links[:5]):
        print(f"  Link {i}: {link.get_text(strip=True)[:80]}")
        print(f"    URL: {link.get('href')[:100]}")

# Save HTML for inspection
with open('debug_summit.html', 'w', encoding='utf-8') as f:
    # Save first 20000 chars to avoid huge file
    f.write(response.text[:20000])
    f.write("\n\n... (truncated) ...\n")

print("\nHTML sample saved to debug_summit.html")
