# Deployment Guide for SmartTable AI

This project is set up for easy deployment to platforms like **Render**, **Heroku**, or **Vercel**.

## Prerequisites
- A MongoDB Atlas account (for production database).
- A Google Gemini API key.
- A GitHub repository with your code.

## Option 1: Deploy to Render (Recommended)
Render is the easiest way to deploy this full-stack app.

1. Create a new **Web Service** on [Render](https://render.com/).
2. Connect your GitHub repository.
3. Render will automatically detect the `render.yaml` file and set up the service.
4. You will need to provide the following Environment Variables in the Render Dashboard:
   - `MONGODB_URI`: Your MongoDB Atlas connection string.
   - `GEMINI_API_KEY`: Your Google Gemini API key.
   - `JWT_SECRET`: A long random string for security.

## Option 2: Deploy to Heroku
1. Install the Heroku CLI.
2. Run `heroku create`.
3. Add a MongoDB add-on or set `MONGODB_URI` config var to your Atlas URI.
4. Set other config vars:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set GEMINI_API_KEY=your_key
   heroku config:set JWT_SECRET=your_secret
   ```
5. Push your code: `git push heroku main`.

## Production Configuration Note
The server is configured to serve the frontend as static files. In production, ensure `NODE_ENV` is set to `production`.

The `CORS` settings in `backend/server.js` will automatically use `process.env.FRONTEND_URL` if set, otherwise it defaults to standard origins. Since we serve the frontend from the same origin as the API, CORS issues should be minimal.

## Troubleshooting
- **Database Connection**: Ensure your MongoDB Atlas IP Whitelist allows connections from everywhere (`0.0.0.0/0`) or the specific IP of your hosting provider.
- **Port**: The application uses `process.env.PORT`, which is required by most hosting providers.
