#!/usr/bin/env python3
"""
Extract camshaft data from Summit Racing and generate SQL INSERT statements
Using improved parsing logic for the actual page content
"""

import re
from datetime import datetime

# All cam data extracted manually from the fetched content
cams_data = [
Howards Cams Hydraulic Flat Tappet Camshafts 220051-08
Camshaft, Hydraulic Flat Tappet, Advertised Duration 277/289, Lift .496/.520,
Ford, 351W, Each
Part Number: HRS-220051-08

COMP Cams Computer-Controlled Camshafts 31-255-5
Camshaft, Hydraulic Flat Tappet, Advertised Duration 250/260, Lift .462/.474,
Ford, Small Block, Each
Part Number: CCA-31-255-5

COMP Cams High Energy Camshafts 35-218-3
Camshaft, Hydraulic Flat Tappet, Advertised Duration 268/268, Lift .456/.456,
Ford, 5.0L HO, 5.8L, Each
Part Number: CCA-35-218-3

COMP Cams Blower and Turbo Camshafts 35-306-8
Camshaft, Hydraulic Roller Tappet, Advertised Duration 284/290, Lift .533/.544,
Ford, 5.0L HO, Each
Part Number: CCA-35-306-8

COMP Cams Magnum Hydraulic Roller Camshafts 35-308-8
Camshaft, Hydraulic Roller Tappet, Advertised Duration 266/270, Lift .533/.533,
Ford, 5.0L HO, Each
Part Number: CCA-35-308-8

Melling Stock Replacement Camshafts SYB-22
Camshaft, Hydraulic Flat Tappet, 274/274 Duration, .442 in./.442 in. Lift, Ford,
390, 428, Each
Part Number: MEL-SYB-22

COMP Cams Magnum Hydraulic Roller Camshafts 35-302-8
Camshaft, Hydraulic Roller Tappet, Advertised Duration 281/284, Lift .512/.533,
Ford, 5.0L HO, Each
Part Number: CCA-35-302-8

COMP Cams Xtreme Energy Camshafts 35-242-3
Camshaft, Hydraulic Flat Tappet, Advertised Duration 268/280, Lift .510/.512,
Ford, 351W, Each
Part Number: CCA-35-242-3

Edelbrock Rollin' Thunder Hydraulic Roller Camshafts 3722
Camshaft, Hydraulic Roller Tappet, Advertised Duration 282/282, Lift .498/.498,
Ford, 5.0L, Each
Part Number: EDL-3722

COMP Cams Xtreme Energy Camshafts 35-234-3
Camshaft, Hydraulic Flat Tappet, Advertised Duration 256/262, Lift .477/.484,
Ford, 351W, Each
Part Number: CCA-35-234-3

Howards Cams Street Force 2 Hydraulic Flat Tappet Camshafts 220031-12
Camshaft, Street Force 2, Hydraulic Flat Tappet, Advertised Duration 269/277,
Lift .475/.496, Ford, 351W, Each
Part Number: HRS-220031-12

Howards Cams Retrofit Hydraulic Roller Camshafts 220275-12
Camshaft, Retrofit, Hydraulic Roller Tappet, Advertised Duration 294/300, Lift
.581/.603, Ford, 351W, Each
Part Number: HRS-220275-12

Melling M-Select Class 1 Camshafts SYB-19
Camshaft, Class 1, Hydraulic Flat Tappet, 273/287 Advertised Duration, .442/.485
Lift, Ford, 429, 460, Each
Part Number: MEL-SYB-19

Howards Cams Hydraulic Flat Tappet Camshafts 210951-10
Camshaft, Hydraulic Flat Tappet, Advertised Duration 275/285, Lift .501/.501,
Ford, 221, 255, 260, 289, 302
Part Number: HRS-210951-10

Howards Cams American Muscle Mechanical Flat Tappet Camshafts 217322-14
Camshaft, Mechanical Flat Tappet, Advertised Duration 310/310, Lift .477/.477,
Ford, 221, 255, 260, 289, 302
Part Number: HRS-217322-14

COMP Cams Nitrous HP Camshafts 35-556-8
Camshaft, Hydraulic Roller Tappet, Advertised Duration 274/286, Lift .555/.570,
Ford, 5.0L HO, Each
Part Number: CCA-35-556-8

COMP Cams Drag Race Camshafts 35-780-9
Camshaft, Mechanical Roller Tappet, Advertised Duration 298/312, Lift .696/.672,
Ford, 351W, Each
Part Number: CCA-35-780-9

COMP Cams Oval Track Camshafts 35-831-9
Camshaft, Mechanical Roller, Duration 288 Int./300 Exh., Lift 0.704 Int./0.672
Exh., Lobe Separation 106, Ford, 351W, Each
Part Number: CCA-35-831-9

COMP Cams Xtreme Fuel Injected Camshafts 35-776-8
Camshaft, Hydraulic Roller Tappet, Advertised Duration 304/314, Lift .608/.608,
Ford, 5.0L HO, Each
Part Number: CCA-35-776-8

COMP Cams Xtreme 4x4 Camshafts 35-231-3
Camshaft, Hydraulic Flat Tappet, Advertised Duration 250/258, Lift .448/.483,
Ford, 351W, Each
Part Number: CCA-35-231-3

COMP Cams Xtreme Energy Camshafts 31-230-3
Camshaft, Hydraulic Flat Tappet, Advertised Duration 250/260, Lift .460/.474,
Ford, Small Block, Each
Part Number: CCA-31-230-3

COMP Cams Xtreme Energy Camshafts 35-238-3
Camshaft, Hydraulic Flat Tappet, Advertised Duration 262/270, Lift .493/.500,
Ford, 351W, Each
Part Number: CCA-35-238-3

COMP Cams Xtreme 4x4 Camshafts 35-235-3
Camshaft, Hydraulic Flat Tappet, Advertised Duration 254/262, Lift .477/.493,
Ford, 351W, Each
Part Number: CCA-35-235-3

COMP Cams Xtreme Energy Camshafts 35-246-3
Camshaft, Hydraulic Flat Tappet, Advertised Duration 274/286, Lift .519/.523,
Ford, 351W, Each
Part Number: CCA-35-246-3

COMP Cams Xtreme 4x4 Camshafts 35-239-3
Camshaft, Hydraulic Flat Tappet, Advertised Duration 262/270, Lift .493/.512,
Ford, 351W, Each
Part Number: CCA-35-239-3

Melling M-Select Class 1 Camshafts SYB-26
Camshaft, Class 1, Hydraulic Flat Tappet, 257/269 Advertised Duration, .379/.395
Lift, Ford, 255, 302, Each
Part Number: MEL-SYB-26

COMP Cams Thumpr Hydraulic Flat Tappet Camshafts 35-601-4
Camshaft; Mutha Thumpr; Camshaft; Hydraulic Flat Tappet; 2200-6100rpm; Adver.
Dur. 287 Int./305 Exh.; Val
Part Number: CCA-35-601-4

COMP Cams Thumpr Hydraulic Flat Tappet Camshafts 35-600-4
Camshaft, Hydraulic Flat Tappet, Advertised Duration 279/297, Lift .490/.475,
Ford, 351W, Each
Part Number: CCA-35-600-4

COMP Cams Xtreme Energy Camshafts 31-234-3
Camshaft, Hydraulic Flat Tappet, Advertised Duration 256/268, Lift .477/.484,
Ford, Small Block, Each
Part Number: CCA-31-234-3

Summit Racing Muscle Car Replacement Cams SUM-3610
Muscle Car Camshaft, 289 HIPO, Mechanical Flat Tappet, 2,000-4,800 RPM Range,
Advertised Duration 310 int./310 exh., Lift 228 int./228 exh., Ford,Each
Part Number: SUM-3610

COMP Cams 4-Pattern Hydraulic Roller Camshafts 35-562-44
Camshaft, Hydraulic Roller, 283/281 intake, 295/293 Exhaust, .622/.619 in.
Intake Lift, .610/.606 in. Exhaust
Part Number: CCA-35-562-44

COMP Cams Street and Strip Camshafts 35-871-13
Camshaft, Hydraulic Roller, Duration 277 Int./290 Exh., Lift 0.577 Int./0.579
Exh., Lobe Separation 111, Ford, 5.0L, Each
Part Number: CCA-35-871-13

COMP Cams Blower and Turbo Camshafts 35-312-8
Camshaft, Hydraulic Roller Tappet, Advertised Duration 276/280, Lift .544/.560,
Ford, 5.0L HO, Each
Part Number: CCA-35-312-8

Howards Cams Street Force 1 Hydraulic Flat Tappet Camshafts 210021-12
Camshaft, Street Force 1, Hydraulic Flat Tappet, Advertised Duration 259/267,
Lift .448/.480, Ford, 221, 255, 260, 289, 302
Part Number: HRS-210021-12

Melling Stock Replacement Camshafts SYB-8
Camshaft, Hydraulic Flat Tappet, Advertised Duration 270/270, Lift .394/.394,
Ford, Mercury, Each
Part Number: MEL-SYB-8

COMP Cams Xtreme Energy Camshafts 31-250-4
Camshaft, Hydraulic Flat Tappet, Advertised Duration 284/296, Lift .541/.544,
Ford, Small Block, Each
Part Number: CCA-31-250-4

COMP Cams Xtreme Energy Camshafts 35-254-4
Camshaft, Hydraulic Flat Tappet, Advertised Duration 294/306, Lift .554/.558,
Ford, 351W, Each
Part Number: CCA-35-254-4

Howards Cams Hydraulic Flat Tappet Camshafts 220931-10
Camshaft, Hydraulic Flat Tappet, Advertised Duration 269/269, Lift .475/.475,
Ford, 351W, Each
Part Number: HRS-220931-10

Melling Stock Replacement Camshafts SYB-51
Camshaft, Hydraulic Roller, Duration @ .050 in. 210/211, Lift .445/.445, Ford,
Small Block, Each
Part Number: MEL-SYB-51

Melling M-Select Class 2 Camshafts SYB-35
Camshaft, Hydraulic Flat Tappet, Advertised Duration 283/304, Lift .445/.453,
Ford, 5.8L, Each
Part Number: MEL-SYB-35

COMP Cams Oval Track Camshafts 35-827-9
Camshaft, Mechanical Roller, Duration 300 Int./307 Exh., Lift 0.651 Int./0.653
Exh., Lobe Separation 108, Ford, 351W, Each
Part Number: CCA-35-827-9

COMP Cams Drag Race Camshafts 35-782-9
Camshaft, Mechanical Roller Tappet, Advertised Duration 318/336, Lift .744/.731,
Ford, 351W, Each
Part Number: CCA-35-782-9

Howards Cams Retrofit Hydraulic Roller Camshafts 220355-10
Camshaft, Retrofit, Hydraulic Roller Tappet, Advertised Duration 304/310, Lift
.592/.592, Ford, 351W, Each
Part Number: HRS-220355-10

COMP Cams Oval Track Camshafts 35-626-5
Camshaft, FL280S-6, Oval Track, Mech Flat Tappet, 280/284-250/254-.592/.608-106
Part Number: CCA-35-626-5

COMP Cams Oval Track Camshafts 35-624-5
Camshaft, Mechanical Flat Tappet, Duration 276 Int./280 Exh., Lift 0.584
Int./0.608 Exh., Lobe Separation 106, Ford, 351W, Each
Part Number: CCA-35-624-5

COMP Cams Oval Track Camshafts 35-609-5
Camshaft, Mechanical Flat Tappet, Advertised Duration 285/295, Lift .568/.592,
Ford, 351W, Each
Part Number: CCA-35-609-5

COMP Cams Oval Track Camshafts 35-620-5
Camshaft, Mechanical Flat Tappet, Advertised Duration 268/276, Lift .568/.584,
Ford, 351W, Each
Part Number: CCA-35-620-5

COMP Cams Oval Track Camshafts 35-635-5
Camshaft, 41/15H-6, Oval Track, Hyd Flat Tappet, 297/299-246/250-.448/.448-106
Part Number: CCA-35-635-5

COMP Cams Xtreme 4x4 Camshafts 35-243-4
Camshaft, Hydraulic Flat Tappet, Advertised Duration 270/278, Lift .512/.531,
Ford, 351W, Each
Part Number: CCA-35-243-4

COMP Cams Thumpr Hydraulic Flat Tappet Camshafts 35-602-4
Camshaft, Hydraulic Flat Tappet, Advertised Duration 295/313, Lift .512/.489,
Ford, 5.8L/351W, Each
Part Number: CCA-35-602-4

COMP Cams Xtreme Energy Camshafts 35-230-3
Camshaft, Hydraulic Flat Tappet, Advertised Duration 250/260, Lift .461/.474,
Ford, 351W, Each
Part Number: CCA-35-230-3

Melling M-Select Class 2 Camshafts 24280
Camshaft, M-Select Class 2, Hydraulic Roller, 286/292 Duration, Street/Strip,
0.512 in./0.512 in. Lift, Ford, 5.0L, Small Block Windsor, Each
Part Number: MEL-24280

Howards Cams American Muscle Hydraulic Flat Tappet Camshafts 227571-14
Camshaft, American Muscle, Hydraulic Flat Tappet, Advertised Duration 260/270,
Lift .416/.445, Ford, 351W
Part Number: HRS-227571-14

Howards Cams Mechanical Flat Tappet Camshafts 211332-08
Camshaft, Mechanical Flat Tappet, Advertised Duration 264/268, Lift .574/.590,
Ford, Small Block, Each
Part Number: HRS-211332-08

COMP Cams Thumpr Hydraulic Flat Tappet Camshafts 31-603-5
Camshaft, Hydraulic Flat Tappet, Advertised Duration 295/312, Lift .512/.497,
Ford, Small Block, Each
Part Number: CCA-31-603-5

COMP Cams Oval Track Camshafts 35-622-5
Camshaft, Mechanical Flat Tappet, Duration 272 Int./280 Exh., Lift 0.576
Int./0.592 Exh., Lobe Separation 106, Ford, 351W, Each
Part Number: CCA-35-622-5

COMP Cams Oval Track Camshafts 35-640-5
Camshaft, Mechanical Flat Tappet, Duration 290 Int./304 Exh., Lift 0.576
Int./0.570 Exh., Lobe Separation 106, Ford, 351W, Each
Part Number: CCA-35-640-5

COMP Cams Oval Track Camshafts 35-826-9
Camshaft, Mechanical Roller, Duration 296 Int./301 Exh., Lift 0.648 Int./0.648
Exh., Lobe Separation 106, Ford, 351W, Each
Part Number: CCA-35-826-9

COMP Cams Oval Track Camshafts 35-830-9
Camshaft, Mechanical Roller, Duration 288 Int./296 Exh., Lift 0.672 Int./0.672
Exh., Lobe Separation 106, Ford, 351W, Each
Part Number: CCA-35-830-9

COMP Cams Oval Track Camshafts 35-639-5
Camshaft, Mechanical Flat Tappet, Advertised Duration 242/246, Lift .541/.522,
Ford, 351W, Each
Part Number: CCA-35-639-5

COMP Cams Oval Track Camshafts 35-832-9
Camshaft, Mechanical Roller, Duration 292 Int./304 Exh., Lift 0.704 Int./0.672
Exh., Lobe Separation 106, Ford, 351W, Each
Part Number: CCA-35-832-9

Howards Cams Retrofit Hydraulic Roller Camshafts 221815-10
Camshaft, Hydraulic Roller Tappet, Advertised Duration 290/298, Lift .597/.597,
Ford, 351W, Each
Part Number: HRS-221815-10

Howards Cams Hydraulic Flat Tappet Camshafts 222141-10
Camshaft, Hydraulic Flat Tappet, Advertised Duration 277/282, Lift .563/.572,
Ford, 351W, Each
Part Number: HRS-222141-10

Howards Cams Steel Billet Mechanical Roller Camshafts 222313-06
Camshaft, Mechanical Roller Tappet, Advertised Duration 291/295, Lift .624/.656,
Ford, 351W, Each
Part Number: HRS-222313-06

Howards Cams Mechanical Flat Tappet Camshafts 222352-06
Camshaft, Mechanical Flat Tappet, Advertised Duration 281/287, Lift .549/.565,
Ford, 351W, Each
Part Number: HRS-222352-06

Howards Cams Mechanical Flat Tappet Camshafts 222372-08
Camshaft, Mechanical Flat Tappet, Advertised Duration 285/291, Lift .560/.571,
Ford, 351W, Each
Part Number: HRS-222372-08

Howards Cams Hydraulic Flat Tappet Camshafts 222601-08
Camshaft, Hydraulic Flat Tappet, Advertised Duration 282/287, Lift .572/.596,
Ford, 351W, Each
Part Number: HRS-222601-08

Howards Cams Retrofit Hydraulic Roller Camshafts 222765-13
Camshaft, Hydraulic Roller Tappet, Advertised Duration 270/270, Lift .496/.496,
Ford, 302 HO/351W, Each
Part Number: HRS-222765-13

Howards Cams Hydraulic Flat Tappet Camshafts 210991-08
Camshaft, Hydraulic Flat Tappet, Advertised Duration 267/267, Lift .543/.543,
Ford, 221, 255, 260, 289, 302
Part Number: HRS-210991-08

Howards Cams Hydraulic Flat Tappet Camshafts 220041-12
Camshaft, Hydraulic Flat Tappet, Advertised Duration 275/275, Lift .475/.475,
Ford, 351W, Each
Part Number: HRS-220041-12

Howards Cams Hydraulic Flat Tappet Camshafts 220051-12
Camshaft, Hydraulic Flat Tappet, Advertised Duration 277/289, Lift .496/.520,
Ford, 351W, Each
Part Number: HRS-220051-12

Howards Cams Hydraulic Flat Tappet Camshafts 220951-10
Camshaft, Hydraulic Flat Tappet, Advertised Duration 275/285, Lift .501/.501,
Ford, 351W, Each
Part Number: HRS-220951-10

Howards Cams Big Bottle Nitrous Oxide Mechanical Roller Camshafts 221133-12
Camshaft, Mechanical Roller Tappet, Advertised Duration 287/299, Lift .640/.640,
Ford, 351W, Each
Part Number: HRS-221133-12

COMP Cams Oval Track Camshafts 35-801-9
Camshaft, Mechanical Roller Tappet, Advertised Duration 292/296, Lift .672/.672,
Ford, 351W, Each
Part Number: CCA-35-801-9

COMP Cams Oval Track Camshafts 35-641-5
Camshaft, Mechanical Flat Tappet, Advertised Duration 300/314, Lift .600/.593,
Ford, 351W, Each
Part Number: CCA-35-641-5

COMP Cams Oval Track Camshafts 35-828-9
Camshaft, Mechanical Roller, Duration 296 Int./301 Exh., Lift 0.648 Int./0.648
Exh., Lobe Separation 106, Ford, 351W, Each
Part Number: CCA-35-828-9

Howards Cams Hydraulic Flat Tappet Camshafts 220051-10
Camshaft, Hydraulic Flat Tappet, Advertised Duration 277/289, Lift .496/.520,
Ford, 351W, Each
Part Number: HRS-220051-10

Melling M-Select Class 1 Camshafts MTF-6
Camshaft, M-Select Class 1, Hydraulic Flat Tappet, Advertised Duration 281/296,
Lift .449/.473, Ford, Each
Part Number: MEL-MTF-6

COMP Cams Factory Muscle Camshafts 31-110-5
Camshaft, Mechanical Flat Tappet, Advertised Duration 263/261, Lift .478/.475,
Ford, Small Block, Each
Part Number: CCA-31-110-5

Melling M-Select Class 2 Camshafts 24211
Camshaft, Hydraulic Flat Tappet, Advertised Duration 298/304, Lift .496/.520,
Ford, 351W, Each
Part Number: MEL-24211
"""

def parse_camshaft_entry(text):
    """Parse a single camshaft entry and extract key data."""
    cam = {
        'brand': None,
        'cam_name': None,
        'pn': None,
        'engine_make': 'Ford',
        'family': None,
        'dur_int_050': None,
        'dur_exh_050': None,
        'lift_int': None,
        'lift_exh': None,
        'lsa': None,
        'notes': None
    }
    
    lines = text.strip().split('\n')
    if len(lines) < 2:
        return None
    
    # Extract brand and cam name from first line
    title = lines[0].strip()
    title_lower = title.lower()
    
    # Extract brand
    if 'howards' in title_lower:
        cam['brand'] = 'Howards Cams'
    elif 'comp cams' in title_lower:
        cam['brand'] = 'COMP Cams'
    elif 'melling' in title_lower:
        cam['brand'] = 'Melling'
    elif 'edelbrock' in title_lower:
        cam['brand'] = 'Edelbrock'
    elif 'summit racing' in title_lower:
        cam['brand'] = 'Summit Racing'
    else:
        return None
    
    # Extract cam name
    cam['cam_name'] = title.replace(cam['brand'], '').strip()
    
    # Get part number from second line
    specs_text = '\n'.join(lines[1:])
    pn_match = re.search(r'Part Number:\s*([A-Z0-9\-]+)', specs_text, re.IGNORECASE)
    if pn_match:
        cam['pn'] = pn_match.group(1)
    else:
        return None
    
    # Extract duration (Advertised Duration XXX/XXX)
    dur_match = re.search(
        r'[Aa]dvertised\s+[Dd]uration\s+(\d+)/(\d+)',
        specs_text
    )
    if dur_match:
        cam['dur_int_050'] = int(dur_match.group(1))
        cam['dur_exh_050'] = int(dur_match.group(2))
    else:
        # Try alternative format (Duration XXX Int./XXX Exh.)
        dur_match = re.search(
            r'[Dd]uration\s+(\d+)\s*Int\.?/(\d+)\s*Exh\.?',
            specs_text
        )
        if dur_match:
            cam['dur_int_050'] = int(dur_match.group(1))
            cam['dur_exh_050'] = int(dur_match.group(2))
    
    # Extract lift (Lift .XXX/.XXX or Lift XXX int./XXX exh.)
    lift_match = re.search(
        r'[Ll]ift\s+[\.]*(\d+(?:\.\d+)?)\s*in\.?/[\.]*(\d+(?:\.\d+)?)\s*(?:in\.)?',
        specs_text
    )
    if lift_match:
        cam['lift_int'] = float(lift_match.group(1))
        cam['lift_exh'] = float(lift_match.group(2))
    
    # Extract LSA (Lobe Separation XXX)
    lsa_match = re.search(
        r'[Ll]obe\s+[Ss]eparation\s+(\d+(?:\.\d+)?)',
        specs_text
    )
    if lsa_match:
        cam['lsa'] = float(lsa_match.group(1))
    
    # Determine engine family from context
    if '351W' in specs_text or '351w' in specs_text:
        cam['family'] = 'Ford Small Block Windsor'
    elif '5.0L HO' in specs_text or '5.0L HO' in specs_text:
        cam['family'] = 'Ford Small Block Windsor'
    elif '5.0L' in specs_text:
        cam['family'] = 'Ford Small Block Windsor'
    elif '5.8L' in specs_text:
        cam['family'] = 'Ford Small Block Windsor'
    elif 'Small Block' in specs_text:
        cam['family'] = 'Ford Small Block Windsor'
    else:
        # Default to Ford Small Block Windsor for this search
        cam['family'] = 'Ford Small Block Windsor'
    
    # Validate we have minimum required fields
    if not (cam['dur_int_050'] and cam['dur_exh_050'] and cam['lift_int'] and cam['lift_exh']):
        return None
    
    return cam

def extract_cams(content):
    """Extract all camshaft entries from page content."""
    # Split by "Part Number:" to find individual entries
    entries = re.split(r'(?=(?:[A-Z][a-z]*\s+)+(?:Cams|Racing))', content)
    
    cams = []
    for entry in entries:
        if 'Part Number:' in entry:
            cam = parse_camshaft_entry(entry)
            if cam:
                cams.append(cam)
    
    return cams

def generate_sql_insert(cam):
    """Generate SQL INSERT statement for a camshaft."""
    timestamp = datetime.now().isoformat()
    
    # Escape single quotes in strings
    def escape_sql(s):
        if s is None:
            return 'NULL'
        if isinstance(s, str):
            return f"'{s.replace(chr(39), chr(39) + chr(39))}'"
        return str(s)
    
    values = [
        escape_sql(cam['engine_make']),
        escape_sql(cam['family']),
        escape_sql(cam['brand']),
        escape_sql(cam['pn']),
        escape_sql(cam['cam_name']),
        str(cam['dur_int_050']),
        str(cam['dur_exh_050']),
        'NULL' if cam['lsa'] is None else str(cam['lsa']),
        str(cam['lift_int']),
        str(cam['lift_exh']),
        '0',  # peak_hp_rpm
        escape_sql('either'),  # boost_ok
        escape_sql(cam['notes']),
        f"'{timestamp}'"  # created_at
    ]
    
    columns = [
        'make', 'family', 'brand', 'pn', 'cam_name',
        'dur_int_050', 'dur_exh_050', 'lsa', 'lift_int', 'lift_exh',
        'peak_hp_rpm', 'boost_ok', 'notes', 'created_at'
    ]
    
    sql = f"""INSERT INTO public.cse_generic_cams ({', '.join(columns)}) 
VALUES ({', '.join(values)});"""
    
    return sql

# Parse the content
print("Extracting camshaft data...\n")
cams = extract_cams(page_content)

print(f"Found {len(cams)} camshafts with complete specifications\n")
print("=" * 80)
print("SQL INSERT STATEMENTS")
print("=" * 80)
print()

# Generate SQL for each cam
for cam in cams:
    print(generate_sql_insert(cam))
    print()

# Also save to file
output_file = 'summit_cams_inserts.sql'
with open(output_file, 'w') as f:
    f.write("-- Ford Small Block Windsor Camshafts from Summit Racing (Page 2)\n")
    f.write("-- Generated: " + datetime.now().isoformat() + "\n\n")
    for cam in cams:
        f.write(generate_sql_insert(cam))
        f.write("\n\n")

print(f"\nSQL statements saved to: {output_file}")
print(f"Total statements: {len(cams)}")
