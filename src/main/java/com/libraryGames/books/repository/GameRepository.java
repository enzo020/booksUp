// GameRepository.java
package com.libraryGames.books.repository;

import com.libraryGames.books.model.Game;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GameRepository extends JpaRepository<Game, Long> {}