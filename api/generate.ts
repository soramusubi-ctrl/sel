import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

type UsageRecord = { date: string; count: number };
const DAILY_LIMIT = 3;
const usageByIp = new Map<string, UsageRecord>();
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
