#!/usr/bin/env python3
"""
Verification Script - Healthcare Risk Prediction Backend

This script verifies that all required files are in place and properly structured.
Run: python verify_setup.py
"""

import os
import sys
from pathlib import Path

def verify_setup():
    """Verify all project files are in place."""
    
    base_path = Path(__file__).parent
    
    # Define all required files
    required_files = {
        "Core Files": [
            "app.py",
            "config.py",
            "extensions.py",
            "requirements.txt",
        ],
        "Configuration": [
            ".env.example",
            ".gitignore",
            "Dockerfile",
            "docker-compose.yml",
        ],
        "API Routes": [
            "api/__init__.py",
            "api/patient_routes.py",
            "api/risk_routes.py",
        ],
        "Business Logic": [
            "services/patient_service.py",
            "services/risk_service.py",
        ],
        "Data Models": [
            "models/patient_model.py",
        ],
        "Database": [
            "database/mongo.py",
        ],
        "ML Engine": [
            "risk_engine/model_loader.py",
            "risk_engine/preprocess.py",
            "risk_engine/predictor.py",
            "risk_engine/explain.py",
        ],
        "Async Tasks": [
            "tasks/celery_app.py",
            "tasks/risk_tasks.py",
        ],
        "Utilities": [
            "utils/validators.py",
        ],
        "Documentation": [
            "README.md",
            "API_DOCUMENTATION.md",
            "SETUP.py",
            "TEST_CASES.md",
            "DEPLOYMENT_CHECKLIST.md",
            "SETUP_COMPLETE.md",
            "PROJECT_SUMMARY.md",
        ],
    }
    
    print("=" * 70)
    print("Healthcare Risk Prediction Backend - Setup Verification")
    print("=" * 70)
    print()
    
    all_present = True
    total_files = 0
    found_files = 0
    
    for category, files in required_files.items():
        print(f"CATEGORY: {category}")
        print("-" * 70)
        
        for file_path in files:
            total_files += 1
            full_path = base_path / file_path
            
            if full_path.exists():
                found_files += 1
                file_size = full_path.stat().st_size
                print(f"   [OK] {file_path:<50} ({file_size:,} bytes)")
            else:
                all_present = False
                print(f"   [MISSING] {file_path:<50}")
        
        print()
    
    print("=" * 70)
    print(f"Summary: {found_files}/{total_files} files found")
    print("=" * 70)
    
    if all_present:
        print("\nALL FILES PRESENT - SETUP IS COMPLETE!")
        print("\nNext Steps:")
        print("   1. Configure .env file")
        print("   2. Install dependencies: pip install -r requirements.txt")
        print("   3. Place trained model at MODEL_PATH")
        print("   4. Run: python app.py")
        return 0
    else:
        print("\nSOME FILES ARE MISSING - SETUP INCOMPLETE")
        return 1


def verify_imports():
    """Verify that all modules can be imported."""
    
    print("\n" + "=" * 70)
    print("Verifying Module Imports")
    print("=" * 70 + "\n")
    
    modules_to_test = [
        "config",
        "extensions",
    ]
    
    failed = []
    
    for module in modules_to_test:
        try:
            __import__(module)
            print(f"[OK] {module:<30}")
        except Exception as e:
            print(f"[FAILED] {module:<30} - {str(e)}")
            failed.append(module)
    
    return len(failed) == 0


def verify_structure():
    """Verify project structure."""
    
    print("\n" + "=" * 70)
    print("Verifying Project Structure")
    print("=" * 70 + "\n")
    
    base_path = Path(__file__).parent
    directories = [
        "api",
        "services",
        "models",
        "database",
        "risk_engine",
        "tasks",
        "utils",
    ]
    
    all_exist = True
    
    for directory in directories:
        dir_path = base_path / directory
        if dir_path.exists() and dir_path.is_dir():
            print(f"[OK] {directory:<30}")
        else:
            print(f"[MISSING] {directory:<30}")
            all_exist = False
    
    return all_exist


def main():
    """Run all verification checks."""
    
    results = []
    
    # Verify files
    file_result = verify_setup()
    results.append(("File Verification", file_result == 0))
    
    # Verify structure
    structure_result = verify_structure()
    results.append(("Structure Verification", structure_result))
    
    # Try imports (optional, may fail if dependencies not installed)
    try:
        import_result = verify_imports()
        results.append(("Import Verification", import_result))
    except Exception as e:
        print(f"\n[SKIP] Import verification skipped (dependencies may not be installed)")
    
    # Print summary
    print("\n" + "=" * 70)
    print("FINAL VERIFICATION SUMMARY")
    print("=" * 70)
    
    for check_name, passed in results:
        status = "PASS" if passed else "FAIL"
        print(f"{check_name:<40} {status}")
    
    print("=" * 70)
    
    if all(result[1] for result in results):
        print("\nSETUP VERIFICATION SUCCESSFUL!")
        print("\nYour backend is ready to go!")
        return 0
    else:
        print("\nSETUP VERIFICATION FAILED")
        print("Please resolve the issues above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
