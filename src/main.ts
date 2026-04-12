import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import { ValidationPipe, Logger } from '@nestjs/common';
import { HttpExceptionFilter } from './common/exceptions/http-exception.filter';
import { ConfigService } from '@nestjs/config';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { SerializeInterceptor } from './common/interceptors/serialize.interceptor';


async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

app.useGlobalInterceptors(
  new SerializeInterceptor(),
  new TransformInterceptor(),
)

  // ✅ 1. CORS FIRST — before anything else
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cookie'],
  });

  // ✅ 2. Helmet AFTER cors, with crossOriginResourcePolicy disabled
  app.use(helmet({
    crossOriginResourcePolicy: false,
  }));

  app.use(compression());
  app.use(cookieParser());

  // ✅ 3. Fixed — preserve `this` context using arrow function
  const loggerMiddleware = new LoggerMiddleware();
  app.use((req, res, next) => loggerMiddleware.use(req, res, next));

  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableShutdownHooks();

  const port = configService.get<number>('PORT') || 5000;
  await app.listen(port, '127.0.0.1');

  logger.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();