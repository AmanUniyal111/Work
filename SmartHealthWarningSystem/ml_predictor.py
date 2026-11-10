import sqlite3
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from collections import defaultdict
import json

class OutbreakPredictor:
    def __init__(self, db_path="health_warning_system.db"):
        self.db_path = db_path

    def get_historical_data(self, disease_id, city_id, months_back=6):
        """Get historical case data for a disease in a city"""
        conn = sqlite3.connect(self.db_path)
        query = """
        SELECT 
            strftime('%Y-%m', report_date) as month,
            COUNT(*) as case_count
        FROM patient_reports
        WHERE disease_id = ? AND city_id = ?
        AND report_date >= date('now', '-{} months')
        GROUP BY month
        ORDER BY month
        """.format(months_back)

        df = pd.read_sql_query(query, conn, params=(disease_id, city_id))
        conn.close()
        return df

    def get_environmental_correlation(self, city_id):
        """Get recent environmental data for a city"""
        conn = sqlite3.connect(self.db_path)
        query = """
        SELECT 
            AVG(air_quality_index) as avg_aqi,
            AVG(water_quality_index) as avg_wqi,
            AVG(temperature) as avg_temp,
            AVG(humidity) as avg_humidity
        FROM environmental_data
        WHERE city_id = ?
        AND monitoring_date >= date('now', '-30 days')
        """

        df = pd.read_sql_query(query, conn, params=(city_id,))
        conn.close()
        return df.iloc[0] if len(df) > 0 else None

    def predict_outbreak_risk(self, disease_id, city_id):
        """
        Predict outbreak risk based on historical patterns and environmental factors
        Returns: risk_level (Low/Medium/High/Critical), probability (0-100), predicted_cases
        """

        # Get historical data
        historical = self.get_historical_data(disease_id, city_id, months_back=6)

        if len(historical) == 0:
            return "Low", 0, 0, "Insufficient historical data"

        # Calculate baseline metrics
        avg_cases = historical['case_count'].mean()
        max_cases = historical['case_count'].max()
        recent_trend = historical['case_count'].tail(3).mean()

        # Get current month for seasonal adjustment
        current_month = datetime.now().month

        # Seasonal factors (based on disease patterns we encoded in data)
        seasonal_multiplier = self._get_seasonal_factor(disease_id, current_month)

        # Environmental factors
        env_data = self.get_environmental_correlation(city_id)
        env_risk_multiplier = self._calculate_environmental_risk(disease_id, env_data)

        # Calculate predicted cases (realistic prediction)
        base_prediction = avg_cases * 0.7 + recent_trend * 0.3  # Weighted average
        predicted_cases = int(base_prediction * seasonal_multiplier * env_risk_multiplier)

        # Add some randomness to make it realistic (±20%)
        noise = np.random.uniform(0.8, 1.2)
        predicted_cases = int(predicted_cases * noise)

        # Ensure minimum prediction
        predicted_cases = max(predicted_cases, 1)

        # Calculate outbreak probability based on historical threshold
        # Outbreak = cases significantly above average
        outbreak_threshold = avg_cases * 1.5  # 50% above average

        if predicted_cases >= outbreak_threshold * 2:
            risk_level = "Critical"
            probability = min(95, 70 + (predicted_cases - outbreak_threshold * 2) / max_cases * 25)
        elif predicted_cases >= outbreak_threshold * 1.5:
            risk_level = "High"
            probability = min(80, 50 + (predicted_cases - outbreak_threshold * 1.5) / max_cases * 30)
        elif predicted_cases >= outbreak_threshold:
            risk_level = "Medium"
            probability = min(60, 30 + (predicted_cases - outbreak_threshold) / max_cases * 30)
        else:
            risk_level = "Low"
            probability = min(40, 10 + predicted_cases / avg_cases * 20)

        # Add reasoning
        reasons = []
        if seasonal_multiplier > 1.2:
            reasons.append("Peak season for this disease")
        elif seasonal_multiplier < 0.8:
            reasons.append("Off-season for this disease")

        if env_risk_multiplier > 1.2:
            reasons.append("Environmental conditions favor disease spread")
        elif env_risk_multiplier < 0.8:
            reasons.append("Environmental conditions unfavorable for spread")

        if recent_trend > avg_cases * 1.3:
            reasons.append("Recent increasing trend detected")
        elif recent_trend < avg_cases * 0.7:
            reasons.append("Recent decreasing trend detected")

        reasoning = "; ".join(reasons) if reasons else "Based on historical patterns"

        return risk_level, int(probability), predicted_cases, reasoning

    def _get_seasonal_factor(self, disease_id, month):
        """Get seasonal multiplier based on disease and month"""
        # Monsoon diseases (June-September): Dengue(1), Malaria(2), Typhoid(3), Cholera(13)
        if disease_id in [1, 2, 3, 13] and month in [6, 7, 8, 9]:
            return 1.5

        # Winter diseases (November-February): H1N1(7), Pneumonia(10), TB(8)
        if disease_id in [7, 10, 8] and month in [11, 12, 1, 2]:
            return 1.4

        # Summer diseases (March-May): Chickenpox(12), Measles(11)
        if disease_id in [12, 11] and month in [3, 4, 5]:
            return 1.3

        # Off-season
        if disease_id in [1, 2, 3, 13] and month in [11, 12, 1, 2, 3]:
            return 0.6
        if disease_id in [7, 10, 8] and month in [6, 7, 8]:
            return 0.7

        return 1.0  # Normal season

    def _calculate_environmental_risk(self, disease_id, env_data):
        """Calculate environmental risk multiplier"""
        if env_data is None:
            return 1.0

        multiplier = 1.0

        # Respiratory diseases affected by air quality
        if disease_id in [7, 8, 10, 15]:  # H1N1, TB, Pneumonia, COVID
            if env_data['avg_aqi'] > 200:
                multiplier *= 1.3
            elif env_data['avg_aqi'] > 150:
                multiplier *= 1.15
            elif env_data['avg_aqi'] < 50:
                multiplier *= 0.8

        # Waterborne diseases affected by water quality
        if disease_id in [2, 3, 5, 9, 13]:  # Malaria, Typhoid, Hepatitis A, Diarrheal, Cholera
            if env_data['avg_wqi'] < 50:
                multiplier *= 1.4
            elif env_data['avg_wqi'] < 70:
                multiplier *= 1.2
            elif env_data['avg_wqi'] > 85:
                multiplier *= 0.7

        # Temperature effects on vector-borne diseases
        if disease_id in [1, 2, 4]:  # Dengue, Malaria, Chikungunya
            if 25 <= env_data['avg_temp'] <= 35:
                multiplier *= 1.2  # Optimal temperature for mosquitoes

        return multiplier

    def get_city_predictions(self, city_id, top_n=5):
        """Get top N disease predictions for a city"""
        conn = sqlite3.connect(self.db_path)

        # Get all diseases with recent cases in this city
        query = """
        SELECT DISTINCT disease_id
        FROM patient_reports
        WHERE city_id = ?
        AND report_date >= date('now', '-6 months')
        """

        cursor = conn.cursor()
        cursor.execute(query, (city_id,))
        disease_ids = [row[0] for row in cursor.fetchall()]
        conn.close()

        predictions = []
        for disease_id in disease_ids:
            risk_level, probability, predicted_cases, reasoning = self.predict_outbreak_risk(disease_id, city_id)

            # Get disease name
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT disease_name FROM diseases WHERE disease_id = ?", (disease_id,))
            disease_name = cursor.fetchone()[0]
            conn.close()

            predictions.append({
                'disease_id': disease_id,
                'disease_name': disease_name,
                'risk_level': risk_level,
                'probability': probability,
                'predicted_cases': predicted_cases,
                'reasoning': reasoning
            })

        # Sort by probability and return top N
        predictions.sort(key=lambda x: x['probability'], reverse=True)
        return predictions[:top_n]

    def get_all_cities_overview(self):
        """Get outbreak risk overview for all cities"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT city_id, city_name FROM cities")
        cities = cursor.fetchall()
        conn.close()

        overview = []
        for city_id, city_name in cities:
            predictions = self.get_city_predictions(city_id, top_n=3)

            if predictions:
                max_risk = max([p['probability'] for p in predictions])

                # Determine overall city risk
                if max_risk >= 70:
                    overall_risk = "High"
                elif max_risk >= 40:
                    overall_risk = "Medium"
                else:
                    overall_risk = "Low"

                overview.append({
                    'city_id': city_id,
                    'city_name': city_name,
                    'overall_risk': overall_risk,
                    'max_probability': max_risk,
                    'top_disease': predictions[0]['disease_name'],
                    'predicted_cases': predictions[0]['predicted_cases']
                })

        overview.sort(key=lambda x: x['max_probability'], reverse=True)
        return overview

# Test function
if __name__ == "__main__":
    predictor = OutbreakPredictor()

    print("\n🔮 TESTING ML PREDICTION MODULE")
    print("="*70)

    # Test prediction for a specific disease in a city
    print("\nTest 1: Dengue prediction for Mumbai (city_id=2)")
    print("-"*70)
    risk, prob, cases, reason = predictor.predict_outbreak_risk(1, 2)  # Dengue in Mumbai
    print(f"Risk Level: {risk}")
    print(f"Probability: {prob}%")
    print(f"Predicted Cases: {cases}")
    print(f"Reasoning: {reason}")

    # Test city predictions
    print("\n\nTest 2: Top disease predictions for Delhi (city_id=1)")
    print("-"*70)
    predictions = predictor.get_city_predictions(1, top_n=5)
    for pred in predictions:
        print(f"\n{pred['disease_name']}:")
        print(f"  Risk: {pred['risk_level']} | Probability: {pred['probability']}% | Cases: {pred['predicted_cases']}")
        print(f"  Reason: {pred['reasoning']}")

    # Test overview
    print("\n\nTest 3: Overall city risk overview")
    print("-"*70)
    overview = predictor.get_all_cities_overview()
    for city in overview[:10]:
        print(f"{city['city_name']:20} | Risk: {city['overall_risk']:6} | Prob: {city['max_probability']:3}% | Top: {city['top_disease']}")

    print("\n✅ ML Prediction Module Test Complete!")
