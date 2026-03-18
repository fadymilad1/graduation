from rest_framework import serializers
from pharmacies.models import Product


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for Pharmacy Product model"""
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'category', 'description', 
            'price', 'stock', 'in_stock', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'in_stock', 'created_at', 'updated_at']


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating Products"""
    
    class Meta:
        model = Product
        fields = ['name', 'category', 'description', 'price', 'stock']
    
    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Price cannot be negative")
        return value
    
    def validate_stock(self, value):
        if value < 0:
            raise serializers.ValidationError("Stock cannot be negative")
        return value


class ProductBulkUploadSerializer(serializers.Serializer):
    """Serializer for bulk CSV upload"""
    products = serializers.ListField(
        child=serializers.DictField(),
        allow_empty=False
    )
    
    def validate_products(self, value):
        for product in value:
            if 'name' not in product or 'price' not in product:
                raise serializers.ValidationError(
                    "Each product must have 'name' and 'price'"
                )
        return value
