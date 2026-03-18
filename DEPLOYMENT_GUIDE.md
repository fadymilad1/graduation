# Deployment Guide for Bug Fixes

## Overview
This guide explains how to deploy the bug fixes for business information persistence and CSV product import.

## Changes Summary
- Fixed business info not persisting to database
- Fixed CSV product import functionality
- Added API data loading on page mount
- Improved error handling and fallbacks

## Deployment Steps

### 1. Backend Deployment

No database migrations are required. The fixes only modify view logic and URL routing.

```bash
cd graduation/backend

# No migrations needed - just restart the server
python manage.py runserver
```

### 2. Frontend Deployment

The frontend changes are in the business info page component.

```bash
cd graduation/frontend

# Install dependencies (if needed)
npm install

# Build for production
npm run build

# Start the server
npm start
```

### 3. Verification Steps

#### Test Business Info Persistence

1. Log in to the dashboard
2. Navigate to Business Information page
3. Enter business details:
   - Business name
   - Logo (optional)
   - About text
   - Address
   - Contact phone
   - Contact email
   - Working hours
4. Click "Publish Website"
5. Refresh the page
6. Verify all data is still present

#### Test CSV Product Import

1. Log in to the dashboard
2. Navigate to Pharmacy Setup page
3. Prepare a CSV file with format:
   ```csv
   name,category,description,price,stock
   Aspirin 500mg,Pain Relief,Pain reliever,5.99,100
   Vitamin C,Vitamins,Immune support,12.99,50
   ```
4. Click "Import products (CSV)" and select your file
5. Wait for import to complete
6. Verify products appear in the list
7. Navigate to your template's medications page
8. Verify products are visible

#### Test Template Display

1. After importing products, visit your pharmacy template
2. Navigate to the medications/products page
3. Verify your products are displayed
4. Check that product details (name, price, stock) are correct
5. Test adding products to cart

## Troubleshooting

### Business Info Not Loading

**Symptom:** Business info page is empty after refresh

**Solutions:**
1. Check browser console for errors
2. Verify you're logged in (check for `access_token` in localStorage)
3. Check backend logs for API errors
4. Try clearing localStorage and re-entering data

### Products Not Appearing

**Symptom:** Products don't show after CSV import

**Solutions:**
1. Check that CSV format is correct (header row required)
2. Verify you're logged in when importing
3. Check backend logs for validation errors
4. Ensure products have required fields (name, price)
5. Try refreshing the page

### API Connection Issues

**Symptom:** "Failed to load" errors in console

**Solutions:**
1. Verify backend is running on correct port (default: 8000)
2. Check CORS settings in backend settings.py
3. Verify API_URL in frontend .env.local
4. Check network tab in browser dev tools

## Environment Variables

### Backend (.env)
```env
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
FRONTEND_URL=http://localhost:3000
CORS_ALLOW_ALL=False
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## API Endpoints Reference

### Business Info
- `GET /api/business-info/` - Get user's business info
- `PATCH /api/business-info/` - Update business info
- `POST /api/business-info/` - Create business info

### Products
- `GET /api/pharmacy/products/` - List products
- `POST /api/pharmacy/products/bulk_upload/` - Import CSV products
- `POST /api/pharmacy/products/` - Create single product
- `PATCH /api/pharmacy/products/<id>/` - Update product
- `DELETE /api/pharmacy/products/<id>/` - Delete product

## Database Backup

Before deploying to production, backup your database:

```bash
# SQLite backup
cp graduation/backend/db.sqlite3 graduation/backend/db.sqlite3.backup

# PostgreSQL backup (if using)
pg_dump -U postgres medify_db > backup.sql
```

## Rollback Plan

If issues occur after deployment:

1. Stop the servers
2. Restore database backup (if needed)
3. Revert code changes:
   ```bash
   git checkout HEAD~1 graduation/backend/core/views/business_info.py
   git checkout HEAD~1 graduation/backend/core/urls.py
   git checkout HEAD~1 graduation/frontend/app/dashboard/business-info/page.tsx
   ```
4. Restart servers

## Monitoring

After deployment, monitor:
- Backend logs for API errors
- Frontend console for JavaScript errors
- Database for data integrity
- User feedback on business info and product import

## Support

If you encounter issues:
1. Check the BUGFIX_SUMMARY.md for detailed technical information
2. Review backend logs in terminal
3. Check browser console for frontend errors
4. Verify database state using Django shell
