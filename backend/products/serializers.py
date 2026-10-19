from django.db.models import Avg
from rest_framework import serializers

from .models import Category, Product, Review


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'description', 'image', 'product_count')

    def get_product_count(self, obj):
        return obj.products.count()


class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    display_image = serializers.SerializerMethodField()
    rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'slug', 'description', 'price', 'category', 'category_name',
            'category_slug', 'display_image', 'stock', 'is_featured', 'popularity',
            'brand', 'created_at', 'rating', 'review_count',
        )

    def get_display_image(self, obj):
        request = self.context.get('request')
        if obj.image:
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url
        return obj.image_url or ''

    def get_rating(self, obj):
        # utilise l'annotation si elle existe, sinon calcule (ex: vue admin)
        if hasattr(obj, 'rating_avg'):
            avg = obj.rating_avg
        else:
            avg = obj.reviews.aggregate(a=Avg('rating'))['a']
        return round(float(avg), 1) if avg else 0

    def get_review_count(self, obj):
        if hasattr(obj, 'review_count_annot'):
            return obj.review_count_annot
        return obj.reviews.count()


class ProductDetailSerializer(ProductListSerializer):
    specs = serializers.JSONField()

    class Meta(ProductListSerializer.Meta):
        fields = ProductListSerializer.Meta.fields + ('specs', 'updated_at')


class ProductWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = (
            'name', 'description', 'price', 'category', 'image', 'image_url',
            'stock', 'is_featured', 'popularity', 'brand', 'specs',
        )


class ReviewSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_slug = serializers.CharField(source='product.slug', read_only=True)

    class Meta:
        model = Review
        fields = (
            'id', 'author', 'rating', 'title', 'comment',
            'created_at', 'product_name', 'product_slug',
        )
        read_only_fields = ('id', 'created_at')

    def get_author(self, obj):
        user = obj.user
        full_name = user.get_full_name().strip() if hasattr(user, 'get_full_name') else ''
        if full_name:
            return full_name
        username = getattr(user, 'username', '') or ''
        if username:
            return username
        email = getattr(user, 'email', '') or ''
        return email.split('@')[0] if email else 'Client'