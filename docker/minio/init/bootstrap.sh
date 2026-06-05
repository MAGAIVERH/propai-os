#!/bin/sh
# Runs once via minio-init (profile: storage). Creates private bucket + CORS for local dev.
set -e

ALIAS=local
ENDPOINT=http://minio:9000
BUCKET=propai-uploads

echo "MinIO bootstrap: waiting for S3 API..."
until mc alias set "$ALIAS" "$ENDPOINT" minioadmin minioadmin 2>/dev/null; do
  sleep 2
done

echo "MinIO bootstrap: ensuring bucket ${BUCKET} (private)..."
mc mb "${ALIAS}/${BUCKET}" --ignore-existing
mc anonymous set none "${ALIAS}/${BUCKET}"

# Bucket-level CORS via mc may fail on some MinIO builds; server env
# MINIO_API_CORS_ALLOW_ORIGIN on the minio service covers local dashboard origin.
if ! mc cors set "${ALIAS}/${BUCKET}" /init/cors.xml 2>/dev/null; then
  echo "MinIO bootstrap: bucket CORS skipped (using MINIO_API_CORS_ALLOW_ORIGIN on server)"
fi

echo "MinIO bootstrap: done — ${BUCKET} ready at ${ENDPOINT}"
