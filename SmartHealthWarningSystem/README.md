# 🏥 Smart Public Health Warning System - Phase 3 Complete

AI-powered disease outbreak prediction and health monitoring system for Indian cities.

## 📋 Project Overview

The Smart Public Health Warning System is a comprehensive DBMS + Machine Learning project that monitors public health data across Indian cities and predicts potential disease outbreaks using historical patterns, seasonal trends, and environmental factors.

### Key Features

✅ **Phase 1 & 2 (DBMS)**
- Comprehensive relational database with 8 tables
- Real-time health data dashboard
- Environmental monitoring integration
- Interactive SQL query interface
- Hospital capacity tracking
- Health alert management

✅ **Phase 3 (Machine Learning)**
- AI-powered outbreak prediction
- Seasonal pattern recognition
- Environmental correlation analysis
- City-wide risk assessment
- Disease-specific forecasting
- Realistic probability calculations

---

## 🗂️ Project Structure

```
SmartHealthWarningSystem/
├── app_phase3.py                 # Main Flask application with ML
├── ml_predictor.py               # ML prediction module
├── templates/                    # HTML templates
│   ├── dashboard.html            # Main dashboard
│   ├── predictions.html          # ML predictions interface
│   └── query.html               # SQL query interface
├── Data Files (CSV):
│   ├── cities.csv               # 20 Indian cities
│   ├── hospitals.csv            # 150 hospitals
│   ├── diseases.csv             # 15 diseases
│   ├── symptoms.csv             # 51 symptoms
│   ├── disease_symptoms.csv     # Disease-symptom mappings
│   ├── patient_reports.csv      # 2,500 patient cases
│   ├── environmental_data.csv   # 1,500 environmental readings
│   └── alerts.csv              # 400 health alerts
└── health_warning_system.db    # SQLite database (auto-generated)
```

---

## 🚀 Quick Start Guide

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- VS Code (recommended)

### Installation Steps

```bash
# 1. Navigate to project folder
cd SmartHealthWarningSystem

# 2. Create virtual environment
python -m venv health_env

# 3. Activate virtual environment
# Windows:
health_env\Scripts\activate
# Mac/Linux:
source health_env/bin/activate

# 4. Install required packages
pip install flask pandas numpy

# 5. Run the application
python app_phase3.py

# 6. Open browser
# Dashboard: http://localhost:5000
# ML Predictions: http://localhost:5000/predictions
# SQL Queries: http://localhost:5000/query
```

---

## 📊 Database Schema

### Tables

1. **cities** - Master list of Indian cities
2. **hospitals** - Healthcare facilities  
3. **diseases** - Disease catalog
4. **symptoms** - Medical symptoms
5. **disease_symptoms** - Disease-symptom mappings (junction table)
6. **patient_reports** - Patient case records (main fact table)
7. **environmental_data** - Air quality, water quality, temperature, etc.
8. **alerts** - Health warnings and notifications

### Relationships

- Cities ← (One-to-Many) → Hospitals, Patient Reports, Environmental Data, Alerts
- Diseases ← (Many-to-Many) → Symptoms (via disease_symptoms)
- Diseases ← (One-to-Many) → Patient Reports
- Hospitals ← (One-to-Many) → Patient Reports

---

## 🧠 Machine Learning Model

### How It Works

Our ML model predicts outbreak probability using:

1. **Historical Pattern Analysis**
   - Last 6 months of case data
   - Average case counts
   - Recent trends

2. **Seasonal Factors**
   - Monsoon diseases (Jun-Sep): Dengue, Malaria, Typhoid
   - Winter diseases (Nov-Feb): H1N1, Pneumonia, TB
   - Summer diseases (Mar-May): Chickenpox, Measles

3. **Environmental Correlation**
   - Air Quality Index (AQI) → Respiratory diseases
   - Water Quality Index (WQI) → Waterborne diseases
   - Temperature → Vector-borne diseases

4. **Risk Classification**
   - **Low Risk**: Probability 0-40%
   - **Medium Risk**: Probability 40-60%
   - **High Risk**: Probability 60-80%
   - **Critical Risk**: Probability 80-100%

### Realistic Predictions

The model is designed to provide realistic predictions:
- Not every disease triggers an outbreak warning
- Accounts for off-season patterns (reduced risk)
- Considers environmental factors
- Includes random variation (±20%)
- Based on actual historical data patterns

---

## 🎯 Features Breakdown

### 1. Real-time Dashboard (`/`)

- **Disease Outbreak Summary**: Current outbreak patterns
- **Environmental Risk**: Cities with poor air/water quality
- **Hospital Capacity**: Bed utilization rates
- **Active Alerts**: Current health warnings

### 2. ML Predictions (`/predictions`)

- **City Risk Overview**: Overall risk level for all cities
- **Detailed Predictions**: Top disease risks per city
- **Probability Scores**: Likelihood of outbreak
- **Predicted Case Counts**: Expected number of cases
- **Reasoning**: Why the prediction was made

### 3. SQL Query Interface (`/query`)

- Execute custom SELECT queries
- Sample queries included
- Export results as CSV
- Learn database structure

---

## 📈 Sample Predictions Output

```
City: Mumbai
Top Disease: Dengue
Risk Level: High
Probability: 72%
Predicted Cases: 45
Reasoning: Peak season for this disease; Environmental conditions favor disease spread
```

---

## 🛠️ Troubleshooting

### Issue: No data on dashboard
**Solution:**
```bash
del health_warning_system.db
python app_phase3.py
```

### Issue: Module not found
**Solution:**
```bash
health_env\Scripts\activate
pip install flask pandas numpy
```

### Issue: Port already in use
**Solution:**
Change port in app_phase3.py:
```python
app.run(debug=True, host='0.0.0.0', port=5001)
```

---

## 🎓 Educational Value

### DBMS Concepts Demonstrated

- Database normalization (1NF, 2NF, 3NF)
- Foreign key constraints
- Complex SQL queries (JOINs, aggregates, subqueries)
- Indexing for performance
- Views for data abstraction
- Transaction management

### ML Concepts Demonstrated

- Time series analysis
- Feature engineering
- Seasonal pattern recognition
- Environmental correlation
- Risk classification
- Predictive modeling

---

## 📝 Key Files Explained

### `app_phase3.py`
Main Flask application that:
- Initializes database
- Imports CSV data
- Serves web interface
- Provides API endpoints
- Integrates ML predictions

### `ml_predictor.py`
Machine learning module that:
- Analyzes historical patterns
- Calculates seasonal factors
- Correlates environmental data
- Predicts outbreak risk
- Provides reasoning for predictions

### `templates/predictions.html`
ML predictions interface that:
- Displays city risk overview
- Shows detailed disease predictions
- Visualizes probability scores
- Explains prediction reasoning

---

## 🌟 Future Enhancements (Optional)

1. Real-time data integration via APIs
2. Geographic visualization with maps
3. Mobile app for field workers
4. Email/SMS alert notifications
5. Advanced ML models (LSTM, Random Forest)
6. User authentication and role management
7. Data export and reporting features

---

## 👥 Team Information

**Project:** Smart Public Health Warning System
**Phase:** Phase 3 (Complete with ML)
**Team:** Health Sentinel
**Course:** DBMS Project

---

## 📜 License

This project is created for educational purposes as part of DBMS coursework.

---

## 🙏 Acknowledgments

- Historical disease data patterns based on actual Indian epidemiological studies
- Environmental data thresholds from WHO and CPCB guidelines
- Machine learning approach inspired by public health forecasting systems

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Verify all CSV files are present
3. Ensure virtual environment is activated
4. Check console output for error messages

---

**Project Status:** ✅ Complete and Production Ready

**Last Updated:** November 19, 2025
