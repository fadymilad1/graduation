# PostgreSQL Setup Guide

## Current Database Status

**Currently using:** SQLite (db.sqlite3 file)

## How to Switch to PostgreSQL

### Step 1: Install PostgreSQL

If you haven't installed PostgreSQL yet:

1. **Download PostgreSQL:**
   - Visit: https://www.postgresql.org/download/windows/
   - Download and install PostgreSQL for Windows
   - Remember the password you set for the `postgres` user

2. **Or use Docker (easier):**
   ```bash
   docker run --name medify-db -e POSTGRES_PASSWORD=yourpassword -p 5432:5432 -d postgres
   ```

### Step 2: Create Database in pgAdmin

1. Open **pgAdmin** (comes with PostgreSQL installation)
2. Connect to your PostgreSQL server (usually `localhost`)
3. Right-click on "Databases" → "Create" → "Database"
4. Name: `medify_db`
5. Click "Save"

### Step 3: Install PostgreSQL Driver

The project needs `psycopg2-binary` to connect to PostgreSQL. However, it requires Visual C++ Build Tools on Windows.

**Option A: Install Visual C++ Build Tools (Recommended)**
1. Download: https://visualstudio.microsoft.com/visual-cpp-build-tools/
2. Install "C++ build tools"
3. Then run: `pip install psycopg2-binary`

**Option B: Use Pre-built Wheel (Easier)**
```bash
cd backend
.\venv\Scripts\Activate.ps1
pip install psycopg2-binary
```

If it fails, try:
```bash
pip install psycopg2-binary --only-binary :all:
```

**Option C: Use psycopg (psycopg3) - Modern Alternative**
```bash
pip install psycopg[binary]
```
Then update settings.py to use `django.db.backends.postgresql` with psycopg3 adapter.

### Step 4: Update .env File

Edit `backend/.env` file:

```env
# Change this line:
DB_ENGINE=postgresql

# Update these with your PostgreSQL credentials:
DB_NAME=medify_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
```

### Step 5: Run Migrations

After switching to PostgreSQL:

```bash
cd backend
.\venv\Scripts\Activate.ps1
python manage.py migrate
```

This will create all tables in PostgreSQL.

### Step 6: Create Superuser (Optional)

```bash
python manage.py createsuperuser
```

## Verify Connection

Test the connection:

```bash
python manage.py dbshell
```

If it connects, you'll see the PostgreSQL prompt.

## Current Database: SQLite

**Location:** `backend/db.sqlite3`

**Pros:**
- ✅ No setup needed
- ✅ Works immediately
- ✅ Good for development

**Cons:**
- ⚠️ Not recommended for production
- ⚠️ Limited concurrent connections
- ⚠️ No advanced features

## PostgreSQL

**Pros:**
- ✅ Production-ready
- ✅ Better performance
- ✅ Advanced features (JSON fields, full-text search, etc.)
- ✅ Better for concurrent users

**Cons:**
- ⚠️ Requires installation
- ⚠️ Needs more setup

## Quick Switch Commands

**To use SQLite (current):**
```env
DB_ENGINE=sqlite
```

**To use PostgreSQL:**
```env
DB_ENGINE=postgresql
DB_NAME=medify_db
DB_USER=postgres
DB_PASSWORD=yourpassword
```

Then restart the Django server.

## Troubleshooting

### Error: "psycopg2 module not found"
- Install: `pip install psycopg2-binary`

### Error: "Microsoft Visual C++ 14.0 required"
- Install Visual C++ Build Tools (see Step 3, Option A)

### Error: "database does not exist"
- Create database in pgAdmin (see Step 2)

### Error: "password authentication failed"
- Check your PostgreSQL password in .env file

### Error: "could not connect to server"
- Make sure PostgreSQL is running
- Check if port 5432 is correct
- Verify DB_HOST is correct (usually `localhost`)



