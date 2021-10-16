FROM node:14-alpine
WORKDIR /app
COPY . .
RUN npm install
ENV SERVICE_PORT=8008
EXPOSE 8008/tcp
CMD ["node", "./index.js"]