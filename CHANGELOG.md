# Changelog

All notable changes to this project are documented in this file. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

This release summarizes everything since commit `5889a4b` (version 0.0.1, included).

## [0.1.0] - 2026-10-28

### Breaking changes

- Every endpoint now requires a JWT (`Authorization: Bearer <token>`) except `POST /auth/login`. Clients must log in
  first. Create the first administrator with `npm run -s user:create` after running the new migration.
- `PUT /health-orders/:id/status` is now `PATCH /health-orders/:id/status`.
- The endpoints `POST /health-orders/:id/prescription/e-mail` and `POST /health-orders/:id/results/e-mail` were removed.
- Files are no longer stored in the database. The `StoreFilesOnDisk` migration refuses to run if
  `health_order_files` still has rows, and it drops the `file_data` column. Export or delete those rows first.
- Node.js 24.22.1 or newer is required (`engines`, `.nvmrc` and the Docker image), up from Node 20.18.0.
- `CEMEVYF_HEALTH_ORDERS_SERVICE_AUTH_JWT_SECRET` (at least 32 characters) is required: the service does not start
  without it.

### Added

- **Authentication and roles**
  - `POST /auth/login` with username and password issues an HS256 JWT. It lasts 8 hours by default and the length is
    configurable (`auth.jwt.expiresIn`). `GET /auth/me` and `PUT /auth/password` complete the flow.
  - Two mutually exclusive roles, `SECRETARY` and `BUSINESS_ADMIN`. Authorization is deny by default and is declared
    with the reusable `@Auth(...roles)` and `@Public()` decorators. Today both roles can call the clients and health
    orders endpoints.
  - User management for `BUSINESS_ADMIN` under `/users`: create, list, get, change role or status, reset password.
    Users are disabled, never deleted.
  - Disabling a user, changing the role or changing the password invalidates its tokens immediately.
  - Login rate limit per username and per IP, bcrypt password hashing and a `users` table migration.
  - `npm run -s user:create -- <username> <role> <password>` creates users from the command line (the first admin).
- **Files stored on disk**
  - Prescription and result files are saved under a unique UUID name in `files.uploadDir`; the database keeps only
    the metadata (original name, MIME type detected from the content, size and SHA-256 checksum).
  - `GET /health-orders/:id/files` lists the files and `GET /health-orders/:id/files/:fileId` downloads one.
  - `DELETE /health-orders/:id/files/:fileId` deletes a file while the order is `quoted` or `pending_results`.
  - Upload size limit (5 MB by default), enforced before the file is fully buffered.
- `PATCH /health-orders/status/bulk` updates the status of several health orders in a single transaction.
- `GET /health-orders` can be filtered by the ID of the client (`clientId`), alone or combined with the other filters.
- `PATCH /health-orders/:id/client` assigns a health order to another client (`{ "clientId": "<uuid>" }`). Only
  allowed while the order is `quoted`; no e-mail is sent to the new client.
- `docs/swagger.json` with the OpenAPI document, regenerated with `npm run -s swagger:generate`.
- Health order responses include the client information and the execution date.
- Demo master price list of laboratory tests (`data/labs-master-demo.csv`).
- `AGENTS.md` and `CLAUDE.md` with the project context and coding rules for AI agents.
- GitHub Actions CI that builds and tests against MySQL 9.7.
- `trustProxy` setting for the real client IP behind a proxy, and Bearer authentication in Swagger.

### Changed

- Upgraded the stack: NestJS 10 to 12, TypeORM 0.3 to 1.x, TypeScript 5 to 6, Jest 29 to 30, ESLint 8 to 10 (flat
  config) and MySQL 9.7 LTS as the supported database. Dependencies were also updated to fix known vulnerabilities.
- Stricter DTO validation for clients and health orders.
- README documents installation, MySQL in Docker, migrations, uploaded files and authentication.

### Fixed

- Pipeline and DTO validation problems in clients and health orders.

### Testing

- Unit test coverage is above 99 % (413 tests), including an integration test of the guards over HTTP and a test that
  fails when any endpoint does not declare its roles.

[0.1.0]: https://github.com/dmerniestic1987/cemevyf-quotation-service/compare/5889a4b...HEAD
