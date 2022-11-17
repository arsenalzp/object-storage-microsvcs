# Build stage
FROM golang:1.16-alpine AS build
WORKDIR /app
COPY . .
RUN go mod download
RUN go build -o manageobjd

# Deploy stage
FROM alpine
WORKDIR /app
ENV RUNTIME_ENV="production" SERVICE_PORT=7001
COPY --from=build /app/manageobjd .
RUN mkdir /app/tls 
COPY tls /app/tls 
RUN chown -R 10010:10010 .
EXPOSE 7001/tcp
USER 10010
CMD ["./manageobjd"]
