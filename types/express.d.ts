import { userPayload } from '../middleware/authenticate'; 

declare global {
  namespace Express {
    interface Request {
      user?: userPayload;
    }
  }
}