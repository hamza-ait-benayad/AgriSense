from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('dashboard.urls')),
    path('api/sensor-data/', include('sensors.urls')),
    path('api/irrigation/', include('irrigation.urls')),
    path('api/recommendation/', include('recommendation.urls')),
]
