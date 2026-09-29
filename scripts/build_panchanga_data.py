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
    'ಫೂಫ': 'ಪೂರ್ವ ಫಲ್ಗುಣಿ', 'ಉತ್ತ': 'ಉತ್ತರ ಫಲ್ಗುಣಿ', 'ಉ.ಫ': 'ಉತ್ತರ ಫಲ್ಗುಣಿ', 'ಹಸ್ತಾ': 'ಹಸ್ತ',
    'ಚಿತ್ತಾ': 'ಚಿತ್ರಾ', 'ಸ್ವಾತೀ': 'ಸ್ವಾತಿ', 'ವಿಶಾ': 'ವಿಶಾಖಾ', 'ಅನು': 'ಅನುರಾಧಾ', 'ಜ್ಯೇಷ್ಠ': 'ಜ್ಯೇಷ್ಠಾ',
    'ಜ್ಯೇಷ್ಠಾ': 'ಜ್ಯೇಷ್ಠಾ', 'ಮೂಲ': 'ಮೂಲಾ', 'ಪೂಷಾ': 'ಪೂರ್ವಾಷಾಢಾ', 'ಉಷಾ': 'ಉತ್ತರಾಷಾಢಾ', 'ಶ್ರವ': 'ಶ್ರವಣ',
    'ಧನಿ': 'ಧನಿಷ್ಠಾ', 'ಶತ': 'ಶತಭಿಷಾ', 'ಪೂಭಾ': 'ಪೂರ್ವಭಾದ್ರಪದಾ', 'ಉಭಾ': 'ಉತ್ತರಾಭಾದ್ರಪದಾ', 'ರೇವ': 'ರೇವತಿ'
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

PAGE_STARTS = [
    (24, '2026-03-19'), (25, '2026-04-03'), (26, '2026-04-18'), (27, '2026-05-02'),
    (28, '2026-05-17'), (29, '2026-06-01'), (30, '2026-06-16'), (31, '2026-06-30'),
    (32, '2026-07-15'), (33, '2026-07-30'), (34, '2026-08-13'), (35, '2026-08-29'),
    (36, '2026-09-12'), (37, '2026-09-27'), (38, '2026-10-11'), (39, '2026-10-27'),
    (40, '2026-11-10'), (41, '2026-11-25'), (42, '2026-12-09'), (43, '2026-12-25'),
    (44, '2027-01-08'), (45, '2027-01-23'), (46, '2027-02-07'), (47, '2027-02-21'),
    (48, '2027-03-09'), (49, '2027-03-23')
]

pdf_path = '/Users/bgm/SRS/Documents/panchanga_parabhava_kannada.pdf'

def build_data():
    daily_records = {}
    
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, start_str in PAGE_STARTS:
            page_idx = page_num - 1
            p = pdf.pages[page_idx]
            raw_text = p.extract_text()
            lines = [l.strip() for l in raw_text.split('\n') if l.strip()]
            
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
            
            for line in lines[2:]:
                if line.startswith('vÁ.') or line.startswith('ತಾ.'):
                    continue
                m = re.search(r'^(?P<day>\d{1,2})\s+(?P<vara>[^\d\)]+?)\s+(?P<mid>.+?)\s+(?P<sr>0[56]\s+\d{2})\s+(?P<dm>(?:2[789]|3[0123])\s+\d{2})\s*(?P<rest>.*)$', line.strip())
                if m:
                    table_rows.append(m)
                else:
                    footnote_lines.append(line)
            
            footnote_text = clean_kn(' '.join(footnote_lines))
            date_notes = {}
            parts = re.split(r'(\b\d{1,2}\))', footnote_text)
            curr_fn_day = None
            for p_str in parts:
                p_str = p_str.strip()
                if re.match(r'^\d{1,2}\)$', p_str):
                    curr_fn_day = int(p_str.replace(')', ''))
                elif curr_fn_day is not None and p_str:
                    date_notes[curr_fn_day] = (date_notes.get(curr_fn_day, '') + ' ' + p_str).strip()
            
            # Process table rows with exact start date for page
            y, m_val, d_val = map(int, start_str.split('-'))
            row_date = date(y, m_val, d_val)
            
            for m in table_rows:
                day_val = int(m.group('day'))
                vara_raw = m.group('vara').strip()
                mid_raw = m.group('mid').strip()
                sr_val = m.group('sr').replace(' ', ':')
                dm_val = m.group('dm').replace(' ', ':')
                rest_raw = m.group('rest').strip()
                
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
                
                mid_kn = clean_kn(mid_raw)
                mid_tokens = mid_kn.split()
                
                tithi_name = ''
                nakshatra_name = ''
                yoga_name = ''
                karana_name = ''
                tithi_time = ''
                
                for k, v in TITHI_MAP.items():
                    if mid_tokens and (k in mid_tokens[0] or mid_tokens[0].startswith(k)):
                        tithi_name = v
                        break
                if not tithi_name and mid_tokens:
                    tithi_name = mid_tokens[0]
                
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
                
                time_matches = re.findall(r'(\d{2}\s+\d{2})', mid_raw)
                if len(time_matches) >= 2:
                    cand = time_matches[1].replace(' ', ':')
                    tithi_time = cand
                
                fn_note = date_notes.get(day_val, '')
                iso_date = row_date.strftime('%Y-%m-%d')
                
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
                
                row_date += timedelta(days=1)

    # Parividi (Table of Contents) from Page 8
    toc = [
        {"id": 1, "titleKn": "ಪಂಚಾಂಗ ಪೀಠಿಕಾ", "titleEn": "Panchanga Peethika", "page": 9},
        {"id": 2, "titleKn": "ಶ್ರೀ ಪರಾಭವ ಸಂ|| ರಾಜಾದಿನಾಯಕರು", "titleEn": "Rajadi Navanayakaru", "page": 10},
        {"id": 3, "titleKn": "ರಾಜಾದಿನಾಯಕರ ಫಲಗಳು", "titleEn": "Navanayaka Phala", "page": 11},
        {"id": 4, "titleKn": "ಸಂಕ್ರಾಂತಿ ಪುಣ್ಯಕಾಲ", "titleEn": "Sankranti Punya Kaala", "page": 13},
        {"id": 5, "titleKn": "ಶ್ರೀ ಪರಾಭವ ಸಂವತ್ಸರ ಹಬ್ಬಗಳು", "titleEn": "Annual Festivals List", "page": 14},
        {"id": 6, "titleKn": "ಮಳೆ ನಕ್ಷತ್ರ & ಏಕಾದಶಿ ದಿನಗಳು", "titleEn": "Rain Stars & Ekadashi Dates", "page": 15},
        {"id": 7, "titleKn": "ಆನಂದಾದಿ ಯೋಗಗಳು & ಗೌರೀ ಪಂಚಾಂಗ", "titleEn": "Anandadi Yoga & Gauri Panchanga", "page": 16},
        {"id": 8, "titleKn": "ಶ್ರೀ ಪರಾಭವ ಸಂ|| ರಾಶಿಭವಿಷ್ಯ", "titleEn": "Yearly Rashi Bhavishya", "page": 17},
        {"id": 9, "titleKn": "ವಿವಾಹ & ಉಪನಯನ ಮುಹೂರ್ತಗಳು", "titleEn": "Vivaha & Upanayana Muhurthas", "page": 23},
        {"id": 10, "titleKn": "ಚೈತ್ರಾದಿ ಮಾಸಿಕ ಪಂಚಾಂಗ (ದೈನಂದಿನ)", "titleEn": "Chaitradi Monthly Panchanga (Daily)", "page": 24},
        {"id": 11, "titleKn": "ಷಣ್ಣವತಿ (96) ಶ್ರಾದ್ಧತಿಥಿಗಳು", "titleEn": "96 Shraddha Tithis", "page": 50},
        {"id": 12, "titleKn": "ದೈನಂದಿನ ಲಗ್ನಭೋಗ್ಯಕಾಲಗಳು", "titleEn": "Daily Lagna Bhogya Times", "page": 51},
        {"id": 13, "titleKn": "ದೃಕ್ ನಕ್ಷತ್ರಾಂತ್ಯಕಾಲಗಳು", "titleEn": "Drik Nakshatra End Times", "page": 52},
        {"id": 14, "titleKn": "ದೃಕ್ ಗ್ರಹಗಳ ನಕ್ಷತ್ರಪಾದಚಾರಗಳು", "titleEn": "Planetary Nakshatra Pada Movements", "page": 54},
        {"id": 15, "titleKn": "ನವರಾತ್ರೋತ್ಸವ ಸಂಕಲ್ಪ & ಸದ್ವಿದ್ಯಾಪೀಠ", "titleEn": "Navaratri Sankalpa & Vidyapeetha", "page": 57}
    ]

    # Special Sacred Invocations from Pages 1-7
    hymns = [
        {"title": "ಪ್ರಾತಃ ಸಂಕಲ್ಪ ಗದ್ಯಮ್ (ಶ್ರೀ ರಾಘವೇಂದ್ರತೀರ್ಥ ಗುರುಸಾರ್ವಭೌಮರು)", "page": 1},
        {"title": "ಸರ್ವಸಮರ್ಪಣ ಗದ್ಯಮ್ (ಶ್ರೀ ರಾಘವೇಂದ್ರತೀರ್ಥ ಗುರುಸಾರ್ವಭೌಮರು)", "page": 2},
        {"title": "ಗುರುಪರಂಪರಾ ಚರಮಶ್ಲೋಕಗಳು", "page": 3},
        {"title": "ಗುರುಪರಂಪರಾ ದಂಡಕಂ & ಮಂಗಳಾಚರಣಂ", "page": 5},
        {"title": "ಶ್ರೀ ಗುರುಸಾರ್ವಭೌಮರ ಆರಾಧನಾ ಸಪ್ತಾಹ & ಮಂಗಳಾಷ್ಟಕಮ್", "page": 6},
        {"title": "ಶ್ರೀ ಜಯತೀರ್ಥ ಸ್ತುತಿಃ & ಗುರುದಶಕಮ್ (ಶ್ರೀ ಸುಬುಧೇಂದ್ರತೀರ್ಥರು)", "page": 7}
    ]

    # Festivals List from Page 14
    festivals = [
        {"nameKn": "ಚಾಂದ್ರಮಾನ ಯುಗಾದಿ", "nameEn": "Chandramana Yugadi", "date": "2026-03-19"},
        {"nameKn": "ಚೈತ್ರಗೌರೀ ವ್ರತ", "nameEn": "Chaitra Gauri Vrata", "date": "2026-03-21"},
        {"nameKn": "ಶ್ರೀರಾಮನವಮೀ", "nameEn": "Sri Rama Navami", "date": "2026-03-27"},
        {"nameKn": "ಚಿತ್ರಾಪೂರ್ಣಿಮಾ, ಹಂಪಿ ರಥೋತ್ಸವ", "nameEn": "Chitra Purnima, Hampi Ratha", "date": "2026-04-02"},
        {"nameKn": "ಅಕ್ಷಯ ತದಿಗೆ", "nameEn": "Akshaya Tadige", "date": "2026-04-20"},
        {"nameKn": "ಶ್ರೀ ನರಸಿಂಹ ಜಯಂತೀ", "nameEn": "Sri Narasimha Jayanti", "date": "2026-04-30"},
        {"nameKn": "ದೀಪಸ್ತಂಭ ಗೌರೀ ವ್ರತ", "nameEn": "Deepastambha Gauri Vrata", "date": "2026-08-12"},
        {"nameKn": "ನಾಗಚತುರ್ಥಿ", "nameEn": "Naga Chaturthi", "date": "2026-08-16"},
        {"nameKn": "ನಾಗಪಂಚಮೀ", "nameEn": "Naga Panchami", "date": "2026-08-17"},
        {"nameKn": "ಋಗ್ವೇದ ಉಪಾಕರ್ಮ", "nameEn": "Rigveda Upakarma", "date": "2026-08-26"},
        {"nameKn": "ವರಮಹಾಲಕ್ಷ್ಮೀ ವ್ರತ - ಯಜುರ್ವೇದ ಉಪಾಕರ್ಮ", "nameEn": "Varamahalakshmi Vrata / Yajurveda Upakarma", "date": "2026-08-28"},
        {"nameKn": "ಶ್ರೀ ರಾಘವೇಂದ್ರ ಗುರುಸಾರ್ವಭೌಮರ ಆರಾಧನೆ (ಪೂರ್ವ, ಮಧ್ಯ, ಉತ್ತರ)", "nameEn": "Sri Guru Raghavendra Swamy Aradhana (Poorva, Madhya, Uttara)", "date": "2026-08-29", "endDate": "2026-08-31"},
        {"nameKn": "ಶ್ರೀಕೃಷ್ಣ ಜನ್ಮಾಷ್ಟಮೀ", "nameEn": "Sri Krishna Janmashtami", "date": "2026-09-04"},
        {"nameKn": "ಸ್ವರ್ಣಗೌರೀ ವ್ರತ - ಗಣೇಶ ಚತುರ್ಥಿ", "nameEn": "Swarna Gauri Vrata - Ganesha Chaturthi", "date": "2026-09-14"},
        {"nameKn": "ಋಷಿ ಪಂಚಮೀ", "nameEn": "Rishi Panchami", "date": "2026-09-15"},
        {"nameKn": "ಅನಂತ ಚತುರ್ದಶೀ", "nameEn": "Ananta Chaturdashi", "date": "2026-09-25"},
        {"nameKn": "ಶರನ್ನವರಾತ್ರೀ ಆರಂಭ", "nameEn": "Sharannavaratri Begins", "date": "2026-10-11"},
        {"nameKn": "ಸರಸ್ವತೀ ಆವಾಹನೆ", "nameEn": "Saraswati Avahane", "date": "2026-10-16"},
        {"nameKn": "ಸರಸ್ವತೀ ಪೂಜೆ", "nameEn": "Saraswati Pooje", "date": "2026-10-18"},
        {"nameKn": "ದುರ್ಗಾಷ್ಟಮೀ", "nameEn": "Durgashtami", "date": "2026-10-19"},
        {"nameKn": "ಮಹಾನವಮೀ, ವಿಜಯದಶಮೀ", "nameEn": "Mahanavami, Vijayadashami", "date": "2026-10-20"},
        {"nameKn": "ಶ್ರೀ ಮಧ್ವ ಜಯಂತೀ", "nameEn": "Sri Madhwa Jayanti", "date": "2026-10-21"},
        {"nameKn": "ನೀರು ತುಂಬುವ ಹಬ್ಬ", "nameEn": "Neeru Thumbuva Habba", "date": "2026-11-07"},
        {"nameKn": "ನರಕ ಚತುರ್ದಶೀ, ಧನಲಕ್ಷ್ಮೀ ಪೂಜಾ", "nameEn": "Naraka Chaturdashi, Dhana Lakshmi Pooja", "date": "2026-11-08"},
        {"nameKn": "ದೀಪಾವಲೀ ಅಮಾವಾಸ್ಯೆ", "nameEn": "Deepavali Amavasya", "date": "2026-11-09"},
        {"nameKn": "ಬಲಿಪಾಡ್ಯಮಿ", "nameEn": "Balipadyami", "date": "2026-11-10"},
        {"nameKn": "ಉತ್ಥಾನ ದ್ವಾದಶೀ, ತುಳಸೀ ವಿವಾಹ", "nameEn": "Utthana Dwadashi, Tulasi Vivaha", "date": "2026-11-21"},
        {"nameKn": "ಹನುಮದ್ವ್ರತ", "nameEn": "Hanumad Vrata", "date": "2026-12-22"},
        {"nameKn": "ಮಕರ ಸಂಕ್ರಮಣ (ಉತ್ತರಾಯಣ ಪುಣ್ಯಕಾಲ)", "nameEn": "Makara Sankramana (Pongal / Uttarayana)", "date": "2027-01-15"},
        {"nameKn": "ರಥಸಪ್ತಮೀ", "nameEn": "Ratha Saptami", "date": "2027-02-13"},
        {"nameKn": "ಭೀಷ್ಮಾಷ್ಟಮೀ", "nameEn": "Bhishmashtami", "date": "2027-02-14"},
        {"nameKn": "ಮಧ್ವನವಮೀ", "nameEn": "Madhwa Navami", "date": "2027-02-15"},
        {"nameKn": "ಭಾರತ ಹುಣ್ಣಿಮೆ, ಬಳ್ಳಾರಿ ರಥ", "nameEn": "Bharata Hunnime, Ballari Ratha", "date": "2027-02-20"},
        {"nameKn": "ಮಹಾಶಿವರಾತ್ರೀ", "nameEn": "Maha Shivaratri", "date": "2027-03-06"},
        {"nameKn": "ಕಾಮದಹನ", "nameEn": "Kama Dahana", "date": "2027-03-21"},
        {"nameKn": "ಹೋಳಿ ಹುಣ್ಣಿಮೆ", "nameEn": "Holi Hunnime", "date": "2027-03-22"}
    ]

    # Aradhana Saptaha Programs from Page 6
    aradhana_saptaha = [
        {"date": "2026-08-27", "dayKn": "ಗುರುವಾರ", "dayEn": "Thursday", "eventKn": "ಧ್ವಜಾರೋಹಣ, ಪ್ರಾರ್ಥನೋತ್ಸವ, ಪ್ರಭಾ ಉತ್ಸವ, ಧಾನ್ಯೋತ್ಸವಾದಿಗಳು", "eventEn": "Dhwajarohana, Prarthanotsava, Prabha Utsava, Dhanyotsava"},
        {"date": "2026-08-28", "dayKn": "ಶುಕ್ರವಾರ", "dayEn": "Friday", "eventKn": "ಶಾಕೋತ್ಸವ, ರಜತಮಂಟಪೋತ್ಸವಾದಿಗಳು", "eventEn": "Shakotsava, Rajata Mantapotsava"},
        {"date": "2026-08-29", "dayKn": "ಶನಿವಾರ", "dayEn": "Saturday", "eventKn": "ಪೂರ್ವಾರಾಧನೆ, ಸಿಂಹವಾಹನಾದಿಗಳು", "eventEn": "Poorvaradhana, Simhavahanotsava"},
        {"date": "2026-08-30", "dayKn": "ರವಿವಾರ", "dayEn": "Sunday", "eventKn": "ಮಧ್ಯಾರಾಧನೆ, ರಾತ್ರಿ ಗಜ, ರಜತ, ಸ್ವರ್ಣರಥೋತ್ಸವ", "eventEn": "Madhyaradhana, Gaja, Rajata, Swarna Rathotsava"},
        {"date": "2026-08-31", "dayKn": "ಸೋಮವಾರ", "dayEn": "Monday", "eventKn": "ಉತ್ತರಾರಾಧನೆ, ಪ್ರಾತಃ ಮಹಾರಥೋತ್ಸವ", "eventEn": "Uttararadhana, Pratah Maha Rathotsava"},
        {"date": "2026-09-01", "dayKn": "ಮಂಗಳವಾರ", "dayEn": "Tuesday", "eventKn": "ಅಶ್ವವಾಹನಾದಿಗಳು", "eventEn": "Ashwavahanotsava"},
        {"date": "2026-09-02", "dayKn": "ಬುಧವಾರ", "dayEn": "Wednesday", "eventKn": "ಸರ್ವಸಮರ್ಪಣೋತ್ಸವ || ಮಂಗಳಂ ||", "eventEn": "Sarva Samarpana Utsava (Mangalam)"}
    ]

    result = {
        "metadata": {
            "titleKn": "ಶ್ರೀ ಪರಾಭವ ನಾಮ ಸಂವತ್ಸರ ಸೂರ್ಯಸಿದ್ಧಾಂತ ಪಂಚಾಂಗ (೨೦೨೬-೨೦೨೭)",
            "titleEn": "Sri Parabhava Nama Samvatsara Surya Siddhanta Panchanga (2026-2027)",
            "publisher": "ಶ್ರೀ ರಾಘವೇಂದ್ರ ಸ್ವಾಮಿಗಳ ಮಠ, ಮೂಲ ಮಹಾಸಂಸ್ಥಾನ, ಮಂತ್ರಾಲಯ",
            "shakaYear": 1948,
            "kaliYear": 5127,
            "pdfUrl": "/documents/panchanga_parabhava_2026_27.pdf",
            "startDate": "2026-03-19",
            "endDate": "2027-04-07",
            "totalDays": len(daily_records)
        },
        "tableOfContents": toc,
        "hymns": hymns,
        "festivals": festivals,
        "aradhanaSaptaha": aradhana_saptaha,
        "days": daily_records
    }
    
    os.makedirs('/Users/bgm/SRS/SRS-Seva/frontend/src/data', exist_ok=True)
    out_path = '/Users/bgm/SRS/SRS-Seva/frontend/src/data/srs_panchanga_2026_2027.json'
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    print(f'Successfully written Panchanga JSON to {out_path} ({len(daily_records)} days).')

if __name__ == '__main__':
    build_data()
