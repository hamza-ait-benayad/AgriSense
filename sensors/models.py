from django.db import models


class SensorData(models.Model):
    moisture = models.FloatField()
    temperature = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Moisture: {self.moisture}% at {self.created_at}"
