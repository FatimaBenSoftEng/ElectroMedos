from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from orders.models import Cart, CartItem, Order, OrderItem
from products.fixtures.catalog import CATEGORIES, PRODUCTS
from products.management.commands.seed_data import seed_catalog
from products.models import Product
from users.models import User

USERS = [
    {
        'username': 'admin',
        'email': 'admin@electromedos.fr',
        'password': 'Admin1234!',
        'first_name': 'Marie',
        'last_name': 'Dupont',
        'phone': '06 12 34 56 78',
        'address': '12 rue de Rivoli',
        'city': 'Paris',
        'postal_code': '75001',
        'is_staff': True,
        'is_superuser': True,
    },
    {
        'username': 'thomas.martin',
        'email': 'thomas.martin@gmail.com',
        'password': 'Client1234!',
        'first_name': 'Thomas',
        'last_name': 'Martin',
        'phone': '06 98 76 54 32',
        'address': '45 avenue Jean Jaurès',
        'city': 'Lyon',
        'postal_code': '69007',
    },
    {
        'username': 'sophie.bernard',
        'email': 'sophie.bernard@outlook.fr',
        'password': 'Client1234!',
        'first_name': 'Sophie',
        'last_name': 'Bernard',
        'phone': '07 11 22 33 44',
        'address': '8 boulevard Longchamp',
        'city': 'Marseille',
        'postal_code': '13001',
    },
    {
        'username': 'lucas.petit',
        'email': 'lucas.petit@yahoo.fr',
        'password': 'Client1234!',
        'first_name': 'Lucas',
        'last_name': 'Petit',
        'phone': '06 55 44 33 22',
        'address': '23 rue de la République',
        'city': 'Toulouse',
        'postal_code': '31000',
    },
    {
        'username': 'emma.leroy',
        'email': 'emma.leroy@free.fr',
        'password': 'Client1234!',
        'first_name': 'Emma',
        'last_name': 'Leroy',
        'phone': '07 88 99 00 11',
        'address': '5 allée des Tilleuls',
        'city': 'Nantes',
        'postal_code': '44000',
    },
    {
        'username': 'julien.moreau',
        'email': 'julien.moreau@laposte.net',
        'password': 'Client1234!',
        'first_name': 'Julien',
        'last_name': 'Moreau',
        'phone': '06 77 66 55 44',
        'address': '17 rue Victor Hugo',
        'city': 'Bordeaux',
        'postal_code': '33000',
    },
]

CARTS = [
    {
        'username': 'thomas.martin',
        'items': [
            ('iphone-15-pro-max', 1),
            ('airpods-pro-2', 1),
        ],
    },
    {
        'username': 'sophie.bernard',
        'items': [
            ('macbook-pro-14-m3', 1),
            ('anker-powercore-26800', 2),
        ],
    },
    {
        'username': 'lucas.petit',
        'items': [
            ('playstation-5-slim', 1),
            ('logitech-g-pro-x-superlight-2', 1),
        ],
    },
]

ORDERS = [
    {
        'username': 'thomas.martin',
        'status': 'delivered',
        'days_ago': 45,
        'notes': 'Livraison en point relais Colissimo.',
        'items': [
            ('samsung-galaxy-s24-ultra', 1),
            ('sony-wh-1000xm5', 1),
        ],
    },
    {
        'username': 'sophie.bernard',
        'status': 'shipped',
        'days_ago': 7,
        'notes': '',
        'items': [
            ('macbook-pro-14-m3', 1),
        ],
    },
    {
        'username': 'lucas.petit',
        'status': 'processing',
        'days_ago': 2,
        'notes': 'Appeler avant livraison.',
        'items': [
            ('playstation-5-slim', 1),
            ('samsung-odyssey-g9', 1),
        ],
    },
    {
        'username': 'emma.leroy',
        'status': 'pending',
        'days_ago': 0,
        'notes': '',
        'items': [
            ('google-pixel-8-pro', 1),
            ('bose-quietcomfort-ultra', 1),
        ],
    },
    {
        'username': 'julien.moreau',
        'status': 'cancelled',
        'days_ago': 14,
        'notes': 'Annulation demandée par le client.',
        'items': [
            ('asus-rog-zephyrus-g16', 1),
        ],
    },
    {
        'username': 'thomas.martin',
        'status': 'delivered',
        'days_ago': 120,
        'notes': '',
        'items': [
            ('anker-powercore-26800', 3),
        ],
    },
]


class Command(BaseCommand):
    help = 'Peuple la base avec des données de test réalistes (catalogue, utilisateurs, paniers, commandes)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset-orders',
            action='store_true',
            help='Supprime paniers et commandes existants avant de recréer les données',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options['reset_orders']:
            OrderItem.objects.all().delete()
            Order.objects.all().delete()
            CartItem.objects.all().delete()
            Cart.objects.all().delete()
            self.stdout.write('Paniers et commandes réinitialisés.')

        seed_catalog()
        self.stdout.write(f'  {len(CATEGORIES)} catégories, {len(PRODUCTS)} produits')

        users = {}
        for user_data in USERS:
            data = {**user_data}
            password = data.pop('password')
            is_staff = data.pop('is_staff', False)
            is_superuser = data.pop('is_superuser', False)
            user, created = User.objects.update_or_create(
                username=data['username'],
                defaults={**data, 'is_staff': is_staff, 'is_superuser': is_superuser},
            )
            user.set_password(password)
            user.save()
            users[user.username] = user
            action = 'Créé' if created else 'Mis à jour'
            self.stdout.write(f'  {action}: {user.username} ({user.email})')

        cart_count = 0
        cart_item_count = 0
        for cart_data in CARTS:
            user = users[cart_data['username']]
            cart, _ = Cart.objects.get_or_create(user=user)
            for slug, quantity in cart_data['items']:
                product = Product.objects.get(slug=slug)
                _, created = CartItem.objects.update_or_create(
                    cart=cart,
                    product=product,
                    defaults={'quantity': quantity},
                )
                cart_item_count += 1 if created else 0
            cart_count += 1

        order_count = 0
        order_item_count = 0
        now = timezone.now()
        for order_data in ORDERS:
            user = users[order_data['username']]
            items_data = order_data['items']
            products = [Product.objects.get(slug=slug) for slug, _ in items_data]

            total = sum(
                product.price * quantity
                for product, (_, quantity) in zip(products, items_data, strict=True)
            )

            created_at = now - timedelta(days=order_data['days_ago'])
            order = Order.objects.create(
                user=user,
                status=order_data['status'],
                total=total,
                first_name=user.first_name,
                last_name=user.last_name,
                email=user.email,
                phone=user.phone,
                address=user.address,
                city=user.city,
                postal_code=user.postal_code,
                country=user.country,
                notes=order_data['notes'],
                created_at=created_at,
            )

            for product, (_, quantity) in zip(products, items_data, strict=True):
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    product_name=product.name,
                    quantity=quantity,
                    price=product.price,
                )
                order_item_count += 1

            order_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'\nBase peuplée avec succès :\n'
            f'  - {len(users)} utilisateurs (admin: admin / Admin1234!)\n'
            f'  - {cart_count} paniers actifs ({cart_item_count} articles)\n'
            f'  - {order_count} commandes ({order_item_count} lignes)\n'
            f'  - Clients: mot de passe Client1234!'
        ))
