import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

type UsageRecord = { date: string; count: number };
const DAILY_LIMIT = 3;
const usageByIp = new Map<string, UsageRecord>();
const DEFAULT_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image';
const FALLBACK_IMAGE_MODEL = 'gemini-2.5-flash-image';

// NOTE: Vercel Serverless instances are ephemeral and memory is not globally/shared or durable.
// This is a lightweight temporary guard only; replace with Redis / Vercel Firewall for production-grade limits.
const checkAndConsumeDailyLimit = (ip: string): { allowed: boolean; remaining: number } => {
  const today = new Date().toISOString().slice(0, 10);
  const current = usageByIp.get(ip);
  if (!current || current.date !== today) {
    usageByIp.set(ip, { date: today, count: 1 });
    return { allowed: true, remaining: DAILY_LIMIT - 1 };
  }
  if (current.count >= DAILY_LIMIT) return { allowed: false, remaining: 0 };
  current.count += 1;
  usageByIp.set(ip, current);
  return { allowed: true, remaining: DAILY_LIMIT - current.count };
};

const generateImage = async (ai: GoogleGenAI, model: string, prompt: string) => {
  return ai.models.generateContent({
    model,
    contents: { parts: [{ text: prompt }] },
  });
};

const extractImageBase64 = (response: Awaited<ReturnType<typeof generateImage>>) => {
  const part = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
  return part?.inlineData?.data;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const ip = ((req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
    const limit = checkAndConsumeDailyLimit(ip);
    if (!limit.allowed) return res.status(429).json({ error: 'Daily generation limit reached' });

    const { prompt } = req.body ?? {};
    if (!prompt || typeof prompt !== 'string') return res.status(400).json({ error: 'Invalid request' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Server configuration error' });

    const ai = new GoogleGenAI({ apiKey });
    let imageBase64: string | undefined;
    let usedModel = DEFAULT_IMAGE_MODEL;

    try {
      const response = await generateImage(ai, DEFAULT_IMAGE_MODEL, prompt);
      imageBase64 = extractImageBase64(response);
    } catch {
      if (DEFAULT_IMAGE_MODEL !== FALLBACK_IMAGE_MODEL) {
        usedModel = FALLBACK_IMAGE_MODEL;
        const fallbackResponse = await generateImage(ai, FALLBACK_IMAGE_MODEL, prompt);
        imageBase64 = extractImageBase64(fallbackResponse);
      } else {
        throw new Error('Generation failed');
      }
    }

    if (!imageBase64) return res.status(502).json({ error: 'Generation failed' });
    return res.status(200).json({ imageBase64, model: usedModel });
  } catch {
    return res.status(500).json({ error: 'Failed to generate image' });
  }
}
