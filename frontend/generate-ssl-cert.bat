@echo off
echo Generating SSL certificate for HTTPS development...

:: Create SSL certificate using OpenSSL (if available) or mkcert
if exist "C:\Program Files\OpenSSL-Win64\bin\openssl.exe" (
    set OPENSSL_PATH="C:\Program Files\OpenSSL-Win64\bin\openssl.exe"
) else if exist "C:\OpenSSL\bin\openssl.exe" (
    set OPENSSL_PATH="C:\OpenSSL\bin\openssl.exe"
) else (
    echo OpenSSL not found. Please install OpenSSL or use mkcert.
    echo.
    echo Alternative: Install mkcert from https://github.com/FiloSottile/mkcert
    echo Then run: mkcert localhost 127.0.0.1
    echo.
    pause
    exit /b 1
)

:: Generate private key
%OPENSSL_PATH% genrsa -out key.pem 2048

:: Generate certificate signing request
%OPENSSL_PATH% req -new -key key.pem -out csr.pem -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

:: Generate self-signed certificate
%OPENSSL_PATH% x509 -req -days 365 -in csr.pem -signkey key.pem -out cert.pem

:: Cleanup
del csr.pem

echo.
echo SSL certificate generated successfully!
echo Files created:
echo - cert.pem (certificate)
echo - key.pem (private key)
echo.
echo Now you can run: npm start
pause