FROM node:14-alpine
WORKDIR /app
COPY . .
RUN npm install
ENV SERVICE_PORT=8007
EXPOSE 8007/tcp
CMD ["node", "./index.js"]