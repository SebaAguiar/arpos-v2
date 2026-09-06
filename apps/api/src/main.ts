import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { LoggingInterceptor } from './core/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.setGlobalPrefix('api');

  // Origins allowed to call the API from a browser/WebView. Defaults to the POS
  // dev server, the legacy Vite port and the Tauri WebView origins so the POS
  // works out of the box. Override with the CORS_ALLOWED_ORIGINS env var
  // (comma-separated list), mirroring the admin-panel CORS behavior.
  const defaultAllowedOrigins = [
    'http://localhost:1420',
    'http://127.0.0.1:1420',
    'http://localhost:5173',
    'tauri://localhost',
    'http://tauri.localhost',
    'http://localhost:4321',
  ];
  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : defaultAllowedOrigins;

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`Arcom API running on http://localhost:${port}/api`);
}

bootstrap();
