#!/usr/bin/env bash
openssl x509 -req -in frontend.csr -CA rootCA.pem -CAkey rootCA.key -CAcreateserial -out frontend.crt -days 500 -sha256 -extfile v3ui.ext
