package com.transact.repo;

import com.transact.domain.LedgerTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface LedgerTransactionRepository extends JpaRepository<LedgerTransaction, UUID> {}
