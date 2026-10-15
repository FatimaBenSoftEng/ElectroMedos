from django.urls import include, path

urlpatterns = [
    path('auth/', include('users.urls')),
    path('products/', include('products.urls')),
    path('orders/', include('orders.urls')),
]
