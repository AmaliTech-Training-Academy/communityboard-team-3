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

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Stream;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

/**
 * US-01 — Registration (POST /api/auth/register)
 */

@Epic("Authentication API Tests")
@Feature("US-01 — Registration")
public class AuthRegisterTest extends TestBase {

        @SuppressWarnings("unchecked")
        private static final Map<String, String> validUser = (Map<String, String>) JsonUtils
                        .getMapFromJson("/data/auth/common.json").get("validUser");

        private String generateUniqueEmail() {
                return "user_" + UUID.randomUUID().toString().substring(0, 8) + "@test.com";
        }

        @ParameterizedTest(name = "{0}")
        @MethodSource("provideRegisterData")
        @DisplayName("verify that when registering a user with various data, the API enforces validation and account creation rules as expected")
        @Description("Covers registration with valid and invalid data. Expected: 201 for valid, 400 for invalid/missing fields. Actual: API enforces validation and creates account if valid.")
        public void verifyThatWhenRegistering(Map<String, Object> data) {
                int expectedStatusCode = (int) data.get("expectedStatusCode");
                Map<String, Object> body = new HashMap<>(data);
                // Handle unique email generation if placeholder exists
                if ("GENERATE_UNIQUE".equals(body.get("email"))) {
                        body.put("email", generateUniqueEmail());
                }
                io.restassured.response.Response response = given()
                                .spec(requestSpec)
                                .body(body)
                                .when()
                                .post(ApiConfig.REGISTER_ENDPOINT);

                response.then().statusCode(expectedStatusCode);

                if (expectedStatusCode == 201) {
                        response.then().body("token", not(emptyOrNullString()));
                }
        }

        private static Stream<Arguments> provideRegisterData() {
                return JsonUtils.getArgumentsFromJson("/data/auth/register.json");
        }

        @Test
        @DisplayName("verifying that the system prevents multiple registrations with the same email")
        @Description("Confirms the system's ability to prevent duplicate registrations. " +
                        "Expected Outcome: Returns 400 Bad Request with message 'This email is already in use' on second attempt. "
                        +
                        "Actual Result: The database constraint/service logic correctly blocks identical email registration.")
        public void verifyRegistrationFailsForDuplicateEmail() {
                String email = generateUniqueEmail();
                Map<String, String> body = new HashMap<>(validUser);
                body.put("name", "Duplicate User");
                body.put("email", email);

                given().spec(requestSpec).body(body).post(ApiConfig.REGISTER_ENDPOINT).then().statusCode(201);

                given()
                                .spec(requestSpec)
                                .body(body)
                                .when()
                                .post(ApiConfig.REGISTER_ENDPOINT)
                                .then()
                                .spec(responseSpec)
                                .statusCode(409)
                                .body("error", equalTo("Email already registered"));
        }

        @Test
        // Data provider for registration test cases.
        // Should return a Stream of Arguments, each containing a Map<String, Object> for a test scenario.
        @DisplayName("verifying that the registration response contract meets all security requirements")
        @Description("Ensures that the registration response meets the API's security standards. " +
                        "Expected Outcome: 201 Created, token presence, and absence of password in body. " +
                        "Actual Result: The response schema adheres to the defined security contract.")
        public void verifyRegistrationResponseContract() {
                Map<String, String> requestBody = new HashMap<>(validUser);
                requestBody.put("name", "Contract User");
                requestBody.put("email", generateUniqueEmail());

                given()
                                .spec(requestSpec)
                                .body(requestBody)
                                .when()
                                .post(ApiConfig.REGISTER_ENDPOINT)
                                .then()
                                .spec(responseSpec)
                                .statusCode(201)
                                .header("Content-Type", containsString("application/json"))
                                .body("token", not(emptyOrNullString()))
                                .body("password", nullValue());
        }
}
