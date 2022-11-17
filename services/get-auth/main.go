package main

import (
	"crypto/tls"
	"crypto/x509"
	"get-auth/errors"
	"get-auth/handlers"
	"io/ioutil"
	"log"
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
	SERVICE_PORT string
)

func init() {
	if v := os.Getenv("RUNTIME_ENV"); v == "development" {
		SERVICE_PORT = "7002"
	} else if v := os.Getenv("RUNTIME_ENV"); v == "production" {
		SERVICE_PORT = os.Getenv("SERVICE_PORT")
	} else {
		SERVICE_PORT = "7002"
	}
}

func main() {
	path, _ := os.Getwd()
	var cert string = filepath.Join(path, "tls", "tls.crt")
	var key string = filepath.Join(path, "tls", "tls.key")
	var ca string = filepath.Join(path, "tls", "rootCA.crt")

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
	r.HandleFunc("/auth/", handlers.HandleAuth).Methods("GET", "CONNECT")

	srv := http.Server{
		Addr:         "0.0.0.0:" + SERVICE_PORT,
		Handler:      r,
		IdleTimeout:  HTTPIDLETIMEOUT,
		WriteTimeout: HTTPWRITETIMEOUT,
		ReadTimeout:  HTTPREADTIMEOUT,
		TLSConfig:    tlsConfig,
	}

	log.Printf("service is listening on port %s...\n", SERVICE_PORT)

	err = srv.ListenAndServeTLS(cert, key)
	if err != nil {
		err = errors.New("server error:", errors.LsnrErr, err)
		log.Panicln(err)
	}
}
