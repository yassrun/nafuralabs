/**
 * CH-01-TECHNICAL-plier · conversation-plier-arbre · AC-1, AC-2, AC-3, AC-5
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

test("conversation-plier-arbre", () => {
  assert.equal(exists("nafura-platform/sources/backend/conversation/ai-conversation/build.gradle"), true);
  assert.equal(exists("nafura-platform/sources/backend/conversation/ai-agent-api/build.gradle"), true);
  assert.equal(
    exists("nafura-platform/sources/backend/conversation/ai-agent-runtime/build.gradle"),
    true
  );
  assert.equal(
    exists(
      "nafura-platform/sources/backend/conversation/ai-conversation/src/main/java/ma/nafura/ai_conversation/api/controller/ConversationController.java"
    ),
    true
  );
  assert.equal(
    exists(
      "nafura-platform/sources/backend/conversation/ai-agent-runtime/src/main/java/ma/nafura/platform/ai/agent/api/controller/AssistantController.java"
    ),
    true
  );
  assert.equal(
    exists(
      "nafura-platform/sources/backend/conversation/ai-agent-runtime/src/main/java/ma/nafura/ai_agent_runtime/api/controller/AgentRuntimeController.java"
    ),
    true
  );
  assert.equal(
    exists(
      "nafura-platform/sources/backend/conversation/ai-conversation/src/test/java/ma/nafura/ai_conversation/ConversationBaselineTest.java"
    ),
    true
  );

  assert.equal(exists("nafura-platform/sources/web/app/conversation/index.ts"), true);
  assert.equal(
    exists("nafura-platform/sources/web/app/conversation/services/conversation-api.service.ts"),
    true
  );
  assert.equal(
    exists(
      "nafura-platform/sources/web/app/conversation/components/assistant-block-renderer.component.ts"
    ),
    true
  );

  const settings = read("nafura-platform/sources/backend/settings.gradle.kts");
  assert.match(settings, /includePlatform\(":platform:conversation:ai-conversation"\)/);
  assert.match(settings, /includePlatform\(":platform:conversation:ai-agent-api"\)/);
  assert.match(settings, /includePlatform\(":platform:conversation:ai-agent-runtime"\)/);
  assert.match(settings, /includePlatform\(":platform:features:ai:llm-provider"\)/);
  assert.doesNotMatch(settings, /:platform:features:ai:ai-conversation/);
  assert.doesNotMatch(settings, /:platform:features:ai:ai-agent-api/);
  assert.doesNotMatch(settings, /:platform:features:ai:ai-agent-runtime/);

  const controller = read(
    "nafura-platform/sources/backend/conversation/ai-conversation/src/main/java/ma/nafura/ai_conversation/api/controller/ConversationController.java"
  );
  assert.match(controller, /package ma\.nafura\.platform\.ai\.conversation/);
  assert.match(controller, /\/api\/ai\/conversations/);

  const assistant = read(
    "nafura-platform/sources/backend/conversation/ai-agent-runtime/src/main/java/ma/nafura/platform/ai/agent/api/controller/AssistantController.java"
  );
  assert.match(assistant, /package ma\.nafura\.platform\.ai\.agent/);
  assert.match(assistant, /\/api\/ai\/conversations/);
  assert.match(assistant, /\/\{conversationId\}\/turn/);

  const agent = read(
    "nafura-platform/sources/backend/conversation/ai-agent-runtime/src/main/java/ma/nafura/ai_agent_runtime/api/controller/AgentRuntimeController.java"
  );
  assert.match(agent, /package ma\.nafura\.platform\.ai\.agent/);
  assert.match(agent, /\/api\/ai\/conversations\/\{conversationId\}\/agent/);

  const baseline = read(
    "nafura-platform/sources/backend/conversation/ai-conversation/src/test/java/ma/nafura/ai_conversation/ConversationBaselineTest.java"
  );
  assert.match(baseline, /package ma\.nafura\.platform\.ai\.conversation/);

  assert.equal(
    exists("nafura-platform/sources/backend/features/ai/ai-conversation/build.gradle"),
    false
  );
  assert.equal(exists("nafura-platform/sources/backend/features/ai/ai-agent-api/build.gradle"), false);
  assert.equal(
    exists("nafura-platform/sources/backend/features/ai/ai-agent-runtime/build.gradle"),
    false
  );
  assert.equal(exists("nafura-platform/sources/web/features/ai/ai-conversation/index.ts"), false);
  assert.equal(exists("nafura-platform/sources/web/features/ai/index.ts"), false);

  const gradle = read("nafura-platform/e2e/conversation/_gradle.mjs");
  assert.match(gradle, /:platform:conversation:ai-conversation:test/);
  assert.match(gradle, /conversation\/ai-conversation\/build\/test-results\/test/);
  assert.doesNotMatch(gradle, /:platform:features:ai:ai-conversation/);

  const here = fs.readFileSync(fileURLToPath(import.meta.url), "utf8");
  assert.match(here, /test\("conversation-plier-arbre"/);
  assert.ok(exists("nafura-platform/e2e/conversation/conversation-creer-et-lister.test.mjs"));
  assert.ok(exists("nafura-platform/e2e/conversation/conversation-deux-tenants.test.mjs"));
  assert.ok(exists("nafura-platform/e2e/conversation/conversation-session-introuvable.test.mjs"));
  assert.ok(exists("nafura-platform/e2e/conversation/conversation-messages-vides.test.mjs"));
  assert.ok(exists("nafura-platform/e2e/conversation/conversation-frontiere-produit.test.mjs"));
});
