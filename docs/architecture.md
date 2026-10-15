# QuickNotes System Architecture

## 1. Overview

QuickNotes is moving from a browser-only application to an online note-taking service for one million registered users. The system must support secure access, reliable note storage, fast reads, and growth in traffic.

The proposed architecture uses multiple application servers, a relational database, a cache, a content delivery network (CDN), and background workers.

## 2. Functional Requirements

The system must:

1. Allow users to register and log in securely.
2. Allow authenticated users to create, view, update, and delete their notes.
3. Allow users to organize notes with tags.
4. Ensure users can access only their own notes.
5. Support pagination when listing notes.
6. Validate note titles and request data.
7. Return clear success and error responses.
8. Support reliable storage and retrieval of notes.

## 3. Non-Functional Requirements

- **Performance:** Common note-list requests should respond quickly.
- **Scalability:** The system should handle increasing numbers of users and requests.
- **Availability:** A single application server failure should not make the whole service unavailable.
- **Security:** Use HTTPS, authentication, authorization, input validation, and secure password hashing.
- **Data integrity:** Use database transactions and constraints to protect related data.
- **Maintainability:** Separate application logic, data storage, caching, and background processing.
- **Recoverability:** Back up important data and test recovery procedures.
- **Observability:** Monitor errors, latency, resource usage, and failed background jobs.

## 4. Load Estimates for One Million Users

These estimates use the following assumptions:

- Registered users: 1,000,000.
- 10% of users are active daily: 100,000 daily active users.
- Each active user reads or refreshes the notes list 50 times per day.
- Each active user creates 1 note per day.
- Each note and its metadata use an average of 10 KB of database storage.
- One day contains 86,400 seconds.
- Peak traffic is five times the average.
- Notes are retained for one year.
- Estimates exclude backups, indexes, replicas, logs, and temporary files.

### Reads per second

Daily reads:

100,000 users × 50 reads = 5,000,000 reads per day.

Average reads per second:

5,000,000 ÷ 86,400 ≈ **58 reads per second**.

Estimated peak:

58 × 5 ≈ **290 reads per second**.

### Writes per second

Daily writes:

100,000 users × 1 note = 100,000 new notes per day.

Average writes per second:

100,000 ÷ 86,400 ≈ **1.16 writes per second**.

Estimated peak:

1.16 × 5 ≈ **5.8 writes per second**.

These write estimates count note creation only. Updates, deletes, tag changes, and other database operations would add more writes.

### Storage per year

Daily storage:

100,000 notes × 10 KB = 1,000,000 KB, approximately 1 GB per day using decimal units.

Yearly storage:

1 GB × 365 = **365 GB per year**.

This is an estimate for note records and their assumed metadata only. Actual storage will be higher after including indexes, user accounts, tags, replicas, and backups.

### Read-heavy or write-heavy?

QuickNotes is expected to be **read-heavy** because it has approximately 50 reads for every new note created under these assumptions. A cache and read replica can reduce database read pressure, while a primary database remains responsible for authoritative writes.

## 5. Architecture Diagram

```text
                         QUICKNOTES ARCHITECTURE

                            +----------------+
                            | Client / Browser|
                            +----------------+
                                     |
                                     v
                                  +------+
                                  | DNS  |
                                  +------+
                                     |
                                     v
                              +--------------+
                              | CDN / WAF    |
                              +--------------+
                                     |
                                     v
                              +--------------+
                              | Load Balancer|
                              +--------------+
                                     |
                      +--------------+--------------+
                      |                             |
                      v                             v
                +-------------+               +-------------+
                | App Server 1|               | App Server 2|
                +-------------+               +-------------+
                      |                             |
                      +--------------+--------------+
                                     |
                      +--------------+--------------+
                      |                             |
                      v                             v
                +-------------+               +-------------+
                | Cache       |               | Primary DB  |
                | (Redis)     |               +-------------+
                +-------------+                      |
                                                     | Replication
                                                     v
                                               +-------------+
                                               | Read Replica|
                                               +-------------+

                     Background processing:
                       App Server
                           |
                           v
                      +-----------+
                      | Job Queue |
                      +-----------+
                           |
                           v
                      +-----------+
                      | Worker    |
                      +-----------+
                           |
                           v
                      Primary Database
                  (or other required services)
```

The queue and worker are available for asynchronous jobs such as notifications, exports, and other work that should not delay a user request. Note creation itself must still be persisted successfully before the API reports that it has been created.

## 6. What Each Component Solves

- **Client / Browser:** Provides the interface through which users manage their notes.
- **DNS:** Translates the QuickNotes domain name into the address needed to reach the service.
- **CDN / WAF:** Caches static assets near users and filters common malicious web traffic; private note data must not be cached publicly.
- **Load balancer:** Distributes incoming requests across healthy application servers and routes traffic away from failed instances.
- **Application servers:** Validate requests, authenticate users, enforce permissions, and implement the API.
- **Cache (Redis):** Stores frequently requested note-list data to reduce repeated database queries and improve response time.
- **Primary database:** Stores authoritative users, notes, tags, and relationships and handles writes.
- **Read replica:** Handles suitable read queries to reduce the load on the primary database.
- **Job queue:** Holds background tasks until workers can process them, separating slow work from the main request.
- **Worker:** Processes queued jobs, such as notifications and exports, outside the main API request.
- **Monitoring and alerts:** Track failures, latency, and resource usage so the team can identify problems before they cause prolonged outages.
- **Backups and recovery:** Provide a way to restore data after accidental deletion, corruption, or infrastructure failure.

## 7. GET /notes Request Flow

1. The user opens QuickNotes and requests their notes.
2. DNS resolves the service's domain name.
3. The client sends an HTTPS request to the service through the CDN/WAF and load balancer.
4. The load balancer forwards the request to a healthy application server.
5. The application server validates the authentication token and identifies the user.
6. The application checks the cache using a key that includes the user's identity and relevant pagination parameters.
7. If a valid cached result exists, the application returns it after enforcing authorization and response rules.
8. If the cache misses, the application queries the read replica when appropriate. If replication lag or consistency requirements make that unsafe, it reads from the primary database.
9. The application returns the notes as JSON with pagination metadata.
10. The application may cache the result for a short period. Note creation, updates, and deletion must invalidate or update affected cached data.

## 8. POST /notes Request Flow

1. The user submits a note with a title and optional body.
2. The client sends an HTTPS POST request with a JSON body and an authentication token.
3. The load balancer routes the request to a healthy application server.
4. The application validates the token, checks note ownership rules, and validates the title and body.
5. The application inserts the new note into the primary database, using a transaction where necessary.
6. The database commits the write and returns the generated note ID and saved record.
7. The application invalidates or updates relevant cached note lists.
8. If follow-up work is required, such as sending a notification, the application publishes a job to the queue after the database transaction succeeds. A reliable outbox pattern can help prevent lost jobs.
9. The API returns `201 Created` with the saved note.
10. A worker processes the queued task independently and retries transient failures where appropriate.

## 9. Trade-offs

### Cache speed versus data freshness

Caching reduces database load and improves response time. However, users may briefly see outdated notes if cached data is not invalidated correctly. QuickNotes should use short expiration times and invalidate affected cache entries after writes.

### Read replica performance versus consistency

A read replica increases read capacity but may lag behind the primary database. A user might create a note and not immediately see it if the next request reads a stale replica. Read-after-write requests can use the primary database or another consistency mechanism.

### Availability versus operational cost

Multiple application servers, database replicas, backups, and monitoring improve resilience but cost more to operate. Capacity should be scaled according to actual traffic and service requirements.

### Asynchronous work versus immediate completion

A queue prevents slow notifications or exports from delaying the API response. The trade-off is that background work may finish later or fail temporarily. Jobs should be retryable, monitored, and designed to avoid duplicate side effects.

## 10. Avoiding Single Points of Failure

A single point of failure is one component whose failure can make the entire service unavailable.

QuickNotes reduces these risks by:

- Running at least two application servers behind a load balancer.
- Deploying application servers across separate failure zones where possible.
- Using health checks and automatically replacing unhealthy instances.
- Deploying the database with a suitable high-availability or failover configuration.
- Maintaining a read replica, monitoring replication lag, and testing failover procedures.
- Using a highly available cache configuration or treating cache failure as a recoverable miss.
- Using a durable queue with retry policies and a dead-letter mechanism for repeatedly failing jobs.
- Backing up the database and regularly testing restoration.
- Monitoring the service and alerting the team when components fail.

A read replica alone does not guarantee automatic failover, and a queue alone does not guarantee availability. The production deployment must configure, monitor, and test the relevant redundancy and recovery mechanisms.

## 11. Conclusion

QuickNotes can support one million registered users by combining stateless application servers, caching, a primary database with read replicas, and background workers. Under the stated assumptions, the service averages about 58 reads per second, 1.16 note creations per second, and 365 GB of new note storage per year before overhead.

The architecture balances speed, consistency, cost, and reliability. Actual capacity should be validated through load testing and monitoring as real usage grows.