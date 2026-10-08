-- 创建数据库
CREATE DATABASE IF NOT EXISTS `golden_goose` 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE `golden_goose`;

-- 用户表会由Sequelize自动创建，这里仅作参考
-- CREATE TABLE IF NOT EXISTS `users` (
--   `id` INT AUTO_INCREMENT PRIMARY KEY,
--   `openid` VARCHAR(100) NOT NULL UNIQUE,
--   ...
-- );

-- 设置MySQL时区
SET time_zone = '+08:00';

-- 创建数据库用户（可选，生产环境建议使用专用账号）
-- CREATE USER IF NOT EXISTS 'golden_goose_user'@'localhost' IDENTIFIED BY 'strong_password_here';
-- GRANT ALL PRIVILEGES ON golden_goose.* TO 'golden_goose_user'@'localhost';
-- FLUSH PRIVILEGES;

