package com.example.matchservice.config;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Component
public class CustomHandshakeInterceptor implements HandshakeInterceptor {

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                  WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
        System.out.println("WebSocket Handshake: Attempting to extract JWT cookie...");
        if (request instanceof ServletServerHttpRequest) {
            HttpServletRequest servletRequest = ((ServletServerHttpRequest) request).getServletRequest();
            Cookie[] cookies = servletRequest.getCookies();
            if (cookies != null) {
                System.out.println("WebSocket Handshake: Found " + cookies.length + " cookies.");
                for (Cookie cookie : cookies) {
                    if ("JWT".equals(cookie.getName())) {
                        attributes.put("jwtToken", cookie.getValue());
                        System.out.println("WebSocket Handshake: Successfully extracted JWT cookie.");
                        break;
                    }
                }
            } else {
                System.out.println("WebSocket Handshake: No cookies found in request.");
            }
        }
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
    }
}
