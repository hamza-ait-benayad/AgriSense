from django.contrib import admin
from .models import IrrigationStatus


@admin.register(IrrigationStatus)
class IrrigationStatusAdmin(admin.ModelAdmin):
    list_display = ('id', 'status', 'updated_at')
    readonly_fields = ('updated_at',)
