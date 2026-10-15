from django.core.management.base import BaseCommand

from products.fixtures.catalog import CATEGORIES, PRODUCTS
from products.models import Category, Product


def seed_catalog():
    for cat_data in CATEGORIES:
        Category.objects.update_or_create(slug=cat_data['slug'], defaults=cat_data)

    for prod_data in PRODUCTS:
        data = {**prod_data}
        category_slug = data.pop('category')
        category = Category.objects.get(slug=category_slug)
        Product.objects.update_or_create(
            slug=data['slug'],
            defaults={**data, 'category': category},
        )


class Command(BaseCommand):
    help = 'Seed database with sample categories and products'

    def handle(self, *args, **options):
        seed_catalog()
        self.stdout.write(self.style.SUCCESS(f'Seeded {len(CATEGORIES)} categories and {len(PRODUCTS)} products.'))
