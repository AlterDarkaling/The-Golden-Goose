#!/bin/bash

###############################################
# MySQL数据库备份脚本
###############################################

# 配置
DB_USER="goose_user"
DB_NAME="golden_goose"
BACKUP_DIR="/var/backups/golden-goose"
DAYS_TO_KEEP=30

# 创建备份目录
mkdir -p $BACKUP_DIR

# 生成备份文件名
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

echo "开始备份数据库..."
echo "备份文件: $BACKUP_FILE"

# 执行备份
mysqldump -u $DB_USER -p $DB_NAME > $BACKUP_FILE

# 压缩备份
gzip $BACKUP_FILE

echo "备份完成: ${BACKUP_FILE}.gz"

# 删除超过指定天数的旧备份
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$DAYS_TO_KEEP -delete

echo "清理完成，保留最近 $DAYS_TO_KEEP 天的备份"

# 显示备份列表
echo ""
echo "当前备份列表："
ls -lh $BACKUP_DIR/backup_*.sql.gz

