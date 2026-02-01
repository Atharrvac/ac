# AI Chatbot Setup Guide

## EcoAssistant - Powered by Google Gemini AI

The chatbot is now powered by Google's Gemini AI for intelligent, context-aware responses about e-waste recycling.

## Getting Your Free API Key

1. **Visit Google AI Studio**
   - Go to: https://makersuite.google.com/app/apikey
   - Or: https://aistudio.google.com/app/apikey

2. **Sign in with Google Account**
   - Use any Google account (Gmail)

3. **Create API Key**
   - Click "Create API Key"
   - Select "Create API key in new project" or use existing project
   - Copy the generated API key

4. **Add to Your Project**
   - Open `.env` file in the project root
   - Replace the placeholder with your actual key:
   ```
   VITE_GEMINI_API_KEY=your_actual_api_key_here
   ```

5. **Restart Development Server**
   ```bash
   npm run dev
   ```

## Features

✅ **Intelligent Responses** - AI understands context and provides detailed answers
✅ **E-Waste Expertise** - Specialized in recycling, disposal, and environmental topics
✅ **Safety Guardrails** - Blocks sensitive data sharing
✅ **Citations** - Provides sources from knowledge base
✅ **Fallback Mode** - Uses local knowledge base if API is unavailable
✅ **Free Tier** - Gemini API offers generous free usage

## API Limits (Free Tier)

- **60 requests per minute**
- **1,500 requests per day**
- More than enough for development and small-scale production

## Alternative: Use Without API Key

The chatbot will automatically fall back to the local knowledge base if:
- No API key is provided
- API quota is exceeded
- Network issues occur

## Testing the Chatbot

1. Navigate to the **Assistant** page in your app
2. Ask questions like:
   - "How do I safely dispose of lithium batteries?"
   - "What should I do before recycling my phone?"
   - "What are the environmental impacts of e-waste?"
   - "How do I earn EcoCoins?"

## Troubleshooting

**Issue: "AI service temporarily unavailable"**
- Check your API key is correct in `.env`
- Verify you haven't exceeded free tier limits
- Check internet connection
- The app will use fallback knowledge base automatically

**Issue: Slow responses**
- First request may take 2-3 seconds (model initialization)
- Subsequent requests are faster
- This is normal for free tier

**Issue: API key not working**
- Make sure `.env` file is in project root
- Restart the development server after adding key
- Check for typos in the API key

## Security Notes

- ✅ API key is safe to use in frontend (Gemini allows it)
- ✅ Rate limiting is handled by Google
- ✅ No sensitive data is sent to AI (guardrails block it)
- ⚠️ Don't commit `.env` file to public repositories (already in .gitignore)

## Upgrading to Production

For production deployment:
1. Set environment variable in your hosting platform (Vercel, Netlify, etc.)
2. Consider using backend proxy for additional security
3. Monitor API usage in Google Cloud Console
4. Upgrade to paid tier if needed for higher limits

## Support

- Google AI Studio: https://aistudio.google.com
- Gemini API Docs: https://ai.google.dev/docs
- Report issues: Create an issue in the repository
