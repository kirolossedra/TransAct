package com.transact.api;

import com.transact.service.AuthenticatedUserService;
import com.transact.service.LoanService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/loans")
public class AdminLoanController {
    private final LoanService loans;
    private final AuthenticatedUserService current;

    public AdminLoanController(LoanService loans, AuthenticatedUserService current) {
        this.loans = loans;
        this.current = current;
    }

    @GetMapping
    public List<ApiViews.LoanView> queue() {
        return loans.adminReviewQueue().stream().map(ApiViews.LoanView::of).toList();
    }

    @PostMapping("/{id}/approve")
    public ApiViews.LoanView approve(Authentication authentication, @PathVariable UUID id, @RequestBody(required = false) DecisionRequest request) {
        String notes = request == null ? null : request.notes();
        return ApiViews.LoanView.of(loans.approve(current.requireUser(authentication), id, notes));
    }

    @PostMapping("/{id}/reject")
    public ApiViews.LoanView reject(Authentication authentication, @PathVariable UUID id, @RequestBody(required = false) DecisionRequest request) {
        String notes = request == null ? null : request.notes();
        return ApiViews.LoanView.of(loans.reject(current.requireUser(authentication), id, notes));
    }

    public record DecisionRequest(String notes) {}
}
