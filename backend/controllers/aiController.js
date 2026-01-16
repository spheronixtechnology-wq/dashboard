import { GoogleGenAI, Type } from "@google/genai";

// @desc    Generate questions using AI
// @route   POST /api/generate-questions
// @access  Private (Instructor)
const generateQuestions = async (req, res) => {
  const { topic, count, difficulty } = req.body;

  try {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("API Key missing for AI generation.");
      return res.status(500).json({ success: false, message: 'API Key missing.' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp', // Updated model
      contents: `Generate ${count} multiple choice questions about "${topic}" with difficulty level "${difficulty}".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING, description: 'The question text' },
              options: { type: Type.ARRAY, items: { type: Type.STRING }, description: '4 possible answers' },
              correctAnswer: { type: Type.STRING, description: 'The correct option string, must exactly match one of the options' },
              type: { type: Type.STRING, description: 'Always set to "MCQ"' },
              maxMarks: { type: Type.NUMBER, description: 'Marks for the question, usually 10' }
            },
            required: ['text', 'options', 'correctAnswer', 'type', 'maxMarks']
          }
        }
      }
    });

    const rawText = typeof response?.text === 'function' ? response.text() : response?.text;
    let jsonStr = rawText || '[]';
    jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();

    let questions;
    try {
      questions = JSON.parse(jsonStr);
    } catch (parseError) {
      const rawText2 = typeof response?.text === 'function' ? response.text() : response?.text;
      console.error('JSON Parse Error:', parseError, 'Response:', rawText2);
      return res.status(500).json({ success: false, message: 'Failed to parse AI response. Try again.' });
    }

    if (!Array.isArray(questions)) questions = [questions];

    const processed = questions.map(q => ({
      ...q,
      id: Math.random().toString(36).substr(2, 9), // Keep ID for frontend
      type: 'MCQ'
    }));

    res.status(200).json({ success: true, data: processed });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ success: false, message: error.message || 'Failed to generate questions via AI.' });
  }
};

export { generateQuestions };
