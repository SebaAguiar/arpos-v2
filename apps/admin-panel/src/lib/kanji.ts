import { KanjijsAdapter } from '@kanjijs/platform-hono';
import { ZodValidator } from '@kanjijs/contracts';
import { AppModule } from '@/modules/app.module';

import 'reflect-metadata';

let kanjiInstance: Awaited<ReturnType<typeof KanjijsAdapter.create>> | null = null;

export async function getKanjiApp() {
  if (!kanjiInstance) {
    kanjiInstance = await KanjijsAdapter.create(AppModule, {
      validator: new ZodValidator(),
      cors: false,
      securityHeaders: false,
      logger: false,
      requestLogger: false,
    });
  }
  return kanjiInstance;
}
