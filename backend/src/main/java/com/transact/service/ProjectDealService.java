package com.transact.service;

import com.transact.domain.*;
import com.transact.repo.AppUserRepository;
import com.transact.repo.ProjectDealRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class ProjectDealService {
    private final ProjectDealRepository deals;
    private final AppUserRepository users;
    private final LedgerService ledger;
    private final AuditService audit;

    public ProjectDealService(ProjectDealRepository deals, AppUserRepository users, LedgerService ledger, AuditService audit) {
        this.deals = deals; this.users = users; this.ledger = ledger; this.audit = audit;
    }

    @Transactional
    public ProjectDeal create(AppUser requester, UUID developerId, String title, String description, BigDecimal amount, LocalDate dueDate) {
        AppUser developer = users.findById(developerId).orElseThrow(() -> new BusinessRuleException("Developer not found."));
        if (developer.getId().equals(requester.getId())) throw new BusinessRuleException("You cannot create a project deal with yourself.");
        if (developer.getRole() != UserRole.DEVELOPER || !developer.isActive()) throw new BusinessRuleException("Recipient must be an active developer.");
        if (title == null || title.isBlank()) throw new BusinessRuleException("Deal title is required.");
        if (description == null || description.isBlank()) throw new BusinessRuleException("Deal description is required.");
        if (amount == null || amount.signum() <= 0) throw new BusinessRuleException("Deal amount must be positive.");
        if (dueDate != null && dueDate.isBefore(LocalDate.now())) throw new BusinessRuleException("Due date cannot be in the past.");
        ProjectDeal deal = deals.save(new ProjectDeal(requester, developer, title.trim(), description.trim(), amount, dueDate));
        audit.record(requester.getEmail(), "DEAL_CREATED", "ProjectDeal", deal.getId().toString(), "Proposed " + amount + " BC deal to " + developer.getDisplayName());
        return deal;
    }

    @Transactional
    public ProjectDeal accept(AppUser actor, UUID id) {
        ProjectDeal deal = require(id);
        if (!deal.getDeveloper().getId().equals(actor.getId())) throw new BusinessRuleException("Only the assigned developer can accept this deal.");
        if (deal.getStatus() != DealStatus.PROPOSED) throw new BusinessRuleException("Only proposed deals can be accepted.");
        deal.accept();
        audit.record(actor.getEmail(), "DEAL_ACCEPTED", "ProjectDeal", id.toString(), "Developer accepted project commitment.");
        return deal;
    }

    @Transactional
    public ProjectDeal complete(AppUser actor, UUID id) {
        ProjectDeal deal = require(id);
        if (!deal.getRequester().getId().equals(actor.getId())) throw new BusinessRuleException("Only the requester can confirm completion and release payment.");
        if (deal.getStatus() != DealStatus.ACCEPTED) throw new BusinessRuleException("Only accepted deals can be completed.");
        ledger.transfer(deal.getRequester(), deal.getDeveloper(), deal.getAmount(), TransactionType.PROJECT_PAYMENT,
                "ProjectDeal", id.toString(), "Project payment: " + deal.getTitle());
        deal.complete();
        audit.record(actor.getEmail(), "DEAL_COMPLETED", "ProjectDeal", id.toString(), "Payment released to developer.");
        return deal;
    }

    @Transactional
    public ProjectDeal dispute(AppUser actor, UUID id) {
        ProjectDeal deal = require(id);
        boolean party = deal.getRequester().getId().equals(actor.getId()) || deal.getDeveloper().getId().equals(actor.getId());
        if (!party) throw new BusinessRuleException("Only a party to the deal can dispute it.");
        if (deal.getStatus() != DealStatus.ACCEPTED) throw new BusinessRuleException("Only accepted deals can enter dispute.");
        deal.dispute();
        audit.record(actor.getEmail(), "DEAL_DISPUTED", "ProjectDeal", id.toString(), "Deal moved to dispute; no automatic judgment is made.");
        return deal;
    }

    @Transactional
    public ProjectDeal cancel(AppUser actor, UUID id) {
        ProjectDeal deal = require(id);
        if (!deal.getRequester().getId().equals(actor.getId())) throw new BusinessRuleException("Only the requester can cancel a proposed deal.");
        if (deal.getStatus() != DealStatus.PROPOSED) throw new BusinessRuleException("Accepted work cannot be unilaterally cancelled.");
        deal.cancel();
        audit.record(actor.getEmail(), "DEAL_CANCELLED", "ProjectDeal", id.toString(), "Requester cancelled proposal before acceptance.");
        return deal;
    }

    public List<ProjectDeal> listFor(AppUser user) { return deals.findByRequesterIdOrDeveloperIdOrderByCreatedAtDesc(user.getId(), user.getId()); }
    public ProjectDeal require(UUID id) { return deals.findById(id).orElseThrow(() -> new BusinessRuleException("Project deal not found.")); }
}
