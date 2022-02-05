FROM node:16-alpine
WORKDIR /app
COPY . .
RUN npm install
ENV APP_PORT=8080
EXPOSE 8080/tcp
ENV NODE_ENV="production"
CMD ["node", "./app.js"]