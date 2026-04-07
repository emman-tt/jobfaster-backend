interface userPayload {
  sub: string;
  role: string;
  email?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: userPayload;
    }
  }
}
