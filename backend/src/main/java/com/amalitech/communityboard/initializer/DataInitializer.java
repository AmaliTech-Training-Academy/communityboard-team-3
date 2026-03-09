package com.amalitech.communityboard.initializer;

import com.amalitech.communityboard.model.Category;
import com.amalitech.communityboard.model.User;
import com.amalitech.communityboard.model.enums.Role;
import com.amalitech.communityboard.repository.CategoryRepository;
import com.amalitech.communityboard.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final CategoryRepository categoryRepo;
    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(CategoryRepository categoryRepo, UserRepository userRepo, PasswordEncoder passwordEncoder) {
        this.categoryRepo = categoryRepo;
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        if(categoryRepo.count() == 0) {
            categoryRepo.saveAll(List.of(

                            Category.builder().name("NEWS").description("Neighborhood news").build(),
                            Category.builder().name("EVENT").description("Community events").build(),
                            Category.builder().name("DISCUSSION").description("Community discussions").build(),
                            Category.builder().name("ALERT").description("Urgent alerts").build()
                    ));
        }

        if(userRepo.count() == 0) {
            if (userRepo.count() == 0) {
                userRepo.saveAll(List.of(
                        User.builder()
                                .email("admin@amalitech.com")
                                .name("Admin")
                                .password(passwordEncoder.encode("password123"))
                                .role(Role.ADMIN)
                                .build(),

                        User.builder()
                                .email("user@amalitech.com")
                                .name("User")
                                .password(passwordEncoder.encode("password123"))
                                .role(Role.USER)
                                .build()
                ));
            }
        }
    }
}