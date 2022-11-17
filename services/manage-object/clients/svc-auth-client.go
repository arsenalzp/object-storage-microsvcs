package client

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"io/ioutil"
	"log"
	"manage-object/errors"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

var (
	AUTH_SVC_HOST string // Authentication service host
	AUTH_SVC_PORT string // Authentication service port
	cert          string = filepath.Join("tls", "tls.crt")
	key           string = filepath.Join("tls", "tls.key")
	ca            string = filepath.Join("tls", "rootCA.crt")
	client        *http.Client
	trans         *http.Transport
	tlscfg        *tls.Config
)

func init() {
	if v := os.Getenv("RUNTIME_ENV"); v == "development" {
		AUTH_SVC_HOST = "localhost"
		AUTH_SVC_PORT = "7002"
	} else if v := os.Getenv("RUNTIME_ENV"); v == "production" {
		AUTH_SVC_HOST = os.Getenv("AUTH_SVC_HOST")
		AUTH_SVC_PORT = os.Getenv("AUTH_SVC_PORT")
	} else { // need for debugger
		AUTH_SVC_HOST = "localhost"
		AUTH_SVC_PORT = "7002"
	}

	crt, err := tls.LoadX509KeyPair(cert, key)
	if err != nil {
		log.Fatal(err)
	}

	caCert, err := ioutil.ReadFile(ca)
	if err != nil {
		log.Fatal(err)
	}

	caPool := x509.NewCertPool()
	ok := caPool.AppendCertsFromPEM(caCert)
	if !ok {
		log.Printf("service client init error:%+v\n", errors.New("client error:", errors.SvcClntInitErr, nil))
	}

	tlscfg = &tls.Config{
		ClientAuth:   tls.RequireAndVerifyClientCert,
		RootCAs:      caPool,
		Certificates: []tls.Certificate{crt},
	}

	trans = &http.Transport{
		TLSClientConfig: tlscfg,
	}

	client = &http.Client{
		Transport: trans,
		Timeout:   30 * time.Second,
	}
}

// Authentication service client
func IsAuth(ctx context.Context, bucketName string, objectName string, ent_type, op, requesterUName string) (int, error) {
	url := fmt.Sprintf(`https://%s:%s/auth/?bucketName=%s&objectName=%s&type=%s&op=%s&userName=%s`,
		AUTH_SVC_HOST, AUTH_SVC_PORT, bucketName, objectName, ent_type, op, requesterUName,
	)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		err = errors.New("client error:", errors.SvcCtxErr, err)
		return 500, err
	}

	resp, err := client.Do(req)
	if err != nil {
		err = errors.New("client error:", errors.SvcHttpClntErr, err)
		return 500, err
	}

	return resp.StatusCode, nil
}
