FROM node:14-alpine
WORKDIR /app
COPY . .
RUN npm install
ENV SERVICE_PORT=8004
EXPOSE 8004/tcp
CMD ["node", "./index.js"]