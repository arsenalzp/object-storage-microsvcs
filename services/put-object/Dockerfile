FROM node:16-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 7001/tcp
ENV NODE_ENV="production"
CMD ["node", "./index.js"]