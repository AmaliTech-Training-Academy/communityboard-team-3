package com.amalitech.communityboard.service;

import com.amalitech.communityboard.Exceptions.PostNotFoundException;
import com.amalitech.communityboard.Exceptions.UnauthorizedException;
import com.amalitech.communityboard.dto.*;
import com.amalitech.communityboard.model.*;
import com.amalitech.communityboard.repository.*;
import com.amalitech.communityboard.specification.PostSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PostService extends BaseSecurityService{

    private final PostRepository postRepository;
    private final CategoryRepository categoryRepository;
    private final CommentRepository commentRepository;

    public Page<PostResponse> getAllPosts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return postRepository.findAllByIsDeletedFalseOrderByCreatedAtDesc(pageable)
                .map(this::toResponse);
    }

    public PostResponse getPostById(Long id) {
        Post post = postRepository.findById(id)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new PostNotFoundException("Post not found"));
        return toResponse(post);
    }

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

    public PostResponse updatePost(Long id, PostRequest request, User author) {
        Post post = postRepository.findById(id)
                .filter(post1 -> !post1.isDeleted())
                .orElseThrow(() -> new PostNotFoundException("Post not found"));
        if (!post.getAuthor().getId().equals(author.getId())
                && !author.getRole().name().equals("ADMIN")) {
            throw new UnauthorizedException("Not authorized to update this post");
        }
        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        post.setUpdatedAt(LocalDateTime.now());
        if (request.getCategoryId() != null) {
            categoryRepository.findById(request.getCategoryId())
                    .ifPresent(post::setCategory);
        }
        return toResponse(postRepository.save(post));
    }

    public void deletePost(Long id, User author) {
        Post post = postRepository.findById(id)
                .filter(post1 -> !post1.isDeleted())
                .orElseThrow(() -> new PostNotFoundException("Post not found"));
        verifyOwnerOrAdmin(post.getAuthor().getId(), author);
        // soft delete all comments on this post
        List<Comment> comments = commentRepository.findByPostIdOrderByCreatedAtAsc(post.getId());
        comments.forEach(c -> c.setDeleted(true));
        commentRepository.saveAll(comments);


        post.setDeleted(true);
        postRepository.save(post);
    }

    // TODO: Implement search functionality
    public Page<PostResponse> searchPosts(Long categoryId, String keyword,
                                          LocalDateTime startDate, LocalDateTime endDate,
                                          int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("CreatedAt").descending());
        Specification<Post> spec = PostSpecification.filter(categoryId, keyword, startDate, endDate);
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
                .commentCount(commentRepository.countByPostId(post.getId()))
                .build();
    }
}
