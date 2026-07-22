import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByEmail, findUserById, toPublicUser } from '../store/userStore.js';
import { requireAuth } from '../middleware/auth.js';
import { requestContext, sendSecurityEvent } from '../services/siemLogger.js';

const router = Router();

function createToken(user) {
  return jwt.sign(
    { email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    {
      subject: user.id,
      expiresIn: process.env.JWT_EXPIRES_IN || '2h',
      issuer: 'novaauth-api',
      audience: 'novaauth-web',
    },
  );
}

function validateEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email);
}

router.post('/login', async (req, res, next) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const context = requestContext(req);

    if (!validateEmail(email) || !password) {
      void sendSecurityEvent({
        ...context,
        severity: 'warning',
        eventType: 'authentication',
        action: 'login',
        outcome: 'failure',
        user: email || 'unknown',
        message: `Invalid login request from ${context.sourceIp}`,
        tags: ['authentication', 'invalid-request'],
      });
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await findUserByEmail(email);
    const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false;

    if (!user || !passwordMatches) {
      void sendSecurityEvent({
        ...context,
        severity: 'warning',
        eventType: 'authentication',
        action: 'login',
        outcome: 'failure',
        user: email,
        message: `Failed login for ${email} from ${context.sourceIp}`,
        tags: ['authentication', 'failed-login'],
      });
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }

    if (user.status !== 'active') {
      void sendSecurityEvent({
        ...context,
        severity: 'high',
        eventType: 'authentication',
        action: 'login',
        outcome: 'failure',
        user: email,
        message: `Login attempt for disabled account ${email} from ${context.sourceIp}`,
        tags: ['authentication', 'disabled-account'],
      });
      return res.status(403).json({ message: 'Your account has been disabled. Contact the administrator.' });
    }

    void sendSecurityEvent({
      ...context,
      severity: 'informational',
      eventType: 'authentication',
      action: 'login',
      outcome: 'success',
      user: user.email,
      message: `Successful login for ${user.email} from ${context.sourceIp}`,
      tags: ['authentication', 'successful-login'],
    });

    return res.json({
      message: 'Signed in successfully.',
      user: toPublicUser(user),
      token: createToken(user),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await findUserById(req.auth.userId);
    if (!user) {
      return res.status(401).json({ message: 'This user account no longer exists.' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Your account has been disabled.' });
    }
    return res.json({ user: toPublicUser(user) });
  } catch (error) {
    next(error);
  }
});

export default router;
