package utils

import (
	. "get-auth/entities"
	"testing"
)

func TestAuthCheck(t *testing.T) {
	requestEntities := []*Entity{
		{
			BucketName: "gotest",
			ObjectName: "gotest",
			Op:         "get",
			UserName:   User("utest1"),
		},
		{
			BucketName: "gotest",
			ObjectName: "gotest",
			Op:         "del",
			UserName:   User("utest1"),
		},
		{
			BucketName: "gotest",
			ObjectName: "gotest",
			Op:         "put",
			UserName:   User("utest1"),
		},
	}

	dbEntity := &Entity{
		BucketName: "gotest",
		ObjectName: "gotest",
		GrantsArray: []Access{
			{
				User:   "utest1",
				Grants: 7,
			},
			{
				User:   "utest2",
				Grants: 7,
			},
		},
	}

	for _, ent := range requestEntities {
		if isAuth, err := checkAuth(ent, dbEntity); !isAuth || err != nil {
			t.Error("authentication check test failed")
		}
	}
}
