package com.transact.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "accounts")
public class Account {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "owner_id", unique = true)
    private AppUser owner;

    @Column(nullable = false, unique = true, length = 160)
    private String name;

    @Column(name = "system_account", nullable = false)
    private boolean systemAccount;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    protected Account() {}

    public Account(AppUser owner, String name, boolean systemAccount) {
        this.owner = owner;
        this.name = name;
        this.systemAccount = systemAccount;
    }

    public UUID getId() { return id; }
    public AppUser getOwner() { return owner; }
    public String getName() { return name; }
    public boolean isSystemAccount() { return systemAccount; }
    public boolean isActive() { return active; }
}
