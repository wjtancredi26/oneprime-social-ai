FROM node:22.12.0-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY prisma ./prisma
RUN npx prisma generate
COPY src ./src
EXPOSE 8080
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
