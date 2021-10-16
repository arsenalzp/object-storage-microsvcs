FROM node:14-alpine
WORKDIR /app
COPY . .
RUN npm install
ENV SERVICE_PORT=8002
EXPOSE 8002/tcp
CMD ["node", "./index.js"]