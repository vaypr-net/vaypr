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

  // Increase body size limit for PDF attachments (50MB)
  // NOTE: This raises the allowed JSON/form payload size to accommodate large
  // base64-encoded attachments. For production scale it's better to switch to
  // multipart/form-data or object storage, but this is a temporary mitigation.
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  // CORS Configuration - Read from environment or use defaults
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:8080',
    'https://vayper-production.up.railway.app', // Remove trailing slash
    'http://localhost:5173', // Vite dev server
    'http://localhost:8081', // Alternative dev port
    'http://127.0.0.1:8081',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:5173',
  ].filter(Boolean); // Remove empty/undefined values
  
  console.log('🌐 CORS: Allowed origins:', allowedOrigins);
  console.log('🌐 CORS: Using FRONTEND_URL from env:', process.env.FRONTEND_URL);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        callback(null, true);
        return;
      }

      // Check if origin matches allowed list or is localhost in development
      const isAllowed = allowedOrigins.includes(origin) || 
                        (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost')) ||
                        (process.env.NODE_ENV !== 'production' && origin.startsWith('http://127.0.0.1'));
      
      if (isAllowed) {
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
      transformOptions: {
        enableImplicitConversion: true,
      },
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
