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

## Swagger

1. Navigate to the server url with the '/swagger' postfix
