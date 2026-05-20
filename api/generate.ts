import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { prompt } = req.body ?? {};
    if (!prompt || typeof prompt !== 'string') return res.status(400).json({ error: 'Invalid request' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Server configuration error' });

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
    });
    const part = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    const imageBase64 = part?.inlineData?.data;
    if (!imageBase64) return res.status(502).json({ error: 'Generation failed' });
    return res.status(200).json({ imageBase64 });
  } catch {
    return res.status(500).json({ error: 'Failed to generate image' });
  }
}
