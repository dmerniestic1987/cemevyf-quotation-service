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

## Authentication and roles

Every endpoint requires a JWT (`Authorization: Bearer <token>`) except `POST /auth/login`. There are two mutually
exclusive roles, `SECRETARY` and `BUSINESS_ADMIN`; today both can call the clients and health orders endpoints, and
only `BUSINESS_ADMIN` can manage users (`/users`).

- **Login:** `POST /auth/login` with `username` and `password` returns `{ accessToken, tokenType, expiresIn, user }`.
  Usernames are case insensitive. `GET /auth/me` returns the user of the token and `PUT /auth/password` changes the
  own password (it closes every open session, the user must log in again).
- **Configuration** (`auth.*` in `config/default.yml`, environment variables in
  `config/custom-environment-variables.yml`):
  - `CEMEVYF_HEALTH_ORDERS_SERVICE_AUTH_JWT_SECRET` is **required**, at least 32 characters. The service does not start
    without it. Generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`.
    Never commit it; for local development put it in `config/local.yml`.
  - `CEMEVYF_HEALTH_ORDERS_SERVICE_AUTH_JWT_EXPIRES_IN` is the session length, `8h` by default (a number followed by
    `s`, `m`, `h` or `d`).
  - `CEMEVYF_HEALTH_ORDERS_SERVICE_AUTH_BCRYPT_ROUNDS` (default 12) and `auth.loginRateLimit` (5 attempts per minute
    per username, 20 per IP). The counters live in memory, so they are per instance.
  - `CEMEVYF_HEALTH_ORDERS_SERVICE_TRUST_PROXY`: set it to the number of proxies in front of the service (e.g. `1`)
    when it runs behind a load balancer, otherwise every request looks like it comes from the proxy IP.
- **First administrator:** after `npm run migrate` and `npm run build`, create it with the script. The other users
  are created by that administrator with `POST /users`.

  ```
  npm run -s user:create -- <username> <SECRETARY|BUSINESS_ADMIN> <password>
  npm run -s user:create -- admin BUSINESS_ADMIN 'a-long-password'
  ```

  Always use `-s` (`--silent`): without it npm prints the whole command, password included, before running it. The
  script itself never prints or logs the password, and it validates the arguments before it connects to the database.
  A password given as an argument is still visible in the shell history and in the process list of the machine. To
  avoid that, leave the third argument out and give it in the `NEW_USER_PASSWORD` environment variable
  (`read -rs NEW_USER_PASSWORD && export NEW_USER_PASSWORD`); the argument takes precedence when both are present.
  The username and password follow the same rules as `POST /users`.
- **Sessions:** the user is read from the database on every request, so disabling a user, changing the role or
  changing the password invalidates its tokens immediately (`users.token_version`). There are no refresh tokens: when
  the token expires the user logs in again. Passwords: 12 characters minimum, 72 bytes maximum (bcrypt limit).
- **Frontend:** keep the token in `sessionStorage` (or memory), never in `localStorage`. File downloads need the
  header, so fetch them as a blob instead of using `<img src>` or `<iframe src>`.

### Adding or restricting an endpoint

Authorization is deny by default: the global guards reject any endpoint that does not declare who can call it.

```ts
@Auth(...ALL_ROLES)                // whole controller, every authenticated user
@Controller('quotations')
export class QuotationController {
  @Auth(Role.BUSINESS_ADMIN)       // an endpoint can narrow (or change) the roles of its controller
  @Delete('/:id')
  remove() {}
}
```

`@Public()` skips authentication. New controllers must be added to `src/auth/security-metadata.spec.ts`, which fails
if an endpoint forgets its roles.

## Uploaded files

Prescription and result files (PNG, JPG or PDF, 5 MB max) are stored on disk, not in the database. Each file gets a
unique name (`<uuid>.<png|jpg|pdf>`), and the database only keeps that name plus metadata (original name, MIME type
detected from the content, size and SHA-256 checksum).

- Directory: `files.uploadDir` (default `uploadedFiles`, relative to the working directory). Override it with
  `CEMEVYF_HEALTH_ORDERS_SERVICE_FILE_UPLOAD_DIR`.
- The files contain medical data: the directory is created with `0700` permissions and the files with `0600`.
- **In Docker/production the directory must be a persistent volume and must be included in the backups.** The
  database and the directory have to be restored together, otherwise the downloads fail with 404.
- Endpoints: `GET /health-orders/:id/files` lists the files, `GET /health-orders/:id/files/:fileId` downloads one and
  `DELETE /health-orders/:id/files/:fileId` deletes one (the record and the file on disk). Files can only be deleted
  while the order is in `quoted` or `pending_results` status.

## Swagger

1. Navigate to the server url with the '/swagger' postfix
