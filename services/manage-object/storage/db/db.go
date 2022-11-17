package db

import (
	"context"
	ent "manage-object/entities"
	"manage-object/errors"
	"manage-object/new_adapter"
	"manage-object/utils/versionId"
	"time"
)

const (
	BCOLLECTION = "bucketsCollection" // MongoDB collection of buckets
	OCOLLECTION = "objectsCollection" // MongoDB collection of objects
)

// check if a bucket being a versioning one
func IsBucketVers(ctx context.Context, buckeName string) (bool, error) {
	res, err := new_adapter.FindOneBucket(ctx, buckeName)
	if err != nil {
		err = errors.New("storage error:", errors.StgDbGetObjIdErr, err)
		return false, err
	}

	return res.Versioning, nil
}

func GetObjectId(ctx context.Context, buckeName string, objectName string) (*ent.ObjectId, error) {
	res, err := new_adapter.FindOne(ctx, buckeName, objectName)
	if err != nil {
		err = errors.New("storage error:", errors.StgDbGetObjIdErr, err)
		return nil, err
	}

	objId := ent.ObjectId(res.ObjectId)
	return &objId, nil
}

func GetBucketId(ctx context.Context, buckeName string) (*ent.BucketId, error) {
	res, err := new_adapter.FindOneBucket(ctx, buckeName)
	if err != nil {
		err = errors.New("storage error:", errors.StgDbGetBcktIdErr, err)
		return nil, err
	}

	bcktId := ent.BucketId(res.BucketId)
	return &bcktId, nil
}

func UpdateObject(ctx context.Context, bucketName string, objectName string, touchTime time.Time) (*ent.Object, error) {
	var obj *ent.Object = &ent.Object{
		BucketName: bucketName,
		ObjectName: objectName,
		LastUpdate: touchTime,
	}

	oldObj, err := new_adapter.UpdateOne(ctx, obj)
	if err != nil {
		err = errors.New("storage error:", errors.StgDbUpdObjErr, err)
		return nil, err
	}

	return oldObj, nil
}

func CreateObjectVers(ctx context.Context, bucketName string, objectName string, requesterUName string, curTime time.Time) (*ent.ObjectId, error) {
	var versionId ent.VersionId = versionId.GenerateVersionId(32)

	var newObjVersion *ent.Object = &ent.Object{
		BucketName: bucketName,
		Created:    curTime,
		GrantsArray: []ent.Access{
			ent.Access{
				User:   ent.User(requesterUName),
				Grants: 6,
			},
		},
		VersionId: versionId,
	}

	// insert new version of Object
	newObjId, err := new_adapter.InsertOne(ctx, newObjVersion)
	if err != nil {
		err = errors.New("storage error:", errors.StgDbCrtObjErr, err)
		return nil, err
	}

	// get a root Object
	rootObj, err := new_adapter.FindOne(ctx, bucketName, objectName)
	if err != nil {
		err = errors.New("storage error:", errors.StgDbCrtObjErr, err)
		return nil, err
	}

	rootObj.CurrentVersion = versionId

	// update root object with a new current version
	err = new_adapter.UpdateOneRootObj(ctx, rootObj)
	if err != nil {
		err = errors.New("storage error:", errors.StgDbCrtObjErr, err)
		return nil, err
	}

	// create a new Version entry
	newVersion := ent.Version{ObjectId: *newObjId, VersionId: ent.VersionId(versionId)}

	// update a list of object versions
	operator := "$push"
	operand := "versList"
	_, err = new_adapter.UpdateOneVersion(ctx, rootObj, operator, operand, &newVersion)
	if err != nil {
		err = errors.New("storage error:", errors.StgDbCrtObjErr, err)
		return nil, err
	}
	// versionList := append(rootObj.VersionsList, newVersion)
	// rootObj.VersionsList = versionList

	return newObjId, nil
}

func CreateObject(ctx context.Context, bucketName string, objectName string, requesterUName string, curTime time.Time) (*ent.ObjectId, error) {
	var newObj *ent.Object = &ent.Object{
		BucketName: bucketName,
		ObjectName: objectName,
		Created:    curTime,
		GrantsArray: []ent.Access{
			ent.Access{
				User:   ent.User(requesterUName),
				Grants: 6,
			},
		},
	}

	objectId, err := new_adapter.InsertOne(ctx, newObj)
	if err != nil {
		err = errors.New("storage error:", errors.StgDbCrtObjErr, err)
		return nil, err
	}

	return objectId, nil
}

func DeleteObject(ctx context.Context, bucketName string, objectName string) (*ent.Object, *ent.ObjectId, error) {
	var delObj *ent.Object = &ent.Object{
		BucketName: bucketName,
		ObjectName: objectName,
	}

	obj, err := new_adapter.FindOneAndDel(ctx, delObj)
	if err != nil {
		err = errors.New("storage error:", errors.StgDbDelObjErr, err)
		return nil, nil, err
	}

	objId := ent.ObjectId(obj.ObjectId)
	return obj, &objId, nil
}

func UndoObjectDelition(ctx context.Context, undoObj *ent.Object) error {
	_, err := new_adapter.InsertOne(ctx, undoObj)
	if err != nil {
		err = errors.New("storage error:", errors.StgDbDelObjUndoErr, err)
		return err
	}

	return nil
}

func UndoObjectCreation(ctx context.Context, objectId *ent.ObjectId) error {
	err := new_adapter.FindByIdAndDelte(ctx, objectId)
	if err != nil {
		err = errors.New("storage error:", errors.StgDbCrtObjUndoErr, err)
		return err
	}

	return nil
}

func UndoObjectUpdate(ctx context.Context, obj *ent.Object) error {
	_, err := new_adapter.FindOneAndReplace(ctx, obj)
	if err != nil {
		err = errors.New("storage error:", errors.StgDbUpdObjUndoErr, err)
		return err
	}

	return nil
}
