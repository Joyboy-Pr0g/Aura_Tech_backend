import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit, { type RateLimitExceededEventHandler } from 'express-rate-limit';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { isInternalRequest } from './utils/isInternalRequest';
import { APIResponse } from './core/responses/api-response';

const app = express();

app.set('trust proxy', 1);

const jsonRateLimitHandler: RateLimitExceededEventHandler = (_req, res) => {
  res.status(429).json(APIResponse.error('Too many requests, please try again later.'));
};

// ─── Security Headers ────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  }),
);

// ─── Rate Limiting ───────────────────────────────────────────────────────────
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    handler: jsonRateLimitHandler,
    skip: (req) => req.originalUrl.startsWith('/api/visits') || isInternalRequest(req),
  }),
);

// Stricter limit for auth endpoints
app.use(
  '/api/auth',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    handler: (_req, res) => {
      res.status(429).json(APIResponse.error('Too many auth requests, please try again in 15 minutes.'));
    },
  }),
);

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Visits are proxied from the Next.js storefront (shared egress IP), so key by visitor id.
app.use(
  '/api/visits',
  rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    handler: jsonRateLimitHandler,
    keyGenerator: (req) => {
      const visitorId = req.body?.visitor_id;
      if (typeof visitorId === 'string' && visitorId.trim()) {
        return `visit:${visitorId.trim()}`;
      }

      return req.ip ?? 'unknown';
    },
  }),
);

app.use(compression() as any);

// ─── Logging ─────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api', routes);

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use('*', (_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
