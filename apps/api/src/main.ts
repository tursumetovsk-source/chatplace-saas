import express from 'express';
import { AutomationEngine } from '@chatplace/automation-engine';
import { ChannelService } from '@chatplace/channel-sdk';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4000;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ChatPlace Modular Monolith API Gateway', timestamp: new Date().toISOString() });
});

// Conversations REST API matching section 45
app.get('/v1/conversations', (req, res) => {
  res.json({
    data: [
      { id: 'conv_1', contactName: 'Айдос Нурланов', provider: 'INSTAGRAM', mode: 'AI', status: 'OPEN' }
    ]
  });
});

// Automations REST API matching section 47
app.post('/v1/automations/test', async (req, res) => {
  const engine = new AutomationEngine();
  res.json({ status: 'SUCCESS', message: 'Automation flow simulated successfully' });
});

app.listen(PORT, () => {
  console.log(`🚀 ChatPlace API Gateway running on http://localhost:${PORT}`);
});
