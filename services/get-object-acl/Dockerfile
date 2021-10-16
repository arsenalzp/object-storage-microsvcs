FROM node:14-alpine
WORKDIR /app
COPY . .
RUN npm install
ENV SERVICE_PORT=8006
EXPOSE 8006/tcp
CMD ["node", "./index.js"]