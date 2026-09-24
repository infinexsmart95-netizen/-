import { kv } from '@vercel/kv';
import axios from 'axios';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method!== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { token, botName, vipLink, customMessage } = req.body;

    if (!token ||!botName ||!vipLink ||!customMessage) {
      return res.status(400).json({ error: 'Sab fields bharo yar' });
    }

    const botId = token.split(':')[0];
    if (!botId) return res.status(400).json({ error: 'Galat token hai' });

    // 1. Vercel KV me save - Full auto
    await kv.set(`bot:${botId}`, {
      token,
      botName,
      vipLink,
      customMessage,
      createdAt: new Date().toISOString()
    });

    // 2. Webhook auto set - User ko kuch nahi karna
    const host = req.headers.host;
    const webhookUrl = `https://${host}/api/webhook?bot_id=${botId}`;

    const setWebhookRes = await axios.get(
      `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}&allowed_updates=["chat_join_request"]`
    );

    if (!setWebhookRes.data.ok) {
      return res.status(400).json({ error: 'Token galat hai ya Telegram error: ' + setWebhookRes.data.description });
    }

    return res.status(200).json({
      success: true,
      botId,
      webhookUrl,
      message: 'Bot 100% Live Ho Gaya!'
    });

  } catch (e) {
    console.error(e.response?.data || e.message);
    return res.status(500).json({ error: 'Server error: ' + (e.response?.data?.description || e.message) });
  }
}
