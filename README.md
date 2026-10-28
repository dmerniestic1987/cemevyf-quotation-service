# CEMEVYF Quotation Service

This service allows you to create simple quotes and send them by email to the client. The service communicates with 
cemevyf-message-service to send the quotes.

## Installation

The service needs **Node.js 24.22.1** (pinned in `.nvmrc` and in `engines`; `npm` refuses to install with another
version). With [nvm](https://github.com/nvm-sh/nvm):

```
nvm install   # installs the version in .nvmrc
nvm use
npm install
```

## Running

The service uses a MySQL database. You can use an existing instance or create a new one with Docker.

### Running MySQL in Docker

The supported server is **MySQL 9.7 LTS** (8.4 LTS also works). Do not use the `mysql:latest` tag: it points to the
newest Innovation release. The `--default-authentication-plugin=mysql_native_password` option no longer exists, the
default `caching_sha2_password` plugin works with the `mysql2` driver.

```
docker run -d --name cemevyf-mysql -e MYSQL_ROOT_PASSWORD=my-secret-pw -p 3306:3306 \
  -v cemevyf-mysql:/var/lib/mysql mysql:9.7.4
```

Create the `health_orders` database and put the credentials in `config/local.yml` (not versioned) or in the
`CEMEVYF_HEALTH_ORDERS_SERVICE_DB_*` environment variables (see `config/custom-environment-variables.yml`).

### Migrations and tests

```
npm run migrate    # apply the migrations
npm run rollback   # revert the last migration
npm test           # unit tests with coverage
```

`npm test` runs Jest with `--experimental-vm-modules` because the NestJS 12 packages are ESM-only; always use the
npm script instead of calling `jest` directly.

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
