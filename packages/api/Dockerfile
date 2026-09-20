FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose the port the app runs on
EXPOSE 3001

# Start the application
CMD ["node", "server.js"]
