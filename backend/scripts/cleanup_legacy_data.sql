-- 清理历史遗留：users 表重复唯一索引 + 旧兜底账号的孤儿测试数据
-- 背景：backend/app.js 曾使用 db.sync({ alter: true })，每次启动都会给 openid / unionid
--       的 unique 列重新追加一个唯一索引（MySQL 自动改名为 openid_1..N / unionid_N..N），
--       索引数达到单表上限 64 后服务直接启动失败（ER_TOO_MANY_KEYS）。
--       代码已改为 db.sync()，本脚本负责清掉已经堆出来的冗余索引。
-- 数据安全：只删除重复项，openid 与 unionid 各自保留一个唯一索引，唯一约束仍然生效。
-- 执行前请先备份：mysqldump --single-transaction golden_goose > backup.sql

USE golden_goose;

-- ---------- 第 1 步：先看要删哪些索引（只读，可单独执行） ----------
SELECT index_name, column_name
FROM information_schema.statistics
WHERE table_schema = DATABASE()
  AND table_name = 'users'
  AND index_name NOT IN ('PRIMARY', 'openid', 'unionid')
GROUP BY index_name, column_name
ORDER BY index_name;

-- ---------- 第 2 步：删除冗余索引 ----------
-- 以下 61 条按 information_schema 实测结果列出（openid_2..openid_32 共 31 个、
-- unionid_2..unionid_31 共 30 个），保留 PRIMARY / openid / unionid。
ALTER TABLE `users` DROP INDEX `openid_2`;
ALTER TABLE `users` DROP INDEX `openid_3`;
ALTER TABLE `users` DROP INDEX `openid_4`;
ALTER TABLE `users` DROP INDEX `openid_5`;
ALTER TABLE `users` DROP INDEX `openid_6`;
ALTER TABLE `users` DROP INDEX `openid_7`;
ALTER TABLE `users` DROP INDEX `openid_8`;
ALTER TABLE `users` DROP INDEX `openid_9`;
ALTER TABLE `users` DROP INDEX `openid_10`;
ALTER TABLE `users` DROP INDEX `openid_11`;
ALTER TABLE `users` DROP INDEX `openid_12`;
ALTER TABLE `users` DROP INDEX `openid_13`;
ALTER TABLE `users` DROP INDEX `openid_14`;
ALTER TABLE `users` DROP INDEX `openid_15`;
ALTER TABLE `users` DROP INDEX `openid_16`;
ALTER TABLE `users` DROP INDEX `openid_17`;
ALTER TABLE `users` DROP INDEX `openid_18`;
ALTER TABLE `users` DROP INDEX `openid_19`;
ALTER TABLE `users` DROP INDEX `openid_20`;
ALTER TABLE `users` DROP INDEX `openid_21`;
ALTER TABLE `users` DROP INDEX `openid_22`;
ALTER TABLE `users` DROP INDEX `openid_23`;
ALTER TABLE `users` DROP INDEX `openid_24`;
ALTER TABLE `users` DROP INDEX `openid_25`;
ALTER TABLE `users` DROP INDEX `openid_26`;
ALTER TABLE `users` DROP INDEX `openid_27`;
ALTER TABLE `users` DROP INDEX `openid_28`;
ALTER TABLE `users` DROP INDEX `openid_29`;
ALTER TABLE `users` DROP INDEX `openid_30`;
ALTER TABLE `users` DROP INDEX `openid_31`;
ALTER TABLE `users` DROP INDEX `openid_32`;
ALTER TABLE `users` DROP INDEX `unionid_2`;
ALTER TABLE `users` DROP INDEX `unionid_3`;
ALTER TABLE `users` DROP INDEX `unionid_4`;
ALTER TABLE `users` DROP INDEX `unionid_5`;
ALTER TABLE `users` DROP INDEX `unionid_6`;
ALTER TABLE `users` DROP INDEX `unionid_7`;
ALTER TABLE `users` DROP INDEX `unionid_8`;
ALTER TABLE `users` DROP INDEX `unionid_9`;
ALTER TABLE `users` DROP INDEX `unionid_10`;
ALTER TABLE `users` DROP INDEX `unionid_11`;
ALTER TABLE `users` DROP INDEX `unionid_12`;
ALTER TABLE `users` DROP INDEX `unionid_13`;
ALTER TABLE `users` DROP INDEX `unionid_14`;
ALTER TABLE `users` DROP INDEX `unionid_15`;
ALTER TABLE `users` DROP INDEX `unionid_16`;
ALTER TABLE `users` DROP INDEX `unionid_17`;
ALTER TABLE `users` DROP INDEX `unionid_18`;
ALTER TABLE `users` DROP INDEX `unionid_19`;
ALTER TABLE `users` DROP INDEX `unionid_20`;
ALTER TABLE `users` DROP INDEX `unionid_21`;
ALTER TABLE `users` DROP INDEX `unionid_22`;
ALTER TABLE `users` DROP INDEX `unionid_23`;
ALTER TABLE `users` DROP INDEX `unionid_24`;
ALTER TABLE `users` DROP INDEX `unionid_25`;
ALTER TABLE `users` DROP INDEX `unionid_26`;
ALTER TABLE `users` DROP INDEX `unionid_27`;
ALTER TABLE `users` DROP INDEX `unionid_28`;
ALTER TABLE `users` DROP INDEX `unionid_29`;
ALTER TABLE `users` DROP INDEX `unionid_30`;
ALTER TABLE `users` DROP INDEX `unionid_31`;

-- ---------- 第 3 步：删除旧兜底账号与验证脚本账号 ----------
-- dev_test_user：中间件"无 token 兜底成 dev_test_user"的产物，其记录多为早期测试残留
--                （重复的 MacBook Pro、initial_value=0、中文名被终端编码打成乱码的行）。
--                该 openid 已无法通过现在的登录流程访问（登录按 dev_<昵称> 映射）。
-- dev_verify-runner / dev_harness-user：本轮修复期间验证脚本创建，业务记录已清空。
-- 子表外键为 ON DELETE CASCADE，删用户会连带删除其资产/负债/储蓄目标。
DELETE FROM users
WHERE openid IN ('dev_test_user', 'dev_verify-runner', 'dev_harness-user');

-- ---------- 第 4 步：验证 ----------
SELECT COUNT(DISTINCT index_name) AS users_index_count
FROM information_schema.statistics
WHERE table_schema = DATABASE() AND table_name = 'users';

SELECT id, openid, nickname FROM users ORDER BY id;

SELECT u.openid,
       (SELECT COUNT(*) FROM assets a WHERE a.user_id = u.id) AS assets,
       (SELECT COUNT(*) FROM liabilities l WHERE l.user_id = u.id) AS liabilities,
       (SELECT COUNT(*) FROM saving_goals g WHERE g.user_id = u.id) AS goals
FROM users u ORDER BY u.id;
