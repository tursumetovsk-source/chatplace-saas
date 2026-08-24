import { AutomationEngine } from '@chatplace/automation-engine';
import { ChannelService } from '@chatplace/channel-sdk';

console.log('⚙️ Virale AI Background Workers initialized (BullMQ Automation / AI / Messaging Queues)');

const engine = new AutomationEngine();
const channels = new ChannelService();

console.log('Workers listening on queues:');
console.log(' - automation.execute');
console.log(' - message.send');
console.log(' - ai.reply');
console.log(' - webhook.process');
