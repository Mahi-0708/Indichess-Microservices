package com.example.matchservice.model.DTO;

import com.example.matchservice.model.User;
import java.time.LocalDateTime;

public class GameDTO {
    private Long id;
    private User player1;
    private User player2;
    private String status;
    private String playerColor;
    private boolean isMyTurn;
    private String[][] board;
    private String fen;
    private LocalDateTime createdAt;
    private java.util.List<com.example.matchservice.model.Move> moves;
    private LocalDateTime updatedAt;
    private Integer timeLimit;

    public GameDTO() {
    }

    public GameDTO(Long id, com.example.matchservice.model.User player1, com.example.matchservice.model.User player2, String status, String playerColor, boolean isMyTurn,
            String[][] board, String fen, LocalDateTime createdAt, LocalDateTime updatedAt, java.util.List<com.example.matchservice.model.Move> moves) {
        this.id = id;
        this.player1 = player1;
        this.player2 = player2;
        this.status = status;
        this.playerColor = playerColor;
        this.isMyTurn = isMyTurn;
        this.board = board;
        this.fen = fen;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.moves = moves;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getPlayer1() {
        return player1;
    }

    public void setPlayer1(User player1) {
        this.player1 = player1;
    }

    public User getPlayer2() {
        return player2;
    }

    public void setPlayer2(User player2) {
        this.player2 = player2;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPlayerColor() {
        return playerColor;
    }

    public void setPlayerColor(String playerColor) {
        this.playerColor = playerColor;
    }

    public boolean isMyTurn() {
        return isMyTurn;
    }

    public void setMyTurn(boolean myTurn) {
        isMyTurn = myTurn;
    }

    public String[][] getBoard() {
        return board;
    }

    public void setBoard(String[][] board) {
        this.board = board;
    }

    public String getFen() {
        return fen;
    }

    public void setFen(String fen) {
        this.fen = fen;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public java.util.List<com.example.matchservice.model.Move> getMoves() {
        return moves;
    }

    public void setMoves(java.util.List<com.example.matchservice.model.Move> moves) {
        this.moves = moves;
    }

    public Integer getTimeLimit() {
        return timeLimit;
    }

    public void setTimeLimit(Integer timeLimit) {
        this.timeLimit = timeLimit;
    }
}
