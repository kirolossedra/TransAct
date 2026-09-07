package com.transact.api;

import com.transact.domain.AppUser;
import com.transact.service.AuthenticatedUserService;
import com.transact.service.LedgerService;
import com.transact.service.TrustService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final AuthenticatedUserService current;
    private final LedgerService ledger;
    private final TrustService trust;

    public DashboardController(AuthenticatedUserService current, LedgerService ledger, TrustService trust) {
        this.current = current;
        this.ledger = ledger;
        this.trust = trust;
    }

    @GetMapping
    public DashboardResponse dashboard(Authentication authentication) {
        AppUser user = current.requireUser(authentication);
        return new DashboardResponse(ApiViews.UserView.of(user), ledger.balanceForUser(user),
                ApiViews.TScoreView.of(trust.calculate(user)), ledger.recentActivity(user));
    }

    public record DashboardResponse(ApiViews.UserView user, BigDecimal balance, ApiViews.TScoreView tScore,
                                    List<LedgerService.Activity> recentActivity) {}
}
