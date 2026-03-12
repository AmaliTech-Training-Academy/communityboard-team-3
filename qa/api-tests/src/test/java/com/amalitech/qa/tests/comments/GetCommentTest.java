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
@Feature("US-XX — Get Comment")
public class GetCommentTest extends TestBase {

    @ParameterizedTest(name = "{0}")
    @MethodSource("provideGetCommentData")
    @DisplayName("verify that when retrieving comments, the API returns the correct data or error codes")
    @Description("Checks retrieval of single and multiple comments, including edge cases. Expected: 200 for valid, 404 for non-existent. Actual: API returns correct status and data structure.")
    public void verifyThatWhenGettingComments(Map<String, Object> data) {
        Long postId = ((Number) data.get("postId")).longValue();
        Long commentId = data.get("commentId") != null ? ((Number) data.get("commentId")).longValue() : null;
        int expectedStatusCode = (int) data.get("expectedStatusCode");
        boolean single = (boolean) data.get("single");

        if (single) {
            var res = given().spec(requestSpec);
            if (data.get("token") != null) res = res.auth().oauth2(resolveToken((String) data.get("token")));
            res.when()
                    .get(String.format(ApiConfig.COMMENTS_ENDPOINT, postId) + "/" + commentId)
            .then()
                    .statusCode(expectedStatusCode);
        } else {
            var res = given().spec(requestSpec);
            if (data.get("token") != null) res = res.auth().oauth2(resolveToken((String) data.get("token")));
            res.when()
                    .get(String.format(ApiConfig.COMMENTS_ENDPOINT, postId))
            .then()
                    .statusCode(expectedStatusCode);
        }
    }

    private static Stream<Arguments> provideGetCommentData() {
        return JsonUtils.getListFromJson("/data/comments/comments.json").stream()
                .filter(data -> data.get("testName").toString().startsWith("Get"))
                .map(Arguments::of);
    }
}
