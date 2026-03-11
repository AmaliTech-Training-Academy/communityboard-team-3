package com.amalitech.qa.utils;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.params.provider.Arguments;

import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

public class JsonUtils {
    private static final ObjectMapper mapper = new ObjectMapper();

    public static Stream<Arguments> getArgumentsFromJson(String resourcePath) {
        try (InputStream is = JsonUtils.class.getResourceAsStream(resourcePath)) {
            if (is == null) {
                throw new RuntimeException("Resource not found: " + resourcePath);
            }
            List<Map<String, Object>> data = mapper.readValue(is, new TypeReference<List<Map<String, Object>>>() {});
            return data.stream().map(entry -> Arguments.of(entry));
        } catch (Exception e) {
            throw new RuntimeException("Failed to read JSON data from " + resourcePath, e);
        }
    }

    public static Map<String, Object> getMapFromJson(String resourcePath) {
        try (InputStream is = JsonUtils.class.getResourceAsStream(resourcePath)) {
            if (is == null) {
                throw new RuntimeException("Resource not found: " + resourcePath);
            }
            return mapper.readValue(is, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            throw new RuntimeException("Failed to read JSON data from " + resourcePath, e);
        }
    }
}
