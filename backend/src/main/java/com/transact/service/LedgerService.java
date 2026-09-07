package com.transact.service;

import com.transact.domain.*;
import com.transact.repo.AccountRepository;
import com.transact.repo.LedgerPostingRepository;
import com.transact.repo.LedgerTransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class LedgerService {
    private final AccountRepository accounts;
    private final LedgerTransactionRepository transactions;
    private final LedgerPostingRepository postings;

    public LedgerService(AccountRepository accounts, LedgerTransactionRepository transactions, LedgerPostingRepository postings) {
        this.accounts = accounts;
        this.transactions = transactions;
        this.postings = postings;
    }

    public BigDecimal balanceForUser(AppUser user) {
        Account account = accountFor(user);
        BigDecimal balance = postings.balanceForAccount(account.getId());
        return balance == null ? BigDecimal.ZERO.setScale(2) : balance.setScale(2, RoundingMode.HALF_EVEN);
    }

    public Account accountFor(AppUser user) {
        return accounts.findByOwnerId(user.getId())
                .orElseThrow(() -> new BusinessRuleException("Brain Coin account is missing for " + user.getDisplayName()));
    }

    public Account systemAccount(String name) {
        return accounts.findByName(name)
                .orElseThrow(() -> new BusinessRuleException("System account not found: " + name));
    }

    @Transactional(noRollbackFor = BusinessRuleException.class)
    public UUID transfer(AppUser fromUser, AppUser toUser, BigDecimal rawAmount, TransactionType type,
                         String referenceType, String referenceId, String memo) {
        return transfer(accountFor(fromUser), accountFor(toUser), rawAmount, type, referenceType, referenceId, memo);
    }

    @Transactional(noRollbackFor = BusinessRuleException.class)
    public UUID transfer(Account from, Account to, BigDecimal rawAmount, TransactionType type,
                         String referenceType, String referenceId, String memo) {
        BigDecimal amount = normalize(rawAmount);
        if (from.getId().equals(to.getId())) throw new BusinessRuleException("Source and destination accounts must be different.");

        List<UUID> ordered = new ArrayList<>(List.of(from.getId(), to.getId()));
        ordered.sort(Comparator.comparing(UUID::toString));
        Account first = accounts.findLockedById(ordered.get(0)).orElseThrow();
        Account second = accounts.findLockedById(ordered.get(1)).orElseThrow();
        Account lockedFrom = first.getId().equals(from.getId()) ? first : second;
        Account lockedTo = first.getId().equals(to.getId()) ? first : second;

        BigDecimal fromBalance = postings.balanceForAccount(lockedFrom.getId());
        if (!lockedFrom.isSystemAccount() && fromBalance.compareTo(amount) < 0) throw new BusinessRuleException("Insufficient Brain Coin balance.");

        LedgerTransaction transaction = transactions.save(new LedgerTransaction(type, referenceType, referenceId, sanitizeMemo(memo)));
        postings.save(new LedgerPosting(transaction, lockedFrom, amount.negate()));
        postings.save(new LedgerPosting(transaction, lockedTo, amount));
        return transaction.getId();
    }

    public List<Activity> recentActivity(AppUser user) {
        Account account = accountFor(user);
        return postings.findTop20ByAccountIdOrderByCreatedAtDesc(account.getId()).stream().map(posting -> {
            List<LedgerPosting> pair = postings.findByTransactionId(posting.getTransaction().getId());
            String counterparty = pair.stream().filter(p -> !p.getAccount().getId().equals(account.getId())).findFirst()
                    .map(p -> p.getAccount().getOwner() != null ? p.getAccount().getOwner().getDisplayName() : p.getAccount().getName())
                    .orElse("System");
            return new Activity(posting.getTransaction().getId(), posting.getTransaction().getTransactionType().name(),
                    posting.getAmount().setScale(2, RoundingMode.HALF_EVEN), posting.getTransaction().getMemo(), counterparty,
                    posting.getCreatedAt().toString());
        }).toList();
    }

    private BigDecimal normalize(BigDecimal rawAmount) {
        if (rawAmount == null) throw new BusinessRuleException("Amount is required.");
        BigDecimal amount = rawAmount.setScale(2, RoundingMode.HALF_EVEN);
        if (amount.signum() <= 0) throw new BusinessRuleException("Amount must be greater than zero.");
        return amount;
    }

    private String sanitizeMemo(String memo) {
        if (memo == null || memo.isBlank()) return null;
        return memo.length() > 280 ? memo.substring(0, 280) : memo;
    }

    public record Activity(UUID transactionId, String type, BigDecimal amount, String memo, String counterparty, String createdAt) {}
}
