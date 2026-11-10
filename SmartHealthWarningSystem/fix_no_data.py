
"""
Smart Health Warning System - Data Import Diagnostic & Fix Script
Run this to diagnose and fix "No data available" issues
"""

import sqlite3
import pandas as pd
import os
from datetime import datetime

def diagnose_and_fix():
    print("="*70)
    print("SMART HEALTH WARNING SYSTEM - DATA DIAGNOSTIC & FIX")
    print("="*70)
    print()

    # Step 1: Check if CSV files exist
    print("STEP 1: Checking CSV Files...")
    print("-"*70)

    csv_files = [
        'cities.csv',
        'hospitals.csv',
        'diseases.csv',
        'symptoms.csv',
        'disease_symptoms.csv',
        'patient_reports.csv',
        'environmental_data.csv',
        'alerts.csv'
    ]

    missing_files = []
    existing_files = []

    for csv_file in csv_files:
        if os.path.exists(csv_file):
            try:
                df = pd.read_csv(csv_file)
                print(f"✅ {csv_file:30} - {len(df):5} rows")
                existing_files.append(csv_file)
            except Exception as e:
                print(f"❌ {csv_file:30} - ERROR: {str(e)}")
                missing_files.append(csv_file)
        else:
            print(f"❌ {csv_file:30} - FILE NOT FOUND")
            missing_files.append(csv_file)

    if missing_files:
        print(f"\n⚠️  WARNING: {len(missing_files)} CSV files are missing or have errors!")
        print("   Make sure all CSV files are in the same folder as app.py")
        return False

    print(f"\n✅ All {len(csv_files)} CSV files found and readable!")

    # Step 2: Check database
    print("\n" + "="*70)
    print("STEP 2: Checking Database...")
    print("-"*70)

    db_exists = os.path.exists("health_warning_system.db")

    if db_exists:
        print("✅ Database file exists: health_warning_system.db")

        # Check if database has data
        conn = sqlite3.connect("health_warning_system.db")
        cursor = conn.cursor()

        print("\nChecking tables and data...")
        tables = ['cities', 'hospitals', 'diseases', 'symptoms', 
                 'disease_symptoms', 'patient_reports', 'environmental_data', 'alerts']

        all_empty = True
        for table in tables:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                status = "✅" if count > 0 else "❌"
                print(f"{status} {table:20} - {count:5} records")
                if count > 0:
                    all_empty = False
            except Exception as e:
                print(f"❌ {table:20} - ERROR: {str(e)}")

        conn.close()

        if all_empty:
            print("\n⚠️  Database exists but is EMPTY!")
            print("   Deleting database to force fresh import...")
            os.remove("health_warning_system.db")
            print("✅ Database deleted. Will reimport on next run.")
        else:
            print("\n✅ Database has data!")
            return True
    else:
        print("❌ Database does not exist yet")
        print("   Database will be created on first run")

    # Step 3: Import data
    print("\n" + "="*70)
    print("STEP 3: Importing CSV Data into Database...")
    print("-"*70)

    try:
        # Initialize database
        conn = sqlite3.connect("health_warning_system.db")

        # Import each CSV file
        for csv_file in existing_files:
            table_name = csv_file.replace('.csv', '')
            print(f"Importing {csv_file} -> {table_name}...", end=' ')

            df = pd.read_csv(csv_file)
            df.to_sql(table_name, conn, if_exists='replace', index=False)

            # Verify import
            cursor = conn.cursor()
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]

            print(f"✅ {count} records imported")

        conn.close()

        print("\n✅ All data imported successfully!")

        # Step 4: Verify data
        print("\n" + "="*70)
        print("STEP 4: Final Verification...")
        print("-"*70)

        conn = sqlite3.connect("health_warning_system.db")
        cursor = conn.cursor()

        # Check patient reports date range
        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                MIN(report_date) as earliest,
                MAX(report_date) as latest
            FROM patient_reports
        """)
        result = cursor.fetchone()
        print(f"Patient Reports: {result[0]} records")
        print(f"Date Range: {result[1]} to {result[2]}")

        # Check recent data (last 30 days)
        cursor.execute("""
            SELECT COUNT(*) 
            FROM patient_reports 
            WHERE report_date >= date('now', '-30 days')
        """)
        recent_count = cursor.fetchone()[0]
        print(f"Last 30 days: {recent_count} records")

        if recent_count == 0:
            print("\n⚠️  WARNING: No data in last 30 days!")
            print("   This might cause empty dashboard sections.")
            print("   Consider using updated CSV files with recent dates.")

        conn.close()

        print("\n" + "="*70)
        print("✅ DIAGNOSTIC COMPLETE - DATA READY!")
        print("="*70)
        print("\nNext steps:")
        print("1. Run: python app.py")
        print("2. Open: http://localhost:5000")
        print("3. Dashboard should now show data!")

        return True

    except Exception as e:
        print(f"\n❌ ERROR during import: {str(e)}")
        return False

if __name__ == "__main__":
    diagnose_and_fix()
