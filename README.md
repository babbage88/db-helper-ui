# DbBob - Spin up and Manage Development Databases

No need to search for "Postgres 17 create new database and grant access to user" or ask AI.

- "ive granted all Piviliges to my new app user, why am I still getting this connection error in my golang backend?"

## Db URL Builder

Build and validate Database URLs and ConnectionStrings

## Dev Db Builder

Utility that will generate scripts to run that will:

- Create a new application database if it does not exist.
- Create a new user/role with the specified username and password
  - Grant new user proper permissions to connect to database and perform queries needed for the application.

The Db Setup Script component will generate three script.

1. A shell script to execute the other two .sql scripts in the proper order 

```shell
#!/bin/sh 
psql -Atx "host=localhost port=5432 user=postgres password=ExamplePW1 dbname=postgres sslmode=disable" -f pg_create_db.sql
psql -Atx "host=localhost port=5432 user=postgres password=ExamplePW1 dbname=applicationdb sslmode=disable" -f pg_app_db.sql

```

2. A sql script to be exexute with the context of a SuperUser and connected to the default postgres database. This script 
- creates the new application database.
- creates the service account user and sets the password to the one specified
- grants all privileges on the new application db to the new service account user

```sql
/* #### Creating new database #### */
CREATE DATABASE applicationdb WITH OWNER = postgres ENCODING = 'UTF8' TEMPLATE = template0;
CREATE ROLE serviceuser WITH LOGIN;
ALTER USER serviceuser WITH PASSWORD 'SvcUserPassword123';
/* ######### SQL Statements to execute while connected to the default postgres database ########## */
GRANT ALL PRIVILEGES ON DATABASE applicationdb TO serviceuser;
```

3. The final sql script will be run in the context of the new application database and will grant all permissions on the public schema
```sql
/* ######### SQL Statements to execute while connected to the new application database ########## */
GRANT ALL ON SCHEMA public TO serviceuser;
ALTER SCHEMA public OWNER TO serviceuser;
```