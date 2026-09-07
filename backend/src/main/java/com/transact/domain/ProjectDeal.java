package com.transact.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "project_deals")
public class ProjectDeal {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "requester_id", nullable = false)
    private AppUser requester;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "developer_id", nullable = false)
    private AppUser developer;

    @Column(nullable = false, length = 180)
    private String title;

    @Column(nullable = false, length = 2000)
    private String description;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DealStatus status = DealStatus.PROPOSED;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "accepted_at")
    private Instant acceptedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Version
    private long version;

    protected ProjectDeal() {}

    public ProjectDeal(AppUser requester, AppUser developer, String title, String description, BigDecimal amount, LocalDate dueDate) {
        this.requester = requester;
        this.developer = developer;
        this.title = title;
        this.description = description;
        this.amount = amount;
        this.dueDate = dueDate;
    }

    public void accept() { this.status = DealStatus.ACCEPTED; this.acceptedAt = Instant.now(); }
    public void complete() { this.status = DealStatus.COMPLETED; this.completedAt = Instant.now(); }
    public void dispute() { this.status = DealStatus.DISPUTED; }
    public void cancel() { this.status = DealStatus.CANCELLED; }

    public UUID getId() { return id; }
    public AppUser getRequester() { return requester; }
    public AppUser getDeveloper() { return developer; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public BigDecimal getAmount() { return amount; }
    public LocalDate getDueDate() { return dueDate; }
    public DealStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getAcceptedAt() { return acceptedAt; }
    public Instant getCompletedAt() { return completedAt; }
}
