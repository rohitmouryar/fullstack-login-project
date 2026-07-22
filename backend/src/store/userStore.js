import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import pool from '../config/database.js';

const userColumns = `
  id,
  name,
  email,
  password_hash AS passwordHash,
  role,
  status,
  created_by AS createdBy,
  created_at AS createdAt,
  updated_at AS updatedAt
`;

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.passwordHash,
    role: row.role,
    status: row.status,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function findUserByEmail(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const [rows] = await pool.execute(
    `SELECT ${userColumns} FROM users WHERE email = ? LIMIT 1`,
    [normalizedEmail],
  );
  return mapUser(rows[0]);
}

export async function findUserById(id) {
  const [rows] = await pool.execute(
    `SELECT ${userColumns} FROM users WHERE id = ? LIMIT 1`,
    [id],
  );
  return mapUser(rows[0]);
}

export async function listUsers() {
  const [rows] = await pool.execute(
    `SELECT ${userColumns} FROM users ORDER BY created_at DESC`,
  );
  return rows.map((row) => toPublicUser(mapUser(row)));
}

export async function createUser({ name, email, password, role = 'user', createdBy = null }) {
  const id = randomUUID();
  const normalizedEmail = email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await pool.execute(
      `INSERT INTO users
        (id, name, email, password_hash, role, status, created_by)
       VALUES (?, ?, ?, ?, ?, 'active', ?)`,
      [id, name.trim(), normalizedEmail, passwordHash, role === 'admin' ? 'admin' : 'user', createdBy],
    );
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      const duplicateError = new Error('An account with this email already exists.');
      duplicateError.statusCode = 409;
      throw duplicateError;
    }
    throw error;
  }

  return findUserById(id);
}

export async function updateUserStatus(id, status) {
  const user = await findUserById(id);

  if (!user) {
    const error = new Error('User account not found.');
    error.statusCode = 404;
    throw error;
  }
  if (user.role === 'admin') {
    const error = new Error('The administrator account cannot be disabled.');
    error.statusCode = 400;
    throw error;
  }

  await pool.execute(
    `UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?`,
    [status === 'disabled' ? 'disabled' : 'active', id],
  );
  return findUserById(id);
}

export async function deleteUser(id) {
  const user = await findUserById(id);

  if (!user) {
    const error = new Error('User account not found.');
    error.statusCode = 404;
    throw error;
  }
  if (user.role === 'admin') {
    const error = new Error('The administrator account cannot be deleted.');
    error.statusCode = 400;
    throw error;
  }

  await pool.execute('DELETE FROM users WHERE id = ?', [id]);
  return user;
}

export async function seedAdminUser() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const existing = await findUserByEmail(adminEmail);
  if (existing) return existing;

  return createUser({
    name: process.env.ADMIN_NAME || 'System Administrator',
    email: adminEmail,
    password: process.env.ADMIN_PASSWORD || 'Admin@123',
    role: 'admin',
  });
}

export function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdBy: user.createdBy,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
