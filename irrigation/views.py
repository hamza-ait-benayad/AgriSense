from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import IrrigationStatus
from .serializers import IrrigationStatusSerializer


class IrrigationView(APIView):
    """
    GET  /api/irrigation/ — Return current irrigation status
    POST /api/irrigation/ — Update irrigation status (ON / OFF)
    """

    def get(self, request):
        irrigation = IrrigationStatus.get_current()
        serializer = IrrigationStatusSerializer(irrigation)
        return Response(serializer.data)

    def post(self, request):
        irrigation = IrrigationStatus.get_current()
        new_status = request.data.get('status', '').upper()
        if new_status not in ('ON', 'OFF'):
            return Response(
                {'error': 'Invalid status. Must be "ON" or "OFF".'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        irrigation.status = new_status
        irrigation.save()
        serializer = IrrigationStatusSerializer(irrigation)
        return Response(serializer.data)
