package com.amalitech.qa.tests.auth;

import com.amalitech.qa.base.TestBase;
import com.amalitech.qa.config.ApiConfig;
import com.amalitech.qa.utils.JsonUtils;
import io.qameta.allure.Description;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.Map;
import java.util.stream.Stream;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * US-02: Login (POST /api/auth/login)
 */

@Epic("Authentication API Tests")
@Feature("US-02 — Login")
public class AuthLoginTest extends TestBase {

    @SuppressWarnings("unchecked")
    private static final Map<String, String> validUser = (Map<String, String>) JsonUtils.getMapFromJson("/data/auth/common.json").get("validUser");

    @ParameterizedTest(name = "{0}")
    @MethodSource("provideLoginData")
    @DisplayName("verifying that logging in with various credentials behaves according to security rules")
    @Description("Verifies the login process using multiple scenarios defined in the JSON data file. " +
            "Expected Outcome: The system returns the status code specified in the data (e.g., 200 for valid, 401 for invalid). " +
            "Actual Result: The API correctly grants access with a token or restricts it with a generic error message based on inputs.")
    public void verifyLogin(Map<String, Object> data) {
        int expectedStatusCode = (int) data.get("expectedStatusCode");

        io.restassured.response.Response response = given()
                .spec(requestSpec)
                .body(data)
        .when()
                .post(ApiConfig.LOGIN_ENDPOINT);

        response.then().statusCode(expectedStatusCode);

        if (expectedStatusCode == 200) {
            response.then().body("token", not(emptyOrNullString()));
        } else if (expectedStatusCode == 401) {
            response.then().body("error", equalTo("Invalid credentials"));
        }
    }

    private static Stream<Arguments> provideLoginData() {
        return JsonUtils.getArgumentsFromJson("/data/auth/login.json");
    }

    @Test
    @DisplayName("verifying that the generated token is structural valid and works on protected endpoints")
    @Description("Ensures that the authentication token received after a successful login is a valid JWT and functional. " +
            "Expected Outcome: A 3-segment JWT is returned, work on protected endpoints, and fakes are rejected. " +
            "Actual Result: The token system correctly manages access and rejects malformed credentials.")
    public void verifyTokenBehaviorAndJWTStructure() {
        String token = given()
                .spec(requestSpec)
                .body(validUser)
        .when()
                .post(ApiConfig.LOGIN_ENDPOINT)
        .then()
                .statusCode(200)
                .body("token", not(emptyOrNullString()))
                .extract().path("token");

        assertEquals(3, token.split("\\.").length, "Token segments mismatch");

        given()
                .spec(requestSpec)
                .auth().oauth2(token)
        .when()
                .get(ApiConfig.POSTS_ENDPOINT)
        .then()
                .statusCode(200);

        given()
                .spec(requestSpec)
                .auth().oauth2("invalid.token.structure")
        .when()
                .delete(ApiConfig.POSTS_ENDPOINT + "/1")
        .then()
                .statusCode(403);
    }

    @Test
    @DisplayName("verifying that the login response adheres to the expected security contract")
    @Description("Validates the security and format of the login response body and headers. " +
            "Expected Outcome: Response has JSON content type and contains no password field. " +
            "Actual Result: The response body follows security protocols by excluding sensitive data.")
    public void verifyLoginResponseContract() {
        given()
                .spec(requestSpec)
                .body(validUser)
        .when()
                .post(ApiConfig.LOGIN_ENDPOINT)
        .then()
                .spec(responseSpec)
                .statusCode(200)
                .header("Content-Type", containsString("application/json"))
                .body("password", nullValue());
    }
}


