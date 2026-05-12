import { Router } from 'express';
import { OpenAI } from 'openai';

const router = Router();

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

router.post('/generate-post', async (req, res) => {
  const { motoModel, tone, platform, category } = req.body;
  
  const prompt = `Actúa como un experto en marketing de motos. Crea un post para ${platform} sobre la moto ${motoModel}. 
  Tono: ${tone}. 
  Categoría: ${category}. 
  Incluye 5 hashtags relevantes y un llamado a la acción. 
  Devuelve el resultado en formato JSON: { "content": "texto del post", "hashtags": "#moto #ride...", "title": "título" }`;

  try {
    if (!openai) {
      return res.status(400).json({ error: 'OpenAI API key not configured. Please use the Gemini AI features in the frontend.' });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });
    
    const result = JSON.parse(response.choices[0].message.content || '{}');
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'AI generation failed' });
  }
});

export default router;
