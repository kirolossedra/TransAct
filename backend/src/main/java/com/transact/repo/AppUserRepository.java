package com.transact.repo;

import com.transact.domain.AppUser;
import com.transact.domain.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AppUserRepository extends JpaRepository<AppUser, UUID> {
    Optional<AppUser> findByEmail(String email);
    List<AppUser> findByRoleAndActiveTrueOrderByDisplayNameAsc(UserRole role);
}
