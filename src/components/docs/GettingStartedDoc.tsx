import { createRoot } from 'react-dom/client'
import Markdown from 'react-markdown'

const markdown: string = String.raw`

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

${"```"}shell
#!/bin/sh
psql -Atx $PG_CONN_STRING -f pg_create_script.sql
psql -Atx $APP_CONN_STRING -f pg_appdb_setup.sql
 ${"```"}

${"```"}sql
/* ##### Example DB Creation Script ##### */
SELECT current_date As example_placeholder
${"```"}
`

createRoot(document.body).render(<Markdown>{markdown}</Markdown>)

