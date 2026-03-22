# Backend Deployment Guide

## Local Backend Status
✅ **Backend is running locally at**: http://127.0.0.1:8000/api/

## Deployment Options

### Option 1: Railway (Recommended)

Railway is a modern platform that makes it easy to deploy Django applications.

#### Steps to Deploy on Railway:

1. **Sign up for Railway**
   - Visit https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account and select the `graduation` repository

3. **Configure Service**
   - Set root directory to: `backend`
   - Railway will auto-detect Django

4. **Add Environment Variables**
   ```
   SECRET_KEY=your-super-secret-key-here-change-this
   DEBUG=False
   ALLOWED_HOSTS=.railway.app
   DB_ENGINE=postgresql
   CORS_ALLOW_ALL=True
   FRONTEND_URL=https://frontend-one-woad-66.vercel.app
   ```

5. **Add PostgreSQL Database**
   - In your project, click "New"
   - Select "Database" → "PostgreSQL"
   - Railway will automatically set DATABASE_URL

6. **Deploy**
   - Railway will automatically build and deploy
   - Get your app URL (something like: `medify-backend.railway.app`)

#### Cost: 
- Free tier: $5 credit/month (enough for small projects)
- Pay as you go after that

---

### Option 2: Render

Render is another great option with a generous free tier.

#### Steps to Deploy on Render:

1. **Sign up for Render**
   - Visit https://render.com
   - Sign up with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `graduation`
   - Root Directory: `backend`

3. **Configure Build Settings**
   - **Name**: medify-backend
   - **Environment**: Python 3
   - **Build Command**: `chmod +x build.sh && ./build.sh`
   - **Start Command**: `gunicorn medify_backend.wsgi:application`

4. **Add Environment Variables**
   ```
   SECRET_KEY=your-super-secret-key-here-change-this
   DEBUG=False
   ALLOWED_HOSTS=.onrender.com
   DB_ENGINE=postgresql
   CORS_ALLOW_ALL=True
   FRONTEND_URL=https://frontend-one-woad-66.vercel.app
   PYTHON_VERSION=3.11.0
   ```

5. **Add PostgreSQL Database**
   - In Dashboard, click "New +" → "PostgreSQL"
   - Copy the Internal Database URL
   - Add to your web service as `DATABASE_URL`

6. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (first build takes ~5-10 minutes)
   - Get your app URL (something like: `medify-backend.onrender.com`)

#### Cost:
- Free tier available (with some limitations)
- Paid plans start at $7/month

---

### Option 3: Heroku (Classic Option)

1. **Install Heroku CLI**
   ```bash
   # Download from: https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Login and Create App**
   ```bash
   cd c:\Users\moham\Desktop\Medify\graduation\backend
   heroku login
   heroku create medify-backend
   ```

3. **Add PostgreSQL**
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set SECRET_KEY=your-secret-key
   heroku config:set DEBUG=False
   heroku config:set ALLOWED_HOSTS=.herokuapp.com
   heroku config:set DB_ENGINE=postgresql
   heroku config:set CORS_ALLOW_ALL=True
   heroku config:set FRONTEND_URL=https://frontend-one-woad-66.vercel.app
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

---

## After Backend Deployment

### Update Frontend Environment Variables

Once your backend is deployed, update the frontend on Vercel:

1. Go to https://vercel.com/mohamed-ayman28s-projects/frontend
2. Settings → Environment Variables
3. Add/Update:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api
   ```
4. Redeploy the frontend:
   ```bash
   cd c:\Users\moham\Desktop\Medify\graduation\frontend
   vercel --prod
   ```

---

## Test Backend API

Once deployed, test your API endpoints:

### Health Check
```
GET https://your-backend-url/api/
```

### Signup
```
POST https://your-backend-url/api/auth/signup/
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "testpass123",
  "password_confirm": "testpass123",
  "name": "Test User",
  "business_type": "hospital"
}
```

### Login
```
POST https://your-backend-url/api/auth/login/
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "testpass123"
}
```

---

## Files Created for Deployment

✅ `.env` and `.env.example` - Environment configuration  
✅ `Procfile` - Process configuration for Heroku/Render  
✅ `runtime.txt` - Python version specification  
✅ `railway.json` - Railway deployment configuration  
✅ `nixpacks.toml` - Nixpacks build configuration  
✅ `build.sh` - Build script for Render  
✅ `requirements.txt` - Updated with production dependencies  
✅ `requirements-local.txt` - Local development dependencies  

---

## Troubleshooting

### Database Connection Issues
- Make sure `DATABASE_URL` is set by the platform
- Verify `DB_ENGINE=postgresql` is set in environment variables

### Static Files Not Loading
- Ensure WhiteNoise is installed: `pip install whitenoise`
- Run `python manage.py collectstatic` during build

### CORS Errors
- Add your Vercel frontend URL to `CORS_ALLOWED_ORIGINS`
- Or set `CORS_ALLOW_ALL=True` for testing

### Migration Errors
- Make sure migrations run during deployment
- Check build logs for errors

---

## Current Status

✅ **Backend Running Locally**: http://127.0.0.1:8000/api/  
✅ **Frontend Deployed**: https://frontend-one-woad-66.vercel.app  
⏳ **Backend Deployment**: Ready to deploy (choose a platform above)  

---

**Need Help?**  
Check the platform-specific documentation:
- Railway: https://docs.railway.app
- Render: https://render.com/docs
- Heroku: https://devcenter.heroku.com
