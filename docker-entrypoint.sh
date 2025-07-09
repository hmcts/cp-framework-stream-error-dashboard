#!/bin/sh
set -e

# Require BACKEND_URL to be set
if [ -z "$BACKEND_URL" ]; then
  echo "ERROR: BACKEND_URL environment variable must be set (e.g. -e BACKEND_URL=http://host.docker.internal:8080/cakeshop-service)" >&2
  exit 1
fi

# Substitute BACKEND_URL in nginx.conf
envsubst '${BACKEND_URL}' < /etc/nginx/nginx.conf > /etc/nginx/nginx.conf.tmp
mv /etc/nginx/nginx.conf.tmp /etc/nginx/nginx.conf

exec "$@" 