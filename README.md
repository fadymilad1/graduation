# Medify - Medical Website Builder

A modern, professional SaaS platform for building medical websites for Hospitals and Pharmacies. Built with Next.js 16, TypeScript, and Tailwind CSS.

## Overview

Medify is a full-stack application (Next.js frontend + Django REST API backend) that enables medical facilities to create professional websites through an intuitive interface. The platform offers two distinct workflows:

- **🏥 Hospital Websites** - Feature-based website creation with customizable modules
- **💊 Pharmacy Websites** - Template-based website creation with pre-designed layouts
- **🤖 AI Assistant** - Intelligent content generation and website management

## Project Structure

```
.
├── frontend/            # Next.js 16 application (UI)
│   ├── app/             # Next.js app directory (App Router)
│   ├── components/      # Reusable React components
│   ├── public/          # Static assets
│   └── package.json     # Frontend dependencies & scripts
└── backend/             # Django REST API
    ├── medify_backend/  # Django project settings & URLs
    ├── api/             # Core API app (models, serializers, views)
    ├── manage.py        # Django management script
    └── requirements.txt # Backend dependencies
```

## Features

- **Landing Page** - Marketing page with features, pricing, and testimonials
- **User Authentication** - Login and signup pages
- **Dashboard** - Comprehensive dashboard with setup progress tracking
- **Hospital Setup** - Feature selection and configuration for hospitals
- **Pharmacy Setup** - Template selection and customization for pharmacies
- **Business Info Forms** - Collect and manage business information
- **AI Assistant** - Chat interface for website management assistance
- **Settings** - Account and website configuration
- **Payment Integration** - Payment modal for Visa and Fawry (UI ready)
- **Responsive Design** - Mobile-first design that works on all devices

## Tech Stack

- **Frontend Framework**: Next.js 16 (App Router)
- **Frontend Language**: TypeScript 5.5+
- **Styling**: Tailwind CSS
- **Icons**: React Icons
- **Frontend Architecture**: Component-based, reusable UI components
- **Backend Framework**: Django 4 + Django REST Framework
- **Backend Language**: Python 3.10+
- **Database**: SQLite (default) or PostgreSQL
- **Authentication**: JWT (via `rest_framework_simplejwt`)

## Getting Started

### Prerequisites

- Node.js 20.9.0 or later
- Python 3.10 or later
- npm or yarn
- (Optional) PostgreSQL 14+ if you don't want to use the default SQLite database

### 1. Backend (Django API)

```bash
cd backend

# (first time) create & activate virtualenv
python -m venv venv
venv\Scripts\activate           # Windows
# source venv/bin/activate      # Mac/Linux

# install dependencies
pip install -r requirements.txt

# copy environment template and adjust if needed
cp .env.example .env            # or create .env manually based on .env.example

# apply migrations
python manage.py migrate

# run server
python manage.py runserver
```

The backend API will be available at `http://localhost:8000/api/`.

### 2. Frontend (Next.js app)

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`.

### 3. Environment Variables

- **Backend**: Configure `backend/.env` (see `.env.example`) for `SECRET_KEY`, `DEBUG`, database settings (`DB_ENGINE`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`), and `FRONTEND_URL`.
- **Frontend**: Uses mock/local data by default. When wiring the UI to the API, you can add an API base URL via Next.js env vars (for example: `NEXT_PUBLIC_API_URL=http://localhost:8000/api`).

## Project Status

- **Frontend**: Uses local/mock data for now. All flows and components are ready to be connected to real backend endpoints.
- **Backend**: Django REST API implemented for authentication, website setup, and business info, with JWT authentication and CORS configured for the Next.js frontend.
- **Persistence**: SQLite is used by default for local development. PostgreSQL configuration is ready for production or more advanced setups (see backend docs).

## Documentation

For detailed documentation about the frontend application, including:
- Complete feature list
- Component documentation
- Page structure
- Color palette
- Development guidelines

See [frontend/README.md](./frontend/README.md).

For backend API setup, endpoints, and PostgreSQL configuration, see:
- [backend/README.md](./backend/README.md)
- [backend/POSTGRESQL_SETUP.md](./backend/POSTGRESQL_SETUP.md)

## License

This project is part of a full-stack development task.
