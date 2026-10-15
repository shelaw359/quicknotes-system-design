# QuickNotes REST API Design

## 1. Overview

QuickNotes is a note-taking service that allows registered users to create, view, update, and delete their notes. The real backend will use a REST API and JSON for communication.

**Base URL:** `https://api.quicknotes.com/v1`

**Content type:** `application/json`

All endpoints use HTTPS. Users must authenticate before accessing their private notes.

## 2. REST Endpoints

| Method | Path | Description | Success Status |
|---|---|---|---|
| POST | `/auth/register` | Register a new user | 201 Created |
| POST | `/auth/login` | Authenticate a user | 200 OK |
| GET | `/notes` | List the authenticated user's notes | 200 OK |
| GET | `/notes/{id}` | Retrieve one note by ID | 200 OK |
| POST | `/notes` | Create a new note | 201 Created |
| PATCH | `/notes/{id}` | Update part of an existing note | 200 OK |
| DELETE | `/notes/{id}` | Delete an existing note | 204 No Content |
| GET | `/tags` | List the authenticated user's tags | 200 OK |
| POST | `/notes/{id}/tags/{tagId}` | Attach a tag to a note | 204 No Content |

## 3. Authentication and Authorization

The login endpoint returns an authentication token after valid credentials are supplied. Protected endpoints require the client to send:

`Authorization: Bearer <access_token>`

The server identifies the authenticated user from the token. Users can access and modify only their own notes unless an explicitly authorized administrative operation is provided.

## 4. Create a Note

### Request

**POST** `/v1/notes`

```json
{
  "title": "Meeting notes",
  "body": "Discuss project deadlines and next steps."
}
```

The title is required and must contain no more than 100 characters. The body is optional.

### Successful response

Status: `201 Created`

```json
{
  "id": 101,
  "userId": 7,
  "title": "Meeting notes",
  "body": "Discuss project deadlines and next steps.",
  "createdAt": "2026-10-15T08:30:00Z",
  "updatedAt": "2026-10-15T08:30:00Z"
}
```

The server generates the note ID, timestamps, and user ID based on the authenticated account. Clients must not choose another user's ID.

## 5. List Notes

### Request

**GET** `/v1/notes?page=1&limit=10`

The client can request a particular page of notes. The API returns only notes belonging to the authenticated user.

### Successful response

Status: `200 OK`

```json
{
  "data": [
    {
      "id": 101,
      "userId": 7,
      "title": "Meeting notes",
      "body": "Discuss project deadlines and next steps.",
      "createdAt": "2026-10-15T08:30:00Z",
      "updatedAt": "2026-10-15T08:30:00Z"
    },
    {
      "id": 102,
      "userId": 7,
      "title": "Shopping list",
      "body": "Milk, bread, and eggs.",
      "createdAt": "2026-10-15T09:00:00Z",
      "updatedAt": "2026-10-15T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "totalPages": 1
  }
}
```

If the user has no notes, the server returns `200 OK` with an empty `data` array.

## 6. Update and Delete Notes

### Update a note

**PATCH** `/v1/notes/101`

Request:

```json
{
  "title": "Updated meeting notes"
}
```

Success status: `200 OK`. The response contains the updated note.

### Delete a note

**DELETE** `/v1/notes/101`

Success status: `204 No Content`. The response has no body.

The API checks ownership before changing or deleting a note. A note that does not exist returns `404 Not Found`.

## 7. Error Status Codes

| Status | Name | Meaning |
|---|---|---|
| 400 | Bad Request | The request is invalid or required input is missing. |
| 401 | Unauthorized | Authentication is missing or invalid. |
| 403 | Forbidden | The user is authenticated but lacks permission. |
| 404 | Not Found | The requested resource does not exist or is not accessible to the user. |
| 409 | Conflict | The request conflicts with an existing resource, such as a duplicate email address. |
| 422 | Unprocessable Entity | The request fields fail validation. |
| 429 | Too Many Requests | The client has exceeded the rate limit. |
| 500 | Internal Server Error | An unexpected server-side error occurred. |
| 503 | Service Unavailable | The service is temporarily unavailable. |

### Example error response

Status: `400 Bad Request`

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Title is required.",
  "timestamp": "2026-10-15T08:30:00Z",
  "path": "/v1/notes"
}
```

The API should return consistent error structures and avoid exposing passwords, tokens, database details, or internal stack traces.

## 8. Validation and Security

- Require a non-empty title of at most 100 characters.
- Treat the note body as optional.
- Validate IDs, request formats, and supported content types.
- Authenticate protected requests and enforce note ownership.
- Hash passwords securely rather than storing plain text.
- Use HTTPS for all communication.
- Apply rate limits to reduce abuse.
- Use parameterized database queries to prevent SQL injection.
- Return only the data required by the client.

## 9. Pagination and Performance

The notes endpoint supports pagination through `page` and `limit`. The server should enforce a maximum page size, such as 100 notes, to prevent unnecessarily large responses.

Frequently accessed note lists may be cached, but changes and deletions must invalidate or update affected cache entries.

## 10. Conclusion

This REST API provides the foundation for a secure, maintainable QuickNotes service. It supports authentication, note CRUD operations, tags, validation, consistent errors, and pagination. The backend team can implement the contract using a relational database and scale read traffic through caching and database read replicas.