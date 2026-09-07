package com.transact.repo;

import com.transact.domain.DealStatus;
import com.transact.domain.ProjectDeal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ProjectDealRepository extends JpaRepository<ProjectDeal, UUID> {
    List<ProjectDeal> findByRequesterIdOrDeveloperIdOrderByCreatedAtDesc(UUID requesterId, UUID developerId);
    long countByDeveloperIdAndStatus(UUID developerId, DealStatus status);
    long countByDeveloperIdAndStatusAndDueDateBefore(UUID developerId, DealStatus status, LocalDate dueDate);
}
