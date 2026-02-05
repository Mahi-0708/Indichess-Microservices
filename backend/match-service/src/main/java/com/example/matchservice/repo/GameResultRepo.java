package com.example.matchservice.repo;

import com.example.matchservice.model.GameResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GameResultRepo extends JpaRepository<GameResult, Long> {
}
