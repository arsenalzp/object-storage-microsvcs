package adapter

import (
	"context"
	client "get-auth/clients"
	ent "get-auth/entities"
	"get-auth/errors"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

const (
	B = "bucketsCollection" // MongoDB collection of buckets
	O = "objectsCollection" // MongoDB collection of objects
)

// decode mongo.SingleResult into entity
func decode(res *mongo.SingleResult, collection string) (*ent.Entity, error) {
	var ent ent.Entity

	err := res.Decode(&ent)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.ErrNoDocuments{errors.AdaptDocNotFound, err}
		}
		return nil, errors.New("decoder error", errors.AdaptDecodeErr, err)
	}

	return &ent, nil
}

// Adapter for MongoDB FindOne function
// Returns interface and error if one happens
func FindOne(ctx context.Context, e *ent.Entity) (*ent.Entity, error) {
	var db *mongo.Database
	var query bson.M
	var collection string

	if e.EntityType == "b" {
		collection = B
		query = bson.M{
			"bucketName": e.BucketName,
		}
	} else if e.EntityType == "o" {
		collection = O
		query = bson.M{
			"bucketName": e.BucketName,
			"objectName": e.ObjectName,
		}
	}

	db, err := client.DbConnect()
	if err != nil {
		return nil, err
	}

	res := db.Collection(collection).FindOne(ctx, query)
	doc, err := decode(res, collection)
	if err != nil {
		return nil, err
	}

	return doc, nil
}
