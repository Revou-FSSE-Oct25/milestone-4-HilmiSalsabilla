import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Enable CORS
  app.enableCors();

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('RevoBank API')
    .setDescription(
      `
## RevoBank - Secure Banking API

A robust and secure banking API built with NestJS and Prisma.

### Features
- 🔐 JWT Authentication & Role-Based Access Control
- 🏦 Bank Account Management (CRUD)
- 💸 Transactions: Deposit, Withdraw, Transfer
- 📊 Transaction History & Details
- 👥 User Profile Management

### Authentication
Use the \`/api/v1/auth/login\` endpoint to get a JWT token, then click **Authorize** and enter: \`Bearer <your_token>\`
    `,
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT-auth',
    )
    .addTag('Auth', 'User registration and authentication')
    .addTag('Users', 'User profile management')
    .addTag('Accounts', 'Bank account management')
    .addTag('Transactions', 'Deposit, withdraw, and transfer operations')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 RevoBank API running on: http://localhost:${port}/api/v1`);
  console.log(`📖 Swagger docs at:          http://localhost:${port}/api/docs`);
}

bootstrap();
