from pathlib import Path
import argparse
import csv
import json
import re
from bs4 import BeautifulSoup

DEFAULT_HTML_PATH = Path('tmp/summit_ford_windsor_page1.html')
DEFAULT_OUTPUT_PATH = Path('tmp/ford_windsor_cams_first100.csv')
DEFAULT_JSON_PATH = Path('tmp/ford_windsor_cams_first100.json')

BRAND_MAP = {
    'CCA': 'COMP Cams',
    'EDL': 'Edelbrock',
    'FMS': 'Ford Performance Parts',
    'HRS': 'Howards Cams',
    'MEL': 'Melling',
    'SUM': 'Summit Racing',
    'TFS': 'Trick Flow Specialties',
}

NUM = r'(?:\.\d+|\d+\.\d+|\d+)'

DURATION_PATTERNS = [
    (re.compile(rf'({NUM})\s*(?:[^0-9/]+)?[/,]\s*({NUM})\s*Duration\s*@\s*\.050', re.I), '@.050'),
    (re.compile(rf'Duration\s*@\s*\.050[^0-9]*({NUM})\s*(?:[^0-9/]+)?[/,]\s*({NUM})', re.I), '@.050'),
    (re.compile(rf'({NUM})\s*(?:[^0-9/]+)?[/,]\s*({NUM})\s*Advertised\s+Duration', re.I), 'adv'),
    (re.compile(rf'Advertised\s+Duration[^0-9]*({NUM})\s*(?:[^0-9/]+)?[/,]\s*({NUM})', re.I), 'adv'),
    (re.compile(rf'({NUM})\s*(?:[^0-9/]+)?[/,]\s*({NUM})\s*Duration', re.I), 'unspecified'),
    (re.compile(rf'Duration[^0-9]*({NUM})\s*(?:[^0-9/]+)?[/,]\s*({NUM})', re.I), 'unspecified'),
]

LIFT_PATTERNS = [
    re.compile(rf'({NUM})\s*(?:[^0-9/]+)?[/,]\s*({NUM})\s*Lift', re.I),
    re.compile(rf'Lift[^0-9]*({NUM})\s*(?:[^0-9/]+)?[/,]\s*({NUM})', re.I),
]

LSA_PATTERN = re.compile(r'Lobe\s*(?:Sep\.?|Separation)[^0-9]*([0-9]+(?:\.\d+)?)', re.I)
LSA_LEADING_PATTERN = re.compile(r'([0-9]+(?:\.\d+)?)\s*LSA', re.I)
LSA_FALLBACK_PATTERN = re.compile(r'LSA[^0-9]*([0-9]+(?:\.\d+)?)', re.I)


def normalize_lift_value(value: str) -> str:
    if '.' in value:
        return value if value[:1].isdigit() else f'0{value}'
    trimmed = value.strip()
    if trimmed.isdigit() and len(trimmed) <= 3:
        return f"0.{trimmed.zfill(3)}"
    return value


def normalize_duration_value(value: str) -> str:
    try:
        return str(int(round(float(value))))
    except ValueError:
        return value


def normalize_angle_value(value: str) -> str:
    try:
        numeric = float(value)
    except ValueError:
        return value
    if numeric.is_integer():
        return str(int(numeric))
    return f"{numeric:.2f}".rstrip('0').rstrip('.')


def extract_specs(text: str) -> tuple[str, str, str, str]:
    duration = ''
    duration_type = ''
    for pattern, dtype in DURATION_PATTERNS:
        match = pattern.search(text)
        if match:
            duration = f"{normalize_duration_value(match.group(1))}/{normalize_duration_value(match.group(2))}"
            duration_type = dtype
            break

    lift = ''
    for pattern in LIFT_PATTERNS:
        lift_match = pattern.search(text)
        if lift_match:
            lift = f"{normalize_lift_value(lift_match.group(1))}/{normalize_lift_value(lift_match.group(2))}"
            break

    lsa = ''
    lsa_match = LSA_PATTERN.search(text)
    if not lsa_match:
        lsa_match = LSA_LEADING_PATTERN.search(text)
    if not lsa_match:
        lsa_match = LSA_FALLBACK_PATTERN.search(text)
    if lsa_match:
        lsa = normalize_angle_value(lsa_match.group(1))

    return duration, duration_type, lift, lsa


def parse_args():
    parser = argparse.ArgumentParser(description='Extract cam specs from a Summit Racing listing page.')
    parser.add_argument('--html', dest='html_path', type=Path, default=DEFAULT_HTML_PATH, help='Path to the saved Summit HTML page.')
    parser.add_argument('--csv', dest='csv_path', type=Path, default=DEFAULT_OUTPUT_PATH, help='Path for the CSV output.')
    parser.add_argument('--json', dest='json_path', type=Path, default=DEFAULT_JSON_PATH, help='Path for the JSON output.')
    parser.add_argument('--start-index', dest='start_index', type=int, default=1, help='Starting index to assign to extracted rows.')
    parser.add_argument('--limit', dest='limit', type=int, default=100, help='Maximum number of rows to extract.')
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    html = args.html_path.read_text(encoding='utf-8')
    soup = BeautifulSoup(html, 'html.parser')
    cards = soup.select('div.item.row')

    rows = []
    for idx, card in enumerate(cards[:args.limit], start=args.start_index):
        part_el = card.select_one('p.item-part-number span')
        if not part_el:
            continue
        part_number = part_el.get_text(strip=True)
        brand = BRAND_MAP.get(part_number.split('-')[0], 'Unknown')

        desc_el = card.select_one('p.item-description')
        description = desc_el.get_text(' ', strip=True) if desc_el else ''

        duration, duration_type, lift, lsa = extract_specs(description)

        rows.append({
            'index': idx,
            'brand': brand,
            'part_number': part_number,
            'duration_type': duration_type,
            'duration': duration,
            'lift': lift,
            'lsa': lsa,
            'description': description,
        })

    args.csv_path.parent.mkdir(parents=True, exist_ok=True)
    with args.csv_path.open('w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(
            csvfile,
            fieldnames=['index', 'brand', 'part_number', 'duration_type', 'duration', 'lift', 'lsa', 'description'],
        )
        writer.writeheader()
        writer.writerows(rows)

    args.json_path.parent.mkdir(parents=True, exist_ok=True)
    args.json_path.write_text(json.dumps(rows, indent=2), encoding='utf-8')

    print(f'Extracted {len(rows)} rows to {args.csv_path} and {args.json_path}')


if __name__ == '__main__':
    main()
