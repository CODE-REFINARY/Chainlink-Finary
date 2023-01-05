# Public and Private Chainlinks Database ADR

## Decision Outcome
The database used to store chainlinks is POSTGRE. Each user is assigned their own table (in RDBMS terminology) in the database. Each record of the table represents a unique chainlink. A chainlink is a post that contains at least one kind of media and possibly more. Any given chainlink is either public or private and this is denoted by a boolean field. Other fields correspond to the different allowed types of media including plaintext paragraphs, bulleted lists, and JSON formatted img lists.