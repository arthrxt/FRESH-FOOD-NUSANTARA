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
    // Session expired
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
          message: 'Transaksi dengan ID ini sedang diproses. Mohon tunggu sejenak.',
        },
      });
    }
    return res.status(existing.statusCode).json(existing.responseBody);
  }

  next();
}
