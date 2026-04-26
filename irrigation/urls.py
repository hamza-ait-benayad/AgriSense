from django.urls import path
from .views import IrrigationView

urlpatterns = [
    path('', IrrigationView.as_view(), name='irrigation'),
]
