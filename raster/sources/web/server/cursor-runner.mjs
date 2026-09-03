#!/usr/bin/env node
import { Agent } from "@cursor/sdk";

function readStdin() {
  return new Promise((resolve, reject) => {
    let input = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      input += chunk;
    });
    process.stdin.on("end", () => resolve(input));
    process.stdin.on("error", reject);
  });
}

function required(name) {
  const value = String(process.env[name] || "").trim();
  if (!value) throw new Error(`${name} requis`);
  return value;
}

function options(mode) {
  const apiKey = required("CURSOR_API_KEY");
  const model = { id: process.env.RASTER_CURSOR_MODEL || "composer-2.5" };
  const shared = {
    apiKey,
    name: `Raster ${mode}`,
    agents: {
      "code-worker": {
        description: "Exécute une seule Task Code Raster sans élargir le périmètre.",
        prompt:
          "Lis raster/AGENTS.md et la Task confiée. Implémente, valide techniquement et rends seulement ton résultat à l'orchestrateur.",
        model: "inherit",
      },
    },
  };

  if (mode === "local") {
    return {
      ...shared,
      model,
      local: {
        cwd: process.cwd(),
        autoReview: true,
      },
    };
  }

  const repo = required("RASTER_CLOUD_REPO");
  return {
    ...shared,
    cloud: {
      repos: [
        {
          url: repo,
          startingRef: process.env.RASTER_CLOUD_REF || undefined,
        },
      ],
      autoCreatePR: true,
    },
  };
}

async function main() {
  const mode = (
    process.argv[2] ||
    process.env.RASTER_EXECUTION_MODE ||
    "local"
  ).toLowerCase();
  if (mode !== "local" && mode !== "agents") {
    throw new Error(`mode "${mode}" inconnu`);
  }

  const brief = String(await readStdin()).trim();
  if (!brief) throw new Error("brief Raster vide");

  const agent = await Agent.create(options(mode));
  console.log(`CURSOR_AGENT ${agent.agentId}`);
  try {
    const run = await agent.send(brief);
    console.log(`CURSOR_RUN ${run.id}`);
    const result = await run.wait();
    if (result.result) process.stdout.write(`${result.result.trim()}\n`);
    if (result.git?.branches?.length) {
      for (const branch of result.git.branches) {
        console.log(
          `CURSOR_GIT ${branch.prUrl || branch.branch || branch.repoUrl}`
        );
      }
    }
    if (result.status !== "finished") {
      throw new Error(result.error?.message || `run Cursor ${result.status}`);
    }
  } finally {
    agent.close();
  }
}

main().catch((error) => {
  console.error(`CURSOR_RUNNER_ERROR ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
