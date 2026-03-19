#!/bin/bash

DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="/tmp/backups"
mkdir -p $BACKUP_DIR

echo "Starting backup at $DATE"

# Dump auth_db
PGPASSWORD=$POSTGRES_PASSWORD pg_dump \
  -h auth-db -U postgres auth_db \
  > $BACKUP_DIR/auth_db_$DATE.sql

# Dump user_db
PGPASSWORD=$POSTGRES_PASSWORD pg_dump \
  -h user-db -U postgres user_db \
  > $BACKUP_DIR/user_db_$DATE.sql

# Dump task_db
PGPASSWORD=$POSTGRES_PASSWORD pg_dump \
  -h task-db -U postgres task_db \
  > $BACKUP_DIR/task_db_$DATE.sql

echo "Dumps created successfully"

# Configure MinIO client
mc alias set minio http://$MINIO_ENDPOINT:$MINIO_PORT $MINIO_USER $MINIO_PASS

# Create bucket if not exists
mc mb minio/backups --ignore-existing

# Upload files
for file in $BACKUP_DIR/*.sql; do
  filename=$(basename $file)
  mc cp $file minio/backups/$filename
  echo "Uploaded: $filename"
done

# Verify upload
echo "Files in backups bucket:"
mc ls minio/backups

# Delete local files
rm -rf $BACKUP_DIR
echo "Backup completed at $(date)"