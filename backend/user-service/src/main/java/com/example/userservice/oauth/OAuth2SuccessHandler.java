package com.example.userservice.oauth;

import com.example.userservice.model.User;
import com.example.userservice.repo.UserRepo;
import com.example.userservice.service.JwtService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final UserRepo userRepo;

    public OAuth2SuccessHandler(JwtService jwtService, UserRepo userRepo) {
        this.jwtService = jwtService;
        this.userRepo = userRepo;
    }

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) throws IOException {

        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();

        String email = oauthUser.getAttribute("email");
        String name = oauthUser.getAttribute("name");

        if (email == null) {
            response.sendRedirect("http://localhost:3000/login?error=Email not provided by Google");
            return;
        }

        String jwt = jwtService.generateToken(name != null ? name : email);

        User user = userRepo.getUserByEmailId(email);
        if (user == null) {
            user = new User();
            user.setEmailId(email);
            // Use part of email as username if name is not suitable or null
            String username = (name != null) ? name.replace(" ", "_").toLowerCase() : email.split("@")[0];
            user.setUsername(username);
            user.setRating(250);
            userRepo.save(user);
        }

        Cookie jwtCookie = new Cookie("JWT", jwt);
        jwtCookie.setHttpOnly(true);
        jwtCookie.setPath("/");
        jwtCookie.setMaxAge(3600);
        jwtCookie.setSecure(false);
        response.addCookie(jwtCookie);
        response.sendRedirect("http://localhost:3000/home");
    }
}
