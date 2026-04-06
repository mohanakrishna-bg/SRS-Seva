import sqlite3

mapping = {
    'ಸೇವಾಕಾಣಿಕೆ': 'Seva Kaanike',
    'ಕನಕ ಮಹಾಸೇವೆ  ( 3  ಮತ್ತು 4 ಸೇವೆ ಸಹಿತ  )': 'Kanaka Mahaseve (Including 3 and 4 Sevas)',
    'ಕನಕಾಭಿಷೇಕ      ( 3  ಮತ್ತು 4 ಸೇವೆ ಸಹಿತ  )': 'Kanakabhisheka (Including 3 and 4 Sevas)',
    'ಪಾದ ಪೂಜೆ -      ಪಂಚಾಮೃತ ಸೇವೆ ಸಹಿತ': 'Paada Pooje - Including Panchamruta Seve',
    'ಪಂಚಾಮೃತ ಅಭಿಷೇಕ': 'Panchamruta Abhisheka',
    'ಪಾದ   ಪೂಜೆ - ಸೇವಾಕರ್ತರ ಮನೆಯಲ್ಲಿ': 'Paada Pooje - At Sevakartas House',
    'ಶ್ರಾದ್ಧಕರ್ಮ - ಚಟಕ': 'Shraddha Karma - Chataka',
    'ಶ್ರಾದ್ಧಕರ್ಮ - ಸಂಕಲ್ಪ': 'Shraddha Karma - Sankalpa',
    'ಶ್ರೀ  ಸತ್ಯನಾರಾಯಣ     ಪೂಜೆ     ( ಸಾಮೂಹಿಕ)': 'Sri Satyanarayana Pooje (Samuhika)',
    'ಶ್ರೀ ಸತ್ಯನಾರಾಯಣ ಪೂಜೆ ( ಸಾಮೂಹಿಕ ಒಂದು ವರ್ಷಕ್ಕೆ)': 'Sri Satyanarayana Pooje (Samuhika for one year)',
    'ಶ್ರೀ ಸತ್ಯನಾರಾಯಣ ಪೂಜೆ (ಪ್ರತ್ಯೇಕ)': 'Sri Satyanarayana Pooje (Pratyeka)',
    'ಧನುರ್ಮಾಸ ಪೂಜೆ - ಖಾರ ಪೊಂಗಲ್': 'Dhanurmasa Pooje - Khaara Pongal',
    'ಧನುರ್ಮಾಸ ಪೂಜೆ - ಸಿಹಿ ಪೊಂಗಲ್': 'Dhanurmasa Pooje - Sihi Pongal',
    'ರಥೋತ್ಸವ  /  ಡೋಲೋತ್ಸವ  /  ಫಲ್ಲಕ್ಕಿ ಉತ್ಸವ': 'Rathotsava / Dolotsava / Pallakki Utsava',
    'ತೈಲನಂದಾದೀಪ (ಒಂದು ಮಾಸಕ್ಕೆ)': 'Tailanandadeepa (For one month)',
    'ತೈಲ ದೀಪ ಆರತಿ -  ಗುರುವಾರ ಮಾತ್ರ': 'Taila Deepa Aarati - Thursday only',
    'ವಾಹನ ಪೂಜೆ - ದ್ವಿಚಕ್ರ ವಾಹನ': 'Vahana Pooje - Two Wheeler',
    'ವಾಹನ ಪೂಜೆ - ನಾಲ್ಕು ಚಕ್ರ ವಾಹನ': 'Vahana Pooje - Four Wheeler',
    'ಶ್ರೀಗಂಧ ಲೇಪನ - ಅಕ್ಷಯ ತೃತೀಯ': 'Srigandha Lepana - Akshaya Tritiya',
    'ಕಾರ್ತಿಕ ದೀಪಾರಾಧನೆ': 'Karthika Deepaaradhane',
    'ಹಸ್ತೋದಕ': 'Hastodaka',
    'ಪ್ರಸಾದ ಸೇವೆ': 'Prasada Seve',
    'ಶ್ರಾಧ್ದ - ಪಕ್ಷಮಾಸ ಚಟಕ': 'Shraddha - Pakshamasa Chataka',
    'ಶ್ರಾಧ್ದ - ಪಕ್ಷಮಾಸ ಸಂಕಲ್ಪ': 'Shraddha - Pakshamasa Sankalpa',
    'ಘಾತ ಚತುರ್ದಶಿ - ಶ್ರಾದ್ದ ಪಕ್ಷಮಾಸ': 'Ghata Chaturdashi - Shraddha Pakshamasa',
    'ಅವಿಧವಾನವಮೀ - ಶ್ರಾದ್ದ ಪಕ್ಷಮಾಸ': 'Avidhavaanavami - Shraddha Pakshamasa',
    'ಮಧು    ಅಭಿಷೇಕ': 'Madhu Abhisheka',
    'ಹೂವಿನ ಅಲಂಕಾರ': 'Hoovina Alankara',
    'ಗುರುವಾರ ಸಂಪೂರ್ಣ ಸೇವೆ': 'Guruvara Sampoorna Seve',
    'ಅನಂತ ವ್ರತ ಪೂಜೆ ಸೇವಾಕಾಣಿಕೆ': 'Anantha Vrata Pooje Seva Kaanike',
    'ಮಧು    ಅಭಿಷೇಕ - ಸಾಮೂಹಿಕ': 'Madhu Abhisheka - Samuhika',
}

def get_english(k):
    # exact match
    if k in mapping: return mapping[k]
    # flexible matching just in case
    clean_k = " ".join(k.split())
    for key, val in mapping.items():
        if " ".join(key.split()) == clean_k:
            return val
    return k

def main():
    conn = sqlite3.connect('backend/seva.db')
    cursor = conn.cursor()

    # Ensure DescriptionEn exists
    cursor.execute("PRAGMA table_info(Seva)")
    columns = [col[1] for col in cursor.fetchall()]
    if "DescriptionEn" not in columns:
        cursor.execute("ALTER TABLE Seva ADD COLUMN DescriptionEn TEXT;")
        print("Success: Added 'DescriptionEn' column to Seva table.")
    else:
        print("'DescriptionEn' column already exists.")

    cursor.execute("SELECT SevaCode, Description FROM Seva")
    rows = cursor.fetchall()

    for code, desc in rows:
        if not desc: continue
        en_desc = get_english(desc)
        cursor.execute("UPDATE Seva SET DescriptionEn = ? WHERE SevaCode = ?", (en_desc, code))

    conn.commit()
    print("Database updated with English translations/transliterations.\n")
    
    # Verification query
    print("--- Updated Seva Catalog ---")
    cursor.execute("SELECT SevaCode, Description, DescriptionEn FROM Seva LIMIT 50")
    results = cursor.fetchall()
    print(f"{'Code':<6} | {'Kannada Description':<50} | {'English Description':<50}")
    print("-" * 115)
    for r in results:
        code = r[0] if r[0] else ""
        kan = r[1] if r[1] else ""
        eng = r[2] if r[2] else ""
        print(f"{code:<6} | {kan:<50} | {eng:<50}")

    conn.close()

if __name__ == "__main__":
    main()
