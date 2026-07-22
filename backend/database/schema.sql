CREATE DATABASE IF NOT EXISTS novaauth
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'novaauth_user'@'localhost'
  IDENTIFIED BY 'ChangeThisStrongPassword123!';
ALTER USER 'novaauth_user'@'localhost'
  IDENTIFIED BY 'ChangeThisStrongPassword123!';
GRANT SELECT, INSERT, UPDATE, DELETE
  ON novaauth.* TO 'novaauth_user'@'localhost';
FLUSH PRIVILEGES;

USE novaauth;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  status ENUM('active', 'disabled') NOT NULL DEFAULT 'active',
  created_by CHAR(36) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_users_role_status (role, status),
  CONSTRAINT fk_users_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;
