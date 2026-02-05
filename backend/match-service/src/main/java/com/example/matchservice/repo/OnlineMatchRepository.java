package com.example.matchservice.repo;

import com.example.matchservice.model.Match;
import com.example.matchservice.model.OnlineMatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OnlineMatchRepository extends JpaRepository<OnlineMatch, Long> {
    Optional<OnlineMatch> findByRoomCode(String roomCode);
    Optional<OnlineMatch> findByMatch(Match match);
}
