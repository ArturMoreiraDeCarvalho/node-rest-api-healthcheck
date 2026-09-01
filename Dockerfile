FROM node:22-alpine

WORKDIR /app
COPY package.json ./
COPY server.js test_server.js openapi.yaml ./

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]

