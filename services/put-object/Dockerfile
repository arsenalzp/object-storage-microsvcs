FROM node:14-alpine
WORKDIR /app
COPY . .
RUN npm install
ENV SERVICE_PORT=8101
EXPOSE 8101/tcp
CMD ["node", "./index.js"]