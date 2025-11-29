# Environment Variables Setup

## Gemini API Key

To use AI-generated questions, you need to create a `.env.local` file in the root directory with your Gemini API key:

1. Create a file named `.env.local` in the root directory
2. Add the following line:
   ```
   GEMINI_API_KEY=AIzaSyA0ciGSqBozcAgG_GcspFZbmJvM3gFhAIM
   ```

**Important:** The `.env.local` file is already in `.gitignore`, so your API key will NOT be pushed to GitHub.

## Security Note

- Never commit `.env.local` to version control
- The API key is only used server-side in the API route
- If you need to deploy, add the environment variable in your hosting platform (Vercel, Netlify, etc.)

