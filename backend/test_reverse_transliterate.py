import urllib.request
import urllib.parse
import json

def test_google_input_tools(word):
    # Try using kn-t-i0-und but sending Kannada text (unlikely to work well for reverse)
    url = (
        "https://inputtools.google.com/request"
        f"?text={urllib.parse.quote(word)}"
        "&itc=kn-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            print(f"Input: {word} -> Output: {data}")
    except Exception as e:
        print(f"Error: {e}")

words = ["ಮೋಹನ", "ಕೃಷ್ಣ", "ಬೆಂಗಳೂರು", "ಶಿವ"]
print("Testing Google Input Tools API for reverse transliteration:")
for w in words:
    test_google_input_tools(w)
