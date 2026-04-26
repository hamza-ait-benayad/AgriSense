from django.urls import path
from .views import SensorDataListCreateView, LatestSensorDataView

urlpatterns = [
    path('', SensorDataListCreateView.as_view(), name='sensor-data-list-create'),
    path('latest/', LatestSensorDataView.as_view(), name='sensor-data-latest'),
]
