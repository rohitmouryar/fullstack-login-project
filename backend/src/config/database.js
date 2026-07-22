import mysql from 'mysql2/promise';

let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4',
      timezone: 'Z',
    });
  }
  return pool;
}

export async function verifyDatabaseConnection() {
  const connection = await getPool().getConnection();

  try {
    await connection.ping();
    console.log('MySQL database connected successfully.');
  } finally {
    connection.release();
  }
}

export default {
  execute(sql, values) {
    return getPool().execute(sql, values);
  },
};
