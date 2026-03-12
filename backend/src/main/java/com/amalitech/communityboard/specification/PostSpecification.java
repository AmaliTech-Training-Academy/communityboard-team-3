package com.amalitech.communityboard.specification;

import com.amalitech.communityboard.model.Post;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class PostSpecification {

    // Use Specifications instead of JPQL to handle nullable filters dynamically
    // Avoids PostgreSQL type inference issues with null parameters
    public static Specification<Post> filter(String categoryName, String keyword,
                                              LocalDateTime startDate, LocalDateTime endDate) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // always exclude deleted posts
            predicates.add(cb.isFalse(root.get("isDeleted")));

        // Filter by category name if provided and not 'ALL'
        // Allows frontend to pass category names directly without needing to know IDs
            if (categoryName != null && !categoryName.isBlank() && !categoryName.equalsIgnoreCase("ALL")) {
                predicates.add(cb.equal(
                        cb.upper(root.get("category").get("name")), categoryName.toUpperCase()
                ));
            }

            // only add if keyword was provided
            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("title")), pattern),
                    cb.like(cb.lower(root.get("content")), pattern)
                ));
            }

            // only add if startDate was provided
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
            }

            // only add if endDate was provided
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}