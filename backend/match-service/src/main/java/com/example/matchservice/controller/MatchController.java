package com.example.matchservice.controller;

import com.example.matchservice.service.MatchService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/game")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class MatchController {

    private final MatchService matchService;

    public MatchController(MatchService matchService) {
        this.matchService = matchService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Long>> createMatch(java.security.Principal principal) {
        Optional<Long> matchIdOpt = matchService.createMatch(principal);

        Map<String, Long> response = new HashMap<>();
        if (matchIdOpt.isPresent()) {
            response.put("matchId", matchIdOpt.get());
            return ResponseEntity.ok(response);
        } else {
            response.put("matchId", -2L);
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/check-match")
    public ResponseEntity<Map<String, Long>> checkMatch(java.security.Principal principal) {
        Optional<Long> matchIdOpt = matchService.checkMatch(principal);

        Map<String, Long> response = new HashMap<>();
        if (matchIdOpt.isPresent()) {
            response.put("matchId", matchIdOpt.get());
            return ResponseEntity.ok(response);
        } else {
            response.put("matchId", -2L);
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/cancel-waiting")
    public ResponseEntity<Map<String, Boolean>> cancelWaiting(java.security.Principal principal) {
        boolean cancelled = matchService.cancelWaiting(principal);

        Map<String, Boolean> response = new HashMap<>();
        response.put("cancelled", cancelled);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{matchId}")
    public ResponseEntity<Map<String, Object>> getGameDetails(
            @PathVariable Long matchId,
            java.security.Principal principal) {

        try {
            Map<String, Object> response = matchService.getGameDetailsForFrontend(matchId, principal);
            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            if (e.getMessage().contains("Not authenticated")) {
                return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
            } else if (e.getMessage().contains("Not authorized")) {
                return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
            } else if (e.getMessage().contains("not found")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.status(500).body(Map.of("error", "Internal server error"));
        }
    }

    @PostMapping("/bot/save")
    public ResponseEntity<Map<String, Long>> saveBotMatch(@RequestBody Map<String, Object> gameResult, java.security.Principal principal) {
        Optional<Long> matchIdOpt = matchService.saveBotMatch(gameResult, principal);

        Map<String, Long> response = new HashMap<>();
        if (matchIdOpt.isPresent()) {
            response.put("matchId", matchIdOpt.get());
            return ResponseEntity.ok(response);
        } else {
            response.put("matchId", -1L);
            return ResponseEntity.badRequest().body(response);
        }
    }
}
