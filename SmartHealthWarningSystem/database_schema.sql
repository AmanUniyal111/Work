-- Create database
CREATE DATABASE IF NOT EXISTS health_warning_system;
USE health_warning_system;

-- Cities table
CREATE TABLE cities (
    city_id INT PRIMARY KEY AUTO_INCREMENT,
    city_name VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    region VARCHAR(50) NOT NULL,
    population BIGINT NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hospitals table
CREATE TABLE hospitals (
    hospital_id INT PRIMARY KEY AUTO_INCREMENT,
    hospital_name VARCHAR(200) NOT NULL,
    city_id INT NOT NULL,
    hospital_type VARCHAR(100) NOT NULL,
    bed_capacity INT NOT NULL,
    contact_number VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (city_id) REFERENCES cities(city_id)
);

-- Diseases table
CREATE TABLE diseases (
    disease_id INT PRIMARY KEY AUTO_INCREMENT,
    disease_name VARCHAR(100) NOT NULL,
    disease_type VARCHAR(50) NOT NULL,
    severity_level ENUM('Low', 'Medium', 'High') NOT NULL,
    is_communicable BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Symptoms table
CREATE TABLE symptoms (
    symptom_id INT PRIMARY KEY AUTO_INCREMENT,
    symptom_name VARCHAR(100) NOT NULL,
    symptom_category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Disease-Symptoms mapping table (many-to-many relationship)
CREATE TABLE disease_symptoms (
    mapping_id INT PRIMARY KEY AUTO_INCREMENT,
    disease_id INT NOT NULL,
    symptom_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (disease_id) REFERENCES diseases(disease_id),
    FOREIGN KEY (symptom_id) REFERENCES symptoms(symptom_id),
    UNIQUE KEY unique_disease_symptom (disease_id, symptom_id)
);

-- Patient Reports table
CREATE TABLE patient_reports (
    report_id INT PRIMARY KEY AUTO_INCREMENT,
    patient_name VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    contact_number VARCHAR(15),
    city_id INT NOT NULL,
    hospital_id INT NOT NULL,
    disease_id INT NOT NULL,
    report_date DATE NOT NULL,
    outcome ENUM('Recovered', 'Under Treatment', 'Discharged', 'Referred', 'Deceased') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (city_id) REFERENCES cities(city_id),
    FOREIGN KEY (hospital_id) REFERENCES hospitals(hospital_id),
    FOREIGN KEY (disease_id) REFERENCES diseases(disease_id)
);

-- Environmental Data table
CREATE TABLE environmental_data (
    env_id INT PRIMARY KEY AUTO_INCREMENT,
    city_id INT NOT NULL,
    monitoring_date DATE NOT NULL,
    air_quality_index INT NOT NULL,
    water_quality_index INT NOT NULL,
    temperature DECIMAL(4,1) NOT NULL,
    humidity INT NOT NULL,
    pm2_5 DECIMAL(5,1) NOT NULL,
    pm10 DECIMAL(5,1) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (city_id) REFERENCES cities(city_id)
);

-- Alerts table
CREATE TABLE alerts (
    alert_id INT PRIMARY KEY AUTO_INCREMENT,
    city_id INT NOT NULL,
    alert_type VARCHAR(100) NOT NULL,
    severity_level ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL,
    alert_message TEXT NOT NULL,
    alert_date DATE NOT NULL,
    status ENUM('Active', 'Resolved', 'Under Investigation') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (city_id) REFERENCES cities(city_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_patient_reports_date ON patient_reports(report_date);
CREATE INDEX idx_patient_reports_city ON patient_reports(city_id);
CREATE INDEX idx_patient_reports_disease ON patient_reports(disease_id);
CREATE INDEX idx_environmental_data_date ON environmental_data(monitoring_date);
CREATE INDEX idx_environmental_data_city ON environmental_data(city_id);
CREATE INDEX idx_alerts_date ON alerts(alert_date);
CREATE INDEX idx_alerts_city ON alerts(city_id);
CREATE INDEX idx_alerts_status ON alerts(status);

-- Views for common queries
-- Disease outbreak summary by city
CREATE VIEW disease_outbreak_summary AS
SELECT 
    c.city_name,
    c.state,
    d.disease_name,
    COUNT(pr.report_id) as case_count,
    pr.report_date
FROM patient_reports pr
JOIN cities c ON pr.city_id = c.city_id
JOIN diseases d ON pr.disease_id = d.disease_id
WHERE pr.report_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
GROUP BY c.city_id, d.disease_id, pr.report_date
HAVING case_count > 5
ORDER BY case_count DESC;

-- Environmental risk assessment
CREATE VIEW environmental_risk_assessment AS
SELECT 
    c.city_name,
    c.state,
    AVG(ed.air_quality_index) as avg_aqi,
    AVG(ed.water_quality_index) as avg_wqi,
    AVG(ed.pm2_5) as avg_pm25,
    COUNT(CASE WHEN ed.air_quality_index > 200 THEN 1 END) as high_pollution_days
FROM environmental_data ed
JOIN cities c ON ed.city_id = c.city_id
WHERE ed.monitoring_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
GROUP BY c.city_id
ORDER BY avg_aqi DESC;

-- Hospital capacity utilization
CREATE VIEW hospital_capacity_view AS
SELECT 
    h.hospital_name,
    c.city_name,
    h.bed_capacity,
    COUNT(pr.report_id) as current_patients,
    ROUND((COUNT(pr.report_id) / h.bed_capacity) * 100, 2) as occupancy_percentage
FROM hospitals h
JOIN cities c ON h.city_id = c.city_id
LEFT JOIN patient_reports pr ON h.hospital_id = pr.hospital_id 
    AND pr.outcome IN ('Under Treatment')
GROUP BY h.hospital_id
ORDER BY occupancy_percentage DESC;
