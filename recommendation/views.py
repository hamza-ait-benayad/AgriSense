import os
from datetime import timedelta
import pandas as pd
import requests
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView
from sensors.models import SensorData
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MOISTURE_THRESHOLD = 40.0

# Fetch settings from .env (No API Key needed anymore!)
FARM_LAT = os.getenv("FARM_LAT", "30.4278")
FARM_LON = os.getenv("FARM_LON", "-9.5981")
USE_MOCK_WEATHER = os.getenv("USE_MOCK_WEATHER", "false").lower() == "true"
MOCK_RAIN = os.getenv("MOCK_RAIN", "false").lower() == "true"

def will_it_rain_soon():
    """
    Checks Open-Meteo (Free, No API Key) for rain in the next 12 hours.
    """
    if USE_MOCK_WEATHER:
        return {
            "rain_expected": MOCK_RAIN,
            "weather_mode": "mock",
            "reason": "Mock weather mode is currently enabled in .env"
        }

    try:
        # Open-Meteo endpoint checking the next 12 hours only
        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": FARM_LAT,
            "longitude": FARM_LON,
            "hourly": "precipitation_probability,precipitation",
            "forecast_hours": 12,
            "timezone": "auto"
        }

        response = requests.get(url, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()

        # Extract the hourly data arrays
        hourly = data.get("hourly", {})
        probabilities = hourly.get("precipitation_probability", [])
        precipitations = hourly.get("precipitation", [])

        # Logic: If any hour has > 50% chance of rain OR more than 0.5mm of rain expected
        rain_detected = any(p >= 50 for p in probabilities) or any(pr > 0.5 for pr in precipitations)

        return {
            "rain_expected": rain_detected,
            "weather_mode": "live (Open-Meteo)",
            "reason": "Checked Open-Meteo forecast for the next 12 hours.",
        }

    except Exception as e:
        return {
            "rain_expected": False,
            "weather_mode": "fallback",
            "reason": f"Weather API failed: {str(e)}"
        }


class RecommendationView(APIView):
    def get(self, request):
        latest = SensorData.objects.first()

        if latest is None:
            return Response({
                "action": "No Data",
                "message": "No sensor readings available yet.",
                "moisture": None,
                "temperature": None,
                "threshold": MOISTURE_THRESHOLD,
                "level": "info",
                "weather": {
                    "rain_expected": False,
                    "weather_mode": "none",
                    "reason": "No sensor data yet."
                }
            })

        # Check the weather
        weather_info = will_it_rain_soon()
        rain_expected = weather_info["rain_expected"]

        # AI Decision Logic
        if latest.moisture < MOISTURE_THRESHOLD and rain_expected:
            action = "Wait"
            level = "info"
            message = (
                f"Soil moisture is low ({latest.moisture:.1f}%), but rain is expected soon. "
                "Irrigation is postponed to save water."
            )
        elif latest.moisture < MOISTURE_THRESHOLD and not rain_expected:
            action = "Irrigate"
            level = "warning"
            message = (
                f"Soil moisture ({latest.moisture:.1f}%) is below the threshold "
                f"({MOISTURE_THRESHOLD}%), and no rain is expected soon. "
                "Irrigation recommended."
            )
        else:
            action = "No Need"
            level = "ok"
            message = (
                f"Soil moisture ({latest.moisture:.1f}%) is sufficient. "
                "No irrigation needed."
            )

        return Response({
            "action": action,
            "message": message,
            "moisture": latest.moisture,
            "temperature": latest.temperature,
            "threshold": MOISTURE_THRESHOLD,
            "level": level,
            "weather": weather_info,
            "timestamp": latest.created_at,
        })


class DataAnalyticsView(APIView):
    def get(self, request):
        time_threshold = timezone.now() - timedelta(days=1)

        recent_data = SensorData.objects.filter(
            created_at__gte=time_threshold
        ).order_by("created_at").values(
            "moisture", "temperature", "created_at"
        )

        df = pd.DataFrame(recent_data)

        if df.empty:
            return Response({
                "message": "Not enough data for analysis yet."
            })

        latest_moisture = float(df["moisture"].iloc[-1])
        first_moisture = float(df["moisture"].iloc[0])
        moisture_change = round(latest_moisture - first_moisture, 2)

        if len(df) >= 5:
            if moisture_change < -3:
                trend = "Moisture levels are decreasing."
            elif moisture_change > 3:
                trend = "Moisture levels are increasing."
            else:
                trend = "Moisture levels are relatively stable."
        else:
            trend = "Need more data points to determine a trend."

        temperature_available = df["temperature"].notna().any()

        return Response({
            "total_readings": int(len(df)),
            "latest_reading": {
                "moisture": round(latest_moisture, 2),
                "temperature": round(float(df["temperature"].dropna().iloc[-1]), 2)
                if temperature_available else None,
                "created_at": str(df["created_at"].iloc[-1]),
            },
            "moisture_stats": {
                "average": round(float(df["moisture"].mean()), 2),
                "min": round(float(df["moisture"].min()), 2),
                "max": round(float(df["moisture"].max()), 2),
            },
            "temperature_stats": {
                "average": round(float(df["temperature"].mean()), 2) if temperature_available else None,
                "min": round(float(df["temperature"].min()), 2) if temperature_available else None,
                "max": round(float(df["temperature"].max()), 2) if temperature_available else None,
            },
            "dry_readings_count": int((df["moisture"] < MOISTURE_THRESHOLD).sum()),
            "moisture_change_24h": moisture_change,
            "trend": trend,
        })