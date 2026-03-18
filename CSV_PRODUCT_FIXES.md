# CSV Product Import Fixes

## Issues Fixed

### 1. Products Not Persisting After CSV Upload
**Problem**: CSV products were created but not properly saved to the database, causing them to disappear on page reload.

**Solution**: 
- Updated the backend `bulk_upload` endpoint to properly handle product creation and updates
- Products are now created with proper database transactions
- Added duplicate detection: if a product with the same name and category exists, it updates instead of creating a duplicate

### 2. All Stock Showing Zero
**Problem**: Stock quantities from CSV were not being properly parsed and saved, resulting in all products showing 0 units.

**Solution**:
- Fixed stock parsing in both frontend and backend
- Backend now properly accepts and saves stock values from CSV
- Frontend properly parses stock as integers, handling both number and string types
- Added robust validation to ensure stock values are non-negative integers

### 3. Duplicate Products
**Problem**: Re-uploading the same CSV created duplicate products instead of updating existing ones.

**Solution**:
- Implemented smart duplicate detection in `bulk_upload` endpoint
- Products are matched by name + category combination
- Existing products are updated with new price/stock/description
- New products are created only if they don't exist
- Response now shows count of created vs updated products

## Backend Changes

### File: `graduation/backend/pharmacies/views.py`

```python
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
    
    with transaction.atomic():
        for product_data in products_data:
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
                existing_product.stock = product_data.get('stock', 0)
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
                    stock=product_data.get('stock', 0)
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
```

## Frontend Changes

### File: `graduation/frontend/app/dashboard/pharmacy/setup/page.tsx`

1. **Improved stock parsing in bulk upload**:
```typescript
stock: typeof p.stock === 'number' ? p.stock : parseInt(String(p.stock), 10) || 0
```

2. **Better feedback messages**:
```typescript
const message = result.created && result.updated 
  ? `✓ ${result.created} products created, ${result.updated} products updated`
  : `✓ ${importedProducts.length} products imported successfully`
```

### Files: `graduation/frontend/app/templates/pharmacy/{1,2,3}/medications/page.tsx`

1. **Fixed price formatting** (added $ sign):
```typescript
price: `$${parseFloat(p.price || 0).toFixed(2)}`
```

2. **Robust stock parsing**:
```typescript
stock: typeof p.stock === 'number' ? p.stock : (p.stock ? parseInt(String(p.stock), 10) : 0)
```

## CSV Format

The system expects CSV files with the following format:

```csv
name,category,description,price,stock
Amoxicillin 500mg Capsules,Antibiotic,Antibiotic for bacterial infections,35.00,50
Paracetamol 500mg Tablets,Pain Relief,Pain and fever relief medication,4.99,100
```

### Column Details:
- **name** (required): Product name
- **category** (required): Product category (e.g., "Pain Relief", "Antibiotics")
- **description** (optional): Product description
- **price** (required): Product price (numeric, can include $ sign which will be stripped)
- **stock** (required): Quantity in stock (integer, must be >= 0)

## Sample CSV File

A sample CSV file is now available at `/sample-pharmacy-products.csv` with 10 example products.

## Testing the Fixes

1. **Upload a CSV file** with products including stock quantities
2. **Verify products appear** with correct stock numbers (not zero)
3. **Re-upload the same CSV** - should update existing products, not create duplicates
4. **Check the medications page** - products should persist after page reload
5. **Verify stock badges** - should show "In Stock", "Low Stock", or "Out of Stock" correctly

## Key Improvements

✅ Products persist after CSV upload  
✅ Stock quantities are correctly saved and displayed  
✅ Duplicate products are updated instead of recreated  
✅ Better error handling and user feedback  
✅ Consistent price formatting across all templates  
✅ Robust parsing handles various data types  
✅ Sample CSV file provided for reference  

## Migration Notes

No database migrations are required. The fixes are in the application logic only.
