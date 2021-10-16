FROM node:14-alpine
WORKDIR /app
COPY . .
RUN npm install
ENV SERVICE_PORT=8005
EXPOSE 8005/tcp
CMD ["node", "./index.js"]