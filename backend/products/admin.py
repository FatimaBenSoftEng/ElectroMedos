from django.contrib import admin

from .models import Category, Product, Review


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'created_at')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'stock', 'is_featured', 'popularity')
    list_filter = ('category', 'is_featured', 'brand')
    search_fields = ('name', 'description', 'brand')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('product', 'user', 'rating', 'title', 'created_at')
    list_filter = ('rating', 'product')
    search_fields = ('product__name', 'user__email', 'comment')
    autocomplete_fields = ('product',)