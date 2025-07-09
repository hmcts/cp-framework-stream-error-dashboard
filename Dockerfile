# Use nginx to serve static files
FROM nginx:alpine

# Install envsubst for runtime variable substitution
RUN apk add --no-cache gettext

# Copy static files
COPY index.html /usr/share/nginx/html/index.html
COPY main.js /usr/share/nginx/html/main.js
COPY api.js /usr/share/nginx/html/api.js
COPY ui.js /usr/share/nginx/html/ui.js
COPY navigation.js /usr/share/nginx/html/navigation.js
COPY filter.js /usr/share/nginx/html/filter.js

# Copy custom nginx config (if needed)
COPY nginx.conf /etc/nginx/nginx.conf

# Add entrypoint script to substitute BACKEND_URL
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port 80
EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"] 