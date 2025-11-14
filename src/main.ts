import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { HttpExceptionFilter } from './common/exceptions/http-exception.filter'; // 👈 import

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const frontendUrl = process.env.VITE_FRONTEND_URL;

  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  app.use(cookieParser());

  // 👇 register global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.PORT ?? 5000;
  await app.listen(port);
 
}
bootstrap();
