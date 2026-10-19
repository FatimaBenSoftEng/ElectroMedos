from django.core.files.storage import default_storage
from django.db.models import Avg, Count
from django.shortcuts import get_object_or_404
from django_filters import rest_framework as filters
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from .models import Category, Product, Review
from .serializers import (
    CategorySerializer,
    ProductDetailSerializer,
    ProductListSerializer,
    ProductWriteSerializer,
    ReviewSerializer,
)


class AdminProductPagination(PageNumberPagination):
    page_size = 5
    page_size_query_param = 'page_size'
    max_page_size = 50


def products_with_rating():
    """Produits avec note moyenne et nombre d'avis calculés en base."""
    return Product.objects.select_related('category').annotate(
        rating_avg=Avg('reviews__rating'),
        review_count_annot=Count('reviews'),
    )


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = 'slug'


class ProductFilter(filters.FilterSet):
    min_price = filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = filters.NumberFilter(field_name='price', lookup_expr='lte')
    category = filters.CharFilter(field_name='category__slug')
    is_featured = filters.BooleanFilter()

    class Meta:
        model = Product
        fields = ['category', 'is_featured', 'brand']


class ProductListView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    filterset_class = ProductFilter
    search_fields = ['name', 'description', 'brand']
    ordering_fields = ['price', 'popularity', 'created_at', 'name']
    ordering = ['-created_at']

    def get_queryset(self):
        return products_with_rating()


class ProductDetailView(generics.RetrieveAPIView):
    serializer_class = ProductDetailSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        return products_with_rating()

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.popularity += 1
        instance.save(update_fields=['popularity'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class FeaturedProductsView(generics.ListAPIView):
    serializer_class = ProductListSerializer

    def get_queryset(self):
        return products_with_rating().filter(is_featured=True)[:8]


class ProductReviewListCreateView(generics.ListCreateAPIView):
    """GET : liste des avis d'un produit. POST : publier un avis (connecté)."""
    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        return Review.objects.filter(
            product__slug=self.kwargs['slug']
        ).select_related('user', 'product')

    def perform_create(self, serializer):
        product = get_object_or_404(Product, slug=self.kwargs['slug'])
        if Review.objects.filter(product=product, user=self.request.user).exists():
            raise ValidationError(
                {'detail': 'Vous avez déjà publié un avis pour ce produit.'}
            )
        # l'utilisateur vient toujours du token, jamais du formulaire
        serializer.save(user=self.request.user, product=product)


class MyReviewsView(generics.ListAPIView):
    """Avis publiés par l'utilisateur connecté (page profil)."""
    serializer_class = ReviewSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Review.objects.filter(
            user=self.request.user
        ).select_related('product', 'user')


class ProductAdminViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    permission_classes = (permissions.IsAdminUser,)
    lookup_field = 'slug'
    pagination_class = AdminProductPagination

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return ProductWriteSerializer
        return ProductDetailSerializer

    @action(
        detail=False,
        methods=['post'],
        url_path='upload-image',
        parser_classes=[MultiPartParser, FormParser],
    )
    def upload_image(self, request):
        image = request.FILES.get('image')
        if not image:
            return Response(
                {'detail': "Aucune image fournie."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        path = default_storage.save(f'products/{image.name}', image)
        url = request.build_absolute_uri(default_storage.url(path))
        return Response({'url': url})


class CategoryAdminViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = (permissions.IsAdminUser,)
    lookup_field = 'slug'
    pagination_class = AdminProductPagination