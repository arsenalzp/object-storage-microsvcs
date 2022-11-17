package main

import (
	"fmt"
	"get-auth/handlers"
	"net/http"
	"net/http/httptest"
	"testing"
)

type entities struct {
	bucketName,
	objectName,
	entType string
}

func TestHandleAuth(t *testing.T) {
	ents := []entities{
		{
			bucketName: "gotest",
			objectName: "gotest",
			entType:    "O",
		},
		{
			bucketName: "gotest",
			objectName: "",
			entType:    "B",
		},
	}

	operations := []string{
		"get",
		"del",
		"put",
	}

	handler := http.HandlerFunc(handlers.HandleAuth)
	rec := httptest.NewRecorder()
	for _, ent := range ents {
		t.Logf("testing entity %s", ent.entType)
		for _, op := range operations {
			t.Logf("for operation %s", op)
			req, _ := http.NewRequest(
				"GET",
				fmt.Sprintf("auth/?bucketName=%s&objectName=%s&type=%s&op=%s&userName=utest1",
					ent.bucketName, ent.objectName, ent.entType, op,
				),
				nil,
			)
			handler.ServeHTTP(rec, req)
			if rec.Code != 200 {
				t.Errorf("operations %s test failed for entity %s", op, ent.entType)
			}
		}
	}
}
