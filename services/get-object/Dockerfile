FROM node:14-alpine
WORKDIR /app
COPY . .
RUN npm install
ENV SERVICE_PORT=8100
EXPOSE 8100/tcp
CMD ["node", "./index.js"]