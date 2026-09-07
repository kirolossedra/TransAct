package com.transact.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ledger_transactions")
public class LedgerTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 40)
    private TransactionType transactionType;

    @Column(name = "reference_type", length = 80)
    private String referenceType;

    @Column(name = "reference_id", length = 80)
    private String referenceId;

    @Column(length = 280)
    private String memo;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected LedgerTransaction() {}

    public LedgerTransaction(TransactionType transactionType, String referenceType, String referenceId, String memo) {
        this.transactionType = transactionType;
        this.referenceType = referenceType;
        this.referenceId = referenceId;
        this.memo = memo;
    }

    public UUID getId() { return id; }
    public TransactionType getTransactionType() { return transactionType; }
    public String getReferenceType() { return referenceType; }
    public String getReferenceId() { return referenceId; }
    public String getMemo() { return memo; }
    public Instant getCreatedAt() { return createdAt; }
}
