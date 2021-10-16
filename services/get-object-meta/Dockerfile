FROM node:14-alpine
WORKDIR /app
COPY . .
RUN npm install
ENV SERVICE_PORT=8010
EXPOSE 8010/tcp
CMD ["node", "./index.js"]