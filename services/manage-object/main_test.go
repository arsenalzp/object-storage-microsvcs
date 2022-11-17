package main

import (
	"crypto/md5"
	"fmt"
	"io"
	"manage-object/handlers"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

type object struct {
	BucketName     string
	ObjectName     string
	RequesterUName string
	Body           io.Reader
	BodySize       int64
}

var objectBody = strings.NewReader("some io.Reader stream to be read")
var obj = &object{
	BucketName:     "gotest",
	ObjectName:     "gotest",
	RequesterUName: "utest1",
	Body:           objectBody,
	BodySize:       objectBody.Size(),
}

func TestPutObj(t *testing.T) {
	handler := http.HandlerFunc(handlers.HandlePutObj)
	rec := httptest.NewRecorder()
	req, _ := http.NewRequest(
		"PUT",
		fmt.Sprintf(
			"/post/?bucketName=%s&objectName=%s&requesterUName=%s",
			obj.BucketName,
			obj.ObjectName,
			obj.RequesterUName,
		),
		obj.Body)

	handler.ServeHTTP(rec, req)
	if rec.Code != 200 && rec.Code != 201 {
		t.Errorf("put object test failed: statusCode %d, expected 200", rec.Code)
	}
}

func TestGetObj(t *testing.T) {
	handler := http.HandlerFunc(handlers.HandleGetObj)
	rec := httptest.NewRecorder()
	req, _ := http.NewRequest(
		"GET",
		fmt.Sprintf(
			"/get/?bucketName=%s&objectName=%s&requesterUName=%s",
			obj.BucketName,
			obj.ObjectName,
			obj.RequesterUName,
		),
		nil)

	handler.ServeHTTP(rec, req)
	if rec.Code != 200 {
		t.Errorf("get object test failed: statusCode %d, expected 200", rec.Code)
	}

	var buf []byte
	io.ReadFull(objectBody, buf)
	originalHash := md5.Sum(buf)

	rec.Write(buf)

	receivedHash := md5.Sum(buf)
	if originalHash != receivedHash {
		t.Errorf("get object test failed: expected hash of Body %v bytes, given %v bytes", originalHash, receivedHash)
	}
}

func TestDelKey(t *testing.T) {
	handler := http.HandlerFunc(handlers.HandleDelObj)
	rec := httptest.NewRecorder()
	req, _ := http.NewRequest(
		"GET",
		fmt.Sprintf(
			"/del/?bucketName=%s&objectName=%s&requesterUName=%s",
			obj.BucketName,
			obj.ObjectName,
			obj.RequesterUName,
		),
		nil)

	handler.ServeHTTP(rec, req)
	if rec.Code != 200 {
		t.Errorf("del object test failed: statusCode %d, expected 200", rec.Code)
	}

}
