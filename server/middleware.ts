import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { dbStore } from './db';
import { AppUser, UserRole } from './types';

export interface AuthenticatedRequest extends Request {
  user?: AppUser;
  sessionId?: string;
  idempotencyKey?: string;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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
      error: { code: 'INVALID_SESSION', message: 'Sesi login tidak valid atau telah kedaluwarsa.' },
    });
  }

  if (new Date(session.expiresAt) < new Date()) {
    void dbStore.transaction((state) => {
      state.sessions = state.sessions.filter((s) => s.id !== token);
    });
    return res.status(401).json({
      success: false,
      error: { code: 'SESSION_EXPIRED', message: 'Sesi login Anda telah berakhir. Silakan login kembali.' },
    });
  }

  const user = db.users.find((u) => u.id === session.userId);
  if (!user || !user.isActive) {
    return res.status(401).json({
      success: false,
      error: { code: 'USER_INACTIVE', message: 'Akun Anda tidak aktif atau tidak ditemukan.' },
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
          message: `Akses ditolak. Peran '${req.user.role}' tidak memiliki izin untuk tindakan ini.`,
        },
      });
    }

    next();
  };
}

export function markIdempotencySuccess(req: AuthenticatedRequest, statusCode: number, responseBody: any) {
  if (!req.idempotencyKey) return;
  void dbStore.completeIdempotency(req.idempotencyKey, 'COMPLETED', statusCode, responseBody);
}

export function markIdempotencyFailure(req: AuthenticatedRequest, statusCode: number, responseBody: any) {
  if (!req.idempotencyKey) return;
  void dbStore.completeIdempotency(req.idempotencyKey, 'FAILED', statusCode, responseBody);
}

export async function idempotencyMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const rawKey = req.headers['idempotency-key'];
  const key = typeof rawKey === 'string' ? rawKey.trim() : '';
  if (!key) {
    return next();
  }
  if (key.length > 128) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_IDEMPOTENCY_KEY', message: 'Idempotency-Key terlalu panjang.' },
    });
  }

  const userId = req.user?.id || 'anonymous';
  const endpoint = `${req.method} ${req.path}`;
  const scopedKey = crypto.createHash('sha256').update(`${userId}:${endpoint}:${key}`).digest('hex');
  const requestHash = crypto.createHash('sha256').update(JSON.stringify(req.body ?? null)).digest('hex');
  req.idempotencyKey = scopedKey;
  const claim = await dbStore.claimIdempotency(scopedKey, userId, endpoint, requestHash);

  if (claim.state === 'CONFLICT') {
    return res.status(409).json({
      success: false,
      error: {
        code: 'IDEMPOTENCY_KEY_REUSED',
        message: 'Idempotency-Key sudah digunakan untuk endpoint atau payload berbeda.',
      },
    });
  }
  if (claim.state === 'REPLAY' && claim.record) {
    if (claim.record.status === 'PROCESSING') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CONCURRENT_REQUEST',
          message: 'Transaksi dengan ID ini sedang diproses. Mohon tunggu sejenak.',
        },
      });
    }
    return res.status(claim.record.statusCode).json(claim.record.responseBody);
  }

  const originalJson = res.json.bind(res);
  res.json = ((body: unknown) => {
    const statusCode = res.statusCode;
    const status = statusCode >= 400 ? 'FAILED' : 'COMPLETED';
    void dbStore.completeIdempotency(scopedKey, status, statusCode, body);
    return originalJson(body);
  }) as Response['json'];
  next();
}
