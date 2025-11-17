import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { HttpExceptionFilter } from './common/exceptions/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Only allow your current frontend (Docker frontend or host)
  const frontendOrigin = process.env.VITE_FRONTEND_URL;

  app.enableCors({
    origin: frontendOrigin,
    credentials: true, // allow cookies/headers
  });

  app.use(cookieParser());
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.PORT || 5000;
  await app.listen(port);
  console.log(`Backend running on port ${port}`);
}
bootstrap();
