package com.transact.service;

import com.transact.domain.AppUser;
import com.transact.repo.AppUserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
public class AuthenticatedUserService {
    private final AppUserRepository users;

    public AuthenticatedUserService(AppUserRepository users) { this.users = users; }

    public AppUser requireUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) throw new BusinessRuleException("Authentication is required.");
        String email = switch (authentication.getName()) {
            case "developer" -> "alice@transact.local";
            case "admin" -> "admin@transact.local";
            default -> throw new BusinessRuleException("No TransAct profile is mapped to this login.");
        };
        return users.findByEmail(email).orElseThrow(() -> new BusinessRuleException("Authenticated profile is missing."));
    }
}
