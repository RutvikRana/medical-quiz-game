export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { disease } = req.body;

  if (!disease) {
    return res.status(400).json({ error: 'Missing disease name' });
  }

  const prompt = `
    You are a medical educator creating quiz questions. 
    Generate ONE multiple choice question about ${disease}.
    
    RULES:
    1. Question must be based on CLINICAL PRESENTATION (symptoms, signs)
    2. Include 4 options (A, B, C, D)
    3. Mark correct answer with asterisk (*) AFTER the option
    4. NO explanations or extra text
    5. Format EXACTLY as:
    
    [Question text]
    A) Option text*
    B) Option text
    C) Option text
    D) Option text
    
    Example for Parkinson's:
    What is a cardinal motor symptom of Parkinson's Disease?
    A) Intention tremor
    B) Resting tremor*
    C) Muscle rigidity during movement
    D) Hyperreflexia
  `;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`Gemini API error: ${err.error.message}`);
    }

    const data = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Basic validation
    if (!aiText.includes('*')) {
      throw new Error('Invalid response format');
    }

    res.status(200).json({ 
      mcq: aiText,
      source: 'Gemini 1.5 Flash'
    });
    
  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate medical question',
      details: error.message 
    });
  }
}
