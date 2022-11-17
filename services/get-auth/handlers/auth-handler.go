package handlers

import (
	"context"
	"fmt"
	ent "get-auth/entities"
	"get-auth/errors"
	"get-auth/utils"
	"log"
	"net/http"
	"strings"
)

// Handle GET /auth/ requests
func HandleAuth(w http.ResponseWriter, r *http.Request) {
	// create the new context derived from parent one
	ctx, cancel := context.WithCancel(r.Context())

	defer cancel()

	query := r.URL.Query()
	bucketName := query.Get("bucketName")
	objectName := query.Get("objectName")
	etype := strings.ToLower(query.Get("type"))
	op := strings.ToLower(query.Get("op"))
	userName := query.Get("userName")

	if len(op) > 5 || len(op) == 0 || len(etype) != 1 || etype != "o" && etype != "b" {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	req := ent.Entity{
		BucketName: bucketName,
		ObjectName: objectName,
		EntityType: etype,
		Op:         op,
		UserName:   ent.User(userName),
	}

	// Is user authorized to access requested object
	isAuth, err := utils.IsAuth(ctx, &req)
	if err != nil {
		if _, notFound := err.(errors.ErrNoDocuments); notFound {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		w.WriteHeader(http.StatusInternalServerError)
		err = errors.New("handler error", errors.HndlrAuthErr, err)
		log.Printf("%+v\n", err)
		return
	} else if err == nil && !isAuth {
		w.WriteHeader(http.StatusForbidden)
		return
	}

	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, isAuth)
}
