# CSV Product Import - Complete Fix

## 🎯 What Was Fixed

Your CSV product import now works correctly:
- ✅ Products persist after upload (no data loss)
- ✅ Stock quantities are saved correctly (no more zeros)
- ✅ Duplicate products are prevented (updates instead of creating copies)
- ✅ All 3 pharmacy templates display products correctly

## 🚀 Quick Start

### 1. Clean Your Database
```bash
cd graduation/backend
python manage.py cleanup_products --delete-all
```

### 2. Upload Sample CSV
1. Start servers:
   ```bash
   # Terminal 1 - Backend
   cd graduation/backend
   python manage.py runserver
   
   # Terminal 2 - Frontend
   cd graduation/frontend
   npm run dev
   ```

2. Login to dashboard: `http://localhost:3000/dashboard`

3. Go to Pharmacy Setup: `http://localhost:3000/dashboard/pharmacy/setup`

4. Click "Import products (CSV)" and select: `/sample-pharmacy-products.csv`

5. You should see: "✓ 10 products created, 0 products updated"

### 3. Verify Products
Visit: `http://localhost:3000/templates/pharmacy/3/medications`

You should see:
- 10 products with correct stock numbers (50, 100, 75, etc.)
- Green "In Stock" badges
- Correct prices
- Working "Add to Cart" buttons

## 📝 CSV Format

Your CSV file must follow this format:

```csv
name,category,description,price,stock
Amoxicillin 500mg Capsules,Antibiotic,Antibiotic for bacterial infections,35.00,50
Paracetamol 500mg Tablets,Pain Relief,Pain and fever relief medication,4.99,100
```

**Important**:
- First row must be headers
- 5 columns required: name, category, description, price, stock
- Stock must be a number (no text)
- No extra spaces
- Save as UTF-8 encoding

## 🔍 Troubleshooting

### Problem: Products show 0 stock

**Solution 1**: Check your CSV file
- Open CSV in text editor (not Excel)
- Verify stock column has numbers: `50` not `"50"` or `fifty`
- No extra commas or spaces

**Solution 2**: Check browser console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Upload CSV again
4. Look for logs like:
   ```
   Parsed product: Amoxicillin..., stock raw: "50", parsed: 50
   Uploading products, first product: {name: "...", stock: 50}
   ```

**Solution 3**: Check database
```bash
cd graduation/backend
python manage.py shell -c "from pharmacies.models import Product; [print(f'{p.name}: {p.stock}') for p in Product.objects.all()[:5]]"
```

Should show:
```
Amoxicillin 500mg Capsules: 50
Paracetamol 500mg Tablets: 100
```

### Problem: Products disappear after reload

**Solution**: Make sure you're logged in
- Check if you have `access_token` in localStorage (F12 > Application > Local Storage)
- If not, login again
- Then upload CSV

### Problem: Duplicate products

**Solution**: Clean up duplicates
```bash
cd graduation/backend
python manage.py cleanup_products --remove-duplicates
```

Or delete all and start fresh:
```bash
python manage.py cleanup_products --delete-all
```

## 🧪 Testing Checklist

- [ ] Backend server running (port 8000)
- [ ] Frontend server running (port 3000)
- [ ] Logged in to dashboard
- [ ] CSV file properly formatted
- [ ] Upload shows success message
- [ ] Products visible in medications page
- [ ] Stock numbers are correct (not zero)
- [ ] Stock badges show correct colors
- [ ] Products persist after page reload
- [ ] Re-uploading same CSV updates (doesn't duplicate)

## 📊 Debug Commands

### View products in database
```bash
python manage.py shell -c "from pharmacies.models import Product; [print(f'{p.name}: stock={p.stock}, in_stock={p.in_stock}') for p in Product.objects.all()[:10]]"
```

### Count total products
```bash
python manage.py shell -c "from pharmacies.models import Product; print(f'Total: {Product.objects.count()}')"
```

### Test product creation
```bash
python test_csv_import.py
```

### Use debug API endpoint
```bash
curl http://localhost:8000/api/pharmacy/products/debug_info/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 📁 Files Changed

### Backend
- `pharmacies/views.py` - Fixed stock handling, added duplicate detection
- `pharmacies/management/commands/cleanup_products.py` - New cleanup tool

### Frontend
- `app/dashboard/pharmacy/setup/page.tsx` - Added debug logging
- `app/templates/pharmacy/1/medications/page.tsx` - Fixed display
- `app/templates/pharmacy/2/medications/page.tsx` - Fixed display
- `app/templates/pharmacy/3/medications/page.tsx` - Fixed display

### New Files
- `public/sample-pharmacy-products.csv` - Sample data
- `backend/test_csv_import.py` - Test script
- `TESTING_GUIDE.md` - Detailed testing instructions
- `FINAL_FIX_SUMMARY.md` - Technical details

## 🎓 How It Works Now

1. **CSV Upload**:
   - Frontend parses CSV and extracts stock as integer
   - Sends JSON to backend with proper data types
   - Backend validates and saves to database

2. **Duplicate Prevention**:
   - Backend checks if product exists (by name + category)
   - If exists: updates price, description, stock
   - If new: creates new product

3. **Stock Display**:
   - Frontend loads products from backend API
   - Parses stock as integer (handles various formats)
   - Shows correct badges based on stock level:
     - Green "In Stock" if stock > 5
     - Orange "Low Stock" if stock 1-4
     - Red "Out of Stock" if stock = 0

4. **Persistence**:
   - Products saved to database (not just localStorage)
   - Survives page reloads and server restarts
   - Accessible across all pharmacy templates

## ✅ Expected Behavior

After uploading `sample-pharmacy-products.csv`:

1. **Dashboard shows**: "✓ 10 products created, 0 products updated"
2. **Database has**: 10 products with correct stock values
3. **Medications page shows**: All products with green "In Stock" badges
4. **Re-uploading same CSV**: "✓ 0 products created, 10 products updated"
5. **After page reload**: Products still there with correct stock

## 🆘 Still Having Issues?

1. **Check all servers are running**
   - Backend: `http://localhost:8000/admin` should load
   - Frontend: `http://localhost:3000` should load

2. **Check you're logged in**
   - Go to `/dashboard` - should not redirect to login
   - Check localStorage has `access_token`

3. **Check CSV file**
   - Open in Notepad/TextEdit (not Excel)
   - Verify format matches example above
   - No extra blank lines at end

4. **Check browser console**
   - Press F12
   - Look for errors in Console tab
   - Look for debug logs during upload

5. **Check Django logs**
   - Look at terminal running `python manage.py runserver`
   - Should see "First product data: ..." when uploading

6. **Use debug endpoint**
   ```bash
   curl http://localhost:8000/api/pharmacy/products/debug_info/ \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
   Should return products with stock values

## 📞 Need More Help?

See detailed guides:
- `TESTING_GUIDE.md` - Step-by-step testing
- `FINAL_FIX_SUMMARY.md` - Technical details
- `CSV_PRODUCT_FIXES.md` - Code changes explained

---

**Summary**: Your CSV import is now fully functional. Products persist, stock is saved correctly, and duplicates are prevented. Follow the Quick Start guide above to test it!
