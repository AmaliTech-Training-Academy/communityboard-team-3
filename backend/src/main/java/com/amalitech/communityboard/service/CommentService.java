package com.amalitech.communityboard.service;

import com.amalitech.communityboard.Exceptions.CommentNotFoundException;
import com.amalitech.communityboard.Exceptions.PostNotFoundException;
import com.amalitech.communityboard.Exceptions.UnauthorizedException;
import com.amalitech.communityboard.dto.*;
import com.amalitech.communityboard.model.*;
import com.amalitech.communityboard.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService extends BaseSecurityService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;

    public List<CommentResponse> getCommentsByPost(Long postId) {
        return commentRepository.findByPostIdOrderByCreatedAtAsc(postId).stream()
                .filter(c -> !c.isDeleted())
                .map(this::toResponse).toList();
    }

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

     public void deleteComment(Long commentId, User author) {
        Comment comment = commentRepository.findById(commentId)
                .filter(p-> !p.isDeleted()).
                orElseThrow(()-> new CommentNotFoundException("Comment not found"));
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
