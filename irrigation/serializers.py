from rest_framework import serializers
from .models import IrrigationStatus


class IrrigationStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = IrrigationStatus
        fields = ['id', 'status', 'updated_at']
        read_only_fields = ['id', 'updated_at']
