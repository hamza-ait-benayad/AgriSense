from django.urls import path
from .views import RecommendationView, DataAnalyticsView

urlpatterns = [
    path('', RecommendationView.as_view(), name='recommendation'),
    path('analytics/', DataAnalyticsView.as_view(), name='analytics'),
]
