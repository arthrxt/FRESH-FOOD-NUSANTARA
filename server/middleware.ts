import { Request, Response, NextFunction } from 'express';
import { dbStore } from './db';
import { AppUser, UserRole } from './types';
import crypto from 'crypto';

export interface AuthenticatedRequest extends Request {
  user?: AppUser;
  sessionId?: string;
  idempotencyKey?: string;
}

// In-Memory Rate Limiter untuk proteksi brute force
const loginRateLimitMap = new Map<string, { attempts: number; resetTime: number }>();

export function rateLimitLogin(req: Request, res: Response, next: NextFunction) {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 menit
  const maxAttempts = 10;

  const current = loginRateLimitMap.get(ip);
  if (current) {
    if (now > current.resetTime) {
      loginRateLimitMap.set(ip, { attempts: 1, resetTime: now + windowMs });
    } else {
      current.attempts += 1;
      if (current.attempts > maxAttempts) {
        const remainingMinutes = Math.ceil((current.resetTime - now) / 60000);
        return res.status(429).json({
          success: false,
          error: {
            code: 'TOO_MANY_ATTEMPTS',
            message: `Terlalu banyak percobaan login gagal dari alamat IP Anda. Silakan coba lagi dalam ${remainingMinutes} menit.`,
          },
        });
      }
    }
  } else {
    loginRateLimitMap.set(ip, { attempts: 1, resetTime: now + windowMs });
  }

  next();
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Hanya prioritaskan HttpOnly cookie, abaikan token localStorage jika ada cookie
  const token = req.cookies?.['ffn_session'] || req.headers['authorization']?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Sesi belum terautentikasi. Silakan login terlebih dahulu.' },
    });
  }

  const db = dbStore.getData();
  const session = db.sessions.find((s) => s.id === token);

  if (!session) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_SESSION', message: 'Sesi login tidak valid atau telah berakhir.' },
    });
  }

  if (new Date(session.expiresAt) < new Date()) {
    // Bersihkan sesi expired
    db.sessions = db.sessions.filter((s) => s.id !== token);
    dbStore.saveData();
    return res.status(401).json({
      success: false,
      error: { code: 'SESSION_EXPIRED', message: 'Sesi login Anda telah berakhir. Silakan login kembali.' },
    });
  }

  const user = db.users.find((u) => u.id === session.userId);
  if (!user || !user.isActive) {
    return res.status(401).json({
      success: false,
      error: { code: 'USER_INACTIVE', message: 'Akun pengguna dinonaktifkan atau tidak terdaftar.' },
    });
  }

  req.user = user;
  req.sessionId = session.id;
  next();
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Autentikasi diperlukan.' },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Otoritas ditolak: Role '${req.user.role}' tidak memiliki hak akses untuk tindakan ini.`,
        },
      });
    }

    next();
  };
}

// Enterprise Idempotency Middleware dengan Locking & Result Caching
export function idempotencyMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const key = req.headers['idempotency-key'] as string;
  if (!key) {
    return next();
  }

  req.idempotencyKey = key;
  const db = dbStore.getData();
  const existing = db.idempotency.find((i) => i.key === key);

  if (existing) {
    if (existing.status === 'PROCESSING') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONCURRENT_REQUEST',
          message: 'Transaksi sedang dalam proses oleh sistem. Harap tidak mengirim ulang permintaan yang sama.',
        },
      });
    }
    // Return cached response
    return res.status(existing.statusCode).json(existing.responseBody);
  }

  // Daftarkan kunci dengan status PROCESSING
  const requestHash = crypto.createHash('sha256').update(JSON.stringify(req.body || {})).digest('hex');
  const record = {
    key,
    userId: req.user?.id || 'system',
    requestHash,
    status: 'PROCESSING' as const,
    statusCode: 200,
    responseBody: null,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
  };

  db.idempotency.push(record);
  dbStore.saveData();

  // Intercept json response to cache
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    const target = db.idempotency.find((i) => i.key === key);
    if (target) {
      target.status = res.statusCode >= 400 ? 'FAILED' : 'COMPLETED';
      target.statusCode = res.statusCode;
      target.responseBody = body;
      dbStore.saveData();
    }
    return originalJson(body);
  };

  next();
}
