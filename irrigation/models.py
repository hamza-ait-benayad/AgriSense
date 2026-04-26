from django.db import models


class IrrigationStatus(models.Model):
    STATUS_CHOICES = [
        ('ON', 'ON'),
        ('OFF', 'OFF'),
    ]
    status = models.CharField(max_length=3, choices=STATUS_CHOICES, default='OFF')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Irrigation Status"
        verbose_name_plural = "Irrigation Statuses"

    def __str__(self):
        return f"Irrigation: {self.status} (updated {self.updated_at})"

    @classmethod
    def get_current(cls):
        """Return the single current irrigation status, creating it if absent."""
        obj, _ = cls.objects.get_or_create(pk=1, defaults={'status': 'OFF'})
        return obj
