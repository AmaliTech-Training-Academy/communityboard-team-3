package com.amalitech.communityboard.service;

import com.amalitech.communityboard.Exceptions.PostNotFoundException;
import com.amalitech.communityboard.Exceptions.UnauthorizedException;
import com.amalitech.communityboard.dto.*;
import com.amalitech.communityboard.model.*;
import com.amalitech.communityboard.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PostService {

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
                .filter(p-> !p.isDeleted())
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
        if (!post.getAuthor().getId().equals(author.getId())) {
            throw new RuntimeException("Not authorized to update this post");
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
                .orElseThrow(() -> new PostNotFoundException("Post not found"));
        if (!post.getAuthor().getId().equals(author.getId())
                && !author.getRole().name().equals("ADMIN")) {
            throw new UnauthorizedException("Not authorized to delete this post");
        }
        post.setDeleted(true);
        postRepository.save(post);
    }

    // TODO: Implement search functionality
    // public Page<PostResponse> searchPosts(String query, Pageable pageable) { ... }

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
