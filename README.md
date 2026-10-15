# QuickNotes System Design

## Project Description

QuickNotes is a note-taking application designed to demonstrate how a browser-based client communicates with an API and how a real note-taking service can be designed to support one million registered users.

The front end uses HTML, CSS, and JavaScript. It connects to the JSONPlaceholder practice API to load, create, and delete sample notes.

The project also includes backend design documents covering the REST API contract, relational database schema, and scalable system architecture.

**Important:** JSONPlaceholder simulates creating and deleting posts. It does not permanently save these changes.

## Features

- Load up to 10 sample notes using GET.
- Create notes using POST.
- Delete notes using DELETE.
- Validate required titles and enforce the 100-character maximum.
- Display loading, success, error, and empty states.
- Disable relevant buttons while requests are running.
- Display notes safely using `textContent`.
- Document the proposed backend API, database, and architecture.

## Project Structure

```text
quicknotes-system-design/
├── index.html
├── api.js
├── style.css
├── README.md
└── docs/
    ├── api-design.md
    ├── data-model.md
    └── architecture.md
```

## How to Run the API Client

### Requirements

- A modern web browser.
- An internet connection.
- Visual Studio Code.
- Live Server for a convenient local development server (recommended).

### Instructions

1. Clone the repository:

   ```bash
   git clone https://github.com/shelaw359/quicknotes-system-design.git
   ```

2. Open the `quicknotes-system-design` folder in Visual Studio Code.

3. Start `index.html` using the Live Server extension. Alternatively, run a local static server from the project directory.

4. Click **Load Notes** to retrieve the first 10 sample posts.

5. Enter a title and optional body, then click **Create Note**.

6. Click **Delete** on a note to simulate deleting it.

### Practice API

The client uses:

`https://jsonplaceholder.typicode.com/posts`

- GET: `/posts?_limit=10`
- POST: `/posts`
- DELETE: `/posts/{id}`

JSONPlaceholder is a testing service. POST and DELETE return simulated responses, so changes are not permanently stored by the remote server. The client updates its in-memory list to reflect successful operations; refreshing the page may restore the original sample data.

## Design Documents

- [REST API Design](docs/api-design.md) — endpoints, authentication, request and response examples, and error handling.
- [Data Model](docs/data-model.md) — entities, relationships, SQL schema, queries, indexes, and database choice.
- [Architecture](docs/architecture.md) — requirements, traffic and storage estimates, component diagram, request flows, trade-offs, and reliability.

## What I Learned

1. **Working with APIs:** How to use `fetch`, `async/await`, HTTP methods, JSON requests, and response status codes.
2. **Error handling:** How to handle failed requests with `try/catch/finally` and provide useful feedback to users.
3. **DOM manipulation:** How to create and update HTML elements safely using `textContent`.
4. **Database design:** How primary keys, foreign keys, one-to-many relationships, many-to-many relationships, and indexes organize data.
5. **System architecture:** How a CDN, load balancer, cache, database read replica, queue, and worker can help a service scale.
6. **Reliability and trade-offs:** Why caching, replication, asynchronous jobs, backups, and failover require careful design.
7. **Git and GitHub:** How to track project changes with meaningful commits and publish work to a remote repository.

## Future Improvements

- Replace the practice API with a real QuickNotes backend.
- Add user registration, authentication, and authorization.
- Persist notes in a relational database.
- Add tags, pagination, and automated tests.
- Deploy the application and API for online access.

## Author

Shelton Wafula Sifuna

GitHub: [shelaw359](https://github.com/shelaw359)