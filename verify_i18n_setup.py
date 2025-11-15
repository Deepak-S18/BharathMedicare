#!/usr/bin/env python3
"""
Verification script for Multi-Language Support implementation
Run this to verify the i18n setup is correct
"""

import os
import sys
import json

def check_file_exists(filepath, description):
    """Check if a file exists"""
    if os.path.exists(filepath):
        print(f"✓ {description}: {filepath}")
        return True
    else:
        print(f"✗ {description} MISSING: {filepath}")
        return False

def check_backend():
    """Check backend files"""
    print("\n=== Backend Files ===")
    checks = [
        ("backend/requirements.txt", "Requirements file"),
        ("backend/babel.cfg", "Babel configuration"),
        ("backend/app/__init__.py", "App initialization"),
    ]
    
    results = []
    for filepath, desc in checks:
        results.append(check_file_exists(filepath, desc))
    
    # Check if Flask-Babel is in requirements
    if os.path.exists("backend/requirements.txt"):
        with open("backend/requirements.txt", "r") as f:
            content = f.read()
            if "Flask-Babel" in content:
                print("✓ Flask-Babel found in requirements.txt")
                results.append(True)
            else:
                print("✗ Flask-Babel NOT found in requirements.txt")
                results.append(False)
    
    return all(results)

def check_frontend():
    """Check frontend files"""
    print("\n=== Frontend Files ===")
    checks = [
        ("frontend/js/translations.js", "Translation strings"),
        ("frontend/js/i18n.js", "i18n engine"),
        ("frontend/js/language-selector.js", "Language selector"),
        ("frontend/i18n-demo.html", "Demo page"),
        ("frontend/I18N_GUIDE.md", "Developer guide"),
    ]
    
    results = []
    for filepath, desc in checks:
        results.append(check_file_exists(filepath, desc))
    
    return all(results)

def check_documentation():
    """Check documentation files"""
    print("\n=== Documentation ===")
    checks = [
        ("MULTI_LANGUAGE_IMPLEMENTATION.md", "Implementation guide"),
        ("setup_i18n.md", "Setup guide"),
        ("I18N_SUMMARY.md", "Summary document"),
        ("I18N_QUICK_REFERENCE.md", "Quick reference"),
    ]
    
    results = []
    for filepath, desc in checks:
        results.append(check_file_exists(filepath, desc))
    
    return all(results)

def check_translations():
    """Check if translations are properly structured"""
    print("\n=== Translation Validation ===")
    
    try:
        # Read translations.js
        with open("frontend/js/translations.js", "r", encoding="utf-8") as f:
            content = f.read()
        
        # Check for all languages
        languages = ["en", "hi", "te", "kn", "ta"]
        import re
        for lang in languages:
            # More flexible pattern matching
            if re.search(rf'\b{lang}\s*:', content):
                print(f"✓ {lang.upper()} translations found")
            else:
                print(f"✗ {lang.upper()} translations MISSING")
                return False
        
        # Check for key sections
        sections = ["common", "nav", "auth", "dashboard", "patient", "messages"]
        for section in sections:
            # More flexible pattern matching
            if re.search(rf'\b{section}\s*:', content):
                print(f"✓ Section '{section}' found")
            else:
                print(f"✗ Section '{section}' MISSING")
                return False
        
        return True
    except Exception as e:
        print(f"✗ Error reading translations: {e}")
        return False

def check_integration():
    """Check if files are properly integrated"""
    print("\n=== Integration Check ===")
    
    # Check if index.html includes i18n scripts
    try:
        with open("frontend/index.html", "r", encoding="utf-8") as f:
            content = f.read()
        
        scripts = ["translations.js", "i18n.js", "language-selector.js"]
        for script in scripts:
            if script in content:
                print(f"✓ {script} included in index.html")
            else:
                print(f"✗ {script} NOT included in index.html")
                return False
        
        return True
    except Exception as e:
        print(f"✗ Error checking integration: {e}")
        return False

def main():
    """Main verification function"""
    print("=" * 60)
    print("Multi-Language Support - Setup Verification")
    print("=" * 60)
    
    results = {
        "Backend": check_backend(),
        "Frontend": check_frontend(),
        "Documentation": check_documentation(),
        "Translations": check_translations(),
        "Integration": check_integration(),
    }
    
    print("\n" + "=" * 60)
    print("VERIFICATION SUMMARY")
    print("=" * 60)
    
    for category, passed in results.items():
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{category:20s}: {status}")
    
    all_passed = all(results.values())
    
    print("\n" + "=" * 60)
    if all_passed:
        print("✓ ALL CHECKS PASSED!")
        print("\nNext steps:")
        print("1. Install Flask-Babel: pip install Flask-Babel==4.0.0")
        print("2. Open frontend/i18n-demo.html in browser to test")
        print("3. Check documentation in MULTI_LANGUAGE_IMPLEMENTATION.md")
    else:
        print("✗ SOME CHECKS FAILED")
        print("\nPlease review the errors above and fix missing files.")
    print("=" * 60)
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
