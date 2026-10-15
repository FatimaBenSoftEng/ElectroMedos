from django.db import transaction
from django_filters import rest_framework as filters
from rest_framework import generics, permissions, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CartItem, Order, OrderItem
from .serializers import (
    AddToCartSerializer,
    CartSerializer,
    CheckoutSerializer,
    OrderAdminSerializer,
    OrderSerializer,
    OrderStatusUpdateSerializer,
    UpdateCartItemSerializer,
    get_or_create_cart,
)


class AdminOrderPagination(PageNumberPagination):
    page_size = 5
    page_size_query_param = 'page_size'
    max_page_size = 50


class CartView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        cart = get_or_create_cart(request.user)
        return Response(CartSerializer(cart, context={'request': request}).data)

    def delete(self, request):
        cart = get_or_create_cart(request.user)
        cart.items.all().delete()
        return Response({'message': 'Panier vidé.'})


class AddToCartView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        serializer = AddToCartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.validated_data['product_id']
        quantity = serializer.validated_data['quantity']
        cart = get_or_create_cart(request.user)

        if product.stock < quantity:
            return Response(
                {'error': 'Stock insuffisant.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        item, created = CartItem.objects.get_or_create(cart=cart, product=product, defaults={'quantity': quantity})
        if not created:
            new_qty = item.quantity + quantity
            if product.stock < new_qty:
                return Response({'error': 'Stock insuffisant.'}, status=status.HTTP_400_BAD_REQUEST)
            item.quantity = new_qty
            item.save()

        return Response(CartSerializer(cart, context={'request': request}).data, status=status.HTTP_201_CREATED)


class UpdateCartItemView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def patch(self, request, item_id):
        cart = get_or_create_cart(request.user)
        try:
            item = cart.items.get(id=item_id)
        except CartItem.DoesNotExist:
            return Response({'error': 'Article introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = UpdateCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        quantity = serializer.validated_data['quantity']

        if item.product.stock < quantity:
            return Response({'error': 'Stock insuffisant.'}, status=status.HTTP_400_BAD_REQUEST)

        item.quantity = quantity
        item.save()
        return Response(CartSerializer(cart, context={'request': request}).data)

    def delete(self, request, item_id):
        cart = get_or_create_cart(request.user)
        try:
            item = cart.items.get(id=item_id)
        except CartItem.DoesNotExist:
            return Response({'error': 'Article introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        item.delete()
        return Response(CartSerializer(cart, context={'request': request}).data)


class CheckoutView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    @transaction.atomic
    def post(self, request):
        cart = get_or_create_cart(request.user)
        if not cart.items.exists():
            return Response({'error': 'Panier vide.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        for item in cart.items.select_related('product'):
            if item.product.stock < item.quantity:
                return Response(
                    {'error': f'Stock insuffisant pour {item.product.name}.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        order = Order.objects.create(
            user=request.user,
            total=cart.total,
            **serializer.validated_data,
        )

        for item in cart.items.select_related('product'):
            OrderItem.objects.create(
                order=order,
                product=item.product,
                product_name=item.product.name,
                quantity=item.quantity,
                price=item.product.price,
            )
            item.product.stock -= item.quantity
            item.product.save(update_fields=['stock'])

        cart.items.all().delete()
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related('items')


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related('items')


class OrderFilter(filters.FilterSet):
    status = filters.CharFilter()
    created_after = filters.DateFilter(field_name='created_at', lookup_expr='gte')
    created_before = filters.DateFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = Order
        fields = ['status']


class OrderAdminListView(generics.ListAPIView):
    serializer_class = OrderAdminSerializer
    permission_classes = (permissions.IsAdminUser,)
    pagination_class = AdminOrderPagination
    filterset_class = OrderFilter
    search_fields = ['email', 'first_name', 'last_name', 'user__username', 'user__email']
    ordering_fields = ['created_at', 'total', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        return Order.objects.select_related('user').prefetch_related('items').all()


class OrderAdminDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = (permissions.IsAdminUser,)
    lookup_field = 'pk'

    def get_queryset(self):
        return Order.objects.select_related('user').prefetch_related('items').all()

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return OrderStatusUpdateSerializer
        return OrderAdminSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = OrderStatusUpdateSerializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(OrderAdminSerializer(instance).data)