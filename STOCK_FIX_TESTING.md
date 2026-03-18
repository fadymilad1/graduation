# Stock Display Fix - Testing Guide

## Problem
Products uploaded via CSV show "0 units" and "Out of Stock" on the product details page, even though the CSV file contains stock values.

## Root Cause
The stock value from CSV could be stored as either a number or string in localStorage. The previous parsing logic was too strict and would default to `undefined` or 0 if the type didn't match exactly.

## Fixes Applied

### 1. Product Details Page ([id]/page.tsx)
**Changed:** More robust stock parsing that handles both number and string types
```typescript
// OLD - Only handled exact number type
stock: typeof foundProduct.stock === 'number' ? foundProduct.stock : 0

// NEW - Handles both number and string, with proper conversion
let stockValue = 0
if (foundProduct.stock !== undefined && foundProduct.stock !== null) {
  const parsed = typeof foundProduct.stock === 'number' 
    ? foundProduct.stock 
    : parseInt(String(foundProduct.stock), 10)
  stockValue = isNaN(parsed) ? 0 : Math.max(0, parsed)
}
```

### 2. Medications List Page (medications/page.tsx)  
**Changed:** Same robust parsing for localStorage products
```typescript
// Parse stock more robustly - handle both number and string
let stockValue: number | undefined = undefined
if ((p as any).stock !== undefined && (p as any).stock !== null) {
  const parsed = typeof (p as any).stock === 'number' 
    ? (p as any).stock 
    : parseInt(String((p as any).stock), 10)
  if (!isNaN(parsed) && parsed >= 0) {
    stockValue = Math.floor(parsed)
  }
}
```

### 3. Price Formatting
**Changed:** Ensures prices are always formatted with $ sign
```typescript
let priceFormatted = foundProduct.price || '$0.00'
if (!priceFormatted.startsWith('$')) {
  const priceNum = parseFloat(priceFormatted)
  priceFormatted = isNaN(priceNum) ? '$0.00' : `$${priceNum.toFixed(2)}`
}
```

### 4. Added Debug Logging
Console logs now show:
- Number of products in localStorage
- Raw stock value and its type
- Parsed stock value
- Product details (name, category, description preview)

## Testing Steps

### Step 1: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Navigate to a product details page
4. Look for logs starting with 📦:
   ```
   📦 Products in localStorage: 19
   📦 Found product: {name: "...", rawStock: 40, stockType: "number", ...}
   📦 Parsed stock value: 40
   ```

### Step 2: Check localStorage Data
Run this in the browser console on your site:
```javascript
// Check if products are in localStorage
const pharmacySetup = localStorage.getItem('medify_pharmacySetup')
if (pharmacySetup) {
  const data = JSON.parse(pharmacySetup)
  console.table(data.products.map(p => ({
    name: p.name,
    category: p.category,
    stock: p.stock,
    stockType: typeof p.stock,
    price: p.price
  })))
} else {
  console.log('No pharmacySetup found in localStorage')
}
```

### Step 3: Re-upload CSV if Needed
If localStorage shows stock as undefined or wrong type:
1. Go to Dashboard → Pharmacy Setup
2. Re-upload your CSV file with stock column
3. Wait for success message
4. Refresh the medications page
5. Click on a product to check details page

### Step 4: Verify Backend Data
Check if products are in the backend database:
```javascript
// Run in browser console (while logged in)
const token = localStorage.getItem('access_token')
fetch('http://localhost:8000/api/pharmacy/products/', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(products => {
  console.table(products.map(p => ({
    name: p.name,
    category: p.category,
    description: p.description?.substring(0, 30),
    stock: p.stock,
    price: p.price
  })))
})
```

## Expected Results

### Medications Page
- ✓ Products with stock > 0 show GREEN "In Stock" badge
- ✓ Stock number displays correctly: "Stock: 40 units"
- ✓ Price displays with label: "Price: $4.99"
- ✓ Category name displays correctly
- ✓ "View Details" button is visible

### Product Details Page
- ✓ Category badge shows at top (e.g., "Pain Relief")
- ✓ Product name displays correctly
- ✓ Description shows (if available in CSV)
- ✓ Price displays correctly
- ✓ Availability shows correct stock: "40 units"
- ✓ Stock badge shows "In Stock" (green) or "Out of Stock" (red)
- ✓ Quantity selector is visible (when in stock)
- ✓ "Add to Cart" button is visible and enabled (when in stock)
- ✓ Max quantity matches stock value

### When Out of Stock (stock = 0)
- ✓ Shows RED "Out of Stock" badge
- ✓ Shows "0 units"
- ✓ Quantity selector is hidden
- ✓ Add to Cart button is hidden
- ✓ Shows message: "This product is currently out of stock"

## Troubleshooting

### Issue: Still showing 0 stock after fix
**Solution:** 
1. Clear browser cache and localStorage
2. Re-upload CSV file
3. Check console logs for parsing issues

### Issue: Products not loading at all
**Check:**
1. Is CSV uploaded? Go to Pharmacy Setup
2. Check localStorage with the command in Step 2
3. Check browser console for errors

### Issue: Category not showing from CSV
**Check:**
1. CSV has "category" column (case-sensitive)
2. Category values are not empty
3. Re-upload CSV if needed

### Issue: Description not showing
**Check:**
1. CSV has "description" column
2. Description values are not empty
3. Product details page should show description below product name

## CSV Format Reminder
Your CSV must have these columns in order:
```csv
name,category,description,price,stock
Paracetamol 500mg,Pain Relief,Effective pain reliever,4.99,40
```

- `name`: Product name (required, cannot be empty)
- `category`: Category name (required, defaults to "General" if empty)
- `description`: Product description (optional, can be empty)
- `price`: Price as number (required, no $ sign needed)
- `stock`: Stock quantity as integer (required, defaults to 0 if empty)

## Files Changed
1. `frontend/app/templates/pharmacy/3/medications/page.tsx` - Fixed stock parsing from localStorage
2. `frontend/app/templates/pharmacy/3/product/[id]/page.tsx` - Fixed stock parsing and added debug logs
