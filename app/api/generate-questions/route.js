import { GoogleGenAI } from "@google/genai";

// Simple in-memory cache to reduce API calls (resets on server restart)
const questionCache = new Map();

// Helper function to retry with exponential backoff
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isRateLimit = error?.message?.includes('429') || 
                         error?.details?.includes('429') ||
                         error?.code === 429;
      
      if (isRateLimit && attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}

export async function POST(request) {
  try {
    const { category, topic } = await request.json();
    console.log('Generating questions for:', category, topic);
    
    // Check cache first (cache for 1 hour per category)
    const cacheKey = `${category}-${topic}`;
    const cached = questionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hour cache
      console.log('Using cached questions for:', category);
      return Response.json({ questions: cached.questions });
    }
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('API key not found in environment variables');
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }
    console.log('API key found, length:', apiKey.length);

    // Initialize with API key (matches your example)
    const ai = new GoogleGenAI({ apiKey: apiKey });

    const prompt = `Generate 7 educational questions for a 3.5-year-old child learning about "${topic || category}".

Each question should:
- Be simple and age-appropriate
- Have exactly 2 answer options (a and b)
- Have one correct answer
- Be fun and engaging
- Use simple words

Return ONLY a JSON array with this exact format:
[
  {
    "q": "Question text here?",
    "a": { "txt": "Option A text", "icon": "emoji" },
    "b": { "txt": "Option B text", "icon": "emoji" },
    "correct": "a"
  },
  ...
]

Make sure each question is different and creative. Use appropriate emojis for icons.`;

    console.log('Calling Gemini 2.5 Flash API...');
    
    // Use retry logic for rate limits
    // Using gemini-2.5-flash (matches your example exactly)
    const response = await retryWithBackoff(async () => {
      try {
        const result = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
        return result;
      } catch (error) {
        // Check if it's a rate limit error
        const errorMessage = error?.message || JSON.stringify(error);
        if (errorMessage.includes('429') || errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
          throw new Error('RATE_LIMIT');
        }
        throw error;
      }
    });
    
    // Response.text is directly accessible (not a function) - matches your example
    const text = response.text;
    console.log('Received response from Gemini, length:', text.length);
    
    // Extract JSON from the response (handle markdown code blocks if present)
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '').trim();
    }
    
    console.log('Parsing JSON...');
    const questions = JSON.parse(jsonText);
    console.log('Successfully generated', questions.length, 'questions');
    
    // Cache the questions
    questionCache.set(cacheKey, {
      questions,
      timestamp: Date.now()
    });
    
    return Response.json({ questions });
  } catch (error) {
    console.error('Error generating questions:', error);
    console.error('Error stack:', error.stack);
    
    // Check if it's a rate limit error
    const errorMessage = error?.message || JSON.stringify(error);
    if (errorMessage.includes('429') || errorMessage.includes('RATE_LIMIT') || errorMessage.includes('rate limit')) {
      return Response.json({ 
        error: 'Rate limit exceeded', 
        details: 'Too many requests. Please try again in a moment or use static questions.',
        retryAfter: 40 // seconds
      }, { status: 429 });
    }
    
    return Response.json({ error: 'Failed to generate questions', details: error.message }, { status: 500 });
  }
}

