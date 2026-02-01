import { compare } from 'bcryptjs';
import { handleCors } from '../../lib/cors.js';
import { generateToken } from '../../lib/auth.js';
import { findUserByEmail } from '../../lib/db.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user by email
    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await compare(password, user.objectData.passwordHash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken({
      id: user.objectId,
      email: user.objectData.email,
      name: user.objectData.name
    });

    // Return user data (without password hash)
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.objectId,
        name: user.objectData.name,
        email: user.objectData.email,
        joinedAt: user.objectData.joinedAt,
        journeyProgress: user.objectData.journeyProgress || '{}'
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      error: 'Login failed. Please try again.' 
    });
  }
}

export default handleCors(handler);
