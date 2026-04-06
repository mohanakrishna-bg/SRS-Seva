from indic_transliteration import sanscript
import re

words = ["ವೆಂಕಟೇಶ", "ಸಂಜಯ", "ಶ್ರೀನಿವಾಸ", "ಪೂಜಾ"]

def strip_diacritics(text):
    text = text.replace('ś', 'sh').replace('ṣ', 'sh')
    text = text.replace('ā', 'a').replace('ī', 'i').replace('ū', 'u')
    text = text.replace('ē', 'e').replace('ō', 'o')
    text = text.replace('ṭ', 't').replace('ḍ', 'd').replace('ṇ', 'n')
    text = text.replace('ḷ', 'l').replace('ṛ', 'ri').replace('ñ', 'n')
    text = text.replace('ṅ', 'n').replace('ṃ', 'm').replace('ḥ', 'h')
    import unicodedata
    return ''.join(c for c in unicodedata.normalize('NFD', text)
                  if unicodedata.category(c) != 'Mn')

print("Testing indic-transliteration edge cases:")
for w in words:
    iast = sanscript.transliterate(w, sanscript.KANNADA, sanscript.IAST)
    roman = strip_diacritics(iast)
    print(f"[{w}] -> IAST: {iast} -> Roman: {roman.title()}")

