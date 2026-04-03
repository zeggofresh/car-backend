import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export interface UserPayload {
  id: string;
  phone: string;
  name?: string;
  role: string;
  business_id?: string;
}

export interface AuthenticatedRequest extends VercelRequest {
  user?: UserPayload;
}

export const verifyToken = (req: AuthenticatedRequest, res: VercelResponse): boolean => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'No token provided' });
    return false;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    console.log('Decoded JWT Token:', decoded);
    
    if (decoded.id === '0' || decoded.id === 0 as any) {
      res.status(401).json({ message: 'Invalid token payload' });
      return false;
    }
    
    req.user = decoded;
    return true;
  } catch (err) {
    res.status(403).json({ message: 'Invalid token' });
    return false;
  }
};

export const requireRole = (req: AuthenticatedRequest, res: VercelResponse, role: string): boolean => {
  if (!verifyToken(req, res)) return false;
  
  if (!req.user || (req.user.role !== role && req.user.role !== 'super_admin')) {
    res.status(403).json({ message: 'Access denied' });
    return false;
  }
  
  return true;
};
