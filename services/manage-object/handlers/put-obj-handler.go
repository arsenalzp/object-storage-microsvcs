package handlers

import (
	"context"
	"log"
	client "manage-object/clients"
	"manage-object/storage/db"
	"manage-object/storage/fs"
	"net/http"
	"time"

	"manage-object/errors"
)

// Handle PUT object requests
func HandlePutObj(w http.ResponseWriter, r *http.Request) {
	// create the new context derived from parent one
	ctx, cancel := context.WithCancel(r.Context())

	defer cancel()

	query := r.URL.Query()
	bucketName := query.Get("bucketName")
	objectName := query.Get("objectName")
	requesterUName := query.Get("requesterUName")
	curTime := time.Now()

	// if the bucket exists - check the authority
	statusCode, err := client.IsAuth(ctx, bucketName, "", "B", "put", requesterUName)
	switch {
	case err != nil:
		w.WriteHeader(http.StatusInternalServerError)
		err = errors.New("handler error:", errors.HndlrPutBAuthErr, err)
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

	// if the object exists - check the authority
	statusCode, err = client.IsAuth(ctx, bucketName, objectName, "O", "put", requesterUName)
	switch {
	case err != nil:
		w.WriteHeader(http.StatusInternalServerError)
		err = errors.New("handler error:", errors.HndlrPutObAuthErr, err)
		log.Printf("%+v\n", err)
		return
	case statusCode == 500:
		w.WriteHeader(http.StatusInternalServerError)
		return
	case statusCode == 404:
		// if the object is new one
		// create new DB entry
		newObjId, err := db.CreateObject(ctx, bucketName, objectName, requesterUName, curTime)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			err = errors.New("handler error:", errors.HndlrPutDbCretErr, err)
			log.Printf("%+v\n", err)
			return
		}

		// and save on FS
		err = fs.CreateUpdateObject(newObjId, &r.Body, curTime)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			err = errors.New("handler error:", errors.HndlrPutFsCretErr, err)
			log.Printf("%+v\n", err)
			log.Printf("%s\n", "undoing object creation...")
			err = db.UndoObjectCreation(ctx, newObjId)
			if err != nil {
				err = errors.New("undoing object creation failed:", errors.StgDbCrtObjUndoErr, err)
				log.Printf("%+v\n", err)
				return
			}

			return
		}

		// voila
		w.WriteHeader(http.StatusCreated)
		return
	case statusCode == 403:
		w.WriteHeader(http.StatusForbidden)
		return
	}

	// is Bucket versioned ?
	isBucketVers, err := db.IsBucketVers(ctx, bucketName)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		err = errors.New("handler error:", errors.HndlrPutDbGetVersIdErr, err)
		log.Printf("%+v\n", err)
		return
	}

	// if a Bucket versioned - create new object version
	// and update VersionsList of root Object
	if isBucketVers {
		// create a new version of object in DB
		newObjId, err := db.CreateObjectVers(ctx, bucketName, objectName, requesterUName, curTime)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			err = errors.New("handler error:", errors.HndlrPutDbCrtVersIdErr, err)
			log.Printf("%+v\n", err)
			return
		}

		// create a new file which is related to the new version of Object
		err = fs.CreateUpdateObject(newObjId, &r.Body, curTime)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			err = errors.New("handler error:", errors.HndlrPutFsUpdErr, err)
			log.Printf("%+v\n", err)
			return
		}

		w.WriteHeader(http.StatusOK)
		return
	}

	// get the object ID from DB
	objId, err := db.GetObjectId(ctx, bucketName, objectName)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		err = errors.New("handler error:", errors.HndlrPutDbGetIdErr, err)
		log.Printf("%+v\n", err)
		return
	}

	// update the object in DB
	oldObj, err := db.UpdateObject(ctx, bucketName, objectName, curTime)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		err = errors.New("handler error:", errors.HndlrPutDbUpdErr, err)
		log.Printf("%+v\n", err)
		return
	}

	// then update it on FS
	err = fs.CreateUpdateObject(*objId, &r.Body, curTime)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		err = errors.New("handler error:", errors.HndlrPutFsUpdErr, err)
		log.Printf("%+v\n", err)
		log.Printf("%s\n", "undoing object update...")
		err = db.UndoObjectUpdate(ctx, oldObj)
		if err != nil {
			err = errors.New("undoing object update failed:", errors.StgDbCrtObjUndoErr, err)
			log.Printf("%+v\n", err)
			return
		}

		return
	}

	// voila
	w.WriteHeader(http.StatusOK)
}
