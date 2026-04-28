from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie


@ensure_csrf_cookie
def dashboard(request):
    """Serve the main AgriSense dashboard."""
    return render(request, 'dashboard/index.html')
