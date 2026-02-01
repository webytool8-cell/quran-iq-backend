import { handleCors } from '../../lib/cors.js';
import { verifyToken } from '../../lib/auth.js';
import { getUser } from '../../lib/db.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    // Verify JWT
    const decoded = verifyToken(token);

    // Verify user still exists in database
    const user = await getUser(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.objectId,
        name: user.objectData.name,
        email: user.objectData.email,
        joinedAt: user.objectData.joinedAt,
        journeyProgress: user.objectData.journeyProgress || '{}'
      }
    });

  } catch (error) {
    console.error('Verify error:', error);
    
    return res.status(401).json({ 
      error: error.message || 'Invalid or expired token'
    });
  }
}

export default handleCors(handler);
