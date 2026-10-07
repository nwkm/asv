import { createApp } from './create-app';
import { config } from './config';

const app = await createApp();
await app.listen(config.port(), '0.0.0.0');
