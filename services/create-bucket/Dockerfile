FROM node:14-alpine
WORKDIR /app
COPY . .
RUN npm install
ENV SERVICE_PORT=8001
EXPOSE 8001/tcp
CMD ["node", "./index.js"]