
-- Smart Public Health Warning System - Sample SQL Queries
-- These queries demonstrate how to use the database for analysis and reporting

-- ==============================================
-- 1. DISEASE OUTBREAK ANALYSIS
-- ==============================================

-- Find cities with highest disease outbreak cases in last 30 days
SELECT 
    c.city_name,
    c.state,
    COUNT(pr.report_id) as total_cases,
    d.disease_name,
    COUNT(DISTINCT pr.disease_id) as different_diseases
FROM patient_reports pr
JOIN cities c ON pr.city_id = c.city_id
JOIN diseases d ON pr.disease_id = d.disease_id
WHERE pr.report_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
GROUP BY c.city_id
ORDER BY total_cases DESC
LIMIT 10;

-- Identify potential disease outbreaks (>10 cases of same disease in a city within 7 days)
SELECT 
    c.city_name,
    d.disease_name,
    COUNT(pr.report_id) as case_count,
    MIN(pr.report_date) as first_case,
    MAX(pr.report_date) as latest_case
FROM patient_reports pr
JOIN cities c ON pr.city_id = c.city_id
JOIN diseases d ON pr.disease_id = d.disease_id
WHERE pr.report_date >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY)
GROUP BY c.city_id, d.disease_id
HAVING case_count > 10
ORDER BY case_count DESC;

-- Get disease patterns by age group
SELECT 
    CASE 
        WHEN age BETWEEN 0 AND 12 THEN 'Children (0-12)'
        WHEN age BETWEEN 13 AND 17 THEN 'Teenagers (13-17)'
        WHEN age BETWEEN 18 AND 35 THEN 'Young Adults (18-35)'
        WHEN age BETWEEN 36 AND 60 THEN 'Middle Age (36-60)'
        ELSE 'Senior (60+)'
    END as age_group,
    d.disease_name,
    COUNT(pr.report_id) as case_count
FROM patient_reports pr
JOIN diseases d ON pr.disease_id = d.disease_id
WHERE pr.report_date >= DATE_SUB(CURRENT_DATE, INTERVAL 90 DAY)
GROUP BY age_group, d.disease_id
ORDER BY age_group, case_count DESC;

-- ==============================================
-- 2. ENVIRONMENTAL CORRELATION ANALYSIS  
-- ==============================================

-- Correlate air quality with respiratory disease cases
SELECT 
    c.city_name,
    AVG(ed.air_quality_index) as avg_aqi,
    COUNT(CASE WHEN d.disease_name IN ('Pneumonia', 'Tuberculosis', 'H1N1 Influenza') THEN 1 END) as respiratory_cases,
    COUNT(pr.report_id) as total_cases
FROM environmental_data ed
JOIN cities c ON ed.city_id = c.city_id
LEFT JOIN patient_reports pr ON ed.city_id = pr.city_id 
    AND ed.monitoring_date = pr.report_date
LEFT JOIN diseases d ON pr.disease_id = d.disease_id
WHERE ed.monitoring_date >= DATE_SUB(CURRENT_DATE, INTERVAL 60 DAY)
GROUP BY c.city_id
HAVING avg_aqi > 150
ORDER BY respiratory_cases DESC;

-- Find cities with poor water quality and waterborne disease correlation
SELECT 
    c.city_name,
    AVG(ed.water_quality_index) as avg_water_quality,
    COUNT(CASE WHEN d.disease_name IN ('Cholera', 'Typhoid', 'Hepatitis A', 'Diarrheal Disease') THEN 1 END) as waterborne_cases
FROM environmental_data ed
JOIN cities c ON ed.city_id = c.city_id
LEFT JOIN patient_reports pr ON ed.city_id = pr.city_id 
    AND ABS(DATEDIFF(ed.monitoring_date, pr.report_date)) <= 7
LEFT JOIN diseases d ON pr.disease_id = d.disease_id
WHERE ed.monitoring_date >= DATE_SUB(CURRENT_DATE, INTERVAL 90 DAY)
GROUP BY c.city_id
HAVING avg_water_quality < 70
ORDER BY waterborne_cases DESC;

-- ==============================================
-- 3. HOSPITAL RESOURCE MANAGEMENT
-- ==============================================

-- Hospital capacity and patient load analysis
SELECT 
    h.hospital_name,
    c.city_name,
    h.bed_capacity,
    COUNT(CASE WHEN pr.outcome = 'Under Treatment' THEN 1 END) as current_patients,
    COUNT(pr.report_id) as total_cases_last_month,
    ROUND((COUNT(CASE WHEN pr.outcome = 'Under Treatment' THEN 1 END) / h.bed_capacity) * 100, 2) as occupancy_rate
FROM hospitals h
JOIN cities c ON h.city_id = c.city_id
LEFT JOIN patient_reports pr ON h.hospital_id = pr.hospital_id 
    AND pr.report_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
GROUP BY h.hospital_id
ORDER BY occupancy_rate DESC;

-- Find hospitals handling specific disease cases
SELECT 
    h.hospital_name,
    c.city_name,
    d.disease_name,
    COUNT(pr.report_id) as cases_handled,
    COUNT(CASE WHEN pr.outcome = 'Recovered' THEN 1 END) as recovered_cases,
    ROUND((COUNT(CASE WHEN pr.outcome = 'Recovered' THEN 1 END) / COUNT(pr.report_id)) * 100, 2) as recovery_rate
FROM hospitals h
JOIN cities c ON h.city_id = c.city_id
JOIN patient_reports pr ON h.hospital_id = pr.hospital_id
JOIN diseases d ON pr.disease_id = d.disease_id
WHERE pr.report_date >= DATE_SUB(CURRENT_DATE, INTERVAL 90 DAY)
    AND d.disease_name IN ('COVID-19', 'Dengue', 'Malaria')
GROUP BY h.hospital_id, d.disease_id
HAVING cases_handled > 5
ORDER BY d.disease_name, recovery_rate DESC;

-- ==============================================
-- 4. ALERT SYSTEM QUERIES
-- ==============================================

-- Active critical alerts by city
SELECT 
    c.city_name,
    c.state,
    a.alert_type,
    a.alert_message,
    a.alert_date,
    DATEDIFF(CURRENT_DATE, a.alert_date) as days_active
FROM alerts a
JOIN cities c ON a.city_id = c.city_id
WHERE a.status = 'Active' 
    AND a.severity_level IN ('High', 'Critical')
ORDER BY a.severity_level DESC, days_active DESC;

-- Alert response time analysis
SELECT 
    c.city_name,
    a.alert_type,
    AVG(CASE WHEN a.status = 'Resolved' 
        THEN DATEDIFF(a.created_at, a.alert_date) 
        END) as avg_resolution_days,
    COUNT(CASE WHEN a.status = 'Resolved' THEN 1 END) as resolved_alerts,
    COUNT(a.alert_id) as total_alerts
FROM alerts a
JOIN cities c ON a.city_id = c.city_id
WHERE a.alert_date >= DATE_SUB(CURRENT_DATE, INTERVAL 180 DAY)
GROUP BY c.city_id, a.alert_type
ORDER BY avg_resolution_days DESC;

-- ==============================================
-- 5. PREDICTIVE ANALYSIS QUERIES (Phase 2)
-- ==============================================

-- Seasonal disease pattern analysis
SELECT 
    d.disease_name,
    MONTH(pr.report_date) as month,
    MONTHNAME(pr.report_date) as month_name,
    COUNT(pr.report_id) as case_count,
    AVG(COUNT(pr.report_id)) OVER (PARTITION BY d.disease_id) as avg_monthly_cases
FROM patient_reports pr
JOIN diseases d ON pr.disease_id = d.disease_id
WHERE pr.report_date >= DATE_SUB(CURRENT_DATE, INTERVAL 365 DAY)
GROUP BY d.disease_id, MONTH(pr.report_date)
ORDER BY d.disease_name, month;

-- Risk factor identification for disease outbreaks
SELECT 
    c.city_name,
    c.population,
    COUNT(h.hospital_id) as hospital_count,
    ROUND(c.population / COUNT(h.hospital_id), 0) as people_per_hospital,
    COUNT(pr.report_id) as total_cases,
    AVG(ed.air_quality_index) as avg_aqi,
    AVG(ed.water_quality_index) as avg_water_quality
FROM cities c
LEFT JOIN hospitals h ON c.city_id = h.city_id
LEFT JOIN patient_reports pr ON c.city_id = pr.city_id 
    AND pr.report_date >= DATE_SUB(CURRENT_DATE, INTERVAL 90 DAY)
LEFT JOIN environmental_data ed ON c.city_id = ed.city_id 
    AND ed.monitoring_date >= DATE_SUB(CURRENT_DATE, INTERVAL 90 DAY)
GROUP BY c.city_id
HAVING people_per_hospital > 50000 OR avg_aqi > 200 OR avg_water_quality < 60
ORDER BY total_cases DESC;

-- ==============================================
-- 6. DATA EXPORT QUERIES FOR ANALYSIS
-- ==============================================

-- Export data for ML model training (outbreak prediction)
SELECT 
    c.city_name,
    c.population,
    DATE(pr.report_date) as report_date,
    d.disease_name,
    COUNT(pr.report_id) as daily_cases,
    AVG(ed.air_quality_index) as aqi,
    AVG(ed.water_quality_index) as water_quality,
    AVG(ed.temperature) as temperature,
    AVG(ed.humidity) as humidity,
    COUNT(h.hospital_id) as hospital_count
FROM patient_reports pr
JOIN cities c ON pr.city_id = c.city_id
JOIN diseases d ON pr.disease_id = d.disease_id
LEFT JOIN environmental_data ed ON c.city_id = ed.city_id 
    AND ed.monitoring_date = pr.report_date
LEFT JOIN hospitals h ON c.city_id = h.city_id
WHERE pr.report_date >= DATE_SUB(CURRENT_DATE, INTERVAL 365 DAY)
GROUP BY c.city_id, d.disease_id, DATE(pr.report_date)
ORDER BY report_date DESC;
