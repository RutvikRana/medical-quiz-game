export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { disease } = req.body;

  if (!disease) {
    return res.status(400).json({ error: 'Missing disease name' });
  }

  const prompt = `
    Generate a multiple choice question about ${disease}.
    Include 4 options (A, B, C, D). Mark the correct answer with an asterisk (*).
    Example:
    What is a key symptom of Parkinson's Disease?
    A) Fever
    B) Tremor*
    C) Rash
    D) Headache
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
      throw new Error(`Gemini: ${err.error.message}`);
    }

    const data = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Failed to generate question.';

    res.status(200).json({ mcq: aiText });
  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({ error: 'Failed to generate MCQ' });
  }
}
