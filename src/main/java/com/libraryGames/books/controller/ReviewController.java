// ReviewController.java
package com.libraryGames.books.controller;

import com.libraryGames.books.dto.request.ReviewRequestDTO;
import com.libraryGames.books.dto.request.ReviewUpdateDTO;
import com.libraryGames.books.dto.response.ReviewResponseDTO;
import com.libraryGames.books.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping
    public ResponseEntity<ReviewResponseDTO> create(@Valid @RequestBody ReviewRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reviewService.create(dto));
    }

    @GetMapping
    public ResponseEntity<List<ReviewResponseDTO>> findAll() {
        return ResponseEntity.ok(reviewService.findAll());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ReviewResponseDTO>> findByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(reviewService.findByUserId(userId));
    }

    @GetMapping("/game/{gameId}")
    public ResponseEntity<List<ReviewResponseDTO>> findByGameId(@PathVariable Long gameId) {
        return ResponseEntity.ok(reviewService.findByGameId(gameId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReviewResponseDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(reviewService.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReviewResponseDTO> update(@PathVariable Long id, @Valid @RequestBody ReviewUpdateDTO dto) {
        return ResponseEntity.ok(reviewService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        reviewService.delete(id);
        return ResponseEntity.noContent().build();
    }
}