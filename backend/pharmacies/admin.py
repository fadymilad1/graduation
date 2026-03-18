from django.contrib import admin
from pharmacies.models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """Admin interface for Product model"""
    list_display = ['name', 'category', 'price', 'stock', 'in_stock', 'website_setup', 'created_at']
    list_filter = ['category', 'in_stock', 'created_at']
    search_fields = ['name', 'category', 'description']
    readonly_fields = ['id', 'in_stock', 'created_at', 'updated_at']
    list_per_page = 50
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'website_setup', 'name', 'category')
        }),
        ('Details', {
            'fields': ('description', 'price', 'stock', 'in_stock')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

