package com.amalitech.communityboard.initializer;

import com.amalitech.communityboard.model.User;
import com.amalitech.communityboard.model.enums.Role;

import com.amalitech.communityboard.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * This class seeds initial data into the database when the application starts.
 * It implements ApplicationRunner so the `run` method is executed after Spring Boot starts.
 */
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
       // Create admin account if it doesn't exist
        if (userRepository.findByEmail("admin@amalitech.com").isEmpty()) {
            User admin = new User();
            admin.setEmail("admin@amalitech.com");
            admin.setName("Admin User");
            admin.setPassword(passwordEncoder.encode("password123"));
            admin.setRole(Role.ADMIN);
            userRepository.save(admin);
        }


        // Create a default user account if it doesn't exist
        if (userRepository.findByEmail("user@amalitech.com").isEmpty()) {
            User user = new User();
            user.setEmail("user@amalitech.com");
            user.setName("Default User");
            user.setPassword(passwordEncoder.encode("password123"));
            user.setRole(Role.USER);
            userRepository.save(user);
        }
    }
}