package com.example.matchservice.service;

import com.example.matchservice.model.Match;
import com.example.matchservice.model.MatchStatus;
import com.example.matchservice.model.OnlineMatch;
import com.example.matchservice.model.User;
import com.example.matchservice.repo.MatchRepo;
import com.example.matchservice.repo.OnlineMatchRepository;
import com.example.matchservice.repo.UserRepo;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
public class OnlineMatchService {

    private final OnlineMatchRepository onlineMatchRepository;
    private final MatchRepo matchRepo;
    private final UserRepo userRepo;
    private final Random random = new Random();

    public OnlineMatchService(OnlineMatchRepository onlineMatchRepository, MatchRepo matchRepo, UserRepo userRepo) {
        this.onlineMatchRepository = onlineMatchRepository;
        this.matchRepo = matchRepo;
        this.userRepo = userRepo;
    }

    @Transactional
    public OnlineMatch createRoom(String hostUsername, Integer timeLimit) {
        User host = userRepo.getUserByUsername(hostUsername);
        if (host == null) {
            throw new RuntimeException("Host user not found");
        }

        String roomCode = generateUniqueRoomCode();
        OnlineMatch onlineMatch = new OnlineMatch(roomCode, host);
        onlineMatch.setTimeLimit(timeLimit);
        return onlineMatchRepository.save(onlineMatch);
    }

    @Transactional
    public OnlineMatch joinRoom(String roomCode, String guestUsername) {
        Optional<OnlineMatch> roomOpt = onlineMatchRepository.findByRoomCode(roomCode);
        if (roomOpt.isEmpty()) {
            throw new RuntimeException("code is wrong unable to join room");
        }

        OnlineMatch room = roomOpt.get();
        if (room.getGuest() != null && !room.getGuest().getUsername().equals(guestUsername)) {
            throw new RuntimeException("Room is already full");
        }

        User guest = userRepo.getUserByUsername(guestUsername);
        if (guest == null) {
            throw new RuntimeException("Guest user not found");
        }

        if (room.getHost().getUsername().equals(guestUsername)) {
            throw new RuntimeException("You cannot join your own room");
        }

        room.setGuest(guest);
        return onlineMatchRepository.save(room);
    }

    @Transactional
    public Match setupMatch(String roomCode, String hostColor) {
        Optional<OnlineMatch> roomOpt = onlineMatchRepository.findByRoomCode(roomCode);
        if (roomOpt.isEmpty()) {
            throw new RuntimeException("Room not found");
        }

        OnlineMatch room = roomOpt.get();
        if (room.getGuest() == null) {
            throw new RuntimeException("No guest has joined yet");
        }

        // Determine P1 and P2 based on selected color
        // In this system, Player1 in Match entity is 'White' by convention (see MatchService.determineIfMyTurn)
        User p1, p2;
        if ("white".equalsIgnoreCase(hostColor)) {
            p1 = room.getHost();
            p2 = room.getGuest();
        } else {
            p1 = room.getGuest();
            p2 = room.getHost();
        }

        Match match = new Match(p1, p2, MatchStatus.IN_PROGRESS, 0); // 0 ply means start
        match.setFenCurrent("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
        match.setTimeLimit(room.getTimeLimit());
        match = matchRepo.save(match);

        room.setMatch(match);
        room.setPlayedAt(LocalDateTime.now());
        onlineMatchRepository.save(room);

        return match;
    }

    public Optional<OnlineMatch> getRoomStatus(String roomCode) {
        return onlineMatchRepository.findByRoomCode(roomCode);
    }

    @Transactional
    public void updateMatchResult(Long matchId, String status, String winnerName) {
        Optional<Match> matchOpt = matchRepo.findById(matchId);
        if (matchOpt.isEmpty()) return;

        Optional<OnlineMatch> onlineMatchOpt = onlineMatchRepository.findByMatch(matchOpt.get());
        if (onlineMatchOpt.isEmpty()) return;

        OnlineMatch onlineMatch = onlineMatchOpt.get();
        try {
            onlineMatch.setStatus(MatchStatus.valueOf(status.toUpperCase()));
        } catch (Exception e) {
            onlineMatch.setStatus(MatchStatus.FINISHED);
        }
        onlineMatch.setWinnerName(winnerName);
        onlineMatchRepository.save(onlineMatch);
    }

    private String generateUniqueRoomCode() {
        String characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed ambiguous characters
        StringBuilder code;
        do {
            code = new StringBuilder();
            for (int i = 0; i < 6; i++) {
                code.append(characters.charAt(random.nextInt(characters.length())));
            }
        } while (onlineMatchRepository.findByRoomCode(code.toString()).isPresent());
        return code.toString();
    }
}
