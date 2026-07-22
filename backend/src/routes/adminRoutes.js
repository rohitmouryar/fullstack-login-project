import { Router } from 'express';
import {
  createUser,
  deleteUser,
  listUsers,
  toPublicUser,
  updateUserStatus,
} from '../store/userStore.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { requestContext, sendSecurityEvent } from '../services/siemLogger.js';

const router = Router();

router.use(requireAuth, requireAdmin);

function validateEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email);
}

router.get('/users', async (_req, res, next) => {
  try {
    const users = await listUsers();
    return res.json({ users });
  } catch (error) {
    next(error);
  }
});

router.post('/users', async (req, res, next) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (name.length < 2 || name.length > 80) {
      return res.status(400).json({ message: 'Name must contain 2 to 80 characters.' });
    }

    if (!validateEmail(email) || email.length > 160) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ message: 'Password must contain 8 to 128 characters.' });
    }

    const user = await createUser({
      name,
      email,
      password,
      role: 'user',
      createdBy: req.auth.userId,
    });

    void sendSecurityEvent({
      ...requestContext(req),
      severity: 'informational',
      eventType: 'iam',
      action: 'user-created',
      outcome: 'success',
      user: email,
      message: `Administrator ${req.auth.userId} created user ${email}`,
      tags: ['administration', 'user-management'],
    });

    return res.status(201).json({
      message: 'User account created successfully.',
      user: toPublicUser(user),
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/users/:id/status', async (req, res, next) => {
  try {
    const status = req.body.status;
    if (!['active', 'disabled'].includes(status)) {
      return res.status(400).json({ message: 'Status must be active or disabled.' });
    }

    const user = await updateUserStatus(req.params.id, status);
    void sendSecurityEvent({
      ...requestContext(req),
      severity: status === 'disabled' ? 'medium' : 'informational',
      eventType: 'iam',
      action: `user-${status}`,
      outcome: 'success',
      user: user.email,
      message: `Administrator ${req.auth.userId} changed ${user.email} status to ${status}`,
      tags: ['administration', 'user-management'],
    });
    return res.json({ message: `User account ${status}.`, user: toPublicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.delete('/users/:id', async (req, res, next) => {
  try {
    await deleteUser(req.params.id);
    void sendSecurityEvent({
      ...requestContext(req),
      severity: 'high',
      eventType: 'iam',
      action: 'user-deleted',
      outcome: 'success',
      message: `Administrator ${req.auth.userId} deleted user ${req.params.id}`,
      tags: ['administration', 'user-management'],
    });
    return res.json({ message: 'User account deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

export default router;
