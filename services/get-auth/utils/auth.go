package utils

import (
	"context"
	"get-auth/adapter"
	"get-auth/errors"

	ent "get-auth/entities"
)

const (
	DEL_ACL = 1 // [0,0,1]
	PUT_ACL = 2 // [0,1,0]
	GET_ACL = 4 // [1,0,0]
)

// Check user grants
// Returns bool
func checkAuth(req, res *ent.Entity) (bool, error) {
	for _, accessItem := range res.GrantsArray {
		if accessItem.User == req.UserName {
			if req.Op == "del" {
				return (accessItem.Grants & DEL_ACL) == DEL_ACL, nil
			} else if req.Op == "put" {
				return (accessItem.Grants & PUT_ACL) == PUT_ACL, nil
			} else if req.Op == "get" {
				return (accessItem.Grants & GET_ACL) == GET_ACL, nil
			} else {
				err := errors.New("check auth failed", errors.UtilAuthChckErr, nil)
				return false, err
			}
		}
	}

	return false, nil
}

// Check rights of a user against grants of entity
// Returns bool and error if one happens
func IsAuth(ctx context.Context, req *ent.Entity) (bool, error) {
	res, err := adapter.FindOne(ctx, req)
	if err != nil {
		return false, err
	}

	// check request entity against retrieved entity
	isAuth, err := checkAuth(req, res)
	if err != nil {
		return false, err
	}

	return isAuth, nil
}
