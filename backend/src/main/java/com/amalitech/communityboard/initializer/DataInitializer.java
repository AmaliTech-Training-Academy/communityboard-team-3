package com.amalitech.communityboard.initializer;

import com.amalitech.communityboard.model.Category;
import com.amalitech.communityboard.model.User;
import com.amalitech.communityboard.model.enums.Role;
import com.amalitech.communityboard.repository.CategoryRepository;
import com.amalitech.communityboard.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * This class seeds initial data into the database when the application starts.
 * It implements ApplicationRunner so the `run` method is executed after Spring Boot starts.
 */
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        // Seed categories and users when the app starts
        seedCategories();
        seedUsers();
    }
    /**
     * Seed default categories if they do not exist.
     */
    private void seedCategories() {
        List<String[]> categories = List.of(
            new String[]{"NEWS", "General news for the community"},
            new String[]{"EVENT", "Upcoming events"},
            new String[]{"DISCUSSION", "Community discussions"},
            new String[]{"ALERT", "Urgent alerts"}
        );

        for (String[] cat : categories) {
            if (categoryRepository.findByName(cat[0]).isEmpty()) {
                Category category = new Category();
                category.setName(cat[0]);
                category.setDescription(cat[1]);
                categoryRepository.save(category);// Save category to DB
            }
        }
    }

    /**
     * Seed default admin and user accounts if they do not exist.
     */
    private void seedUsers() {
        // Create admin account if it doesn't exist
        if (userRepository.findByEmail("admin@amalitech.com").isEmpty()) {
            User admin = new User();
            admin.setEmail("admin@amalitech.com");
            admin.setName("Admin User");
            admin.setPassword(passwordEncoder.encode("password"));
            admin.setRole(Role.ADMIN);
            userRepository.save(admin);
        }


        // Create a default user account if it doesn't exist
        if (userRepository.findByEmail("user@amalitech.com").isEmpty()) {
            User user = new User();
            user.setEmail("user@amalitech.com");
            user.setName("Default User");
            user.setPassword(passwordEncoder.encode("password"));
            user.setRole(Role.USER);
            userRepository.save(user);
        }
    }
}