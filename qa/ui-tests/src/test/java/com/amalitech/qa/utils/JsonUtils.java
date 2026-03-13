package com.amalitech.qa.utils;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

public class JsonUtils {
    private static final ObjectMapper objectMapper = new ObjectMapper();

    public static List<Map<String, Object>> readTestData(String filePath) throws IOException {
        JsonNode rootNode = objectMapper.readTree(new File(filePath));
        List<Map<String, Object>> testData = new ArrayList<>();

        if (rootNode.isArray()) {
            for (JsonNode node : rootNode) {
                testData.add(objectMapper.convertValue(node, Map.class));
            }
        }
        return testData;
    }

    public static JsonNode readJson(String filePath) throws IOException {
        return objectMapper.readTree(new File(filePath));
    }
}
