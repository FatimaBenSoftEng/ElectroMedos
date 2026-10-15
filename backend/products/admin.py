from django.contrib import admin

from .models import Category, Product


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
