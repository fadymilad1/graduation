from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction

from core.models import WebsiteSetup
from pharmacies.models import Product
from pharmacies.serializers import (
    ProductSerializer, 
    ProductCreateUpdateSerializer,
    ProductBulkUploadSerializer
)


class ProductViewSet(viewsets.ModelViewSet):
    """ViewSet for managing pharmacy products"""
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Only return products for the current user's pharmacy"""
        return Product.objects.filter(
            website_setup__user=self.request.user
        ).order_by('-created_at')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ProductCreateUpdateSerializer
        return ProductSerializer

    def perform_create(self, serializer):
        """Associate product with user's website setup"""
        website_setup, created = WebsiteSetup.objects.get_or_create(
            user=self.request.user,
            defaults={'subdomain': self.request.user.email.split('@')[0]}
        )
        serializer.save(website_setup=website_setup)

    @action(detail=False, methods=['post'])
    def bulk_upload(self, request):
        """Bulk upload products from CSV - creates or updates existing products"""
        serializer = ProductBulkUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        products_data = serializer.validated_data['products']
        website_setup, created = WebsiteSetup.objects.get_or_create(
            user=request.user,
            defaults={'subdomain': request.user.email.split('@')[0]}
        )
        
        created_count = 0
        updated_count = 0
        all_products = []
        
        # Debug: Log first product data
        if products_data:
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"First product data: {products_data[0]}")
        
        with transaction.atomic():
            for product_data in products_data:
                # Extract stock value with proper type handling
                stock_value = product_data.get('stock', 0)
                if isinstance(stock_value, str):
                    try:
                        stock_value = int(stock_value)
                    except (ValueError, TypeError):
                        stock_value = 0
                elif not isinstance(stock_value, int):
                    stock_value = int(stock_value) if stock_value else 0
                
                # Ensure stock is non-negative
                stock_value = max(0, stock_value)
                
                # Try to find existing product by name and category
                existing_product = Product.objects.filter(
                    website_setup=website_setup,
                    name=product_data['name'],
                    category=product_data.get('category', 'General')
                ).first()
                
                if existing_product:
                    # Update existing product
                    existing_product.description = product_data.get('description', '')
                    existing_product.price = product_data['price']
                    existing_product.stock = stock_value
                    existing_product.save()
                    all_products.append(existing_product)
                    updated_count += 1
                else:
                    # Create new product
                    product = Product.objects.create(
                        website_setup=website_setup,
                        name=product_data['name'],
                        category=product_data.get('category', 'General'),
                        description=product_data.get('description', ''),
                        price=product_data['price'],
                        stock=stock_value
                    )
                    all_products.append(product)
                    created_count += 1
        
        response_serializer = ProductSerializer(all_products, many=True)
        return Response({
            'message': f'{created_count} products created, {updated_count} products updated',
            'created': created_count,
            'updated': updated_count,
            'products': response_serializer.data
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def debug_info(self, request):
        """Debug endpoint to check product data"""
        products = self.get_queryset()[:10]
        return Response({
            'total_count': self.get_queryset().count(),
            'sample_products': [
                {
                    'id': str(p.id),
                    'name': p.name,
                    'stock': p.stock,
                    'stock_type': type(p.stock).__name__,
                    'in_stock': p.in_stock,
                    'price': str(p.price),
                }
                for p in products
            ]
        })

    @action(detail=False, methods=['delete'])
    def delete_all(self, request):
        """Delete all products for current user"""
        count = self.get_queryset().count()
        self.get_queryset().delete()
        return Response({
            'message': f'{count} products deleted successfully'
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get products grouped by category"""
        products = self.get_queryset()
        categories = {}
        
        for product in products:
            if product.category not in categories:
                categories[product.category] = []
            categories[product.category].append(ProductSerializer(product).data)
        
        return Response(categories)
