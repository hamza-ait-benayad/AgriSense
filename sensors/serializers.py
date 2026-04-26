from rest_framework import serializers
from .models import SensorData


class SensorDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = SensorData
        fields = ['id', 'moisture', 'temperature', 'created_at']
        read_only_fields = ['id', 'created_at']
