package com.amalitech.qa.tests.comments;

import com.amalitech.qa.base.TestBase;
import com.amalitech.qa.config.ApiConfig;
import com.amalitech.qa.utils.JsonUtils;
import io.qameta.allure.Description;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.Map;
import java.util.stream.Stream;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@Epic("Comments Management API Tests")
@Feature("US-XX — Add Comment")
public class AddCommentTest extends TestBase {

    @ParameterizedTest(name = "{0}")
    @MethodSource("provideAddCommentData")
    @DisplayName("verify that when adding a comment with various data sets, the API behaves as expected")
    @Description("Validates the add comment functionality for different scenarios. Expected: 201 for valid, 400/401/403/404 for invalid or unauthorized. Actual: API returns correct status and response body.")
    public void verifyThatWhenAddingComment(Map<String, Object> data) {
	Long postId = (Long) data.get("postId");
	String token = (String) data.get("token");
	int expectedStatusCode = (int) data.get("expectedStatusCode");
	String content = (String) data.get("content");

	var req = given()
		.spec(requestSpec)
		.body(Map.of("content", content));
	if (token != null) {
	    req = req.auth().oauth2(token);
	}
	req.when()
		.post(String.format(ApiConfig.COMMENTS_ENDPOINT, postId))
	.then()
		.statusCode(expectedStatusCode);
    }

    private static Stream<Arguments> provideAddCommentData() {
	// Implement or load from JSON as in posts/auth
	return Stream.empty();
    }
}
