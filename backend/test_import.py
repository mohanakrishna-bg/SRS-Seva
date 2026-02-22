import sys
import traceback
try:
    print("Attempting to import app.main...")
    from app import main
    print("Import successful!")
except Exception as e:
    print("Exception occurred!")
    traceback.print_exc()
