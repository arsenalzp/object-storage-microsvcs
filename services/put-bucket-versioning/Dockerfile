FROM node:14-alpine
WORKDIR /app
COPY . .
RUN npm install && chown -R 10010:10010 .
EXPOSE 7001/tcp
ENV NODE_ENV="production"
USER 10010
CMD ["node", "./index.js"]