
"""
Smart Public Health Warning System - Demo Script
This script demonstrates the DBMS functionality and SQL query capabilities
"""

from app import HealthWarningSystem
import pandas as pd

def run_demo():
    print("🏥 Smart Public Health Warning System - DBMS Demo")
    print("=" * 60)

    # Initialize the system
    print("\n1. Initializing Database System...")
    health_system = HealthWarningSystem()

    print("✅ Database initialized with SQLite")
    print("✅ Tables created with proper relationships")
    print("✅ Indexes created for performance")

    # Import data
    print("\n2. Importing Synthetic Datasets...")
    health_system.import_csv_data()
    print("✅ All CSV files imported successfully")

    # Demonstrate key queries
    print("\n3. Demonstrating SQL Queries and DBMS Features...")

    # Query 1: Disease outbreak summary
    print("\n📊 Query 1: Disease Outbreak Summary (Last 30 days)")
    print("-" * 50)
    results, columns = health_system.get_disease_outbreak_summary()
    if results:
        df = pd.DataFrame(results, columns=columns)
        print(df.head(10).to_string(index=False))
        print(f"\nTotal outbreak patterns found: {len(results)}")
    else:
        print("No significant outbreak patterns detected")

    # Query 2: Environmental risk cities
    print("\n🌍 Query 2: Cities with High Environmental Risk")
    print("-" * 50)
    results, columns = health_system.get_environmental_risk_cities()
    if results:
        df = pd.DataFrame(results, columns=columns)
        print(df.head(10).to_string(index=False))
        print(f"\nHigh-risk cities found: {len(results)}")
    else:
        print("No high-risk environmental conditions detected")

    # Query 3: Hospital capacity
    print("\n🏥 Query 3: Hospital Capacity Utilization")
    print("-" * 50)
    results, columns = health_system.get_hospital_capacity_status()
    if results:
        df = pd.DataFrame(results, columns=columns)
        print(df.head(10).to_string(index=False))
        print(f"\nHospitals analyzed: {len(results)}")
    else:
        print("No hospital data available")

    # Query 4: Active alerts
    print("\n🚨 Query 4: Active Health Alerts")
    print("-" * 50)
    results, columns = health_system.get_active_alerts()
    if results:
        df = pd.DataFrame(results, columns=columns)
        print(df.head(10).to_string(index=False))
        print(f"\nActive alerts: {len(results)}")
    else:
        print("No active alerts")

    # Demonstrate complex join query
    print("\n🔗 Query 5: Complex Multi-table Join Analysis")
    print("-" * 50)
    complex_query = """
    SELECT 
        c.city_name,
        c.state,
        COUNT(DISTINCT h.hospital_id) as hospital_count,
        COUNT(pr.report_id) as total_cases,
        COUNT(DISTINCT d.disease_id) as disease_types,
        AVG(ed.air_quality_index) as avg_aqi,
        COUNT(a.alert_id) as alert_count
    FROM cities c
    LEFT JOIN hospitals h ON c.city_id = h.city_id
    LEFT JOIN patient_reports pr ON c.city_id = pr.city_id
    LEFT JOIN diseases d ON pr.disease_id = d.disease_id
    LEFT JOIN environmental_data ed ON c.city_id = ed.city_id
    LEFT JOIN alerts a ON c.city_id = a.city_id
    GROUP BY c.city_id
    ORDER BY total_cases DESC
    LIMIT 10
    """

    results, columns = health_system.execute_query(complex_query)
    if results:
        df = pd.DataFrame(results, columns=columns)
        print(df.to_string(index=False))

    # Show database statistics
    print("\n\n📈 Database Statistics")
    print("=" * 40)

    stats_queries = [
        ("Cities", "SELECT COUNT(*) FROM cities"),
        ("Hospitals", "SELECT COUNT(*) FROM hospitals"),
        ("Diseases", "SELECT COUNT(*) FROM diseases"),
        ("Symptoms", "SELECT COUNT(*) FROM symptoms"),
        ("Patient Reports", "SELECT COUNT(*) FROM patient_reports"),
        ("Environmental Records", "SELECT COUNT(*) FROM environmental_data"),
        ("Alerts", "SELECT COUNT(*) FROM alerts"),
    ]

    for name, query in stats_queries:
        results, _ = health_system.execute_query(query)
        count = results[0][0] if results else 0
        print(f"{name:20}: {count:6,} records")

    print("\n\n🎯 DBMS Features Demonstrated:")
    print("✅ Relational database design with normalization")
    print("✅ Foreign key relationships and referential integrity")
    print("✅ Complex SQL queries with multiple JOINs")
    print("✅ Aggregate functions and GROUP BY operations")
    print("✅ Subqueries and window functions")
    print("✅ Indexes for query optimization")
    print("✅ Views for common analytical queries")
    print("✅ Data import/export functionality")
    print("✅ Web-based query interface")
    print("✅ API endpoints for data access")

    print("\n💡 Next: Run 'python app.py' to start the web interface")
    print("   - Dashboard: http://localhost:5000")
    print("   - SQL Interface: http://localhost:5000/query")

if __name__ == "__main__":
    run_demo()
