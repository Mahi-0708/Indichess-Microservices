package com.example.matchservice.controller;

import com.example.matchservice.model.DTO.*;
import com.example.matchservice.service.GameService;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@RestController
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class GameController {

    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @MessageMapping("/game/{matchId}/move")
    @SendTo("/topic/moves/{matchId}")
    public MoveDTO handleMove(@DestinationVariable Long matchId,
            @Payload MoveRequest moveRequest,
            Principal principal) {
        try {
            if (principal == null) {
                System.err.println("GameController: Principal is NULL for move in game " + matchId);
                throw new RuntimeException("User not authenticated");
            }
            System.out.println("GameController: Received move for game " + matchId + " from " + principal.getName());
            return gameService.processMove(matchId, moveRequest, principal);
        } catch (Exception e) {
            System.err.println("Error processing move: " + e.getMessage());
            MoveDTO errorMove = new MoveDTO();
            errorMove.setMatchId(matchId);
            errorMove.setMoveNotation("ERROR: " + e.getMessage());
            return errorMove;
        }
    }

    @MessageMapping("/game/{matchId}/join")
    @SendTo("/topic/game/{matchId}")
    public GameStatusDTO handlePlayerJoin(@DestinationVariable Long matchId,
            @Payload JoinRequest joinRequest,
            Principal principal) {
        try {
            if (principal == null) {
                System.err.println("GameController: Principal is NULL for join in game " + matchId);
                throw new RuntimeException("User not authenticated");
            }
            System.out.println("GameController: Player " + principal.getName() + " joining game " + matchId);
            return gameService.handlePlayerJoin(matchId, joinRequest, principal);
        } catch (Exception e) {
            System.err.println("Error handling player join: " + e.getMessage());
            GameStatusDTO errorStatus = new GameStatusDTO();
            errorStatus.setMatchId(matchId);
            errorStatus.setStatus("ERROR: " + e.getMessage());
            return errorStatus;
        }
    }

    @MessageMapping("/game/{matchId}/resign")
    @SendTo("/topic/game-state/{matchId}")
    public Map<String, Object> handleResign(@DestinationVariable Long matchId,
            Principal principal) {
        try {
            System.out.println("Player " + principal.getName() + " resigning from game " + matchId);
            gameService.handleResignation(matchId, principal.getName());

            Map<String, Object> response = new HashMap<>();
            response.put("type", "RESIGNATION");
            response.put("player", principal.getName());
            response.put("matchId", matchId);
            response.put("timestamp", System.currentTimeMillis());
            return response;
        } catch (Exception e) {
            System.err.println("Error handling resignation: " + e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return error;
        }
    }

    @MessageMapping("/game/{matchId}/draw")
    public Map<String, Object> handleDrawOffer(@DestinationVariable Long matchId,
            Principal principal) {
        try {
            System.out.println("Player " + principal.getName() + " offering draw in game " + matchId);
            gameService.handleDrawOffer(matchId, principal.getName());

            Map<String, Object> response = new HashMap<>();
            response.put("type", "DRAW_OFFER_SENT");
            response.put("matchId", matchId);
            response.put("timestamp", System.currentTimeMillis());
            return response;
        } catch (Exception e) {
            System.err.println("Error handling draw offer: " + e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return error;
        }
    }

    @MessageMapping("/game/{matchId}/draw/accept")
    @SendTo("/topic/game-state/{matchId}")
    public Map<String, Object> handleDrawAccept(@DestinationVariable Long matchId,
            Principal principal) {
        try {
            System.out.println("Player " + principal.getName() + " accepting draw in game " + matchId);
            gameService.handleDrawAccept(matchId);

            Map<String, Object> response = new HashMap<>();
            response.put("type", "DRAW_ACCEPTED");
            response.put("player", principal.getName());
            response.put("matchId", matchId);
            response.put("timestamp", System.currentTimeMillis());
            response.put("status", "DRAW");
            return response;
        } catch (Exception e) {
            System.err.println("Error handling draw accept: " + e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return error;
        }
    }

    @MessageMapping("/game/{matchId}/draw/decline")
    public void handleDrawDecline(@DestinationVariable Long matchId,
            Principal principal) {
        try {
            System.out.println("Player " + principal.getName() + " declining draw in game " + matchId);
            gameService.handleDrawDecline(matchId, principal.getName());
        } catch (Exception e) {
            System.err.println("Error handling draw decline: " + e.getMessage());
        }
    }

    @MessageMapping("/game/{matchId}/chat")
    @SendTo("/topic/chat/{matchId}")
    public Map<String, Object> handleChatMessage(@DestinationVariable Long matchId,
            @Payload Map<String, String> chatMessage,
            Principal principal) {
        try {
            System.out.println("Chat message from " + principal.getName() + " in game " + matchId);

            Map<String, Object> response = new HashMap<>();
            response.put("type", "CHAT_MESSAGE");
            response.put("from", principal.getName());
            response.put("message", chatMessage.get("message"));
            response.put("matchId", matchId);
            response.put("timestamp", System.currentTimeMillis());
            return response;
        } catch (Exception e) {
            System.err.println("Error handling chat message: " + e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return error;
        }
    }

}
