package com.transact.api;

import com.transact.domain.AppUser;
import com.transact.domain.ProjectDeal;
import com.transact.service.AuthenticatedUserService;
import com.transact.service.ProjectDealService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/deals")
public class DealController {
    private final AuthenticatedUserService current;
    private final ProjectDealService deals;

    public DealController(AuthenticatedUserService current, ProjectDealService deals) {
        this.current = current;
        this.deals = deals;
    }

    @GetMapping
    public List<ApiViews.DealView> list(Authentication authentication) {
        AppUser user = current.requireUser(authentication);
        return deals.listFor(user).stream().map(ApiViews.DealView::of).toList();
    }

    @PostMapping
    public ApiViews.DealView create(Authentication authentication, @Valid @RequestBody CreateDealRequest request) {
        ProjectDeal deal = deals.create(current.requireUser(authentication), request.developerId(), request.title(),
                request.description(), request.amount(), request.dueDate());
        return ApiViews.DealView.of(deal);
    }

    @PostMapping("/{id}/accept")
    public ApiViews.DealView accept(Authentication authentication, @PathVariable UUID id) {
        return ApiViews.DealView.of(deals.accept(current.requireUser(authentication), id));
    }

    @PostMapping("/{id}/complete")
    public ApiViews.DealView complete(Authentication authentication, @PathVariable UUID id) {
        return ApiViews.DealView.of(deals.complete(current.requireUser(authentication), id));
    }

    @PostMapping("/{id}/dispute")
    public ApiViews.DealView dispute(Authentication authentication, @PathVariable UUID id) {
        return ApiViews.DealView.of(deals.dispute(current.requireUser(authentication), id));
    }

    @PostMapping("/{id}/cancel")
    public ApiViews.DealView cancel(Authentication authentication, @PathVariable UUID id) {
        return ApiViews.DealView.of(deals.cancel(current.requireUser(authentication), id));
    }

    public record CreateDealRequest(@NotNull UUID developerId, @NotBlank String title, @NotBlank String description,
                                    @NotNull @Positive BigDecimal amount, LocalDate dueDate) {}
}
