from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Vérifie la connexion à la base PostgreSQL externe'

    def handle(self, *args, **options):
        db = connection.settings_dict
        self.stdout.write(f"Hôte : {db['HOST']}:{db['PORT']}")
        self.stdout.write(f"Base : {db['NAME']}")
        self.stdout.write(f"Utilisateur : {db['USER']}")

        try:
            with connection.cursor() as cursor:
                cursor.execute('SELECT version();')
                version = cursor.fetchone()[0]
            self.stdout.write(self.style.SUCCESS(f'Connexion réussie — {version[:60]}...'))
        except Exception as exc:
            self.stdout.write(self.style.ERROR(f'Échec de connexion : {exc}'))
            raise SystemExit(1) from exc
