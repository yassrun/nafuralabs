package ma.nafura.platform.authorization.repository;

import ma.nafura.platform.authorization.domain.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, UUID> {

    List<UserRole> findByUserId(UUID userId);

    boolean existsByUserIdAndRoleCode(UUID userId, String roleCode);

    @Query(value = "SELECT ur.role_code FROM user_role ur " +
           "JOIN app_user u ON u.id = ur.user_id " +
           "WHERE LOWER(u.email) = LOWER(:email)",
           nativeQuery = true)
    List<String> findRoleCodesByEmailIgnoreCase(@Param("email") String email);

    @Query(value = "SELECT EXISTS(SELECT 1 FROM user_role ur " +
           "JOIN app_user u ON u.id = ur.user_id " +
           "WHERE LOWER(u.email) = LOWER(:email) AND ur.role_code = :roleCode)",
           nativeQuery = true)
    boolean existsByEmailIgnoreCaseAndRoleCode(@Param("email") String email, @Param("roleCode") String roleCode);
}

