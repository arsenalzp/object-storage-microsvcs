package handlers

import (
	"context"
	"io"
	"log"
	client "manage-object/clients"
	"manage-object/storage/db"
	"manage-object/storage/fs"
	"net/http"

	"manage-object/errors"
)

// Handle GET object requests
func HandleGetObj(w http.ResponseWriter, r *http.Request) {
	// create the new context derived from parent one
	ctx, cancel := context.WithCancel(r.Context())

	defer cancel()

	query := r.URL.Query()
	bucketName := query.Get("bucketName")
	objectName := query.Get("objectName")
	requesterUName := query.Get("requesterUName")

	// if bucket exist - check an authority
	statusCode, err := client.IsAuth(ctx, bucketName, "", "B", "put", requesterUName)
	switch {
	case err != nil:
		w.WriteHeader(http.StatusInternalServerError)
		err = errors.New("handler error:", errors.HndlrGetBAuthErr, err)
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
	statusCode, err = client.IsAuth(ctx, bucketName, objectName, "O", "put", requesterUName)
	switch {
	case err != nil:
		w.WriteHeader(http.StatusInternalServerError)
		err = errors.New("handler error:", errors.HndlrGetObAuthErr, err)
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

	// get object ID from DB
	objId, err := db.GetObjectId(ctx, bucketName, objectName)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		err = errors.New("handler error:", errors.HndlrGetDbErr, err)
		log.Printf("%+v\n", err)
		return
	}

	// then get a file from FS
	reader, file, err := fs.GetObject(*objId)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		err = errors.New("handler error:", errors.HndlrGetFsErr, err)
		log.Printf("%+v\n", err)
		return
	}

	defer file.Close()

	// write a file to a response
	_, err = io.Copy(w, reader)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		err = errors.New("handler error:", errors.HndlrGetWrtErr, err)
		log.Printf("%+v\n", err)
		return
	}

	// voila
	w.WriteHeader(http.StatusOK)
}
