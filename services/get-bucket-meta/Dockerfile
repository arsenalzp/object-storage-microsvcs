FROM node:14-alpine
WORKDIR /app
COPY . .
RUN npm install
ENV SERVICE_PORT=8009
EXPOSE 8009/tcp
CMD ["node", "./index.js"]