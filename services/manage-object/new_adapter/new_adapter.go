package new_adapter

import (
	"context"
	"fmt"
	client "manage-object/clients"
	ent "manage-object/entities"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

const (
	BCOLLECTION = "bucketsCollection" // MongoDB collection of buckets
	OCOLLECTION = "objectsCollection" // MongoDB collection of objects
)

func decode(res *mongo.SingleResult, collection string) (interface{}, error) {
	var obj ent.Object
	var bckt ent.Bucket

	if collection == OCOLLECTION {
		err := res.Decode(&obj)
		if err != nil {
			if err == mongo.ErrNoDocuments {
				return nil, fmt.Errorf("%s", "document not found")
			}
			return nil, err
		}

		return &obj, nil
	}

	err := res.Decode(&bckt)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, fmt.Errorf("%s", "document not found")
		}
		return nil, err
	}

	return &bckt, nil
}

// Find a single document in bucket collection
func FindOneBucket(ctx context.Context, buckeName string) (*ent.Bucket, error) {
	defer ctx.Done()

	query := bson.M{
		"bucketName": buckeName,
	}

	db, err := client.DbConnect()
	if err != nil {
		return nil, err
	}

	res := db.Collection(BCOLLECTION).FindOne(ctx, query)
	doc, err := decode(res, BCOLLECTION)
	if err != nil {
		return nil, err
	}

	bckt := doc.(*ent.Bucket)
	return bckt, nil
}

// Find a single document in file collection
func FindOne(ctx context.Context, buckeName string, objectName string) (*ent.Object, error) {
	defer ctx.Done()

	query := bson.M{
		"bucketName": buckeName,
		"objectName": objectName,
	}

	db, err := client.DbConnect()
	if err != nil {
		return nil, err
	}

	res := db.Collection(OCOLLECTION).FindOne(ctx, query)
	doc, err := decode(res, OCOLLECTION)
	if err != nil {
		return nil, err
	}

	obj := doc.(*ent.Object)

	return obj, nil
}

// Insert single document into collection
func InsertOne(ctx context.Context, newObj *ent.Object) (*ent.ObjectId, error) {
	defer ctx.Done()

	db, err := client.DbConnect()
	if err != nil {
		return nil, err
	}

	res, err := db.Collection(OCOLLECTION).InsertOne(ctx, newObj)
	if err != nil {
		return nil, err
	}

	// cast interface{} to ObjectID
	id := res.InsertedID.(primitive.ObjectID)

	// convert primitive.ObjectID to ent.ObjectId
	objId := ent.ObjectId(id)

	return &objId, nil
}

func UpdateOneVersion(ctx context.Context, updObj *ent.Object, operator, operand string, version *ent.Version) (*ent.Object, error) {
	defer ctx.Done()

	var update bson.M

	filter := bson.M{
		"bucketName": updObj.BucketName,
		"objectName": updObj.ObjectName,
	}

	update = bson.M{
		operator: bson.M{
			operand: bson.M{
				"_id":            primitive.ObjectID(version.ObjectId),
				"versionId":      version.VersionId,
				"CurrentVersion": true,
			},
		},
	}

	db, err := client.DbConnect()
	if err != nil {
		return nil, err
	}

	res := db.Collection(OCOLLECTION).FindOneAndUpdate(ctx, filter, update)
	doc, err := decode(res, OCOLLECTION)
	if err != nil {
		return nil, err
	}

	obj := doc.(*ent.Object)

	return obj, err

}

// Update single document in a collection and
// returns MatchedCount, ModifiedCount and error
func UpdateOne(ctx context.Context, updObj *ent.Object) (*ent.Object, error) {
	defer ctx.Done()
	var update bson.M

	filter := bson.M{
		"bucketName": updObj.BucketName,
		"objectName": updObj.ObjectName,
	}

	update = bson.M{
		"$set": bson.M{
			"lastUpdate": updObj.LastUpdate,
		},
	}

	db, err := client.DbConnect()
	if err != nil {
		return nil, err
	}

	res := db.Collection(OCOLLECTION).FindOneAndUpdate(ctx, filter, update)
	doc, err := decode(res, OCOLLECTION)
	if err != nil {
		return nil, err
	}

	obj := doc.(*ent.Object)

	return obj, err
}

func FindByIdAndDelte(ctx context.Context, objId ent.ObjectId) error {
	defer ctx.Done()

	query := bson.M{
		"_id": primitive.ObjectID(objId),
	}

	db, err := client.DbConnect()
	if err != nil {
		return err
	}

	_, err = db.Collection(OCOLLECTION).DeleteOne(ctx, query)
	if err != nil {
		return err
	}

	return nil
}

// Find single document and delete it
func FindOneAndDel(ctx context.Context, delObj *ent.Object) (*ent.Object, error) {
	defer ctx.Done()

	query := bson.M{
		"bucketName": delObj.BucketName,
		"objectName": delObj.ObjectName,
	}

	db, err := client.DbConnect()
	if err != nil {
		return nil, err
	}

	res := db.Collection(OCOLLECTION).FindOneAndDelete(ctx, query)
	doc, err := decode(res, OCOLLECTION)
	if err != nil {
		return nil, err
	}

	obj := doc.(*ent.Object)

	return obj, nil
}

func FindOneAndReplace(ctx context.Context, oldObj *ent.Object) (*ent.Object, error) {
	defer ctx.Done()

	filter := bson.M{
		"_id": primitive.ObjectID(oldObj.ObjectId),
	}

	db, err := client.DbConnect()
	if err != nil {
		return nil, err
	}

	res := db.Collection(OCOLLECTION).FindOneAndReplace(ctx, filter, oldObj)
	doc, err := decode(res, OCOLLECTION)
	if err != nil {
		return nil, err
	}

	obj := doc.(*ent.Object)

	return obj, err
}
