import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips out any properties that do NOT have decorators in the DTO
      transform: true, // Automatically transforms payloads into DTO class instances
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
