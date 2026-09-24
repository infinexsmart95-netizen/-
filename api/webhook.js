import { kv } from '@vercel/kv';
import axios from 'axios';

export default async function handler(req, res) {
  const botId = req.query.bot_id;

  if (req.method === 'GET') {
    return res.status(200).send(`👑 Royal Builder Webhook Online for Bot: ${botId || 'Unknown'}`);
  }

  if (!botId) return res.status(200).send('No bot_id');

  try {
    let update = req.body;
    if (typeof update === 'string') update = JSON.parse(update);

    if (!update.chat_join_request) return res.status(200).send('Not join request');

    // Database se us bot ka config nikalo
    const config = await kv.get(`bot:${botId}`);
    if (!config) {
      console.log(`Bot ${botId} not found in KV`);
      return res.status(200).send('Bot not found');
    }

    const from = update.chat_join_request.from;
    const userId = update.chat_join_request.user_chat_id || from.id;
    const firstName = from.first_name || 'Trader';

    // User ka custom message + variables replace
    let finalMessage = config.customMessage
     .replace(/{firstName}/g, firstName)
     .replace(/{botName}/g, config.botName);

    await axios.post(`https://api.telegram.org/bot${config.token}/sendMessage`, {
      chat_id: userId,
      text: finalMessage,
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [[{ text: `👑 JOIN ${config.botName}`, url: config.vipLink }]]
      }
    });

    console.log(`Sent to ${userId} for bot ${botId}`);
    return res.status(200).send('OK');

  } catch (e) {
    console.log('Webhook Error:', e.response?.data || e.message);
    return res.status(200).send('Error handled');
  }
}
