#!/bin/sh
set -e

if [ -z "$BACKEND_URL" ]; then
  echo "ERROR: BACKEND_URL environment variable must be set (e.g. -e BACKEND_URL=http://host.docker.internal:8080/cakeshop-service)" >&2
  exit 1
fi

BACKEND_HOST=$(echo "$BACKEND_URL" | sed -E 's~^[a-zA-Z]+://([^/:]+).*~\1~')
export BACKEND_HOST

echo "BACKEND_URL: $BACKEND_URL"
echo "BACKEND_HOST: $BACKEND_HOST"

# Substitute BACKEND_URL and BACKEND_HOST in nginx.conf
envsubst '${BACKEND_URL} ${BACKEND_HOST}' < /etc/nginx/nginx.conf > /etc/nginx/nginx.conf.tmp
mv /etc/nginx/nginx.conf.tmp /etc/nginx/nginx.conf

exec "$@" 