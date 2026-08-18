/**
 * CH-01-TECHNICAL-plier · identite-plier-arbre · AC-1, AC-2, AC-3, AC-5
 * État initial : sources actuelles.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

function read(rel) {
  return fs.readFileSync(path.join(REPO, rel), "utf8").replace(/\r\n/g, "\n");
}

function exists(rel) {
  return fs.existsSync(path.join(REPO, rel));
}

test("identite-plier-arbre", () => {
  assert.equal(exists("nafura-platform/sources/backend/identite/identity/build.gradle"), true);
  assert.equal(exists("nafura-platform/sources/backend/identite/iam/build.gradle"), true);
  assert.equal(
    exists(
      "nafura-platform/sources/backend/identite/identity/src/main/java/ma/nafura/core/domain/model/AppUser.java"
    ),
    true
  );
  assert.equal(
    exists(
      "nafura-platform/sources/backend/identite/identity/src/main/java/ma/nafura/core/service/AppUserProvisioningService.java"
    ),
    true
  );
  assert.equal(
    exists(
      "nafura-platform/sources/backend/identite/iam/src/main/java/ma/nafura/core/api/controller/IamController.java"
    ),
    true
  );
  assert.equal(
    exists(
      "nafura-platform/sources/backend/identite/iam/src/main/java/ma/nafura/core/api/controller/InvitationPublicController.java"
    ),
    true
  );
  assert.equal(
    exists(
      "nafura-platform/sources/backend/identite/iam/src/test/java/ma/nafura/platform/administration/iam/IdentiteBaselineTest.java"
    ),
    true
  );

  assert.equal(exists("nafura-platform/sources/web/app/identite/members.routes.ts"), true);
  assert.equal(
    exists("nafura-platform/sources/web/app/identite/member-listing/member-listing.page.ts"),
    true
  );
  assert.equal(
    exists("nafura-platform/sources/web/app/identite/member-detail/member-detail.page.ts"),
    true
  );
  assert.equal(
    exists(
      "nafura-platform/sources/web/app/identite/components/invite-member-dialog.component.ts"
    ),
    true
  );
  assert.equal(
    exists("nafura-platform/sources/web/app/identite/services/members-api.service.ts"),
    true
  );
  assert.equal(
    exists("nafura-platform/sources/web/app/identite/services/members.facade.ts"),
    true
  );

  const settings = read("nafura-platform/sources/backend/settings.gradle.kts");
  assert.match(settings, /includePlatform\(":platform:identite:identity"\)/);
  assert.match(settings, /includePlatform\(":platform:identite:iam"\)/);
  assert.doesNotMatch(settings, /:platform:core:identity/);
  assert.doesNotMatch(settings, /:platform:features:administration:iam/);

  const appUser = read(
    "nafura-platform/sources/backend/identite/identity/src/main/java/ma/nafura/core/domain/model/AppUser.java"
  );
  assert.match(appUser, /package ma\.nafura\.platform\.identity/);

  const provisioning = read(
    "nafura-platform/sources/backend/identite/identity/src/main/java/ma/nafura/core/service/AppUserProvisioningService.java"
  );
  assert.match(provisioning, /package ma\.nafura\.platform\.identity/);

  const iam = read(
    "nafura-platform/sources/backend/identite/iam/src/main/java/ma/nafura/core/api/controller/IamController.java"
  );
  assert.match(iam, /package ma\.nafura\.platform\.administration\.iam/);
  assert.match(iam, /\/api\/tenants/);

  const invitations = read(
    "nafura-platform/sources/backend/identite/iam/src/main/java/ma/nafura/core/api/controller/InvitationPublicController.java"
  );
  assert.match(invitations, /package ma\.nafura\.platform\.administration\.iam/);
  assert.match(invitations, /\/api\/public\/invitations/);

  const baseline = read(
    "nafura-platform/sources/backend/identite/iam/src/test/java/ma/nafura/platform/administration/iam/IdentiteBaselineTest.java"
  );
  assert.match(baseline, /package ma\.nafura\.platform\.administration\.iam/);

  assert.equal(exists("nafura-platform/sources/backend/core/identity/build.gradle"), false);
  assert.equal(
    exists("nafura-platform/sources/backend/features/administration/iam/build.gradle"),
    false
  );
  assert.equal(
    exists("nafura-platform/sources/web/features/administration/iam/members/members.routes.ts"),
    false
  );

  const gradle = read("nafura-platform/e2e/identite/_gradle.mjs");
  assert.match(gradle, /:platform:identite:iam:test/);
  assert.match(gradle, /identite\/iam\/build\/test-results\/test/);
  assert.doesNotMatch(gradle, /:platform:features:administration:iam/);

  const here = fs.readFileSync(fileURLToPath(import.meta.url), "utf8");
  assert.match(here, /test\("identite-plier-arbre"/);
  assert.ok(exists("nafura-platform/e2e/identite/identite-deux-tenants.test.mjs"));
  assert.ok(exists("nafura-platform/e2e/identite/identite-inviter-membre.test.mjs"));
  assert.ok(exists("nafura-platform/e2e/identite/identite-accepter-invitation.test.mjs"));
  assert.ok(exists("nafura-platform/e2e/identite/identite-retirer-membre.test.mjs"));
  assert.ok(exists("nafura-platform/e2e/identite/identite-frontiere-produit.test.mjs"));
});
