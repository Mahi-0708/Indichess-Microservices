package com.example.matchservice.service;

import com.example.matchservice.model.DTO.*;
import com.example.matchservice.model.Match;
import com.example.matchservice.repo.MatchRepo;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GameService {

    private final MatchRepo matchRepo;
    private final JwtService jwtService;
    private final SimpMessagingTemplate messagingTemplate;
    private final OnlineMatchService onlineMatchService;
    private final com.example.matchservice.repo.MoveRepo moveRepo;

    public GameService(MatchRepo matchRepo, JwtService jwtService,
            SimpMessagingTemplate messagingTemplate, OnlineMatchService onlineMatchService,
            com.example.matchservice.repo.MoveRepo moveRepo) {
        this.matchRepo = matchRepo;
        this.jwtService = jwtService;
        this.messagingTemplate = messagingTemplate;
        this.onlineMatchService = onlineMatchService;
        this.moveRepo = moveRepo;
    }

    private final Map<Long, GameState> activeGames = new ConcurrentHashMap<>();

    private static class GameState {
        private String[][] board;
        private boolean isWhiteTurn;
        private String status;
        private String player1Username;
        private String player2Username;

        public GameState() {
        }

        public String[][] getBoard() {
            return board;
        }

        public void setBoard(String[][] board) {
            this.board = board;
        }

        public boolean isWhiteTurn() {
            return isWhiteTurn;
        }

        public void setWhiteTurn(boolean whiteTurn) {
            isWhiteTurn = whiteTurn;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getPlayer1Username() {
            return player1Username;
        }

        public void setPlayer1Username(String player1Username) {
            this.player1Username = player1Username;
        }

        public String getPlayer2Username() {
            return player2Username;
        }

        public void setPlayer2Username(String player2Username) {
            this.player2Username = player2Username;
        }
    }

    public GameDTO getGameDetails(Long matchId, Principal principal) {
        if (principal == null) {
            throw new RuntimeException("User not authenticated");
        }
        String username = principal.getName();

        Optional<Match> matchOpt = matchRepo.findById(matchId);
        if (matchOpt.isEmpty()) {
            throw new RuntimeException("Game not found");
        }

        Match match = matchOpt.get();
        String playerColor = determinePlayerColor(match, username);
        boolean isMyTurn = determineMyTurn(match, username);

        GameState gameState = activeGames.get(matchId);
        if (gameState == null) {
            gameState = initializeGameState(match);
            activeGames.put(matchId, gameState);

            activeGames.put(matchId, gameState);
        }

        GameDTO gameDTO = new GameDTO();
        gameDTO.setId(match.getId());
        gameDTO.setPlayer1(match.getPlayer1());
        gameDTO.setPlayer2(match.getPlayer2());
        gameDTO.setStatus(gameState.getStatus());
        gameDTO.setPlayerColor(playerColor);
        gameDTO.setMyTurn(isMyTurn);
        gameDTO.setBoard(gameState.getBoard());
        gameDTO.setFen(convertBoardToFEN(gameState.getBoard(), gameState.isWhiteTurn()));
        gameDTO.setCreatedAt(match.getCreatedAt());
        gameDTO.setUpdatedAt(match.getUpdatedAt());
        gameDTO.setMoves(match.getMoves());

        return gameDTO;
    }

    private String determinePlayerColor(Match match, String username) {
        if (match.getPlayer1().getUsername().equals(username)) {
            return "white";
        } else if (match.getPlayer2().getUsername().equals(username)) {
            return "black";
        }
        throw new RuntimeException("User not part of this game");
    }

    private boolean determineMyTurn(Match match, String username) {
        GameState gameState = activeGames.get(match.getId());
        if (gameState == null) {
            return match.getPlayer1().getUsername().equals(username);
        }

        boolean isWhiteTurn = gameState.isWhiteTurn();
        if (isWhiteTurn) {
            return match.getPlayer1().getUsername().equals(username);
        } else {
            return match.getPlayer2().getUsername().equals(username);
        }
    }

    private GameState initializeGameState(Match match) {
        String[][] initialBoard = {
                { "r", "n", "b", "q", "k", "b", "n", "r" },
                { "p", "p", "p", "p", "p", "p", "p", "p" },
                { "", "", "", "", "", "", "", "" },
                { "", "", "", "", "", "", "", "" },
                { "", "", "", "", "", "", "", "" },
                { "", "", "", "", "", "", "", "" },
                { "P", "P", "P", "P", "P", "P", "P", "P" },
                { "R", "N", "B", "Q", "K", "B", "N", "R" }
        };

        GameState gameState = new GameState();
        gameState.setBoard(initialBoard);
        gameState.setWhiteTurn(true);
        gameState.setStatus("IN_PROGRESS");
        gameState.setPlayer1Username(match.getPlayer1().getUsername());
        gameState.setPlayer2Username(match.getPlayer2().getUsername());

        return gameState;
    }

    public MoveDTO processMove(Long matchId, MoveRequest moveRequest, Principal principal) {
        String username = principal.getName();

        if (moveRequest.getFromRow() == null || moveRequest.getFromCol() == null ||
                moveRequest.getToRow() == null || moveRequest.getToCol() == null) {
            throw new RuntimeException("Move coordinates cannot be null");
        }

        if (moveRequest.getPiece() == null || moveRequest.getPiece().isEmpty()) {
            throw new RuntimeException("Piece cannot be null or empty");
        }

        if (moveRequest.getPlayerColor() == null) {
            throw new RuntimeException("Player color cannot be null");
        }

        GameState gameState = activeGames.get(matchId);
        if (gameState == null) {
            throw new RuntimeException("Game not found or not active");
        }

        boolean isWhiteTurn = gameState.isWhiteTurn();
        String expectedPlayer = isWhiteTurn ? gameState.getPlayer1Username() : gameState.getPlayer2Username();

        if (!username.equals(expectedPlayer)) {
            throw new RuntimeException("Not your turn");
        }

        String playerColor = moveRequest.getPlayerColor();
        if (isWhiteTurn && !"white".equals(playerColor)) {
            throw new RuntimeException("Invalid move: White's turn but player is " + playerColor);
        }
        if (!isWhiteTurn && !"black".equals(playerColor)) {
            throw new RuntimeException("Invalid move: Black's turn but player is " + playerColor);
        }

        String[][] newBoard = moveRequest.getBoard();
        if (newBoard == null) {
            throw new RuntimeException("Board cannot be null");
        }

        gameState.setBoard(newBoard);
        gameState.setWhiteTurn(!isWhiteTurn);
        
        String status = moveRequest.getStatus() != null ? moveRequest.getStatus() : "IN_PROGRESS";
        gameState.setStatus(status);

        activeGames.put(matchId, gameState);

        // If game is over, update OnlineMatch
        if (!"IN_PROGRESS".equals(status)) {
            String winner = null;
            if ("FINISHED".equals(status)) {
                winner = username; // Player who made the move that finished the game wins
            }
            onlineMatchService.updateMatchResult(matchId, status, winner);
        }


        try {
            updateMatchInDatabase(matchId, moveRequest);
        } catch (Exception e) {
            System.err.println("⚠️ Failed to update database: " + e.getMessage());
        }

        String moveNotation = createMoveNotation(moveRequest);

        MoveDTO moveDTO = new MoveDTO();
        moveDTO.setFromRow(moveRequest.getFromRow());
        moveDTO.setFromCol(moveRequest.getFromCol());
        moveDTO.setToRow(moveRequest.getToRow());
        moveDTO.setToCol(moveRequest.getToCol());
        moveDTO.setPiece(moveRequest.getPiece());
        moveDTO.setPromotedTo(moveRequest.getPromotedTo());
        moveDTO.setCapturedPiece(moveRequest.getCapturedPiece());
        moveDTO.setCastled(moveRequest.getCastled() != null ? moveRequest.getCastled() : false);
        moveDTO.setIsEnPassant(moveRequest.getIsEnPassant() != null ? moveRequest.getIsEnPassant() : false);
        moveDTO.setIsPromotion(moveRequest.getIsPromotion() != null ? moveRequest.getIsPromotion() : false);
        moveDTO.setFenBefore(moveRequest.getFenBefore());
        moveDTO.setFenAfter(moveRequest.getFenAfter());
        moveDTO.setBoard(newBoard);
        moveDTO.setIsWhiteTurn(!isWhiteTurn);
        moveDTO.setPlayerColor(playerColor);
        moveDTO.setMatchId(matchId);
        moveDTO.setTimestamp(LocalDateTime.now());
        moveDTO.setMoveNotation(moveNotation);
        moveDTO.setPlayerUsername(username);

        return moveDTO;
    }

    private String createMoveNotation(MoveRequest move) {
        int toRow = move.getToRow();
        int toCol = move.getToCol();
        String piece = move.getPiece();

        String toSquare = colToFile(toCol) + (8 - toRow);

        if (Boolean.TRUE.equals(move.getCastled())) {
            return toCol == 6 ? "O-O" : "O-O-O";
        }

        String pieceSymbol = piece.toUpperCase();
        if ("p".equalsIgnoreCase(piece)) {
            pieceSymbol = "";
        }

        String capture = move.getCapturedPiece() != null && !move.getCapturedPiece().isEmpty() ? "x" : "";
        return pieceSymbol + capture + toSquare;
    }

    private String colToFile(int col) {
        return String.valueOf((char) ('a' + col));
    }

    private void updateMatchInDatabase(Long matchId, MoveRequest moveRequest) {
        try {
            Optional<Match> matchOpt = matchRepo.findById(matchId);
            if (matchOpt.isPresent()) {
                Match match = matchOpt.get();

                if (moveRequest.getFenAfter() != null) {
                    match.setFenCurrent(moveRequest.getFenAfter());
                }

                String uci = createUCI(moveRequest);
                if (!uci.isEmpty()) {
                    match.setLastMoveUci(uci);
                }

                Integer currentPly = match.getCurrentPly();
                if (currentPly == null) {
                    currentPly = 0;
                }
                int newPly = currentPly + 1;
                match.setCurrentPly(newPly);

                // Save individual Move entity
                com.example.matchservice.model.Move move = new com.example.matchservice.model.Move();
                move.setMatch(match);
                move.setPly(newPly);
                move.setMoveNumber((newPly + 1) / 2);
                move.setColor(newPly % 2 == 1 ? com.example.matchservice.model.PieceColor.WHITE : com.example.matchservice.model.PieceColor.BLACK);
                move.setUci(uci);
                move.setSan(createMoveNotation(moveRequest));
                move.setFenBefore(moveRequest.getFenBefore());
                move.setFenAfter(moveRequest.getFenAfter());
                move.setCreatedAt(java.time.LocalDateTime.now());
                
                moveRepo.save(move);
                matchRepo.save(match);
            }
        } catch (Exception e) {
            System.err.println("❌ Error updating match in database: " + e.getMessage());
        }
    }

    private String createUCI(MoveRequest move) {
        if (move.getFromCol() == null || move.getFromRow() == null ||
                move.getToCol() == null || move.getToRow() == null) {
            return "";
        }

        try {
            String fromFile = Character.toString((char) ('a' + move.getFromCol()));
            int fromRank = 8 - move.getFromRow();
            String toFile = Character.toString((char) ('a' + move.getToCol()));
            int toRank = 8 - move.getToRow();

            String uci = fromFile + fromRank + toFile + toRank;

            if (Boolean.TRUE.equals(move.getIsPromotion()) && move.getPromotedTo() != null) {
                String promotedPiece = move.getPromotedTo().toLowerCase();
                if (promotedPiece.equals("q"))
                    uci += "q";
                else if (promotedPiece.equals("r"))
                    uci += "r";
                else if (promotedPiece.equals("b"))
                    uci += "b";
                else if (promotedPiece.equals("n"))
                    uci += "n";
            }

            return uci;
        } catch (Exception e) {
            System.err.println("Error creating UCI notation: " + e.getMessage());
            return "";
        }
    }

    public GameStatusDTO handlePlayerJoin(Long matchId, JoinRequest joinRequest, Principal principal) {
        String username = principal.getName();

        GameState gameState = activeGames.get(matchId);
        if (gameState == null) {
            Optional<Match> matchOpt = matchRepo.findById(matchId);
            if (matchOpt.isPresent()) {
                gameState = initializeGameState(matchOpt.get());
                activeGames.put(matchId, gameState);
            } else {
                throw new RuntimeException("Game not found");
            }
        }

        GameStatusDTO statusDTO = new GameStatusDTO();
        statusDTO.setMatchId(matchId);
        statusDTO.setStatus(gameState.getStatus());
        statusDTO.setPlayerColor(joinRequest.getPlayerColor());
        statusDTO.setMyTurn(determineMyTurn(matchId, username));
        statusDTO.setBoard(gameState.getBoard());
        statusDTO.setFen(convertBoardToFEN(gameState.getBoard(), gameState.isWhiteTurn()));

        return statusDTO;
    }

    private boolean determineMyTurn(Long matchId, String username) {
        GameState gameState = activeGames.get(matchId);
        if (gameState == null)
            return false;

        boolean isWhiteTurn = gameState.isWhiteTurn();
        if (isWhiteTurn) {
            return gameState.getPlayer1Username().equals(username);
        } else {
            return gameState.getPlayer2Username().equals(username);
        }
    }

    private String convertBoardToFEN(String[][] board, boolean isWhiteTurn) {
        StringBuilder fen = new StringBuilder();

        for (int row = 0; row < 8; row++) {
            int emptyCount = 0;
            for (int col = 0; col < 8; col++) {
                String piece = board[row][col];
                if (piece == null || piece.isEmpty()) {
                    emptyCount++;
                } else {
                    if (emptyCount > 0) {
                        fen.append(emptyCount);
                        emptyCount = 0;
                    }
                    fen.append(piece);
                }
            }
            if (emptyCount > 0) {
                fen.append(emptyCount);
            }
            if (row < 7) {
                fen.append("/");
            }
        }

        fen.append(" ").append(isWhiteTurn ? "w" : "b");
        fen.append(" ").append("KQkq");
        fen.append(" ").append("-");
        fen.append(" ").append("0 1");

        return fen.toString();
    }

    public void handleResignation(Long matchId, String username) {
        GameState gameState = activeGames.get(matchId);
        if (gameState != null) {
            gameState.setStatus("RESIGNED");
            activeGames.put(matchId, gameState);

            String opponent = getOpponentUsername(matchId, username);
            onlineMatchService.updateMatchResult(matchId, "RESIGNED", opponent);

            // We rely on GameController's @SendTo to broadcast the RESIGNATION type message
        }
    }

    public void handleDrawAccept(Long matchId) {
        GameState gameState = activeGames.get(matchId);
        if (gameState != null) {
            gameState.setStatus("DRAW");
            activeGames.put(matchId, gameState);
            onlineMatchService.updateMatchResult(matchId, "DRAW", null);
        }
    }


    public void handleDrawOffer(Long matchId, String username) {
        GameState gameState = activeGames.get(matchId);
        if (gameState != null) {
            String opponent = getOpponentUsername(matchId, username);

            Map<String, Object> drawOffer = new HashMap<>();
            drawOffer.put("type", "DRAW_OFFER");
            drawOffer.put("from", username);
            drawOffer.put("matchId", matchId);
            drawOffer.put("timestamp", System.currentTimeMillis());

            System.out.println("Sending draw offer from " + username + " to " + opponent + " for match " + matchId);
            messagingTemplate.convertAndSendToUser(opponent, "/queue/draw-offers", drawOffer);
            
            // Debug: Send to public topic as well to see if it arrives there
            messagingTemplate.convertAndSend("/topic/game-state/" + matchId, drawOffer);
        }
    }

    public void handleDrawDecline(Long matchId, String username) {
        String opponent = getOpponentUsername(matchId, username);
        
        Map<String, Object> declineMsg = new HashMap<>();
        declineMsg.put("type", "DRAW_DECLINED");
        declineMsg.put("player", username);
        declineMsg.put("matchId", matchId);
        declineMsg.put("timestamp", System.currentTimeMillis());

        System.out.println("Broadcasting draw decline from " + username + " for match " + matchId);
        messagingTemplate.convertAndSend("/topic/game-state/" + matchId, declineMsg);
    }

    private String getPlayerColor(Long matchId, String username) {
        GameState gameState = activeGames.get(matchId);
        if (gameState != null) {
            if (username.equals(gameState.getPlayer1Username())) {
                return "white";
            } else if (username.equals(gameState.getPlayer2Username())) {
                return "black";
            }
        }
        return null;
    }

    private String getOpponentUsername(Long matchId, String username) {
        GameState gameState = activeGames.get(matchId);
        if (gameState != null) {
            if (username.equals(gameState.getPlayer1Username())) {
                return gameState.getPlayer2Username();
            } else if (username.equals(gameState.getPlayer2Username())) {
                return gameState.getPlayer1Username();
            }
        }
        return null;
    }

}
