package com.amalitech.communityboard.service;

import com.amalitech.communityboard.Exceptions.CategoryDeletionException;
import com.amalitech.communityboard.Exceptions.CategoryNotFoundException;
import com.amalitech.communityboard.Exceptions.DuplicateCategoryException;
import com.amalitech.communityboard.dto.CategoryRequest;
import com.amalitech.communityboard.model.Category;
import com.amalitech.communityboard.repository.CategoryRepository;
import com.amalitech.communityboard.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final PostRepository postRepository;
    private final CategoryRepository categoryRepository;

    // Fetch all categories for public display (e.g. frontend dropdowns)
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    // Admin only — create a new category
    public Category createCategory(CategoryRequest request) {
        if (categoryRepository.existsByName(request.getName().toUpperCase())) {
            throw new DuplicateCategoryException("Category already exists");
        }
        Category category = new Category();
        category.setName(request.getName().toUpperCase());
        category.setDescription(request.getDescription());
        return categoryRepository.save(category);
    }

    // Admin only — update an existing category
    public Category updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new CategoryNotFoundException("Category not found"));
        category.setName(request.getName().toUpperCase());
        category.setDescription(request.getDescription());
        return categoryRepository.save(category);
    }

    // Admin only — delete a category
    public void deleteCategory(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new CategoryNotFoundException("Category not found");
        }
        // Prevent deletion if posts are still using this category
        if (postRepository.existsByCategoryId(id)) {
            throw new CategoryDeletionException("Cannot delete category with existing posts");
        }

        categoryRepository.deleteById(id);
    }
}