package com.transact.repo;

import com.transact.domain.LedgerPosting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface LedgerPostingRepository extends JpaRepository<LedgerPosting, UUID> {
    @Query("select coalesce(sum(p.amount), 0) from LedgerPosting p where p.account.id = :accountId")
    BigDecimal balanceForAccount(@Param("accountId") UUID accountId);
    long countByAccountId(UUID accountId);
    List<LedgerPosting> findTop20ByAccountIdOrderByCreatedAtDesc(UUID accountId);
    List<LedgerPosting> findByTransactionId(UUID transactionId);
}
