-- DATABASE: communityboard
-- Tables + Initial Data
-- ===============================

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
    );

-- CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ame VARCHAR(255) NOT NULL UNIQUE,
    description VARCHAR(255)
    );

-- POSTS TABLE
CREATE TABLE IF NOT EXISTS posts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category_id BIGINT,
    author_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_post_category FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT fk_post_author FOREIGN KEY (author_id) REFERENCES users(id)
    );

-- COMMENTS TABLE
CREATE TABLE IF NOT EXISTS comments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    content TEXT NOT NULL,
    post_id BIGINT NOT NULL,
    author_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_comment_post FOREIGN KEY (post_id) REFERENCES posts(id),
    CONSTRAINT fk_comment_author FOREIGN KEY (author_id) REFERENCES users(id)
    );

-- INITIAL DATA


-- Categories
INSERT INTO categories (name, description) VALUES
    ('NEWS', 'General news for the community'),
    ('EVENT', 'Upcoming events'),
    ('DISCUSSION', 'Community discussions'),
    ('ALERT', 'Urgent alerts')
    ON CONFLICT (name) DO NOTHING;

-- Default Users (passwords in plain text for now;)
INSERT INTO users (email, name, password, role)
SELECT 'admin@amalitech.com', 'Admin User', 'password123', 'ADMIN'
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE email='admin@amalitech.com');

INSERT INTO users (email, name, password, role)
SELECT 'user@amalitech.com', 'Default User', 'password123', 'USER'
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE email='user@amalitech.com');