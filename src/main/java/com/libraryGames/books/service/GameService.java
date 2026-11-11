// GameService.java
package com.libraryGames.books.service;

import com.libraryGames.books.dto.request.GameRequestDTO;
import com.libraryGames.books.dto.response.GameResponseDTO;
import com.libraryGames.books.exception.ResourceNotFoundException;
import com.libraryGames.books.model.Game;
import com.libraryGames.books.repository.GameRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class GameService {

    private final GameRepository gameRepository;

    public GameService(GameRepository gameRepository) {
        this.gameRepository = gameRepository;
    }

    @Transactional
    public GameResponseDTO create(GameRequestDTO dto) {
        Game game = new Game(null, dto.title(), dto.genre(), dto.platform(), dto.releaseYear());
        game = gameRepository.save(game);
        return toDTO(game);
    }

    @Transactional(readOnly = true)
    public List<GameResponseDTO> findAll() {
        return gameRepository.findAll().stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public GameResponseDTO findById(Long id) {
        Game game = gameRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Jogo não encontrado com o ID: " + id));
        return toDTO(game);
    }

    @Transactional
    public GameResponseDTO update(Long id, GameRequestDTO dto) {
        Game game = gameRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Jogo não encontrado com o ID: " + id));
        game.setTitle(dto.title());
        game.setGenre(dto.genre());
        game.setPlatform(dto.platform());
        game.setReleaseYear(dto.releaseYear());
        return toDTO(gameRepository.save(game));
    }

    @Transactional
    public void delete(Long id) {
        if (!gameRepository.existsById(id)) {
            throw new ResourceNotFoundException("Jogo não encontrado com o ID: " + id);
        }
        gameRepository.deleteById(id);
    }

    private GameResponseDTO toDTO(Game game) {
        return new GameResponseDTO(game.getId(), game.getTitle(), game.getGenre(), game.getPlatform(), game.getReleaseYear());
    }
}