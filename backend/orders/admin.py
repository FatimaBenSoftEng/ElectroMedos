from django.contrib import admin

from .models import Cart, CartItem, Order, OrderItem


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('user', 'item_count_display', 'total_display', 'updated_at')
    inlines = [CartItemInline]

    def item_count_display(self, obj):
        return obj.item_count
    item_count_display.short_description = 'Articles'

    def total_display(self, obj):
        return f'{obj.total} €'
    total_display.short_description = 'Total'


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product_name', 'quantity', 'price')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'status', 'total', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('user__username', 'email', 'first_name', 'last_name')
    inlines = [OrderItemInline]
