# CommunityBoard Backend API

Spring Boot 3.2 REST API for the CommunityBoard neighborhood bulletin board application.

## Getting Started

### Prerequisites
- Docker & Docker Compose

### Running the Application
```bash
# First run or after code changes
docker-compose up --build

# Subsequent runs
docker-compose up

# Fresh start (clears all data)
docker-compose down -v && docker-compose up --build
```

Base URL: `http://localhost:8080`  
Swagger UI: `http://localhost:8080/swagger-ui/index.html`

---

## Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

Tokens are obtained from the login endpoint and expire after 24 hours.

### Default Accounts
| Email | Password | Role |
|-------|----------|------|
| admin@amalitech.com | password123 | ADMIN |
| user@amalitech.com | password123 | USER |

---

## Endpoints

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | None | Register a new user |
| POST | `/api/auth/login` | None | Login and get JWT token |

#### Register
**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```
**Response `201`:**
```json
{
  "token": "eyJhbGci...",
  "data": {
    "email": "john@example.com",
    "name": "John Doe",
    "role": "USER"
  }
}
```

#### Login
**Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
**Response `200`:**
```json
{
  "token": "eyJhbGci...",
  "data": {
    "email": "john@example.com",
    "name": "John Doe",
    "role": "USER"
  }
}
```

---

### Posts

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/posts` | None | Get all posts (paginated) |
| GET | `/api/posts/{id}` | None | Get post by ID |
| GET | `/api/posts/search` | None | Search and filter posts |
| POST | `/api/posts` | USER/ADMIN | Create a post |
| PUT | `/api/posts/{id}` | USER/ADMIN | Update own post |
| DELETE | `/api/posts/{id}` | USER/ADMIN | Delete own post (ADMIN can delete any) |

#### Get All Posts
**Query params:** `page` (default 0), `size` (default 10)  
**Response `200`:**
```json
{
  "content": [
    {
      "id": 1,
      "title": "Post Title",
      "content": "Post content here",
      "categoryName": "NEWS",
      "categoryId": 1,
      "authorName": "John Doe",
      "authorEmail": "john@example.com",
      "createdAt": "2026-03-11T10:00:00",
      "updatedAt": "2026-03-11T10:00:00",
      "commentCount": 3
    }
  ],
  "totalElements": 50,
  "totalPages": 5,
  "size": 10,
  "number": 0
}
```

#### Search & Filter Posts
All parameters are optional and combinable.

**Query params:**
| Param | Type | Example | Description |
|-------|------|---------|-------------|
| `category` | String | `NEWS` | Filter by category name. Pass `ALL` or omit for all posts |
| `keyword` | String | `hello` | Search in title and content (case-insensitive) |
| `startDate` | LocalDate | `2026-03-01` | Posts created on or after this date |
| `endDate` | LocalDate | `2026-03-11` | Posts created on or before this date |
| `page` | int | `0` | Page number (default 0) |
| `size` | int | `10` | Page size (default 10) |

**Examples:**
```
GET /api/posts/search?category=NEWS
GET /api/posts/search?keyword=community
GET /api/posts/search?startDate=2026-03-01&endDate=2026-03-11
GET /api/posts/search?category=NEWS&keyword=community&startDate=2026-03-01
```

**Response `200`:** Same paginated format as Get All Posts.  
Returns empty list (not an error) when no posts match.

#### Create Post
**Request:**
```json
{
  "title": "Post Title",
  "content": "Post content here",
  "categoryId": 1
}
```
**Response `201`:** Returns the created post object.

#### Update Post
Only the post author or ADMIN can update.  
All fields are optional — only provided fields are updated.

**Request:**
```json
{
  "title": "Updated Title",
  "content": "Updated content",
  "categoryId": 2
}
```
**Response `200`:** Returns the updated post object.

#### Delete Post
Only the post author or ADMIN can delete.  
Soft deletes the post and all its comments.  
**Response `204`:** No content.

---

### Comments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/posts/{postId}/comments` | None | Get comments for a post |
| POST | `/api/posts/{postId}/comments` | USER/ADMIN | Add a comment |
| DELETE | `/api/posts/{postId}/comments/{commentId}` | USER/ADMIN | Delete own comment (ADMIN can delete any) |

#### Get Comments
**Response `200`:**
```json
[
  {
    "id": 1,
    "content": "Great post!",
    "authorName": "John Doe",
    "createdAt": "2026-03-11T10:00:00"
  }
]
```

#### Create Comment
**Request:**
```json
{
  "content": "Great post!"
}
```
**Response `201`:** Returns the created comment object.

#### Delete Comment
Only the comment author or ADMIN can delete. Soft delete.  
**Response `204`:** No content.

---

### Categories

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/categories` | None | Get all categories |
| POST | `/api/categories` | ADMIN | Create a category |
| PUT | `/api/categories/{id}` | ADMIN | Update a category |
| DELETE | `/api/categories/{id}` | ADMIN | Delete a category |

#### Get All Categories
**Response `200`:**
```json
[
  { "id": 1, "name": "NEWS", "description": "General news for the community" },
  { "id": 2, "name": "EVENT", "description": "Upcoming events" },
  { "id": 3, "name": "DISCUSSION", "description": "Community discussions" },
  { "id": 4, "name": "ALERT", "description": "Urgent alerts" }
]
```

#### Create / Update Category (ADMIN only)
**Request:**
```json
{
  "name": "ANNOUNCEMENT",
  "description": "Official announcements"
}
```
**Response `201` / `200`:** Returns the category object.

---

## Error Responses

All errors return a consistent JSON format:
```json
{
  "error": "Error message here"
}
```

| Status Code | Meaning | Example Trigger |
|-------------|---------|-----------------|
| `400` | Bad Request | Missing required field, blank comment |
| `401` | Unauthorized | No token, expired token, wrong credentials |
| `403` | Forbidden | Trying to delete someone else's post |
| `404` | Not Found | Post or comment ID doesn't exist |
| `409` | Conflict | Registering with an existing email |

### Common Error Messages
| Message | Status | Cause |
|---------|--------|-------|
| `Authentication required, please login` | 401 | No token provided |
| `Token has expired, please login again` | 401 | JWT token expired |
| `Invalid token` | 401 | Malformed or tampered token |
| `Invalid credentials` | 401 | Wrong email or password |
| `You do not have permission to perform this action` | 403 | Not owner or admin |
| `Post not found` | 404 | Post ID doesn't exist or is deleted |
| `Comment not found` | 404 | Comment ID doesn't exist or is deleted |
| `Email already in use` | 409 | Email taken on register |
| `Category already exists` | 409 | Duplicate category name |

---

## Validation Rules

| Field | Rule |
|-------|------|
| `email` | Must be valid email format |
| `password` | Minimum 6 characters |
| `name` | Cannot be blank |
| `post.title` | Cannot be blank |
| `post.content` | Cannot be blank |
| `comment.content` | Cannot be blank |
| `category.name` | Cannot be blank |
```