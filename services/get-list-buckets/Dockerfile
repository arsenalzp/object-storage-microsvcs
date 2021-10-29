FROM node:14-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 8008/tcp
CMD ["node", "./index.js"]