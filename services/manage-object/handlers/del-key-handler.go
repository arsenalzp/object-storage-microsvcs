package handlers

import (
	"context"
	"log"
	client "manage-object/clients"
	"manage-object/errors"
	"manage-object/storage/db"
	"manage-object/storage/fs"
	"net/http"
)

// Handle DELETE key requests
func HandleDelObj(w http.ResponseWriter, r *http.Request) {
	// create the new context derived from parent one
	ctx, cancel := context.WithCancel(r.Context())

	defer cancel()

	query := r.URL.Query()
	bucketName := query.Get("bucketName")
	objectName := query.Get("objectName")
	requesterUName := query.Get("requesterUName")

	// if bucket exist - check an authority
	statusCode, err := client.IsAuth(ctx, bucketName, "", "B", "del", requesterUName)
	switch {
	case err != nil:
		w.WriteHeader(http.StatusInternalServerError)
		err = errors.New("handler error:", errors.HndlrDelBAuthErr, err)
		log.Printf("%+v\n", err)
		return
	case statusCode == 500:
		w.WriteHeader(http.StatusInternalServerError)
		return
	case statusCode == 404:
		w.WriteHeader(http.StatusNotFound)
		return
	case statusCode == 403:
		w.WriteHeader(http.StatusForbidden)
		return
	}

	// if object exist - check an authority
	statusCode, err = client.IsAuth(ctx, bucketName, objectName, "O", "del", requesterUName)
	switch {
	case err != nil:
		w.WriteHeader(http.StatusInternalServerError)
		err = errors.New("handler error:", errors.HndlrDelObAuthErr, err)
		log.Printf("%+v\n", err)
		return
	case statusCode == 500:
		w.WriteHeader(http.StatusInternalServerError)
		return
	case statusCode == 404:
		w.WriteHeader(http.StatusNotFound)
		return
	case statusCode == 403:
		w.WriteHeader(http.StatusForbidden)
		return
	}

	// delete an object in a DB
	obj, objId, err := db.DeleteObject(ctx, bucketName, objectName)
	if err != nil {
		err = errors.New("handler error:", errors.HndlrDelDbErr, err)
		log.Printf("%+v\n", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	// then delete it on FS
	err = fs.DelObject(objId)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		err = errors.New("handler error:", errors.HndlrDelFsErr, err)
		log.Printf("%+v\n", err)
		log.Printf("%s\n", "undoing object deletion...")
		err = db.UndoObjectDelition(ctx, obj) // restore deleted object
		if err != nil {
			err = errors.New("undoing object deletion failed:", errors.StgDbDelObjUndoErr, err)
			log.Printf("%+v\n", err)
			return
		}
		log.Printf("%s\n", "success!")
		return
	}

	// voila
	w.WriteHeader(http.StatusOK)
}
