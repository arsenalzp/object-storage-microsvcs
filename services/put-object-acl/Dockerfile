FROM node:14-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 7001/tcp
CMD ["node", "./index.js"]