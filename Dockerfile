# Use nginx to serve static files
FROM nginx:alpine

# Install envsubst for runtime variable substitution
RUN apk add --no-cache gettext

# Copy static files
COPY static/ /usr/share/nginx/html/

# Copy custom nginx config (if needed)
COPY nginx.conf /etc/nginx/nginx.conf

# Add entrypoint script to substitute BACKEND_URL
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port 80
EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"] 