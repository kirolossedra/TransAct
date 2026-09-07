package com.transact.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ledger_postings", indexes = {
    @Index(name = "idx_postings_account", columnList = "account_id"),
    @Index(name = "idx_postings_transaction", columnList = "transaction_id")
})
public class LedgerPosting {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "transaction_id", nullable = false)
    private LedgerTransaction transaction;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected LedgerPosting() {}

    public LedgerPosting(LedgerTransaction transaction, Account account, BigDecimal amount) {
        this.transaction = transaction;
        this.account = account;
        this.amount = amount;
    }

    public UUID getId() { return id; }
    public LedgerTransaction getTransaction() { return transaction; }
    public Account getAccount() { return account; }
    public BigDecimal getAmount() { return amount; }
    public Instant getCreatedAt() { return createdAt; }
}
