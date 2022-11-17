package client

import (
	"context"
	"fmt"
	"log"
	"manage-object/errors"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
)

const (
	DBNAME              = "buckets" // MongoDB DB name
	DBCONNECTIONTIMEOUT = 10 * time.Second
)

var db *mongo.Database

var (
	// DB_HOST = os.Getenv("DB_HOST")
	// DB_PORT = os.Getenv("DB_PORT")
	DB_HOST string
	DB_PORT string
	uri     string
)

func init() {
	if v := os.Getenv("RUNTIME_ENV"); v == "development" {
		DB_HOST = "localhost"
		DB_PORT = "27017"
	} else if v := os.Getenv("RUNTIME_ENV"); v == "production" {
		DB_HOST = os.Getenv("DB_HOST")
		DB_PORT = os.Getenv("DB_PORT")
	} else { // need for debugger
		DB_HOST = "localhost"
		DB_PORT = "27017"
	}

	uri = fmt.Sprintf("mongodb://%s:%s", DB_HOST, DB_PORT)

	_, err := DbConnect()
	if err != nil {
		log.Printf("db client init error:%+v\n", errors.New("client error:", errors.DbClntInitErr, err))
	}
}

// Connects to DB
// Returns either DB connection instance or error if one happens
func DbConnect() (*mongo.Database, error) {

	// Singleton
	if db != nil {
		client := db.Client()
		if err := client.Ping(context.TODO(), readpref.Primary()); err != nil {
			err = errors.New("client error:", errors.DbConnErr, err)
			return nil, err
		}
		return db, nil
	}

	opts := options.Client().ApplyURI(uri)
	opts.SetConnectTimeout(DBCONNECTIONTIMEOUT)

	client, err := mongo.Connect(context.TODO(), opts)
	if err != nil {
		client.Disconnect(context.TODO())
		err = errors.New("client error:", errors.DbClntErr, err)
		return nil, err
	}

	if err := client.Ping(context.TODO(), readpref.Primary()); err != nil {
		err = errors.New("client error:", errors.DbConnErr, err)
		return nil, err
	}

	db = client.Database(DBNAME)

	return db, nil
}
