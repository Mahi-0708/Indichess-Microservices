package com.example.matchservice.controller;

import com.example.matchservice.model.Match;
import com.example.matchservice.model.OnlineMatch;
import com.example.matchservice.service.JwtService;
import com.example.matchservice.service.OnlineMatchService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/game/online")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class OnlineMatchController {

    private final OnlineMatchService onlineMatchService;
    private final JwtService jwtService;

    public OnlineMatchController(OnlineMatchService onlineMatchService, JwtService jwtService) {
        this.onlineMatchService = onlineMatchService;
        this.jwtService = jwtService;
    }

    @PostMapping("/create")
    public ResponseEntity<?> createRoom(@RequestBody(required = false) Map<String, Object> payload, java.security.Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body("Unauthorized");
        try {
            Integer timeLimit = null;
            if (payload != null && payload.containsKey("timeLimit")) {
                Object tl = payload.get("timeLimit");
                if (tl instanceof Number) {
                    timeLimit = ((Number) tl).intValue();
                }
            }
            OnlineMatch room = onlineMatchService.createRoom(principal.getName(), timeLimit);
            return ResponseEntity.ok(room);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/join")
    public ResponseEntity<?> joinRoom(@RequestBody Map<String, String> payload, java.security.Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body("Unauthorized");
        String code = payload.get("code");
        if (code == null) return ResponseEntity.badRequest().body("Code is required");
        try {
            OnlineMatch room = onlineMatchService.joinRoom(code, principal.getName());
            return ResponseEntity.ok(room);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/setup")
    public ResponseEntity<?> setupMatch(@RequestBody Map<String, String> payload, java.security.Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body("Unauthorized");
        String code = payload.get("code");
        String color = payload.get("color"); // 'white' or 'black'
        
        if (code == null || color == null) return ResponseEntity.badRequest().body("Code and color are required");
        
        try {
            Match match = onlineMatchService.setupMatch(code, color);
            Map<String, Object> response = new HashMap<>();
            response.put("matchId", match.getId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/status/{code}")
    public ResponseEntity<?> getStatus(@PathVariable String code, java.security.Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body("Unauthorized");
        Optional<OnlineMatch> roomOpt = onlineMatchService.getRoomStatus(code);
        if (roomOpt.isEmpty()) return ResponseEntity.status(404).body("Room not found");
        
        OnlineMatch room = roomOpt.get();
        return ResponseEntity.ok(room);
    }
}
