import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';

const router = Router();

router.post('/generate-post', async (req, res) => {
  const { motoModel, tone, platform, category } = req.body;
  
  const prompt = `Actúa como un experto en marketing de motos. Crea un post para ${platform} sobre la moto ${motoModel}. 
  Tono: ${tone}. 
  Categoría: ${category}. 
  Incluye 5 hashtags relevantes y un llamado a la acción. 
  Devuelve el resultado estríctamente en formato JSON válido: { "content": "texto del post", "hashtags": "#moto #ride...", "title": "título" }`;

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(400).json({ error: 'Gemini API key not configured. Please add it to your environment variables.' });
  }

  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('No content returned from Gemini');
    }
    
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error('Gemini Error:', error);
    res.status(500).json({ error: error.message || 'AI generation failed' });
  }
});

export default router;
