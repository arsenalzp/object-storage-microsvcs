FROM node:14-alpine
WORKDIR /app
COPY . .
RUN npm install
ENV SERVICE_PORT=8003
EXPOSE 8003/tcp
CMD ["node", "./index.js"]