# AGENTS.md - Medify Backend Development Guide

This document provides guidelines for agents working on the Medify backend codebase.

## Project Overview

- **Framework**: Django 4.2.7 with Django REST Framework 3.14.0
- **Language**: Python
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **Authentication**: JWT via djangorestframework-simplejwt

## Project Structure

```
backend/
├── api/                    # Main Django app
│   ├── migrations/
│   ├── models/             # Database models (user.py, business.py, etc.)
│   ├── serializers/        # DRF serializers
│   ├── admin.py
│   ├── apps.py
│   ├── urls.py
│   └── views.py
├── medify_backend/         # Django project settings
│   ├── settings.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
├── manage.py
├── pyproject.toml         # pyright config
├── requirements.txt
├── .flake8               # flake8 config (ignores E501)
└── setup.cfg             # pycodestyle config
```

## Build/Lint/Test Commands

### Running the Development Server
```bash
python manage.py runserver
```

### Database Migrations
```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate
```

### Linting
```bash
# flake8 (recommended - ignores E501 line length)
flake8 .

# Run with specific config
flake8 --config=.flake8 .
```

### Type Checking
```bash
# pyright (configured in pyproject.toml)
pyright
```

### Django Management Commands
```bash
# Create superuser
python manage.py createsuperuser

# Check configuration
python manage.py check

# Shell access
python manage.py shell
```

### Running Tests
```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test api

# Run a specific test file
python manage.py test api.tests.test_views

# Run a specific test class
python manage.py test api.tests.test_views.UserViewSetTest

# Run a specific test method
python manage.py test api.tests.test_views.UserViewSetTest.test_create_user

# With coverage (if coverage is installed)
coverage run manage.py test
coverage report
```

## Code Style Guidelines

### Imports (PEP 8 - Standard Library First)
```python
# 1. Standard library
import uuid
import os
from pathlib import Path
from datetime import timedelta

# 2. Third-party packages
from django.db import models
from django.contrib.auth.models import AbstractUser
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

# 3. Local imports (relative)
from .models import User, WebsiteSetup
from .serializers import UserSerializer
```

### Formatting
- **Line length**: E501 ignored (no strict limit)
- **Indentation**: 4 spaces
- **Blank lines**: Two blank lines between top-level definitions
- **Trailing whitespace**: Avoid

### Naming Conventions
- **Classes**: PascalCase (`UserSerializer`, `BusinessInfoViewSet`)
- **Functions/methods**: snake_case (`get_queryset`, `create_user`)
- **Variables**: snake_case (`user_data`, `is_valid`)
- **Constants**: SCREAMING_SNAKE_CASE
- **Database fields**: snake_case (`created_at`, `business_type`)
- **Files**: snake_case (`user_serializers.py`, `views.py`)

### Type Hints
- Use type hints for function arguments and return values where beneficial
- Example:
```python
from typing import Optional, List

def get_user(email: str) -> Optional[User]:
    """Get user by email."""
    try:
        return User.objects.get(email=email)
    except User.DoesNotExist:
        return None
```

### Django Model Guidelines
```python
from django.db import models
import uuid

class BusinessInfo(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name
```

### DRF Serializer Guidelines
```python
from rest_framework import serializers
from api.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'business_type', 'created_at']
        read_only_fields = ['id', 'created_at']
```

### ViewSet Guidelines
```python
class BusinessInfoViewSet(viewsets.ModelViewSet):
    serializer_class = BusinessInfoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return BusinessInfo.objects.filter(user=self.request.user)

    @action(detail=False, methods=['post'])
    def publish(self, request):
        # Custom action implementation
        pass
```

### Error Handling
- Use `serializer.is_valid(raise_exception=True)` for automatic validation errors
- Return appropriate HTTP status codes:
  - `200 OK` - Successful GET/PUT/PATCH
  - `201 Created` - Successful POST
  - `400 Bad Request` - Validation errors
  - `401 Unauthorized` - Authentication failed
  - `404 Not Found` - Resource not found
- Example error response:
```python
return Response(
    {'error': 'Business info already exists. Use update endpoint.'},
    status=status.HTTP_400_BAD_REQUEST
)
```

### API Endpoints Structure
Follow REST conventions:
- `GET /api/resource/` - List
- `POST /api/resource/` - Create
- `GET /api/resource/{id}/` - Retrieve
- `PUT/PATCH /api/resource/{id}/` - Update
- `DELETE /api/resource/{id}/` - Destroy
- Custom actions: `POST /api/resource/{id}/action_name/`

### Custom Actions Pattern
```python
@action(detail=False, methods=['post'])
def publish(self, request):
    """Publish the website."""
    business_info = self.get_object()
    business_info.is_published = True
    business_info.save()
    serializer = self.get_serializer(business_info)
    return Response(serializer.data)
```

### Permissions
- Default: `IsAuthenticated` for most endpoints
- Use `permissions.AllowAny` for public endpoints (login, signup)
- Decorator pattern for function-based views:
```python
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def signup(request):
    pass
```

### Documentation
- Include docstrings for all views, serializers, and complex functions
- Format: Google-style or simple descriptions
- Example:
```python
def get_queryset(self):
    """Return business info for the current user's website setup."""
    pass
```

## Environment Configuration

Create a `.env` file (do not commit):
```
SECRET_KEY=your-secret-key
DEBUG=True
DB_ENGINE=sqlite  # or postgresql
DB_NAME=medify_db
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
FRONTEND_URL=http://localhost:3000
```

## Common Development Tasks

### Creating a New Model
1. Create model in `api/models/`
2. Add to `api/models/__init__.py`
3. Run `python manage.py makemigrations`
4. Run `python manage.py migrate`

### Creating a New Serializer
1. Add to appropriate file in `api/serializers/`
2. Export in `api/serializers/__init__.py`

### Creating a New ViewSet
1. Add viewset to `api/views.py`
2. Add to `api/urls.py`

### Adding a New App
1. Create app: `python manage.py startapp newapp`
2. Add to `INSTALLED_APPS` in `settings.py`
3. Add to `ROOT_URLCONF`
