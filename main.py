import sys
import os

# Add backend to Python module path so 'app' and all its submodules are discoverable
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
