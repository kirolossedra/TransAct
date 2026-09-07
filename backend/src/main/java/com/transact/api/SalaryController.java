package com.transact.api;

import com.transact.domain.AppUser;
import com.transact.service.AuthenticatedUserService;
import com.transact.service.SalaryService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/salaries")
public class SalaryController {
    private final AuthenticatedUserService current;
    private final SalaryService salaries;

    public SalaryController(AuthenticatedUserService current, SalaryService salaries) {
        this.current = current;
        this.salaries = salaries;
    }

    @GetMapping
    public List<ApiViews.SalaryView> list(Authentication authentication) {
        AppUser user = current.requireUser(authentication);
        return salaries.listFor(user).stream().map(ApiViews.SalaryView::of).toList();
    }

    @PostMapping
    public ApiViews.SalaryView create(Authentication authentication, @Valid @RequestBody SalaryRequest request) {
        return ApiViews.SalaryView.of(salaries.create(current.requireUser(authentication), request.recipientId(), request.label(),
                request.amount(), request.intervalDays(), request.firstPaymentAt()));
    }

    @PostMapping("/{id}/deactivate")
    public ApiViews.SalaryView deactivate(Authentication authentication, @PathVariable UUID id) {
        return ApiViews.SalaryView.of(salaries.deactivate(current.requireUser(authentication), id));
    }

    public record SalaryRequest(@NotNull UUID recipientId, @NotBlank String label, @NotNull @Positive BigDecimal amount,
                                @Min(1) @Max(365) int intervalDays, Instant firstPaymentAt) {}
}
