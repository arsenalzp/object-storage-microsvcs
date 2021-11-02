FROM node:16-alpine
WORKDIR /app
COPY . .
RUN npm install
ENV APP_PORT=8080
EXPOSE 8080/tcp
CMD ["node", "./app.js"]