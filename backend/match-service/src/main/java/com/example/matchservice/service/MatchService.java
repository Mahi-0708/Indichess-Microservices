package com.example.matchservice.service;

import com.example.matchservice.model.Match;
import com.example.matchservice.model.User;
import com.example.matchservice.repo.MatchRepo;
import com.example.matchservice.repo.UserRepo;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

import static com.example.matchservice.model.MatchStatus.IN_PROGRESS;

@Service
public class MatchService {

    private static final Map<String, Long> waitingPlayers = new ConcurrentHashMap<>();
    private static final Map<Long, String[]> matchPlayers = new ConcurrentHashMap<>();

    private final JwtService jwtService;
    private final UserRepo userRepo;
    private final MatchRepo matchRepo;
    private final GameService gameService;
    private final com.example.matchservice.repo.GameResultRepo gameResultRepo;

    public MatchService(JwtService jwtService, UserRepo userRepo, MatchRepo matchRepo, GameService gameService, com.example.matchservice.repo.GameResultRepo gameResultRepo) {
        this.jwtService = jwtService;
        this.userRepo = userRepo;
        this.matchRepo = matchRepo;
        this.gameService = gameService;
        this.gameResultRepo = gameResultRepo;
    }

    public Optional<Long> createMatch(java.security.Principal principal) {
        if (principal == null) {
            return Optional.empty();
        }
        String userName = principal.getName();

        System.out.println("User " + userName + " requesting match");

        synchronized (this) {
            for (String waitingPlayer : waitingPlayers.keySet()) {
                if (!waitingPlayer.equals(userName)) {
                    User player1 = userRepo.getUserByUsername(waitingPlayer);
                    User player2 = userRepo.getUserByUsername(userName);

                    if (player1 != null && player2 != null) {
                        Match newMatch = matchRepo.save(new Match(player1, player2, IN_PROGRESS, 1));
                        Long matchId = newMatch.getId();

                        matchPlayers.put(matchId, new String[] { waitingPlayer, userName });
                        waitingPlayers.remove(waitingPlayer);

                        System.out.println("Match created: " + matchId);

                        return Optional.of(matchId);
                    }
                }
            }

            waitingPlayers.put(userName, -1L);
            System.out.println("User " + userName + " added to waiting queue");

            return Optional.of(-1L);
        }
    }

    public Optional<Long> checkMatch(java.security.Principal principal) {
        if (principal == null) {
            return Optional.empty();
        }
        String userName = principal.getName();

        synchronized (this) {
            if (waitingPlayers.containsKey(userName)) {
                return Optional.of(-1L);
            }

            for (Map.Entry<Long, String[]> entry : matchPlayers.entrySet()) {
                String[] players = entry.getValue();
                if (players[0].equals(userName) || players[1].equals(userName)) {
                    Long matchId = entry.getKey();
                    matchPlayers.remove(matchId);
                    waitingPlayers.remove(players[0]);
                    waitingPlayers.remove(players[1]);
                    System.out.println("Returning match " + matchId + " to " + userName);
                    return Optional.of(matchId);
                }
            }
        }

        return Optional.empty();
    }

    public boolean cancelWaiting(java.security.Principal principal) {
        if (principal == null) {
            return false;
        }
        String userName = principal.getName();

        synchronized (this) {
            boolean removed = waitingPlayers.remove(userName) != null;
            if (removed) {
                System.out.println("User " + userName + " cancelled waiting");
            }
            return removed;
        }
    }

    private Map<String, Object> createPlayerInfo(User user) {
        Map<String, Object> playerInfo = new HashMap<>();
        playerInfo.put("id", user.getUserId());
        playerInfo.put("username", user.getUsername());
        return playerInfo;
    }

    private boolean determineIfMyTurn(Match match, boolean isPlayer1) {
        Integer currentPly = match.getCurrentPly();
        if (currentPly == null) {
            currentPly = 0;
        }

        boolean isWhiteTurn = currentPly % 2 == 0;
        return (isPlayer1 && isWhiteTurn) || (!isPlayer1 && !isWhiteTurn);
    }

    public Map<String, Object> getGameDetailsForFrontend(Long matchId, java.security.Principal principal) {
        if (principal == null) {
            throw new RuntimeException("Not authenticated");
        }

        String username = principal.getName();

        Optional<Match> matchOpt = matchRepo.findById(matchId);
        if (matchOpt.isEmpty()) {
            throw new RuntimeException("Game not found");
        }

        Match match = matchOpt.get();

        User player1 = match.getPlayer1();
        User player2 = match.getPlayer2();

        boolean isPlayer1 = player1.getUsername().equals(username);
        boolean isPlayer2 = player2 != null && player2.getUsername().equals(username);

        if (!isPlayer1 && !isPlayer2) {
            throw new RuntimeException("Not authorized to view this game");
        }

        String playerColor = isPlayer1 ? "white" : "black";
        boolean isMyTurn = determineIfMyTurn(match, isPlayer1);

        Map<String, Object> response = new HashMap<>();
        response.put("matchId", match.getId());
        response.put("player1", createPlayerInfo(player1));

        if (player2 != null) {
            response.put("player2", createPlayerInfo(player2));
        }

        response.put("status", match.getStatus() != null ? match.getStatus().toString() : "IN_PROGRESS");
        response.put("playerColor", playerColor);
        response.put("isMyTurn", isMyTurn);
        response.put("createdAt", match.getCreatedAt());
        response.put("startedAt", match.getStartedAt());
        response.put("currentPly", match.getCurrentPly());
        response.put("fenCurrent", match.getFenCurrent());
        response.put("moves", match.getMoves());
        response.put("timeLimit", match.getTimeLimit());

        return response;
    }

    public Optional<Long> saveBotMatch(Map<String, Object> gameResult, java.security.Principal principal) {
        if (principal == null) return Optional.empty();

        String username = principal.getName();

        User player = userRepo.getUserByUsername(username);
        if (player == null) return Optional.empty();

        // Get or create Computer user
        User computer = userRepo.getUserByUsername("Computer");
        if (computer == null) {
            computer = new User();
            computer.setUsername("Computer");
            computer.setEmailId("bot@indichess.com");
            computer.setPassword("bot_password"); // Not used for login
            computer.setRating(1500);
            computer = userRepo.save(computer);
        }

        String resultStatus = (String) gameResult.get("status");
        String winnerUsername = (String) gameResult.get("winner");
        String gameTypeOverride = (String) gameResult.get("gameType");
        String opponentName = (String) gameResult.get("opponentName");

        // Map status
        String finalStatus;
        if (resultStatus.toLowerCase().contains("checkmate")) {
            finalStatus = "FINISHED";
        } else if (resultStatus.toLowerCase().contains("resign")) {
            finalStatus = "RESIGNED";
        } else if (resultStatus.toLowerCase().contains("draw") || resultStatus.toLowerCase().contains("stalemate")) {
            finalStatus = "DRAW";
        } else {
            finalStatus = "FINISHED";
        }

        // Map winner name
        String finalWinner = null;
        if (!finalStatus.equals("DRAW") && winnerUsername != null) {
            finalWinner = winnerUsername;
        }

        // Save to the dedicated GameResult table
        com.example.matchservice.model.GameResult result = new com.example.matchservice.model.GameResult();
        result.setPlayer1Name(username);
        result.setPlayer2Name(opponentName != null ? opponentName : "Computer");
        result.setGameType(gameTypeOverride != null ? gameTypeOverride : "BOT");
        result.setStatus(finalStatus);
        result.setWinnerName(finalWinner);
        result.setPlayedAt(LocalDateTime.now());
        
        com.example.matchservice.model.GameResult savedResult = gameResultRepo.save(result);

        return Optional.of(savedResult.getId());
    }
}
