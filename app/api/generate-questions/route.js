import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request) {
  try {
    const { category, topic } = await request.json();
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response (handle markdown code blocks if present)
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '').trim();
    }
    
    const questions = JSON.parse(jsonText);
    
    return Response.json({ questions });
  } catch (error) {
    console.error('Error generating questions:', error);
    return Response.json({ error: 'Failed to generate questions', details: error.message }, { status: 500 });
  }
}

