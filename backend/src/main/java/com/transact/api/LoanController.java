package com.transact.api;

import com.transact.domain.AppUser;
import com.transact.service.AuthenticatedUserService;
import com.transact.service.LoanService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/loans")
public class LoanController {
    private final AuthenticatedUserService current;
    private final LoanService loans;

    public LoanController(AuthenticatedUserService current, LoanService loans) {
        this.current = current;
        this.loans = loans;
    }

    @GetMapping
    public List<ApiViews.LoanView> list(Authentication authentication) {
        AppUser applicant = current.requireUser(authentication);
        return loans.listFor(applicant).stream().map(ApiViews.LoanView::of).toList();
    }

    @PostMapping
    public ApiViews.LoanView apply(Authentication authentication, @Valid @RequestBody LoanRequest request) {
        return ApiViews.LoanView.of(loans.apply(current.requireUser(authentication), request.amount(), request.purpose(), request.qualifications()));
    }

    @PostMapping("/{id}/repay")
    public ApiViews.LoanView repay(Authentication authentication, @PathVariable UUID id, @Valid @RequestBody RepaymentRequest request) {
        return ApiViews.LoanView.of(loans.repay(current.requireUser(authentication), id, request.amount()));
    }

    public record LoanRequest(@NotNull @Positive BigDecimal amount, @NotBlank String purpose, @NotBlank String qualifications) {}
    public record RepaymentRequest(@NotNull @Positive BigDecimal amount) {}
}
