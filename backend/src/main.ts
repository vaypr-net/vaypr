import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers with helmet
  app.use(helmet({
    contentSecurityPolicy: false, // Disable for API
    crossOriginEmbedderPolicy: false,
  }));

  // IMPORTANT: Raw body parsing for Stripe webhook signature verification
  // Must be BEFORE JSON body parser
  app.use('/billing/webhook', bodyParser.raw({ type: 'application/json' }));

  // Reduced body size limit for protection (10MB instead of 50MB)
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  // CORS Configuration - Read from environment or use defaults
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:8080',
    'https://vaypr.net',
    'https://test.vaypr.net',
    'http://localhost:5173',
    'http://localhost:8081',
  ].filter(Boolean);
  
  console.log('🌐 CORS: Allowed origins:', allowedOrigins);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      const isAllowed = allowedOrigins.includes(origin) || 
                        (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost'));
      
      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`❌ CORS blocked: ${origin}`);
        callback(new Error('CORS not allowed'), false);
      }
    },
    credentials: true,
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
    .setDescription('Invoice, Quote, and Receipt Management System')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  const port = process.env.PORT ?? 8081;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Backend API is running on: http://0.0.0.0:${port}`);
  console.log(`🔒 Security: Helmet enabled, Rate limiting active`);
}
bootstrap();
