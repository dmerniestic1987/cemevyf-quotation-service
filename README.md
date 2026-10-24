# CEMEVYF Quotation Service

This service allows you to create simple quotes and send them by email to the client. The service communicates with 
cemevyf-message-service to send the quotes.

## Installation

We need to use node >= 20

`npm install`

## Running

The service use a database. We can create an existing instance or create a new database using MySQL or Docker.

## Running mysql in docker

1. For example: 

```docker run -e MYSQL_ROOT_PASSWORD=my-secret-pw -p 3306:3306 -d mysql --default-authentication-plugin=mysql_native_password```

## Uploaded files

Prescription and result files (PNG, JPG or PDF, 5 MB max) are stored on disk, not in the database. Each file gets a
unique name (`<uuid>.<png|jpg|pdf>`), and the database only keeps that name plus metadata (original name, MIME type
detected from the content, size and SHA-256 checksum).

- Directory: `files.uploadDir` (default `uploadedFiles`, relative to the working directory). Override it with
  `CEMEVYF_HEALTH_ORDERS_SERVICE_FILE_UPLOAD_DIR`.
- The files contain medical data: the directory is created with `0700` permissions and the files with `0600`.
- **In Docker/production the directory must be a persistent volume and must be included in the backups.** The
  database and the directory have to be restored together, otherwise the downloads fail with 404.
- Endpoints: `GET /health-orders/:id/files` lists the files and `GET /health-orders/:id/files/:fileId` downloads one.

## Swagger

1. Navigate to the server url with the '/swagger' postfix
