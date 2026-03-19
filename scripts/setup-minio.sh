#!/bin/bash

# Подождать пока MinIO запустится
sleep 5

# Настроить MinIO client
mc alias set minio http://$MINIO_ENDPOINT:$MINIO_PORT $MINIO_USER $MINIO_PASS

# Создать bucket для бэкапов
mc mb minio/backups --ignore-existing

echo "MinIO backup bucket ready"