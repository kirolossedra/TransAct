package com.transact.api;

import com.transact.domain.AppUser;
import com.transact.domain.TransactionType;
import com.transact.repo.AppUserRepository;
import com.transact.service.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/transfers")
public class TransferController {
    private final AuthenticatedUserService current;
    private final AppUserRepository users;
    private final LedgerService ledger;
    private final AuditService audit;

    public TransferController(AuthenticatedUserService current, AppUserRepository users, LedgerService ledger, AuditService audit) {
        this.current = current;
        this.users = users;
        this.ledger = ledger;
        this.audit = audit;
    }

    @PostMapping
    public Map<String, Object> transfer(Authentication authentication, @Valid @RequestBody TransferRequest request) {
        AppUser from = current.requireUser(authentication);
        AppUser to = users.findById(request.recipientId()).orElseThrow(() -> new BusinessRuleException("Recipient not found."));
        UUID transactionId = ledger.transfer(from, to, request.amount(), TransactionType.TRANSFER,
                "DirectTransfer", null, request.memo());
        audit.record(from.getEmail(), "DIRECT_TRANSFER", "LedgerTransaction", transactionId.toString(),
                "Transferred " + request.amount() + " BC to " + to.getDisplayName());
        return Map.of("transactionId", transactionId, "balance", ledger.balanceForUser(from));
    }

    public record TransferRequest(@NotNull UUID recipientId, @NotNull @Positive BigDecimal amount, String memo) {}
}
