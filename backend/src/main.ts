import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // IMPORTANT: Raw body parsing for Stripe webhook signature verification
  // Must be BEFORE JSON body parser
  app.use('/billing/webhook', bodyParser.raw({ type: 'application/json' }));

  // Increase body size limit for PDF attachments (10MB)
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  // CORS Configuration - Read from environment or use defaults
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:8080',
    'https://vayper-production.up.railway.app', // Remove trailing slash
    'http://localhost:5173', // Vite dev server
  ].filter(Boolean); // Remove empty/undefined values
  
  console.log('🌐 CORS: Allowed origins:', allowedOrigins);
  console.log('🌐 CORS: Using FRONTEND_URL from env:', process.env.FRONTEND_URL);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`❌ CORS blocked: ${origin}`);
        callback(new Error('CORS not allowed'), false);
      }
    },
    credentials: true, // Allow cookies and auth headers
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Length', 'X-JSON-Response'],
    maxAge: 3600,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Vaypr Backend API')
    .setDescription('Invoice, Quote, and Receipt Management System - Complete API documentation for managing invoices, quotes, receipts, clients, and recurring billing')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  const port = process.env.PORT ?? 8081;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Backend API is running on: http://0.0.0.0:${port}`);

  console.log(`📚 Swagger API docs available at: http://localhost:${port}/api`);
  console.log(`⚡ Deployment Version: ${new Date().toISOString()}`);
}
bootstrap();
