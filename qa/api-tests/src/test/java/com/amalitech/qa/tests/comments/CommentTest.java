package com.amalitech.qa.tests.comments;

import com.amalitech.qa.base.TestBase;
import com.amalitech.qa.config.ApiConfig;
import io.qameta.allure.Description;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import org.junit.jupiter.api.*;

import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@Epic("Comments Management API Tests")
@Feature("Comment CRUD Operations")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class CommentTest extends TestBase {
    // All comment tests have been separated into AddCommentTest, UpdateCommentTest, DeleteCommentTest, and GetCommentTest.
}
