# Medify Backend - Django REST API

Backend API for Medify medical website builder platform.

## Setup Instructions

### 1. Install Prerequisites

```bash
# Install Python 3.10+ if not already installed
python --version

# Install PostgreSQL (or use Docker)
docker run --name medify-db -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
```

### 2. Create Virtual Environment

```bash
cd backend
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env file with your database credentials
```

### 5. Create Database

```bash
# Connect to PostgreSQL and create database
# Or use pgAdmin to create database named 'medify_db'
```

### 6. Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 7. Create Superuser (Optional)

```bash
python manage.py createsuperuser
```

### 8. Run Development Server

```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`

## API Endpoints

### Authentication
- `POST /api/auth/signup/` - User registration
- `POST /api/auth/login/` - User login
- `GET /api/auth/me/` - Get current user
- `POST /api/auth/refresh/` - Refresh JWT token

### Website Setup
- `GET /api/website-setups/` - Get user's website setup
- `PATCH /api/website-setups/` - Update website setup

### Business Info
- `GET /api/business-info/` - Get business info
- `POST /api/business-info/` - Create business info
- `PATCH /api/business-info/` - Update business info
- `POST /api/business-info/publish/` - Publish website

## Testing with Postman/Thunder Client

### Signup Request
```
POST http://localhost:8000/api/auth/signup/
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "testpass123",
  "password_confirm": "testpass123",
  "name": "Test User",
  "business_type": "hospital"
}
```

### Login Request
```
POST http://localhost:8000/api/auth/login/
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "testpass123"
}
```

### Get Current User (with token)
```
GET http://localhost:8000/api/auth/me/
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## Phase 1 Features Implemented

✅ User authentication (signup/login)
✅ Website setup creation
✅ Basic CRUD for business info
✅ JWT token authentication
✅ CORS configuration for Next.js frontend

## Next Steps (Phase 2)

- Hospital: Departments & Doctors management
- Pharmacy: Products & Templates management
- File uploads (logos, doctor photos, certificates)

