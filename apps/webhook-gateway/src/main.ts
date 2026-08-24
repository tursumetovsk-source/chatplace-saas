import express from 'express';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4001;

// Webhook Gateway Endpoint for Meta (Instagram / WhatsApp)
app.post('/webhooks/meta', (req, res) => {
  console.log('[Webhook Gateway] Received Instagram/Meta webhook event');
  res.status(200).send('EVENT_RECEIVED');
});

// Webhook Gateway Endpoint for Telegram
app.post('/webhooks/telegram', (req, res) => {
  console.log('[Webhook Gateway] Received Telegram webhook event');
  res.status(200).json({ ok: true });
});

// Webhook Gateway Endpoint for TikTok
app.post('/webhooks/tiktok', (req, res) => {
  console.log('[Webhook Gateway] Received TikTok webhook event');
  res.status(200).json({ code: 0 });
});

app.listen(PORT, () => {
  console.log(`⚡ Virale AI Webhook Gateway running on http://localhost:${PORT}`);
});
