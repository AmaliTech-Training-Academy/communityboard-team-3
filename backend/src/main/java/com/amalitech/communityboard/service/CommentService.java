package com.amalitech.communityboard.service;

import com.amalitech.communityboard.Exceptions.CommentNotFoundException;
import com.amalitech.communityboard.Exceptions.PostNotFoundException;
import com.amalitech.communityboard.Exceptions.UnauthorizedException;
import com.amalitech.communityboard.dto.*;
import com.amalitech.communityboard.model.*;
import com.amalitech.communityboard.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService extends BaseSecurityService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;

    // Read-only transaction — no writes, optimized for queries
    @Transactional(readOnly = true)
    public List<CommentResponse> getCommentsByPost(Long postId) {
        return commentRepository.findByPostIdAndIsDeletedFalseOrderByCreatedAtAsc(postId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // Wraps comment creation in a transaction — rolls back if save fails
    @Transactional
    public CommentResponse createComment(Long postId, CommentRequest request, User author) {
        Post post = postRepository.findById(postId)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new PostNotFoundException("Post not found"));

        Comment comment = Comment.builder()
                .content(request.getContent())
                .post(post)
                .author(author)
                .build();

        return toResponse(commentRepository.save(comment));
    }

    // Wraps soft delete in a transaction — rolls back if save fails
    @Transactional
    public void deleteComment(Long commentId, User author) {
        Comment comment = commentRepository.findById(commentId)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new CommentNotFoundException("Comment not found"));

        // Verify current user is the comment author or an ADMIN
        verifyOwnerOrAdmin(comment.getAuthor().getId(), author);

        comment.setDeleted(true);
        commentRepository.save(comment);
    }

    private CommentResponse toResponse(Comment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .authorName(comment.getAuthor().getName())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}