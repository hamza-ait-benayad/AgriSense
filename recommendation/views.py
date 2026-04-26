from rest_framework.views import APIView
from rest_framework.response import Response
from sensors.models import SensorData

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
