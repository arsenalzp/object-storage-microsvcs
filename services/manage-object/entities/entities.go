package entities

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User string
type Grants int32
type Access struct {
	User   `bson:"userName"`
	Grants `bson:"grants"`
}

type VersionId string

type Version struct {
	ObjectId  `bson:"_id"`
	VersionId `bson:"versionId"`
}

type ObjectId primitive.ObjectID
type BucketId primitive.ObjectID
type CurrentVersion primitive.ObjectID

type Object struct {
	ObjectId       primitive.ObjectID `bson:"_id,omitempty"`
	ObjectName     string             `bson:"objectName,omitempty"`
	BucketName     string             `bson:"bucketName,omitempty"`
	Created        time.Time          `bson:"created,omitempty"`
	LastUpdate     time.Time          `bson:"lastUpdate,omitempty"`
	GrantsArray    []Access           `bson:"access,omitempty"`
	VersionsList   []Version          `bson:"version,omitempty"`
	VersionId      `bson:"versionId,omitempty"`
	CurrentVersion VersionId `bson:"currentVersion,omitempty"`
}

type Bucket struct {
	BucketId    primitive.ObjectID `bson:"_id,omitempty"`
	BucketName  string             `bson:"bucketName,omitempty"`
	Created     time.Time          `bson:"created,omitempty"`
	Owner       string             `bson:"owner,omitempty"`
	GrantsArray []Access           `bson:"access,omitempty"`
	Versioning  bool               `bson:"versioning,omitempty"`
}

func (obj ObjectId) IdToStr() string {
	objId := primitive.ObjectID(obj)

	return objId.Hex()
}

func (bckt BucketId) IdToStr() string {
	bcktId := primitive.ObjectID(bckt)

	return bcktId.Hex()
}
