from indic_transliteration import sanscript
import re

words = ["ಮೋಹನ", "ಕೃಷ್ಣ", "ಬೆಂಗಳೂರು", "ಶಿವ"]

def strip_diacritics(text):
    # Mapping common transliterated diacritics to simple english rules
    text = text.replace('ś', 'sh').replace('ṣ', 'sh')
    text = text.replace('ā', 'a').replace('ī', 'i').replace('ū', 'u')
    text = text.replace('ē', 'e').replace('ō', 'o')
    text = text.replace('ṭ', 't').replace('ḍ', 'd').replace('ṇ', 'n')
    text = text.replace('ḷ', 'l').replace('ṛ', 'ri').replace('ñ', 'n')
    text = text.replace('ṅ', 'n').replace('ṃ', 'm').replace('ḥ', 'h')
    text = text.replace('r̥', 'ri')
    # strip anything remaining that's non-standard
    import unicodedata
    return ''.join(c for c in unicodedata.normalize('NFD', text)
                  if unicodedata.category(c) != 'Mn')

print("Testing indic-transliteration (Kannada -> IAST -> English phonetic):")
for w in words:
    # Transliterate Kannada to IAST (International Alphabet of Sanskrit Transliteration)
    iast = sanscript.transliterate(w, sanscript.KANNADA, sanscript.IAST)
    roman = strip_diacritics(iast)
    print(f"[{w}] -> IAST: {iast} -> Roman: {roman.title()}")

