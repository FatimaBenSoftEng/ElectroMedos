from django.urls import path

from .views import (
    AddToCartView,
    CartView,
    CheckoutView,
    OrderAdminDetailView,
    OrderAdminListView,
    OrderDetailView,
    OrderListView,
    UpdateCartItemView,
)

urlpatterns = [
    path('cart/', CartView.as_view(), name='cart'),
    path('cart/add/', AddToCartView.as_view(), name='cart-add'),
    path('cart/items/<int:item_id>/', UpdateCartItemView.as_view(), name='cart-item'),
    path('checkout/', CheckoutView.as_view(), name='checkout'),
    path('admin/', OrderAdminListView.as_view(), name='order-admin-list'),
    path('admin/<int:pk>/', OrderAdminDetailView.as_view(), name='order-admin-detail'),
    path('', OrderListView.as_view(), name='order-list'),
    path('<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
]
