package com.transact.repo;

import com.transact.domain.SalaryAgreement;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SalaryAgreementRepository extends JpaRepository<SalaryAgreement, UUID> {
    List<SalaryAgreement> findByPayerIdOrRecipientIdOrderByCreatedAtDesc(UUID payerId, UUID recipientId);
    List<SalaryAgreement> findByActiveTrueAndNextPaymentAtLessThanEqual(Instant now);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from SalaryAgreement s where s.id = :id")
    Optional<SalaryAgreement> findLockedById(@Param("id") UUID id);
}
