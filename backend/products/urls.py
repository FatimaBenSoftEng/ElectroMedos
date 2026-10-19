from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CategoryAdminViewSet,
    CategoryViewSet,
    FeaturedProductsView,
    ProductAdminViewSet,
    ProductDetailView,
    ProductListView,
    MyReviewsView,
    ProductReviewListCreateView,
)

router = DefaultRouter()
router.register('categories', CategoryViewSet, basename='category')
router.register('admin/categories', CategoryAdminViewSet, basename='admin-category')
router.register('admin/products', ProductAdminViewSet, basename='admin-product')

urlpatterns = [
    path('', ProductListView.as_view(), name='product-list'),
        path('featured/', FeaturedProductsView.as_view(), name='product-featured'),
        path('reviews/me/', MyReviewsView.as_view(), name='my-reviews'),
    
        path('', include(router.urls)),
    
        path('<slug:slug>/reviews/', ProductReviewListCreateView.as_view(), name='product-reviews'),
        path('<slug:slug>/', ProductDetailView.as_view(), name='product-detail'),
]
