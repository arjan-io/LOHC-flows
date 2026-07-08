FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++ sqlite

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/app/data/roster-calculator.sqlite

RUN mkdir -p /app/data /app/uploads

EXPOSE 3000

CMD ["sh", "-c", "npm run db:init && npm start"]
