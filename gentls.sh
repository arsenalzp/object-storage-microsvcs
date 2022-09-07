#!/bin/sh

CMD=/usr/bin/openssl
TLS_PATH=${PWD}/tls
SERVER_TLS_PATH=${PWD}/server/tls
CLIENTS_TLS_PATH=${PWD}/server/clients/tls
SERVICES_PATH=${PWD}/services
SERVICES=(
	'create-bucket'
	'get-auth'
	'get-bucket-acl'
	'get-bucket-meta'
	'get-list-buckets'
	'get-list-objects'
	'get-object-acl'
	'get-object-meta'
	'manage-object'
	'put-bucket-acl'
	'put-object-acl'
)

if ! [[ -z "$(ls -A ${TLS_PATH})" ]]; then
   echo "removing old keys and certs"
   rm -f ${TLS_PATH}/server.key && \
   rm -f ${TLS_PATH}/server.crt && \
   rm -f ${TLS_PATH}/rootCA.key && \
   rm -f ${TLS_PATH}/rootCA.crt && \
   rm -f ${TLS_PATH}/rootCA.srl && \
   rm -f ${TLS_PATH}/tls.key && \
   rm -f ${TLS_PATH}/tls.csr && \
   rm -f ${TLS_PATH}/tls.crt && \
   rm -f ${TLS_PATH}/san.conf
fi

cat <<EOF> ${TLS_PATH}/san.conf  
subjectAltName = @alt_names
[alt_names]
IP.1=127.0.0.1
DNS.1=localhost
DNS.2=*.example.com
EOF

echo "generating the key and self-signed cert for the server"
${CMD} req -x509 -nodes -days 3650 -newkey rsa:2048 -keyout ${TLS_PATH}/server.key -out ${TLS_PATH}/server.crt \
 -subj "/C=UA/ST=ZP/L=Zaporizhzhia/O=Default Company Ltd/CN=example.com" -nodes && \

echo "copying them to the server dir"
cp ${TLS_PATH}/server.crt ${SERVER_TLS_PATH} && \
cp ${TLS_PATH}/server.key ${SERVER_TLS_PATH} && \

echo "generating the key and the cert for the CA"
${CMD} req -x509 -sha256 -days 3650 -newkey rsa:2048 -keyout ${TLS_PATH}/rootCA.key -out ${TLS_PATH}/rootCA.crt -subj "/CN=Local CA/O=Local Issuer/C=UA" -nodes && \

echo "generating the key and CSR for clients and services"
${CMD} req -newkey rsa:2048 -keyout ${TLS_PATH}/tls.key -out ${TLS_PATH}/tls.csr -subj "/C=UA/ST=ZP/L=Zaporizhzhia/O=Local client/CN=*.example.com" -nodes && \

echo "signing CSR by using CA"
${CMD} x509 -req -CA ${TLS_PATH}/rootCA.crt -CAkey ${TLS_PATH}/rootCA.key -in ${TLS_PATH}/tls.csr -out ${TLS_PATH}/tls.crt -days 3650 -CAcreateserial -extfile ${TLS_PATH}/san.conf && \

echo "copying the key signed cert into the server's client dir"
cp ${TLS_PATH}/tls.key ${TLS_PATH}/tls.crt ${TLS_PATH}/rootCA.crt ${CLIENTS_TLS_PATH} && \

function tls_remove_old {
	if ! [[ -z "$(ls -A ${1})" ]]; then
        	echo "removing old keys and certs"
        	rm -f $1/tls.key && \
        	rm -f $1/tls.crt && \
        	rm -f $1/rootCA.crt
				fi
	
	# in case of service isn't get-auth one
	if ! [[ -z $2 ]];then
		if ! [[ -z "$(ls -A ${2})" ]];then
		        rm -f $2/tls.key && \
        		rm -f $2/tls.crt && \
        		rm -f $2/rootCA.crt
		fi
	fi
}

function tls_copy_new {
        echo "copying key, cert and CA cert into service ${svc} dir"
        cp ${TLS_PATH}/tls.crt $1/tls.crt && \
        cp ${TLS_PATH}/tls.key $1/tls.key && \
        cp ${TLS_PATH}/rootCA.crt $1/rootCA.crt

	# in case of service isn't get-auth one
	if ! [[ -z $2 ]];then
       		cp ${TLS_PATH}/tls.crt $2/tls.crt && \
	        cp ${TLS_PATH}/tls.key $2/tls.key && \
        	cp ${TLS_PATH}/rootCA.crt $2/rootCA.crt
	fi
}

# Copy the key, cert and CA cert into service directory
for svc in "${SERVICES[@]}"
do	
	SERVICE_TLS_PATH=${SERVICES_PATH}/${svc}/tls
	SERVICE_CLIENT_TLS_PATH=${SERVICES_PATH}/${svc}/clients/tls
	echo "checking for previous key, cert and CA in ${svc} dir"

	if [[ "${svc}" == "get-auth" ]];then
		tls_remove_old ${SERVICE_TLS_PATH}
		tls_copy_new ${SERVICE_TLS_PATH}
	else 
		tls_remove_old ${SERVICE_TLS_PATH} ${SERVICE_CLIENT_TLS_PATH}
		tls_copy_new ${SERVICE_TLS_PATH} ${SERVICE_CLIENT_TLS_PATH}
	fi
done
