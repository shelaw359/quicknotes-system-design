# QuickNotes Database Data Model

## 1. Overview

QuickNotes uses a relational SQL database to store users, notes, and tags. The database maintains relationships between records using primary keys and foreign keys.

The four main entities are:

- **Users:** Accounts registered with QuickNotes.
- **Notes:** Notes created by users.
- **Tags:** Labels used to organize notes.
- **Note_tags:** A junction table connecting notes and tags.

## 2. Tables and Columns

### Users

| Column | Type | Key / Rule |
|---|---|---|
| id | BIGINT | Primary key, auto-increment |
| name | VARCHAR(100) | Required |
| email | VARCHAR(255) | Required, unique |
| password_hash | VARCHAR(255) | Required |
| created_at | TIMESTAMP | Required |
| updated_at | TIMESTAMP | Required |

### Notes

| Column | Type | Key / Rule |
|---|---|---|
| id | BIGINT | Primary key, auto-increment |
| user_id | BIGINT | Foreign key referencing users.id |
| title | VARCHAR(100) | Required |
| body | TEXT | Optional |
| created_at | TIMESTAMP | Required |
| updated_at | TIMESTAMP | Required |

### Tags

| Column | Type | Key / Rule |
|---|---|---|
| id | BIGINT | Primary key, auto-increment |
| user_id | BIGINT | Foreign key referencing users.id |
| name | VARCHAR(50) | Required |
| created_at | TIMESTAMP | Required |

A unique constraint on `(user_id, name)` prevents a user from creating duplicate tags with the same name.

### Note_tags

| Column | Type | Key / Rule |
|---|---|---|
| note_id | BIGINT | Primary key component; foreign key to notes.id |
| tag_id | BIGINT | Primary key component; foreign key to tags.id |

The combined primary key `(note_id, tag_id)` prevents the same tag from being attached to the same note more than once.

## 3. Relationships

### One-to-many relationships

- **Users to notes:** One user can create many notes, but each note belongs to one user.
- **Users to tags:** One user can create many tags, but each tag belongs to one user.

These relationships use foreign keys in the `notes` and `tags` tables.

### Many-to-many relationship

- **Notes to tags:** One note can have many tags, and one tag can be used on many notes.

The `note_tags` junction table implements this relationship using `note_id` and `tag_id`.

When a user deletes a note, its associated `note_tags` records should be removed automatically. A tag should not be deleted if it is still referenced by a note unless its associations are removed first.

## 4. CREATE TABLE Statements

The following SQL uses PostgreSQL syntax.

```sql
CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(100) NOT NULL,
    body TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notes_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE tags (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_tags_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_tags_user_name
        UNIQUE (user_id, name)
);

CREATE TABLE note_tags (
    note_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,

    PRIMARY KEY (note_id, tag_id),

    CONSTRAINT fk_note_tags_note
        FOREIGN KEY (note_id)
        REFERENCES notes(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_note_tags_tag
        FOREIGN KEY (tag_id)
        REFERENCES tags(id)
        ON DELETE CASCADE
);
```

## 5. Example SQL Queries

### Query 1: Find all notes belonging to a user

```sql
SELECT id, title, body, created_at
FROM notes
WHERE user_id = 7
ORDER BY updated_at DESC;
```

This retrieves the notes owned by user 7, showing the most recently updated notes first.

### Query 2: Find a note by ID

```sql
SELECT id, user_id, title, body
FROM notes
WHERE id = 101
  AND user_id = 7;
```

Including `user_id` helps ensure that the application retrieves a note only for its owner.

### Query 3: Retrieve notes with their tags using JOIN

```sql
SELECT
    n.id AS note_id,
    n.title,
    t.name AS tag_name
FROM notes n
JOIN note_tags nt ON n.id = nt.note_id
JOIN tags t ON nt.tag_id = t.id
WHERE n.user_id = 7
ORDER BY n.id;
```

This joins notes, the junction table, and tags to show which tags belong to each note.

### Query 4: Count notes for each user

```sql
SELECT
    u.id,
    u.name,
    COUNT(n.id) AS total_notes
FROM users u
LEFT JOIN notes n ON u.id = n.user_id
GROUP BY u.id, u.name
ORDER BY total_notes DESC;
```

The `LEFT JOIN` includes users who have not created any notes.

## 6. Indexes

A useful index is:

```sql
CREATE INDEX idx_notes_user_updated
ON notes (user_id, updated_at DESC);
```

**Reason:** QuickNotes frequently retrieves a user's notes sorted by their update time. This index can help the database filter notes by `user_id` and return them in the required order more efficiently.

The unique constraint on `users.email` also creates an index in PostgreSQL, supporting efficient login lookups and preventing duplicate email addresses.

Indexes consume storage and can slow down inserts and updates slightly, so additional indexes should be based on actual query patterns.

## 7. SQL vs NoSQL Decision

I would choose a relational SQL database such as PostgreSQL for QuickNotes. Users, notes, and tags have clear relationships, and foreign keys help maintain data integrity. SQL transactions are useful when creating a note or updating related records, while joins make it easy to retrieve notes with their tags. At one million users, a well-indexed SQL database can support the service, with caching and read replicas helping to handle higher read traffic. NoSQL could be considered later if specific workloads require a different data model, but it is not necessary for the initial design.

## 8. Conclusion

This model keeps user information, note content, and tags organized in four related tables. Primary keys uniquely identify records, foreign keys enforce relationships, and indexes improve common queries. The schema provides a practical foundation for a secure and scalable QuickNotes backend.