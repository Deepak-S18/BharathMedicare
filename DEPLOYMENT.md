# BharathMedicare Deployment Guide

## Current Setup
- **Frontend**: Deployed on Vercel
- **Backend**: Needs to be deployed separately (Flask + MongoDB)

## Backend Deployment Options

### Option 1: Render.com (Recommended - FREE)

1. Go to https://render.com and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: bharathmedicare-backend
   - **Root Directory**: `backend`
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
   - **Plan**: Free

5. Add Environment Variables:
   ```
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET_KEY=your_secret_key_here
   ENCRYPTION_KEY=your_encryption_key_here
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_token
   TWILIO_VERIFY_SERVICE_SID=your_verify_sid
   FLASK_ENV=production
   ```

6. Click "Create Web Service"
7. Copy the deployed URL (e.g., `https://bharathmedicare-backend.onrender.com`)

### Option 2: Railway.app (FREE with limits)

1. Go to https://railway.app
2. Click "Start a New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Configure:
   - **Root Directory**: `backend`
   - Add same environment variables as above
5. Railway will auto-detect Flask and deploy

## Update Frontend Configuration

After deploying backend, update the API URL:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   ```
   API_BASE_URL=https://your-backend-url.onrender.com
   ```

3. Update `frontend/js/config.js`:
   ```javascript
   const API_BASE_URL = process.env.VERCEL_URL 
     ? 'https://your-backend-url.onrender.com'
     : 'http://localhost:5000';
   ```

4. Redeploy frontend on Vercel

## MongoDB Setup

If you don't have MongoDB Atlas:

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster (M0 Sandbox - FREE)
3. Create database user
4. Whitelist IP: `0.0.0.0/0` (allow from anywhere)
5. Get connection string
6. Add to backend environment variables

## Testing

1. Backend health check: `https://your-backend-url.onrender.com/api/health`
2. Frontend: `https://your-project.vercel.app`

## Important Notes

- Render free tier: Backend sleeps after 15 min of inactivity (first request takes ~30s)
- Keep your `.env` file secure and never commit it
- Update CORS settings in backend to allow your Vercel domain
