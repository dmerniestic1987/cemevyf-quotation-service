# CEMEVYF Quotation Service - AI Agent Instructions

## 🎯 Project Context
You are an expert software engineer with years of experience developing software with typescript, nestjs and node. You are working on the **CEMEVYF Quotation Service**.
This is a backend REST API system designed to manage laboratory test quotations, patients, and health providers for a medical center. The application uses a relational and transactional database.

Our primary goal is to provide a fast, reliable CRUD (Create, Read, Update, Delete) and business logic layer for generating and managing quotations.

## 🛠 Tech Stack & Architecture
- **Runtime:** Node.js 24.22.1 (pinned in `.nvmrc` and `engines`; macOS development environment)
- **Framework:** NestJS 12.2 (ESM-only packages loaded from the CommonJS app; tests run with `npm test`, which enables `--experimental-vm-modules`)
- **Language:** TypeScript 6.0 (strict mode is the target; `strict` is currently `false` in `tsconfig.json` and enabling it is tracked as a separate task)
- **ORM & Database:** TypeORM 1.x with MySQL 9.7 LTS (`mysql2` driver)
- **Authentication/Security:** JWT (`@nestjs/jwt`, HS256) with global guards, `bcrypt` for password hashing, `@nestjs/throttler` on login
- **Communications:** SMTP server integration for sending emails

## 🧑‍💻 Coding Standards & AI Guidelines
1. **Language:** AI prompts and chat interactions may be in Spanish, but **ALL source code, comments, variables, git commits, and documentation MUST be strictly in English**.
2. **Unit Testing:** Minimum acceptable test coverage is **95%**. Every component (Services, Controllers, Utilities) must have accompanying unit tests (Jest).
3. **Architecture:** Follow standard NestJS modular architecture (Modules, Controllers, Services, DTOs, Entities).

## 📊 Initial Data Seed
- The file `@data/labs-master-demo.csv` contains the master price list of laboratory tests.
- The system must support importing/reading this file to seed or manage available medical practices.

## 🔐 Role-Based Access Control (RBAC)
The system features two mutually exclusive user roles (a user can only have one role at a time):
- **Secretary (`SECRETARY`):** Creates quotations, sends patient lists to health providers, and uploads medical practice results to the system.
- **Business Administrator (`BUSINESS_ADMIN`):** Manages health providers, processes payments, and updates the pricing of medical practices.

## 🗂 Domain Model & Entities

### 1. Patient (`Patient`)
Individuals requesting health order quotations.
- **Fields:** First Name, Last Name, Document Type, Document Number, Email, Mobile Phone.

### 2. Medical Order (`HealthOrder`)
A document issued by a healthcare professional containing a list of medical practices (e.g., lab tests) required to assess the patient's health.
- Represented in the system via digital file attachments (PNG, JPG, or PDF formats).

### 3. Medical Practice / Lab Test (`MedicalPractice`)
The catalog of billable medical items (sourced from the CSV).
- **Fields:**
  - `code`: String (Note: Not unique).
  - `name`: Name of the laboratory test.
  - `suggested_price_from_provider`: Used to calculate accounts payable to providers.
  - `price`: Final retail price used to calculate the total quotation value.
  - `provider_id`: Foreign key to the Provider (Defaults to `DEMO_PROVIDER` for this version).

### 4. Provider (`Provider`)
The legal entity or individual offering health services.
- *Current scope constraint:* Only a single dummy provider is required for now (`DEMO_PROVIDER`).

### 5. Quotation (`Quotation`)
The core transactional entity linking a `Patient` and a `HealthOrder`.
- **Fields:** Creation Date, associated Patient ID, list of line items (Medical Practices) with their locked-in prices, and a Unique Quotation Number.
- **Relations:** Can have one or multiple digital files (attachments) associated with it.

## 🔄 Business Logic: Quotation State Machine
Quotations must strictly adhere to one of the following states:
- `PENDING`: The quotation has been created but not yet accepted/paid.
- `EXECUTED`: The patient accepted the quote and scheduled/completed the lab work (blood draw or urine sample drop-off). The system records the execution date.
- `EXPIRED`: The quotation remained in the `PENDING` state for more than 3 months from its creation date and is no longer valid.

## 🚀 Core Workflows (Use Cases)

### A. Quotation Creation (Secretary Workflow)
1. **Intake:** Patient requests a quote and provides a digital medical order (JPG, PNG, PDF). A quotation *must* have at least one attached digital order.
2. **Patient Resolution:**
  - Search for the patient (by first name, last name, or document type + number).
  - If not found, create a new `Patient` record.
3. **Itemization & Attachments:**
  - The Secretary manually reads the physical/digital order and adds the corresponding `MedicalPractice` items one by one.
  - Attach the provided digital files to the quotation entity.
4. **Finalization:** The system generates a unique Quotation Number, links the patient, sets the creation date, itemizes the prices, and saves it in the `PENDING` state.

### B. Patient Search
Provide an endpoint to search patients using any combination of:
- First Name
- Last Name
- Document Type + Document Number

### C. Quotation Search
Provide a robust search/filter endpoint for quotations using:
- Patient ID (Linked to the Patient Search use case)
- Quotation ID / Unique Number
- Quotation Creation Date (Date Range)
- Execution Date (Date Range)

## 🔑 Authentication & Authorization Rules
- All endpoints are protected by the global `JwtAuthGuard` + `RolesGuard` (see `src/auth`). Authorization is deny by default.
- Every controller or endpoint MUST declare its access with `@Auth(...roles)` (use `ALL_ROLES` for any authenticated user) or `@Public()`. Add new controllers to `src/auth/security-metadata.spec.ts`.
- Never return `passwordHash` or `tokenVersion`; map users to `UserResponseDto`. Never log passwords or tokens.
- Changing a user's role, status or password must increment `tokenVersion` (this revokes the existing tokens).
- Secrets only come from the environment (`CEMEVYF_HEALTH_ORDERS_SERVICE_AUTH_JWT_SECRET`) or the git-ignored `config/local.yml`. No users or passwords in migrations; the first admin is created with `npm run -s user:create` (always `-s`, otherwise npm echoes the password argument). Never print or log passwords or tokens.
