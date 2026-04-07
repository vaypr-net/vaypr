import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import helmet from 'helmet';
import { UserService } from './user/user.service';

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
    'https://api.vaypr.net',
    'https://test.vaypr.net',
    'http://localhost:5173',
    'http://localhost:8081',
  ].filter(Boolean);
  
  console.log('🌐 CORS: Allowed origins:', allowedOrigins);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow missing origin (server-to-server) and 'null' origin
      // (browsers send Origin: null for form posts from 401-served pages)
      if (!origin || origin === 'null') {
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

  // Swagger Configuration — disabled unless SWAGGER_ENABLED=true is set in .env
  const swaggerEnabled = process.env.SWAGGER_ENABLED === 'true';

  if (swaggerEnabled) {
    const userService = app.get(UserService);
    const expressApp  = app.getHttpAdapter().getInstance();

    // ── Token helpers (HMAC-signed session cookie, expires when browser closes) ──
    const SWAGGER_COOKIE = 'sw_auth';
    const COOKIE_SECRET  = process.env.JWT_SECRET || 'swagger-fallback-secret';

    const signToken = (email: string): string => {
      // exp = 8 hours from now so refreshes on long sessions still work
      const exp     = Date.now() + 8 * 60 * 60 * 1000;
      const payload = Buffer.from(JSON.stringify({ email, exp })).toString('base64url');
      const sig     = crypto.createHmac('sha256', COOKIE_SECRET).update(payload).digest('base64url');
      return `${payload}.${sig}`;
    };

    const verifyToken = (token: string): string | null => {
      const dotIdx = token.lastIndexOf('.');
      if (dotIdx === -1) return null;
      const payload = token.slice(0, dotIdx);
      const sig     = token.slice(dotIdx + 1);
      const expected = crypto.createHmac('sha256', COOKIE_SECRET).update(payload).digest('base64url');
      if (expected !== sig) return null;
      try {
        const { email, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
        if (Date.now() > exp) return null;
        return email as string;
      } catch {
        return null;
      }
    };

    const parseCookies = (header = ''): Record<string, string> => {
      const out: Record<string, string> = {};
      header.split(';').forEach(c => {
        const idx = c.indexOf('=');
        if (idx === -1) return;
        out[c.slice(0, idx).trim()] = c.slice(idx + 1).trim();
      });
      return out;
    };

    // ── Custom HTML login form ───────────────────────────────────────────────
    const loginPage = (errorMsg = '') => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>API Docs — Sign In</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,sans-serif;background:#0f0f1a;display:flex;justify-content:center;align-items:center;min-height:100vh}
    .card{background:#fff;padding:2rem 2.25rem;border-radius:10px;width:340px;box-shadow:0 8px 32px rgba(0,0,0,.45)}
    h2{font-size:1.15rem;color:#111;margin-bottom:1.5rem;border-bottom:1px solid #eee;padding-bottom:.75rem}
    label{display:block;font-size:.82rem;font-weight:600;color:#444;margin-bottom:.35rem}
    input{width:100%;padding:.55rem .75rem;border:1px solid #d1d5db;border-radius:6px;font-size:.95rem;outline:none;transition:border .15s}
    input:focus{border-color:#6366f1}
    .field{margin-bottom:1rem}
    .error{background:#fef2f2;color:#b91c1c;font-size:.82rem;padding:.5rem .75rem;border-radius:6px;margin-bottom:1rem;border:1px solid #fecaca}
    button{width:100%;padding:.62rem;background:#6366f1;color:#fff;border:none;border-radius:6px;font-size:.95rem;font-weight:600;cursor:pointer;margin-top:.25rem;transition:background .15s}
    button:hover{background:#4f46e5}
  </style>
</head>
<body>
  <div class="card">
    <h2>API Documentation</h2>
    ${errorMsg ? `<div class="error">${errorMsg}</div>` : ''}
    <form method="POST" action="/__sw_login">
      <div class="field">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" placeholder="admin@example.com" required autofocus />
      </div>
      <div class="field">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required />
      </div>
      <button type="submit">Sign In</button>
    </form>
  </div>
</body>
</html>`;

    // ── Auth guard middleware ─────────────────────────────────────────────────
    const swaggerAuthMiddleware = (req: any, res: any, next: any) => {
      const cookies = parseCookies(req.headers['cookie']);
      const token   = cookies[SWAGGER_COOKIE];
      if (token && verifyToken(token)) return next();
      // Not authenticated — show the login form
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(401).send(loginPage());
    };

    // ── Login POST handler ────────────────────────────────────────────────────
    expressApp.post(
      '/__sw_login',
      bodyParser.urlencoded({ extended: true }),
      async (req: any, res: any) => {
        const email    = (req.body?.email    || '').toLowerCase().trim();
        const password = (req.body?.password || '');

        const fail = (msg: string) => {
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          return res.status(401).send(loginPage(msg));
        };

        if (!email || !password) return fail('Email and password are required.');

        try {
          const user = await userService.findByEmail(email);
          if (!user || !user.isSuperAdmin || !user.password) return fail('Invalid credentials.');
          const ok = await bcrypt.compare(password, user.password);
          if (!ok) return fail('Invalid credentials.');
          // Set HttpOnly session cookie (no Max-Age → clears when browser closes)
          const token = signToken(email);
          res.setHeader('Set-Cookie', `${SWAGGER_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/`);
          return res.redirect(302, '/api');
        } catch {
          return fail('Server error. Please try again.');
        }
      },
    );

    // Protect all Swagger paths — register BEFORE SwaggerModule.setup()
    expressApp.use(['/api', '/api-json', '/api-yaml', '/api-static'], swaggerAuthMiddleware);

    // ── Mount Swagger ─────────────────────────────────────────────────────────
    const config = new DocumentBuilder()
      .setTitle('Vaypr Backend API')
      .setDescription('Invoice, Quote, and Receipt Management System')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, documentFactory);

    console.log('📖 Swagger: enabled — protected by custom login form (super admin credentials)');
  } else {
    console.log('📖 Swagger: disabled (set SWAGGER_ENABLED=true to enable)');
  }

  const port = process.env.PORT ?? 8081;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Backend API is running on: http://0.0.0.0:${port}`);
  console.log(`🔒 Security: Helmet enabled, Rate limiting active`);
}
bootstrap();
