# Environment Variables Setup

## Gemini API Key

### For Local Development

To use AI-generated questions locally, create a `.env.local` file in the root directory:

1. Create a file named `.env.local` in the root directory
2. Add the following line:
   ```
   GEMINI_API_KEY=AIzaSyA0ciGSqBozcAgG_GcspFZbmJvM3gFhAIM
   ```

**Important:** The `.env.local` file is already in `.gitignore`, so your API key will NOT be pushed to GitHub.

### For Vercel Deployment

To add the API key to your Vercel deployment:

1. Go to your Vercel project: https://vercel.com/saidhiraj-amurus-projects/toddler-learning
2. Click on **Settings** in the top navigation
3. Click on **Environment Variables** in the left sidebar
4. Click **Add New** button
5. Enter:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** `AIzaSyA0ciGSqBozcAgG_GcspFZbmJvM3gFhAIM`
   - **Environment:** Select all (Production, Preview, Development) or just Production
6. Click **Save**
7. **Important:** After adding, you need to redeploy your app for the changes to take effect:
   - Go to **Deployments** tab
   - Click the three dots (⋯) on the latest deployment
   - Click **Redeploy**

## Security Note

- Never commit `.env.local` to version control
- The API key is only used server-side in the API route
- Environment variables in Vercel are encrypted and secure

