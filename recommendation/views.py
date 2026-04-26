from rest_framework.views import APIView
from rest_framework.response import Response
from sensors.models import SensorData
import pandas as pd
from datetime import timedelta
from django.utils import timezone



# Moisture threshold below which irrigation is recommended (%)
MOISTURE_THRESHOLD = 40.0


class RecommendationView(APIView):
    """
    GET /api/recommendation/
    Returns a simple rule-based irrigation recommendation based on the
    latest sensor reading.
    """

    def get(self, request):
        latest = SensorData.objects.first()

        if latest is None:
            return Response({
                'action': 'No Data',
                'message': 'No sensor readings available yet.',
                'moisture': None,
                'threshold': MOISTURE_THRESHOLD,
            })

        if latest.moisture < MOISTURE_THRESHOLD:
            action = 'Irrigate'
            message = f'Soil moisture ({latest.moisture:.1f}%) is below the threshold ({MOISTURE_THRESHOLD}%). Irrigation recommended.'
            level = 'warning'
        else:
            action = 'No Need'
            message = f'Soil moisture ({latest.moisture:.1f}%) is sufficient. No irrigation needed.'
            level = 'ok'

        return Response({
            'action': action,
            'message': message,
            'moisture': latest.moisture,
            'threshold': MOISTURE_THRESHOLD,
            'level': level,
        })
        
        

class DataAnalyticsView(APIView):
    """
    GET /api/recommendation/analytics/
    Returns a statistical summary of the sensor data using Pandas.
    """
    def get(self, request):
        # 1. Fetch data from the last 24 hours
        time_threshold = timezone.now() - timedelta(days=1)
        recent_data = SensorData.objects.filter(created_at__gte=time_threshold).values(
            'moisture', 'temperature', 'created_at'
        )

        # 2. Convert to a Pandas DataFrame
        df = pd.DataFrame(recent_data)

        if df.empty:
            return Response({'message': 'Not enough data for analysis yet.'})

        # 3. Perform Data Analytics
        stats = {
            'total_readings': len(df),
            'moisture_stats': {
                'average': round(df['moisture'].mean(), 2),
                'min': df['moisture'].min(),
                'max': df['moisture'].max(),
            },
            'temperature_stats': {
                'average': round(df['temperature'].mean(), 2) if df['temperature'].notna().any() else None,
                'min': df['temperature'].min() if df['temperature'].notna().any() else None,
                'max': df['temperature'].max() if df['temperature'].notna().any() else None,
            }
        }

        # 4. Simple Trend Analysis
        # Compare the first half of the data to the second half to see if moisture is dropping
        if len(df) > 10:
            half_point = len(df) // 2
            first_half_avg = df['moisture'].iloc[:half_point].mean()
            second_half_avg = df['moisture'].iloc[half_point:].mean()
            
            if second_half_avg < first_half_avg:
                stats['trend'] = "Moisture levels are decreasing."
            else:
                stats['trend'] = "Moisture levels are stable or increasing."
        else:
            stats['trend'] = "Need more data points to determine a trend."

        return Response(stats)
