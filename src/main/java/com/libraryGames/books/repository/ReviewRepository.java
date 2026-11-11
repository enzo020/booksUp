// ReviewRepository.java
package com.libraryGames.books.repository;

import com.libraryGames.books.model.Review;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    // O EntityGraph carrega usuário e jogo na mesma consulta e evita o problema N+1
    @Override
    @EntityGraph(attributePaths = {"user", "game"})
    List<Review> findAll();

    @EntityGraph(attributePaths = {"user", "game"})
    List<Review> findByUserId(Long userId);

    @EntityGraph(attributePaths = {"user", "game"})
    List<Review> findByGameId(Long gameId);

    boolean existsByUserIdAndGameId(Long userId, Long gameId);
}
