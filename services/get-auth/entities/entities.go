package entities

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type EntityId primitive.ObjectID

type User string
type Grants int32
type Access struct {
	User   `bson:"userName"`
	Grants `bson:"grants"`
}

// Incomig auth request
type Entity struct {
	EntityId    primitive.ObjectID `bson:"_id,omitempty"`
	BucketName  string             `bson:"bucketName,omitempty"`
	ObjectName  string             `bson:"objectName,omitempty"`
	EntityType  string
	Op          string
	GrantsArray []Access `bson:"access,omitempty"`
	UserName    User
}
