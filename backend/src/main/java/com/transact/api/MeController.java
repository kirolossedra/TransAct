package com.transact.api;

import com.transact.domain.AppUser;
import com.transact.repo.AppUserRepository;
import com.transact.service.AuthenticatedUserService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class MeController {
    private final AuthenticatedUserService current;
    private final AppUserRepository users;

    public MeController(AuthenticatedUserService current, AppUserRepository users) {
        this.current = current;
        this.users = users;
    }

    @GetMapping("/me")
    public ApiViews.UserView me(Authentication authentication) {
        return ApiViews.UserView.of(current.requireUser(authentication));
    }

    @GetMapping("/users")
    public List<ApiViews.UserView> developers(Authentication authentication) {
        AppUser me = current.requireUser(authentication);
        return users.findByRoleAndActiveTrueOrderByDisplayNameAsc(com.transact.domain.UserRole.DEVELOPER).stream()
                .filter(user -> !user.getId().equals(me.getId()))
                .map(ApiViews.UserView::of).toList();
    }
}
