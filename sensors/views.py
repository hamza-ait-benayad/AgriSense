from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import SensorData
from .serializers import SensorDataSerializer


class SensorDataListCreateView(APIView):
    """
    GET  /api/sensor-data/ — Return last 20 readings
    POST /api/sensor-data/ — Submit a new sensor reading
    """

    def get(self, request):
        data = SensorData.objects.all()[:20]
        serializer = SensorDataSerializer(data, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = SensorDataSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LatestSensorDataView(APIView):
    """
    GET /api/sensor-data/latest/ — Return only the most recent reading
    """

    def get(self, request):
        latest = SensorData.objects.first()
        if latest is None:
            return Response({'moisture': None, 'temperature': None, 'created_at': None})
        serializer = SensorDataSerializer(latest)
        return Response(serializer.data)
