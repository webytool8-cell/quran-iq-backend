import { hash } from 'bcryptjs';
import { handleCors } from '../../lib/cors.js';
import { generateToken } from '../../lib/auth.js';
import { createUser, findUserByEmail } from '../../lib/db.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters' 
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await hash(password, 10);

    // Create user in database
    const newUser = await createUser({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      joinedAt: new Date().toISOString(),
      journeyProgress: '{}'
    });

    // Generate JWT token
    const token = generateToken({
      id: newUser.objectId,
      email: newUser.objectData.email,
      name: newUser.objectData.name
    });

    // Return success response
    return res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser.objectId,
        name: newUser.objectData.name,
        email: newUser.objectData.email,
        joinedAt: newUser.objectData.joinedAt,
        journeyProgress: '{}'
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      error: 'Registration failed. Please try again.' 
    });
  }
}

export default handleCors(handler);
