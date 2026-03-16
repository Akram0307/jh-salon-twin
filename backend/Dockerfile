FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 8080
ENV PORT=8080
# Create non-root user
RUN addgroup -g 1001 -S nodejs &&     adduser -S nodejs -u 1001

# Set ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

CMD ["npm", "start"]
