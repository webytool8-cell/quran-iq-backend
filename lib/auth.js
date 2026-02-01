/**
 * Authentication Utilities
 * JWT token generation and verification
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = '7d'; // 7 days

if (!JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET not set! Authentication will fail.');
}

/**
 * Generate JWT token for user
 */
export function generateToken(user) {
  const payload = {
    userId: user.id || user.objectId,
    email: user.email,
    name: user.name
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Verify JWT token and return decoded payload
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Middleware to require authentication
 */
export function requireAuth(handler) {
  return async (req, res) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'No token provided' 
        });
      }

      const token = authHeader.substring(7); // Remove 'Bearer '
      const decoded = verifyToken(token);

      // Attach user info to request
      req.user = decoded;

      return handler(req, res);
    } catch (error) {
      console.error('Auth middleware error:', error);
      
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: error.message 
      });
    }
  };
}

/**
 * Extract user from request (optional auth)
 */
export function getUser(req) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    return verifyToken(token);
  } catch (error) {
    return null;
  }
}
