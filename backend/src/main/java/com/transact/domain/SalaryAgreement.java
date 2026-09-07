package com.transact.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "salary_agreements")
public class SalaryAgreement {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "payer_id", nullable = false)
    private AppUser payer;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "recipient_id", nullable = false)
    private AppUser recipient;

    @Column(nullable = false, length = 180)
    private String label;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(name = "interval_days", nullable = false)
    private int intervalDays;

    @Column(name = "next_payment_at", nullable = false)
    private Instant nextPaymentAt;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "last_run_at")
    private Instant lastRunAt;

    @Column(name = "last_run_status", length = 300)
    private String lastRunStatus;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Version
    private long version;

    protected SalaryAgreement() {}

    public SalaryAgreement(AppUser payer, AppUser recipient, String label, BigDecimal amount, int intervalDays, Instant nextPaymentAt) {
        this.payer = payer;
        this.recipient = recipient;
        this.label = label;
        this.amount = amount;
        this.intervalDays = intervalDays;
        this.nextPaymentAt = nextPaymentAt;
    }

    public void recordSuccess() { this.lastRunAt = Instant.now(); this.lastRunStatus = "SUCCESS"; this.nextPaymentAt = this.nextPaymentAt.plusSeconds(intervalDays * 86400L); }
    public void recordFailure(String reason) { this.lastRunAt = Instant.now(); this.lastRunStatus = "FAILED: " + reason; this.nextPaymentAt = Instant.now().plusSeconds(86400L); }
    public void deactivate() { this.active = false; }

    public UUID getId() { return id; }
    public AppUser getPayer() { return payer; }
    public AppUser getRecipient() { return recipient; }
    public String getLabel() { return label; }
    public BigDecimal getAmount() { return amount; }
    public int getIntervalDays() { return intervalDays; }
    public Instant getNextPaymentAt() { return nextPaymentAt; }
    public boolean isActive() { return active; }
    public Instant getLastRunAt() { return lastRunAt; }
    public String getLastRunStatus() { return lastRunStatus; }
}
