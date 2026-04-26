from django.contrib import admin
from .models import SensorData


@admin.register(SensorData)
class SensorDataAdmin(admin.ModelAdmin):
    list_display = ('id', 'moisture', 'temperature', 'created_at')
    list_filter = ('created_at',)
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)
