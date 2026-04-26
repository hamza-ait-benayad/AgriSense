"""
Seed the database with an initial irrigation status and an admin user.
Usage: python manage.py seed_db
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from irrigation.models import IrrigationStatus


class Command(BaseCommand):
    help = 'Seeds the database with initial data for AgriSense'

    def handle(self, *args, **options):
        User = get_user_model()

        # 1. Create admin if not exists
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser(
                username='admin',
                email='admin@agrisense.local',
                password='admin123',
            )
            self.stdout.write(self.style.SUCCESS('[OK] Created admin user (admin / admin123)'))
        else:
            self.stdout.write(self.style.WARNING('  Admin user already exists, skipping.'))

        # 2. Ensure a default irrigation status row
        obj, created = IrrigationStatus.objects.get_or_create(
            pk=1,
            defaults={'status': 'OFF'},
        )
        if created:
            self.stdout.write(self.style.SUCCESS('[OK] Created default IrrigationStatus (OFF)'))
        else:
            self.stdout.write(self.style.WARNING('  IrrigationStatus already exists, skipping.'))

        self.stdout.write(self.style.SUCCESS('\nSeed complete! Run: python manage.py runserver'))
