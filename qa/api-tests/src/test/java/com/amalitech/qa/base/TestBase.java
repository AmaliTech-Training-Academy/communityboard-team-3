package com.amalitech.qa.base;

import com.amalitech.qa.config.ApiConfig;
import com.amalitech.qa.utils.JsonUtils;
import io.qameta.allure.restassured.AllureRestAssured;
import io.restassured.RestAssured;
import io.restassured.builder.RequestSpecBuilder;
import io.restassured.builder.ResponseSpecBuilder;
import io.restassured.filter.log.LogDetail;
import io.restassured.http.ContentType;
import io.restassured.specification.RequestSpecification;
import io.restassured.specification.ResponseSpecification;
import org.junit.jupiter.api.BeforeAll;

import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

public class TestBase {
    protected static RequestSpecification requestSpec;
    protected static ResponseSpecification responseSpec;
    protected static String userToken;
    protected static String adminToken;

    @BeforeAll
    public static void setUp() {
        requestSpec = new RequestSpecBuilder()
                .setBaseUri(ApiConfig.BASE_URL)
                .setContentType(ContentType.JSON)
                .addHeader("Origin", ApiConfig.FRONTEND_ORIGIN)
                .addHeader("Referer", ApiConfig.FRONTEND_ORIGIN + "/")
                .addFilter(new AllureRestAssured())
                .log(LogDetail.ALL)
                .build();

        responseSpec = new ResponseSpecBuilder()
                .log(LogDetail.ALL)
                .build();

        // Obtain tokens for testing
        userToken = obtainToken("/data/auth/common.json", "validUser");
        adminToken = obtainToken("/data/auth/common.json", "adminUser");
    }

    @SuppressWarnings("unchecked")
    private static String obtainToken(String resourcePath, String userKey) {
        try {
            Map<String, Object> userData = (Map<String, Object>) JsonUtils.getMapFromJson(resourcePath).get(userKey);
            return given()
                    .spec(requestSpec)
                    .body(userData)
            .when()
                    .post(ApiConfig.LOGIN_ENDPOINT)
            .then()
                    .statusCode(200)
                    .extract().path("token");
        } catch (Exception e) {
            System.err.println("Failed to obtain token for " + userKey + ": " + e.getMessage());
            return null;
        }
    }

    protected Long createPost(String token, String title, String content) {
        return given()
                .spec(requestSpec)
                .auth().oauth2(token)
                .body(Map.of("title", title, "content", content))
        .when()
                .post(ApiConfig.POSTS_ENDPOINT)
        .then()
                .statusCode(anyOf(is(200), is(201)))
                .extract().jsonPath().getLong("id");
    }
}
