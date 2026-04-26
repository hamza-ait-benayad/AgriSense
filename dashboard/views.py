from django.shortcuts import render


def dashboard(request):
    """Serve the main AgriSense dashboard."""
    return render(request, 'dashboard/index.html')
