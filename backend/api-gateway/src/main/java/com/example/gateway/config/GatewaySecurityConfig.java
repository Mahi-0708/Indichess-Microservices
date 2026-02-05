package com.example.gateway.config;


import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

@Configuration
public class GatewaySecurityConfig {

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .authorizeExchange(exchanges -> exchanges
                        // 🔥 VERY IMPORTANT: allow preflight
                        .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // 🔓 allow auth + oauth routes
                        .pathMatchers(
                                "/auth/**",
                                "/oauth2/**",
                                "/login/**"
                        ).permitAll()

                        // 🔓 allow everything else for now
                        .anyExchange().permitAll()
                )
                .build();
    }
}
