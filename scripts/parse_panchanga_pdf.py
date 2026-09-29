import pdfplumber, re, json, os
from datetime import date, timedelta
from kannada_converter import KannadaConverter

converter = KannadaConverter()

def clean_kn(s):
    if not s:
        return ''
    res = converter.convert_ascii_to_unicode(s)
    res = res.replace('¯ï', 'ಲ್').replace('ð', 'ರ್')
    res = res.replace('ಶಾz್ರ ್ಧÀ', 'ಶ್ರಾದ್ಧ').replace('ಶಾz್ರ Á್ಧಬಾs ವ', 'ಶ್ರಾದ್ಧಾಭಾವ').replace('ಯಗಾದಿ', 'ಯುಗಾದಿ')
    return re.sub(r'\s+', ' ', res).strip()

TITHI_MAP = {
    'ಪ್ರತಿ': 'ಪ್ರತಿಪದೆ', 'ಪ್ರತಿಪತ್': 'ಪ್ರತಿಪದೆ', 'ಪ್ರತಿ1': 'ಪ್ರತಿಪದೆ', 'ಅಮಾ1': 'ಪ್ರತಿಪದೆ',
    'ದ್ವಿತೀ': 'ದ್ವಿತೀಯಾ', 'ತೃತೀ': 'ತೃತೀಯಾ', 'ಚತು': 'ಚತುರ್ಥಿ', 'ಚತುರ್': 'ಚತುರ್ಥಿ',
    'ಪಂಚ': 'ಪಂಚಮಿ', 'ಷಷ್ಠೀ': 'ಷಷ್ಠಿ', 'ಷಷ್ಠಿ': 'ಷಷ್ಠಿ', 'ಸಪ್ತ': 'ಸಪ್ತಮಿ',
    'ಅಷ್ಟ': 'ಅಷ್ಟಮಿ', 'ನವ': 'ನವಮಿ', 'ದಶ': 'ದಶಮಿ', 'ಏಕಾ': 'ಏಕಾದಶಿ',
    'ದ್ವಾದ': 'ದ್ವಾದಶಿ', 'ತ್ರಯೋ': 'ತ್ರಯೋದಶಿ', 'ಪೂರ್ಣಿ': 'ಪೂರ್ಣಿಮೆ', 'ಅಮಾ': 'ಅಮಾವಾಸ್ಯೆ'
}

NAKSHATRA_MAP = {
    'ಅಶ್ವಿ': 'ಅಶ್ವಿನಿ', 'ಭರ': 'ಭರಣಿ', 'ಭರಣಿ': 'ಭರಣಿ', 'ಕೃತ್ತಿ': 'ಕೃತ್ತಿಕಾ', 'ರೋಹಿ': 'ರೋಹಿಣಿ',
    'ಮೃಗ': 'ಮೃಗಶಿರಾ', 'ಆದ್ರ್ರಾ': 'ಆರ್ದ್ರಾ', 'ಆರ್ದ್ರಾ': 'ಆರ್ದ್ರಾ', 'ಪುನ': 'ಪುನರ್ವಸು', 'ಪುಷ್ಯಾ': 'ಪುಷ್ಯ',
    'ಪುಷ್ಯ': 'ಪುಷ್ಯ', 'ಆಶ್ಲೇ': 'ಆಶ್ಲೇಷಾ', 'ಮಘಾ': 'ಮಘಾ', 'ಪೂಫ': 'ಪೂರ್ವ ಫಲ್ಗುಣಿ', 'ಪೂ.ಫ': 'ಪೂರ್ವ ಫಲ್ಗುಣಿ',
    'ಉತ್ತ': 'ಉತ್ತರ ಫಲ್ಗುಣಿ', 'ಉ.ಫ': 'ಉತ್ತರ ಫಲ್ಗುಣಿ', 'ಹಸ್ತಾ': 'ಹಸ್ತ', 'ಚಿತ್ತಾ': 'ಚಿತ್ರಾ', 'ಸ್ವಾತೀ': 'ಸ್ವಾತಿ',
    'ವಿಶಾ': 'ವಿಶಾಖಾ', 'ಅನು': 'ಅನುರಾಧಾ', 'ಜ್ಯೇಷ್ಠ': 'ಜ್ಯೇಷ್ಠಾ', 'ಜ್ಯೇಷ್ಠಾ': 'ಜ್ಯೇಷ್ಠಾ', 'ಮೂಲ': 'ಮೂಲಾ',
    'ಪೂಷಾ': 'ಪೂರ್ವಾಷಾಢಾ', 'ಉಷಾ': 'ಉತ್ತರಾಷಾಢಾ', 'ಶ್ರವ': 'ಶ್ರವಣ', 'ಧನಿ': 'ಧನಿಷ್ಠಾ', 'ಶತ': 'ಶತಭಿಷಾ',
    'ಪೂಭಾ': 'ಪೂರ್ವಭಾದ್ರಪದಾ', 'ಉಭಾ': 'ಉತ್ತರಾಭಾದ್ರಪದಾ', 'ರೇವ': 'ರೇವತಿ'
}

YOGA_MAP = {
    'ವಿಷ್ಕ': 'ವಿಷ್ಕಂಭ', 'ಪ್ರೀತಿ': 'ಪ್ರೀತಿ', 'ಆಯು': 'ಆಯುಷ್ಮಾನ್', 'ಆಯ': 'ಆಯುಷ್ಮಾನ್', 'ಸೌಭಾ': 'ಸೌಭಾಗ್ಯ',
    'ಶೋಭ': 'ಶೋಭನ', 'ಅತಿ': 'ಅತಿಗಂಡ', 'ಸುಕ': 'ಸುಕರ್ಮ', 'ಧೃತಿ': 'ಧೃತಿ', 'ಶೂಲ': 'ಶೂಲ',
    'ಗಂಡ': 'ಗಂಡ', 'ವೃದ್ಧಿ': 'ವೃದ್ಧಿ', 'ಧ್ರುವ': 'ಧ್ರುವ', 'ವ್ಯಾಘಾ': 'ವ್ಯಾಗಾತ', 'ಹರ್ಷ': 'ಹರ್ಷಣ',
    'ವಜ್ರ': 'ವಜ್ರ', 'ಸಿದ್ಧಿ': 'ಸಿದ್ಧಿ', 'ವ್ಯತೀ': 'ವ್ಯತೀಪಾತ', 'ವರಿ': 'ವರೀಯಾನ್', 'ಪರಿ': 'ಪರಿಘ',
    'ಶಿವ': 'ಶಿವ', 'ಸಿದ್ಧ': 'ಸಿದ್ಧ', 'ಸಾಧ್ಯ': 'ಸಾಧ್ಯ', 'ಶುಭ': 'ಶುಭ', 'ಶುಕ್ಲ': 'ಶುಕ್ಲ',
    'ಬ್ರಹ್ಮ': 'ಬ್ರಹ್ಮ', 'ಐಂದ್ರ': 'ಐಂದ್ರ', 'ವೈಧೃ': 'ವೈಧೃತಿ'
}

KARANA_MAP = {
    'ಬವ': 'ಬವ', 'ಬಾಲ': 'ಬಾಲವ', 'ಕೌಲ': 'ಕೌಲವ', 'ತೈತಿ': 'ತೈತಿಲ', 'ಗರ': 'ಗರಜ',
    'ವಣಿ': 'ವಣಿಜ', 'ಭದ್ರ': 'ಭದ್ರ (ವಿಷ್ಟಿ)', 'ಶಕು': 'ಶಕುನಿ', 'ಚತು': 'ಚತುಷ್ಪಾದ್', 'ನಾಗ': 'ನಾಗ', 'ಕಿಂಸ್ತು': 'ಕಿಂಸ್ತುಘ್ನ'
}

VARA_MAP = {
    'ರವಿ': 'ಭಾನುವಾರ', '¨sÁ£ÀÄ': 'ಭಾನುವಾರ', 'ಭಾ': 'ಭಾನುವಾರ',
    '¸ÉÆÃªÀÄ': 'ಸೋಮವಾರ', 'ಸೋಮ': 'ಸೋಮವಾರ', 'ಸೋ': 'ಸೋಮವಾರ',
    'ªÀÄAUÀ': 'ಮಂಗಳವಾರ', 'ªÀÄAUÀÀ': 'ಮಂಗಳವಾರ', 'ಮಂಗ': 'ಮಂಗಳವಾರ', 'ಮಂಗಳ': 'ಮಂಗಳವಾರ', 'ಮಂ': 'ಮಂಗಳವಾರ',
    '§ÄzsÀ': 'ಬುಧವಾರ', 'ಬುಧ': 'ಬುಧವಾರ', 'ಬು': 'ಬುಧವಾರ',
    'UÀÄgÀÄ': 'ಗುರುವಾರ', 'ಗುರು': 'ಗುರುವಾರ', 'ಗು': 'ಗುರುವಾರ',
    '±ÀÄPÀæ': 'ಶುಕ್ರವಾರ', 'ಶುಕ್ರ': 'ಶುಕ್ರವಾರ', 'ಶು': 'ಶುಕ್ರವಾರ',
    '±À¤': 'ಶನಿವಾರ', 'ಶನಿ': 'ಶನಿವಾರ'
}

MASA_NAMES = [
    'ಚೈತ್ರ', 'ವೈಶಾಖ', 'ಅಧಿಕ ಜ್ಯೇಷ್ಠ', 'ನಿಜ ಜ್ಯೇಷ್ಠ', 'ಆಷಾಢ', 'ಶ್ರಾವಣ',
    'ಭಾದ್ರಪದ', 'ಆಶ್ವಿನ', 'ಕಾರ್ತಿಕ', 'ಮಾರ್ಗಶಿರ', 'ಪುಷ್ಯ', 'ಮಾಘ', 'ಫಾಲ್ಗುಣ'
]

pdf_path = '/Users/bgm/SRS/Documents/panchanga_parabhava_kannada.pdf'

def parse_all():
    daily_records = {}
    curr_date = date(2026, 3, 19)
    
    with pdfplumber.open(pdf_path) as pdf:
        for page_idx in range(23, 49):
            page_num = page_idx + 1
            p = pdf.pages[page_idx]
            raw_text = p.extract_text()
            lines = [l.strip() for l in raw_text.split('\n') if l.strip()]
            
            # Header info
            h0 = clean_kn(lines[0])
            h1 = clean_kn(lines[1]) if len(lines) > 1 else ''
            
            # Determine paksha
            paksha = 'ಶುಕ್ಲ ಪಕ್ಷ' if 'ಶುಕ್ಲ' in h0 else 'ಕೃಷ್ಣ ಪಕ್ಷ'
            
            # Determine masa
            current_masa = ''
            for m in MASA_NAMES:
                if m.replace(' ', '') in h0.replace(' ', ''):
                    current_masa = m
                    break
            if not current_masa:
                if page_num in [24, 25]: current_masa = 'ಚೈತ್ರ'
                elif page_num in [26, 27]: current_masa = 'ವೈಶಾಖ'
                elif page_num in [28, 29]: current_masa = 'ಅಧಿಕ ಜ್ಯೇಷ್ಠ'
                elif page_num in [30, 31]: current_masa = 'ನಿಜ ಜ್ಯೇಷ್ಠ'
                elif page_num in [32, 33]: current_masa = 'ಆಷಾಢ'
                elif page_num in [34, 35]: current_masa = 'ಶ್ರಾವಣ'
                elif page_num in [36, 37]: current_masa = 'ಭಾದ್ರಪದ'
                elif page_num in [38, 39]: current_masa = 'ಆಶ್ವಿನ'
                elif page_num in [40, 41]: current_masa = 'ಕಾರ್ತಿಕ'
                elif page_num in [42, 43]: current_masa = 'ಮಾರ್ಗಶಿರ'
                elif page_num in [44, 45]: current_masa = 'ಪುಷ್ಯ'
                elif page_num in [46, 47]: current_masa = 'ಮಾಘ'
                elif page_num in [48, 49]: current_masa = 'ಫಾಲ್ಗುಣ'
            
            # Determine ayana
            ayana = 'ಉತ್ತರಾಯಣ'
            if 'ದಕ್ಷಿಣಾಯನ' in h1:
                ayana = 'ದಕ್ಷಿಣಾಯನ'
            
            # Determine ritu
            ritu = 'ವಸಂತ ಋತು'
            for r in ['ವಸಂತ', 'ಗ್ರೀಷ್ಮ', 'ವರ್ಷ', 'ಶರದ್', 'ಶರದ', 'ಹೇಮಂತ', 'ಶಿಶಿರ']:
                if r in h1:
                    ritu = f'{r} ಋತು'.replace('ಶರದ ಋತು', 'ಶರದ್ ಋತು')
                    break
            
            # Masa Devata
            devata = ''
            dev_match = re.search(r'(ಶ್ರೀ[^\s]+(?:ವಿಷ್ಣವೇ|ಮಧುಸೂದನಾಯ|ತ್ರಿವಿಕ್ರಮಾಯ|ಪುರುಷೋತ್ತಮಾಯ|ವಾಮನಾಯ|ಶ್ರೀಧರಾಯ|ಹೃಷೀಕೇಶಾಯ|ಪದ್ಮನಾಭಾಯ|ದಾಮೋದರಾಯ|ಕೇಶವಾಯ|ನಾರಾಯಣಾಯ|ಮಾಧವಾಯ|ಗೋವಿಂದಾಯ)\s+ನಮಃ)', h1)
            if dev_match:
                devata = dev_match.group(1)
            
            # Separate table rows and footnotes
            table_rows = []
            footnote_lines = []
            is_footnote = False
            
            for line in lines[2:]:
                # Check for table header
                if 'wy' in line or 'ತಿಥಿ' in clean_kn(line):
                    continue
                # If starts with a day row: starts with 1-31 and contains sunrise
                if not is_footnote and re.match(r'^\d{1,2}\s+[^\d]+?', line) and re.search(r'0[56]\s+\d{2}\s+\d{2}\s+\d{2}', line):
                    table_rows.append(line)
                else:
                    # Could be footnote or continuation
                    if re.match(r'^\d{1,2}\)', line.strip()):
                        is_footnote = True
                    if is_footnote or len(table_rows) >= 13:
                        footnote_lines.append(line)
            
            footnote_text = clean_kn(' '.join(footnote_lines))
            # Extract notes by date: e.g. "19) ... 20) ... "
            date_notes = {}
            parts = re.split(r'(\b\d{1,2}\))', footnote_text)
            curr_fn_day = None
            for p_str in parts:
                p_str = p_str.strip()
                if re.match(r'^\d{1,2}\)$', p_str):
                    curr_fn_day = int(p_str.replace(')', ''))
                elif curr_fn_day is not None and p_str:
                    date_notes[curr_fn_day] = (date_notes.get(curr_fn_day, '') + ' ' + p_str).strip()
            
            # Parse each table row
            for row in table_rows:
                # Regex to isolate: Day, Vara, Mid, Sunrise, Dinamana, Rest
                m = re.search(r'^(?P<day>\d{1,2})\s+(?P<vara>[^\d]+?)\s+(?P<mid>.+?)\s+(?P<sr>0[56]\s+\d{2})\s+(?P<dm>\d{2}\s+\d{2})\s+(?P<rest>.+)$', row.strip())
                if not m:
                    continue
                
                day_val = int(m.group('day'))
                vara_raw = m.group('vara').strip()
                mid_raw = m.group('mid').strip()
                sr_val = m.group('sr').replace(' ', ':')
                dm_val = m.group('dm').replace(' ', ':')
                rest_raw = m.group('rest').strip()
                
                # Vara Kannada
                vara_clean = clean_kn(vara_raw)
                day_of_week = VARA_MAP.get(vara_raw, VARA_MAP.get(vara_clean, ''))
                if not day_of_week:
                    day_of_week = f'{vara_clean}ವಾರ'
                
                # Dharmashastra & Shraddha
                rest_parts = rest_raw.rsplit(' ', 1)
                if len(rest_parts) > 1:
                    dharmashastra = clean_kn(rest_parts[0])
                    shraddha = clean_kn(rest_parts[1])
                else:
                    dharmashastra = clean_kn(rest_parts[0])
                    shraddha = ''
                
                # Mid section: Tithi, Nakshatra, Yoga, Karana
                # Clean Kannada of mid_raw
                mid_kn = clean_kn(mid_raw)
                mid_tokens = mid_kn.split()
                
                # Extract Tithi, Nakshatra, Yoga, Karana from tokens
                tithi_name = ''
                nakshatra_name = ''
                yoga_name = ''
                karana_name = ''
                tithi_time = ''
                
                # Look for tithi
                for k, v in TITHI_MAP.items():
                    if mid_tokens and (k in mid_tokens[0] or mid_tokens[0].startswith(k)):
                        tithi_name = v
                        break
                if not tithi_name and mid_tokens:
                    tithi_name = mid_tokens[0]
                
                # Look for nakshatra, yoga, karana by checking tokens
                for t in mid_tokens:
                    for k, v in NAKSHATRA_MAP.items():
                        if k == t or t.startswith(k):
                            if not nakshatra_name:
                                nakshatra_name = v
                    for k, v in YOGA_MAP.items():
                        if k == t or t.startswith(k):
                            if not yoga_name:
                                yoga_name = v
                    for k, v in KARANA_MAP.items():
                        if k == t or t.startswith(k):
                            if not karana_name:
                                karana_name = v
                
                # Check for tithi end time like 18:31 or 18 31
                time_matches = re.findall(r'(\d{2}\s+\d{2})', mid_raw)
                if len(time_matches) >= 2:
                    # usually the second time is clock time (hours/minutes)
                    cand = time_matches[1].replace(' ', ':')
                    tithi_time = cand
                
                # Attach specific footnote
                fn_note = date_notes.get(day_val, '')
                
                iso_date = curr_date.strftime('%Y-%m-%d')
                
                daily_records[iso_date] = {
                    'date': iso_date,
                    'dayOfMonth': day_val,
                    'dayOfWeek': day_of_week,
                    'samvatsara': 'ಶ್ರೀ ಪರಾಭವ ನಾಮ ಸಂವತ್ಸರ',
                    'ayana': ayana,
                    'ritu': ritu,
                    'masa': f'{current_masa} ಮಾಸ',
                    'paksha': paksha,
                    'masaDevata': devata,
                    'tithi': tithi_name,
                    'tithiEndTime': tithi_time,
                    'nakshatra': nakshatra_name,
                    'yoga': yoga_name,
                    'karana': karana_name,
                    'sunrise': sr_val,
                    'dinamana': dm_val,
                    'dharmashastra': dharmashastra,
                    'shraddhaTithi': shraddha,
                    'pdfPage': page_num,
                    'notes': fn_note,
                }
                
                curr_date += timedelta(days=1)
                
    return daily_records

data = parse_all()
print(f'Successfully parsed {len(data)} daily records.')

# Sample check today
print('Sample 2026-09-29:', json.dumps(data.get('2026-09-29'), ensure_ascii=False, indent=2))
