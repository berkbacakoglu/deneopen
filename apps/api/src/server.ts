import 'dotenv/config';
import { buildApp } from './app';

const port = Number(process.env.PORT ?? 3001);
const app = buildApp();

app.listen({ port, host: '0.0.0.0' }).catch((error: unknown) => {
  app.log.error({ err: error }, 'startup_failed');
  process.exit(1);
});
