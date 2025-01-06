FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install express

COPY . .

# Generate env.js on container start
CMD ["sh", "-c", "node scripts/generate-env.js && node server.js"]

EXPOSE 3001 