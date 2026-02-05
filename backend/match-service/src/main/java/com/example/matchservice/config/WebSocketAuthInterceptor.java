package com.example.matchservice.config;

import com.example.matchservice.service.JwtService;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.List;

@Configuration
@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;

    public WebSocketAuthInterceptor(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        
        if (accessor != null) {
            String token = extractToken(accessor);
            System.out.println("WebSocket Interceptor: Command=" + accessor.getCommand() + ", Token found=" + (token != null));

            if (token != null && accessor.getUser() == null) {
                try {
                    String username = jwtService.extractUsername(token);
                    if (username != null) {
                        UserDetails userDetails = User.withUsername(username)
                                .password("")
                                .authorities("USER")
                                .build();

                        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());

                        SecurityContextHolder.getContext().setAuthentication(authentication);
                        accessor.setUser(authentication);
                        System.out.println("WebSocket Interceptor: Successfully authenticated user: " + username);
                    }
                } catch (Exception e) {
                    System.err.println("WebSocket Interceptor: Authentication failed: " + e.getMessage());
                }
            }
        }

        return message;
    }

    private String extractToken(StompHeaderAccessor accessor) {
        List<String> authHeaders = accessor.getNativeHeader("Authorization");
        if (authHeaders != null && !authHeaders.isEmpty()) {
            String bearerToken = authHeaders.get(0);
            if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
                return bearerToken.substring(7);
            }
        }

        String query = accessor.getFirstNativeHeader("query");
        if (query != null && query.contains("token=")) {
            return query.substring(query.indexOf("token=") + 6);
        }

        // Extract from session attributes populated by HandshakeInterceptor
        if (accessor.getSessionAttributes() != null) {
            return (String) accessor.getSessionAttributes().get("jwtToken");
        }

        return null;
    }
}
