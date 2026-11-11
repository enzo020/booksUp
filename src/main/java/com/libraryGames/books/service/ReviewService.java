// ReviewService.java
package com.libraryGames.books.service;

import com.libraryGames.books.dto.request.ReviewRequestDTO;
import com.libraryGames.books.dto.request.ReviewUpdateDTO;
import com.libraryGames.books.dto.response.ReviewResponseDTO;
import com.libraryGames.books.exception.ConflictException;
import com.libraryGames.books.exception.ResourceNotFoundException;
import com.libraryGames.books.model.Game;
import com.libraryGames.books.model.Review;
import com.libraryGames.books.model.User;
import com.libraryGames.books.repository.GameRepository;
import com.libraryGames.books.repository.ReviewRepository;
import com.libraryGames.books.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final GameRepository gameRepository;

    public ReviewService(ReviewRepository reviewRepository, UserRepository userRepository, GameRepository gameRepository) {
        this.reviewRepository = reviewRepository;
        this.userRepository = userRepository;
        this.gameRepository = gameRepository;
    }

    @Transactional
    public ReviewResponseDTO create(ReviewRequestDTO dto) {
        User user = userRepository.findById(dto.userId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o ID: " + dto.userId()));
        Game game = gameRepository.findById(dto.gameId())
                .orElseThrow(() -> new ResourceNotFoundException("Jogo não encontrado com o ID: " + dto.gameId()));

        if (reviewRepository.existsByUserIdAndGameId(dto.userId(), dto.gameId())) {
            throw new ConflictException("Este usuário já possui uma review para este jogo");
        }

        Review review = new Review();
        review.setUser(user);
        review.setGame(game);
        review.setRating(dto.rating());
        review.setComment(dto.comment());
        review.setStatus(dto.status());
        review.setHoursPlayed(dto.hoursPlayed());

        review = reviewRepository.save(review);
        return toDTO(review);
    }

    @Transactional(readOnly = true)
    public List<ReviewResponseDTO> findAll() {
        return reviewRepository.findAll().stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<ReviewResponseDTO> findByUserId(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("Usuário não encontrado com o ID: " + userId);
        }
        return reviewRepository.findByUserId(userId).stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<ReviewResponseDTO> findByGameId(Long gameId) {
        if (!gameRepository.existsById(gameId)) {
            throw new ResourceNotFoundException("Jogo não encontrado com o ID: " + gameId);
        }
        return reviewRepository.findByGameId(gameId).stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public ReviewResponseDTO findById(Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review não encontrada com o ID: " + id));
        return toDTO(review);
    }

    @Transactional
    public ReviewResponseDTO update(Long id, ReviewUpdateDTO dto) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review não encontrada com o ID: " + id));
        review.setRating(dto.rating());
        review.setComment(dto.comment());
        review.setStatus(dto.status());
        review.setHoursPlayed(dto.hoursPlayed());
        return toDTO(reviewRepository.save(review));
    }

    @Transactional
    public void delete(Long id) {
        if (!reviewRepository.existsById(id)) {
            throw new ResourceNotFoundException("Review não encontrada com o ID: " + id);
        }
        reviewRepository.deleteById(id);
    }

    private ReviewResponseDTO toDTO(Review review) {
        return new ReviewResponseDTO(
                review.getId(),
                review.getUser().getId(),
                review.getUser().getName(),
                review.getGame().getId(),
                review.getGame().getTitle(),
                review.getRating(),
                review.getComment(),
                review.getStatus(),
                review.getHoursPlayed(),
                review.getCreatedAt()
        );
    }
}