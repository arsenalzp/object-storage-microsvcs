FROM node:16-alpine
WORKDIR /app
COPY . .
RUN npm install && chown -R 10010:10010 .
ENV APP_PORT=8080
EXPOSE 8080/tcp
ENV NODE_ENV="production"
USER 10010
CMD ["node", "./app.js"]