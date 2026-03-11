package com.amalitech.qa.config;

public class ApiConfig {
    public static final String BASE_URL = "http://localhost:8081";
    public static final String FRONTEND_ORIGIN = "http://localhost:3000";
    public static final String REGISTER_ENDPOINT = "/api/auth/register";
    public static final String LOGIN_ENDPOINT = "/api/auth/login";
    public static final String POSTS_ENDPOINT = "/api/posts";
    public static final String COMMENTS_ENDPOINT = "/api/posts/%d/comments";
    public static final String CATEGORIES_ENDPOINT = "/api/categories";
}
