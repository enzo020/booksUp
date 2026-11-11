// GameController.java
package com.libraryGames.books.controller;

import com.libraryGames.books.dto.request.GameRequestDTO;
import com.libraryGames.books.dto.response.GameResponseDTO;
import com.libraryGames.books.service.GameService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/games")
public class GameController {

    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @PostMapping
    public ResponseEntity<GameResponseDTO> create(@Valid @RequestBody GameRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(gameService.create(dto));
    }

    @GetMapping
    public ResponseEntity<List<GameResponseDTO>> findAll() {
        return ResponseEntity.ok(gameService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<GameResponseDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(gameService.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GameResponseDTO> update(@PathVariable Long id, @Valid @RequestBody GameRequestDTO dto) {
        return ResponseEntity.ok(gameService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        gameService.delete(id);
        return ResponseEntity.noContent().build();
    }
}