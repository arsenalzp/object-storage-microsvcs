FROM node:14-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 8005/tcp
CMD ["node", "./index.js"]