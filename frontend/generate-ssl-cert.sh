#!/bin/bash

echo "Generating SSL certificate for HTTPS development..."

# Check if mkcert is available (recommended)
if command -v mkcert &> /dev/null; then
    echo "Using mkcert..."
    mkcert localhost 127.0.0.1
    mv localhost+1.pem cert.pem
    mv localhost+1-key.pem key.pem
    echo "SSL certificate generated successfully using mkcert!"
elif command -v openssl &> /dev/null; then
    echo "Using OpenSSL..."
    
    # Generate private key
    openssl genrsa -out key.pem 2048
    
    # Generate certificate signing request
    openssl req -new -key key.pem -out csr.pem -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    
    # Generate self-signed certificate
    openssl x509 -req -days 365 -in csr.pem -signkey key.pem -out cert.pem
    
    # Cleanup
    rm csr.pem
    
    echo "SSL certificate generated successfully using OpenSSL!"
else
    echo "Neither mkcert nor OpenSSL found."
    echo "Please install one of them:"
    echo "- mkcert: https://github.com/FiloSottile/mkcert (recommended)"
    echo "- OpenSSL: https://www.openssl.org/"
    exit 1
fi

echo ""
echo "Files created:"
echo "- cert.pem (certificate)"
echo "- key.pem (private key)"
echo ""
echo "Now you can run: npm start"