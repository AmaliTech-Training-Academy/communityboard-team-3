package com.amalitech.communityboard.service;

import com.amalitech.communityboard.Exceptions.PostNotFoundException;
import com.amalitech.communityboard.dto.*;
import com.amalitech.communityboard.model.*;
import com.amalitech.communityboard.repository.*;
import com.amalitech.communityboard.specification.PostSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PostService extends BaseSecurityService {

    private final PostRepository postRepository;
    private final CategoryRepository categoryRepository;
    private final CommentRepository commentRepository;

    // Read-only transaction — improves performance for queries
    @Transactional(readOnly = true)
    public Page<PostResponse> getAllPosts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return postRepository.findAllByIsDeletedFalseOrderByCreatedAtDesc(pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public PostResponse getPostById(Long id) {
        Post post = postRepository.findById(id)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new PostNotFoundException("Post not found"));
        return toResponse(post);
    }

    // Wraps insert in a transaction — rolls back if anything fails
    @Transactional
    public PostResponse createPost(PostRequest request, User author) {
        Post post = Post.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .author(author)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        if (request.getCategoryId() != null) {
            categoryRepository.findById(request.getCategoryId())
                    .ifPresent(post::setCategory);
        }
        return toResponse(postRepository.save(post));
    }

    @Transactional
    public PostResponse updatePost(Long id, PostRequest request, User author) {
        Post post = postRepository.findById(id)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new PostNotFoundException("Post not found"));

        verifyOwnerOrAdmin(post.getAuthor().getId(), author);

        // Only update fields that are provided
        if (request.getTitle() != null) post.setTitle(request.getTitle());
        if (request.getContent() != null) post.setContent(request.getContent());
        post.setUpdatedAt(LocalDateTime.now());
        if (request.getCategoryId() != null) {
            categoryRepository.findById(request.getCategoryId())
                    .ifPresent(post::setCategory);
        }
        return toResponse(postRepository.save(post));
    }

    // Transactional ensures both post and comments are soft deleted together
    // If either operation fails, both are rolled back
    @Transactional
    public void deletePost(Long id, User author) {
        Post post = postRepository.findById(id)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new PostNotFoundException("Post not found"));

        verifyOwnerOrAdmin(post.getAuthor().getId(), author);

        // Soft delete all comments on this post before deleting the post
        // This ensures cascade consistency without using hard deletes
        List<Comment> comments = commentRepository
                .findByPostIdAndIsDeletedFalseOrderByCreatedAtAsc(post.getId());
        comments.forEach(c -> c.setDeleted(true));
        commentRepository.saveAll(comments);

        post.setDeleted(true);
        postRepository.save(post);
    }

    // Search posts with optional filters — all params are independent and combinable
    @Transactional(readOnly = true)
    public Page<PostResponse> searchPosts(String categoryName, String keyword,
                                          LocalDateTime startDate, LocalDateTime endDate,
                                          int page, int size) {
        // Sort by createdAt — field name must match entity field exactly
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Specification<Post> spec = PostSpecification.filter(categoryName, keyword, startDate, endDate);
        return postRepository.findAll(spec, pageable).map(this::toResponse);
    }

    private PostResponse toResponse(Post post) {
        return PostResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .content(post.getContent())
                .categoryName(post.getCategory() != null ? post.getCategory().getName() : null)
                .categoryId(post.getCategory() != null ? post.getCategory().getId() : null)
                .authorName(post.getAuthor().getName())
                .authorEmail(post.getAuthor().getEmail())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .commentCount(commentRepository.countByPostIdAndIsDeletedFalse(post.getId()))
                .build();
    }
}