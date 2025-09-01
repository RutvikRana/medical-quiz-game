export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { disease, mcq } = req.body;

  if (!disease || !mcq) {
    return res.status(400).json({ error: 'Missing required data' });
  }

  const prompt = `
    You are a clinical professor explaining a diagnosis to medical students.
    
    DISEASE: ${disease}
    QUIZ QUESTION: ${mcq}
    
    Provide a concise clinical explanation (3-4 sentences) that:
    1. Explains WHY this is the correct diagnosis
    2. Mentions key clinical features seen in the video
    3. Differentiates from similar conditions
    4. Uses plain language (no jargon without explanation)
    
    Format as single paragraph. NO headings or bullet points.
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

    if (!response.ok) throw new Error('Gemini API error');

    const data = await response.json();
    const explanation = data.candidates?.[0]?.content?.parts?.[0]?.text || 
      "This condition is characterized by key clinical features visible in the video. The diagnosis is confirmed by the presence of specific signs that differentiate it from similar conditions.";

    res.status(200).json({ explanation });
    
  } catch (error) {
    console.error('Explanation Error:', error);
    res.status(500).json({ 
      explanation: "The diagnosis is based on characteristic clinical features visible in the video presentation." 
    });
  }
}
