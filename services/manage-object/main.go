package main

import (
	"crypto/tls"
	"crypto/x509"
	"io/ioutil"
	"log"
	"manage-object/errors"
	"manage-object/handlers"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gorilla/mux"
)

const (
	HTTPIDLETIMEOUT  = 120 * time.Second
	HTTPWRITETIMEOUT = 120 * time.Second
	HTTPREADTIMEOUT  = 120 * time.Second
)

var (
	cert         string = filepath.Join("tls", "tls.crt")
	key          string = filepath.Join("tls", "tls.key")
	ca           string = filepath.Join("tls", "rootCA.crt")
	SERVICE_PORT string
)

func init() {
	if v := os.Getenv("RUNTIME_ENV"); v == "development" {
		SERVICE_PORT = "7001"
	} else if v := os.Getenv("RUNTIME_ENV"); v == "production" {
		SERVICE_PORT = os.Getenv("SERVICE_PORT")
	} else { // need for debugger
		SERVICE_PORT = "7001"
	}
}

func main() {
	caCert, err := ioutil.ReadFile(ca)
	if err != nil {
		log.Fatal(err)
	}

	caPool := x509.NewCertPool()
	caPool.AppendCertsFromPEM(caCert)

	tlsConfig := &tls.Config{
		ClientAuth: tls.RequireAndVerifyClientCert,
		ClientCAs:  caPool,
	}

	r := mux.NewRouter()
	r.HandleFunc("/get/", handlers.HandleGetObj).Methods("GET", "CONNECT")
	r.HandleFunc("/del/", handlers.HandleDelObj).Methods("DELETE", "CONNECT")
	r.HandleFunc("/post/", handlers.HandlePutObj).Methods("POST", "CONNECT")

	srv := http.Server{
		Addr:         "0.0.0.0:" + SERVICE_PORT,
		Handler:      r,
		IdleTimeout:  HTTPIDLETIMEOUT,
		WriteTimeout: HTTPWRITETIMEOUT,
		ReadTimeout:  HTTPREADTIMEOUT,
		TLSConfig:    tlsConfig,
	}

	log.Printf("Service is going to start on port %s...\n", SERVICE_PORT)

	err = srv.ListenAndServeTLS(cert, key)
	if err != nil {
		if err != nil {
			err = errors.New("server error:", errors.LsnrErr, err)
			log.Panicln(err)
		}
	}
}
