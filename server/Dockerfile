FROM node:14-alpine
WORKDIR /app
COPY . .
RUN npm install
ENV APP_PORT=8080
EXPOSE 8008/tcp
CMD ["node", "./app.js"]