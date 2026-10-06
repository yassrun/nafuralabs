// Runs a product in one of four modes; a product's ops/run.mjs only calls run(). Products script nothing (D-16).
//   lab            backend + web locally, embedded PostgreSQL, lab login: no infra at all
//   local-staging  backend + web locally against the staging infra (port-forwarded PostgreSQL), lab user list
//   staging        build images, migrate, deploy on the staging cluster (Docker Desktop)
//   prod           build and push images, migrate, deploy on the prod cluster (asks for confirmation)
//   check          the checks of AGENTS.md before handing over: architecture, web build, host-tests (nothing started)
import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { createWriteStream, existsSync, mkdirSync, readFileSync, rmSync, statfsSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { createServer, Socket } from 'node:net';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

import { install as installToolchain, toolchainPaths, toolchainRoot } from './toolchain.mjs';

const PLATFORM = fileURLToPath(new URL('../..', import.meta.url));
const WORKSPACE = join(PLATFORM, '..');
const PRODUCT_OPS = join(PLATFORM, 'ops/product');
const WINDOWS = process.platform === 'win32';
const LOCAL_STAGING_POSTGRES_PORT = 15432;

export const ENVIRONMENTS = {
  staging: { context: 'docker-desktop', infra: 'nafura-infra-staging', registry: null, domain: 'nafuralabs.staging', scheme: 'http', iam: 'http://iam.nafuralabs.staging' },
  prod: { context: 'nafura-vps-prod', infra: 'nafura-infra-prod', registry: '54.36.183.106:30500/nafura', domain: 'nafuralabs.com', scheme: 'https', iam: 'https://iam.nafuralabs.com' },
};

/** Every product signs in through the shared realm, with its own client (= product id). */
const REALM = 'iam-portal';
const EMAIL = /^[^@\s,'"`$\\]+@[^@\s,'"`$\\]+$/;

const USAGE = `usage: node ops/run.mjs <mode> [options]

modes
  lab              backend + web locally, embedded PostgreSQL, lab users (no infra)
  local-staging    backend + web locally on the staging infra, lab user list (run "staging" once first)
  staging          build, migrate and deploy on the staging cluster
  prod             build, push, migrate and deploy on the prod cluster
  check            architecture:check, web build (types and templates), platform host-tests
  toolchain        install or update the toolchain (JDK, Node, caches) outside the repository
  doctor           check the toolchain, write rights, ports, orphan processes, disk space
  stop             stop everything lab started (API, web, embedded PostgreSQL), nothing else
  clean            delete the product's build outputs (--data: also its lab database)

options
  --scope=full|back|front   staging/prod: what to rebuild and roll out (default full)
  --dry-run                 staging/prod: print the plan and the rendered manifests, change nothing
  --yes                     prod: skip the confirmation
  --data                    clean: also delete the lab database

environment
  NAFURA_TOOLCHAIN   toolchain folder (default %LOCALAPPDATA%\\nafura on Windows, ~/.nafura elsewhere)
  KUBE_CONTEXT       cluster context (default docker-desktop for staging, nafura-vps-prod for prod)
  REGISTRY           image registry for prod (default ${ENVIRONMENTS.prod.registry})`;

// ---------------------------------------------------------------- product

export function productOf(root) {
  const app = JSON.parse(readFileSync(join(root, 'app.nafura.json'), 'utf8'));
  const id = app.metadata.id.replace(/^app\./, '');
  return {
    root,
    app,
    id,
    name: app.spec.product?.name ?? id,
    ports: { api: 8080, web: 4200, ...app.spec.local?.ports },
    database: id.replaceAll('-', '_'),
    backend: join(root, 'sources/backend'),
    web: join(root, 'sources/web'),
  };
}

export const namespaceOf = (product, env) => `${product.id}-${env}`;

export const hostOf = (product, env) => product.app.spec.deploy?.[env]?.host ?? `${product.id}.${ENVIRONMENTS[env].domain}`;

export function imageOf(product, env, component) {
  const registry = env === 'prod' ? (process.env.REGISTRY ?? ENVIRONMENTS.prod.registry) : null;
  const name = `${product.id}-${component}`;
  return `${registry ? `${registry}/${name}` : name}:${env}`;
}

/** Who holds OWNER in the product's organization on that environment (spec.deploy.<env>.owners). */
export function ownersOf(product, env) {
  const owners = product.app.spec.deploy?.[env]?.owners ?? [];
  for (const owner of owners) {
    if (!EMAIL.test(owner)) throw new Error(`spec.deploy.${env}.owners: "${owner}" is not an email.`);
  }
  return owners;
}

/** Issuer the browser sees (checked in every token) and in-cluster keys URL (no hairpin through the ingress). */
export function oidcOf(env, { inCluster = true } = {}) {
  const issuer = `${ENVIRONMENTS[env].iam}/realms/${REALM}`;
  const keysBase = inCluster ? `http://keycloak.${ENVIRONMENTS[env].infra}.svc:8080/realms/${REALM}` : issuer;
  return { issuer, jwkSetUri: `${keysBase}/protocol/openid-connect/certs` };
}

/** The product's public client: Authorization Code + PKCE only, redirects to its own host (and local runs on staging). */
export function keycloakClientOf(product, env) {
  const origins = [`${ENVIRONMENTS[env].scheme}://${hostOf(product, env)}`];
  if (env === 'staging') origins.push(`http://localhost:${product.ports.web}`);
  return {
    clientId: product.id,
    name: product.name,
    enabled: true,
    protocol: 'openid-connect',
    publicClient: true,
    standardFlowEnabled: true,
    implicitFlowEnabled: false,
    directAccessGrantsEnabled: false,
    serviceAccountsEnabled: false,
    redirectUris: origins.map((origin) => `${origin}/auth/callback`),
    webOrigins: ['+'],
    attributes: {
      'pkce.code.challenge.method': 'S256',
      'post.logout.redirect.uris': origins.map((origin) => `${origin}/login`).join('##'),
    },
  };
}

/** The kustomization applied for a product: its own overlay, placed in its namespace with its images and host. */
export function renderKustomization(product, env) {
  const [backend, web] = ['backend', 'web'].map((component) => imageOf(product, env, component).split(/:(?=[^:/]+$)/));
  const host = hostOf(product, env);
  const oidc = oidcOf(env);
  const tls = env === 'prod'
    ? `\n      - op: add\n        path: /spec/tls\n        value: [{ hosts: ["${host}"], secretName: app-tls }]`
    : '';
  return `# Rendered by nafura-platform/ops/product/run.mjs from app.nafura.json. Do not edit.
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: ${namespaceOf(product, env)}
resources:
  - ../../k8s/${env}
labels:
  - pairs: { app.kubernetes.io/part-of: ${product.id}, nafura.io/env: ${env} }
images:
  - { name: backend, newName: ${backend[0]}, newTag: ${backend[1]} }
  - { name: web, newName: ${web[0]}, newTag: ${web[1]} }
patches:
  - target: { kind: Ingress, name: app }
    patch: |-
      - op: replace
        path: /spec/rules/0/host
        value: ${host}${tls}
  - target: { kind: Deployment, name: backend }
    patch: |-
      - op: add
        path: /spec/template/spec/containers/0/env/-
        value: { name: KEYCLOAK_ISSUER_URI, value: "${oidc.issuer}" }
      - op: add
        path: /spec/template/spec/containers/0/env/-
        value: { name: KEYCLOAK_JWK_SET_URI, value: "${oidc.jwkSetUri}" }
      - op: add
        path: /spec/template/spec/containers/0/env/-
        value: { name: NAFURA_OWNERS, value: "${ownersOf(product, env).join(',')}" }
`;
}

// ---------------------------------------------------------------- processes

function exec(command, args, { cwd, env, input, capture = false, dryRun = false, quiet = false } = {}) {
  if (!quiet) console.log(`$ ${[command, ...args].join(' ')}`);
  if (dryRun) return '';
  const result = spawnSync(command, args, {
    cwd,
    env: { ...process.env, ...env },
    input,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: [input === undefined ? 'inherit' : 'pipe', capture ? 'pipe' : 'inherit', 'inherit'],
  });
  if (result.error) throw new Error(`${command}: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`${command} ${args[0] ?? ''} failed (exit ${result.status})`);
  return result.stdout ?? '';
}

const running = [];
let logStream = null;

/** Every line also goes to <toolchain>/logs/<product>/<mode>.log, read by agents that do not see the terminal. */
function log(line) {
  console.log(line);
  logStream?.write(`${line}\n`);
}

function openLog(product, mode) {
  const dir = toolchainPaths().logs(product.id);
  mkdirSync(dir, { recursive: true });
  logStream = createWriteStream(join(dir, `${mode}.log`), { flags: 'w' });
  return join(dir, `${mode}.log`);
}

function start(label, command, args, { cwd, env } = {}) {
  const child = spawn(command, args, { cwd, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
  child.nafuraLabel = label;
  const prefix = (stream) => {
    let rest = '';
    stream.on('data', (chunk) => {
      const lines = (rest + chunk).split(/\r?\n/);
      rest = lines.pop();
      for (const line of lines) log(`[${label}] ${line}`);
    });
  };
  prefix(child.stdout);
  prefix(child.stderr);
  child.on('exit', (code) => {
    if (!stopping) {
      log(`[${label}] exited (${code}); stopping.`);
      stopAll(1);
    }
  });
  running.push(child);
  return child;
}

let stopping = false;
const cleanups = [];
function stopAll(code = 0) {
  stopping = true;
  for (const child of running) {
    if (child.exitCode !== null) continue;
    // The Gradle client alone (not its tree): the daemon it started stays warm for the next run and cancels bootRun.
    const tree = child.nafuraLabel === 'api' ? [] : ['/T'];
    if (WINDOWS) spawnSync('taskkill', ['/pid', String(child.pid), ...tree, '/F'], { stdio: 'ignore' });
    else child.kill('SIGTERM');
  }
  // bootRun runs under the Gradle daemon, not under the launcher: stop what still listens on the product's ports.
  if (localProduct) stopWorkspaceListeners(localProduct);
  for (const cleanup of cleanups) cleanup();
  process.exit(code);
}

async function waitHttp(url, seconds) {
  for (let elapsed = 0; elapsed < seconds; elapsed += 3) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (response.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  throw new Error(`${url} not ready after ${seconds}s`);
}

async function waitTcp(port, seconds) {
  for (let elapsed = 0; elapsed < seconds; elapsed += 1) {
    const open = await new Promise((resolve) => {
      const socket = new Socket();
      socket.once('connect', () => resolve(socket.destroy() || true));
      socket.once('error', () => resolve(false));
      socket.connect(port, '127.0.0.1');
    });
    if (open) return;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`127.0.0.1:${port} not reachable after ${seconds}s`);
}

function assertFree(port, what) {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', () => reject(new Error(`Port ${port} (${what}) is in use: stop the other run or change spec.local.ports.`)));
    server.listen(port, '127.0.0.1', () => server.close(resolve));
  });
}

// ---------------------------------------------------------------- tools

function stackVersion(key) {
  const line = readFileSync(join(PLATFORM, 'stack.versions.properties'), 'utf8').split(/\r?\n/).find((l) => l.startsWith(`${key}=`));
  return line?.slice(key.length + 1).trim();
}

const SETUP = 'install it: nafura-platform\\ops\\bootstrap.cmd (Windows) or sh nafura-platform/ops/bootstrap.sh, then retry';

/** The toolchain's JDK only: a JDK on the machine (JAVA_HOME, PATH, deps/) is never used. */
function javaHome() {
  const tools = toolchainPaths();
  if (!existsSync(tools.java)) throw new Error(`No toolchain JDK at ${tools.jdk}: ${SETUP}.`);
  return tools.jdk;
}

/** The toolchain's Node and npm for everything run.mjs starts (web, npm ci, checks). */
function nodeTools() {
  const tools = toolchainPaths();
  if (!existsSync(tools.nodeExe)) throw new Error(`No toolchain Node at ${tools.node}: ${SETUP}.`);
  return { node: tools.nodeExe, npm: tools.npmCli, env: { npm_config_cache: tools.npmCache } };
}

/** Gradle's caches, wrapper distribution and daemon live in the toolchain, whatever GRADLE_USER_HOME says. */
export function gradleUserHome(env = process.env) {
  return toolchainPaths(toolchainRoot(env)).gradle;
}

/** Gradle through its wrapper jar: no gradlew/gradlew.bat, the same on every OS. */
function gradle(product, args) {
  const home = javaHome();
  return [
    join(home, 'bin', WINDOWS ? 'java.exe' : 'java'),
    // Daemon kept between runs (toolchain GRADLE_USER_HOME). The configuration cache is opted in per task (lab only:
    // host-tests and nafura-migrations.gradle are not compatible with it yet).
    ['-cp', join(product.backend, 'gradle/wrapper/gradle-wrapper.jar'), 'org.gradle.wrapper.GradleWrapperMain', '--console=plain', ...args],
    { cwd: product.backend, env: { JAVA_HOME: home, GRADLE_USER_HOME: gradleUserHome() } },
  ];
}

function ensureWebDependencies(product) {
  if (existsSync(join(product.web, 'node_modules/@angular/cli'))) return;
  const tools = nodeTools();
  exec(tools.node, [tools.npm, 'ci'], { cwd: product.web, env: tools.env });
}

/** The platform web has no install of its own (a second @angular breaks the bundle): its tests read the product's. */
function linkPlatformModules(product) {
  const link = join(PLATFORM, 'sources/web/node_modules');
  if (existsSync(link)) return;
  symlinkSync(join(product.web, 'node_modules'), link, 'junction');
}

function kubectl(env) {
  const context = process.env.KUBE_CONTEXT ?? ENVIRONMENTS[env].context;
  // A forgotten variable must never send a staging command to prod, or the reverse.
  if ((env === 'prod') !== context.includes('prod')) {
    throw new Error(`Context "${context}" does not match ${env}: set KUBE_CONTEXT to a${env === 'prod' ? ' prod' : ' non-prod'} context.`);
  }
  return (args, options) => exec('kubectl', ['--context', context, ...args], options);
}

function readSecret(kube, namespace, name) {
  const raw = kube(['get', 'secret', name, '-n', namespace, '-o', 'json'], { capture: true, quiet: true });
  return Object.fromEntries(Object.entries(JSON.parse(raw).data).map(([key, value]) => [key, Buffer.from(value, 'base64').toString('utf8')]));
}

const exists = (kube, args) => kube(['get', ...args, '--ignore-not-found', '-o', 'name'], { capture: true, quiet: true }).trim() !== '';

// ---------------------------------------------------------------- checks

/** Rule 7 of AGENTS.md, with the project's JDK and Node: nothing starts, nothing deploys. Then `lab` for what is visible. */
function check(product) {
  ensureWebDependencies(product);
  linkPlatformModules(product);
  const tools = nodeTools();
  exec(tools.node, [tools.npm, 'run', '-s', 'architecture:check'], { cwd: join(PLATFORM, 'sources/web'), env: tools.env });
  exec(tools.node, [join(PLATFORM, 'scripts/product-web.mjs'), 'build', '--configuration', 'development'], { cwd: product.web, env: tools.env });
  const [java, args, options] = gradle({ backend: join(PLATFORM, 'sources/backend') }, [':platform:host-tests:test', '--max-workers=1']);
  exec(java, args, options);
  console.log(`
${product.name}: architecture, web build and host-tests pass. Anything visible: run.mjs lab.
`);
}

// ---------------------------------------------------------------- local modes

let localProduct = null;

async function local(product, env) {
  localProduct = product;
  await assertFree(product.ports.api, 'api');
  await assertFree(product.ports.web, 'web');
  ensureWebDependencies(product);
  process.on('SIGINT', () => stopAll(0));
  process.on('SIGTERM', () => stopAll(0));

  const tools = nodeTools();
  const [java, args, options] = gradle(product, ['--configuration-cache', 'bootRun']);
  const startedAt = Date.now();
  const api = start('api', java, args, { ...options, env: { ...options.env, ...env } });
  const web = start('web', tools.node, [join(PLATFORM, 'scripts/product-web.mjs'), 'serve'], { cwd: product.web, env: tools.env });
  writePids(product, { launcher: process.pid, api: api.pid, web: web.pid });
  cleanups.push(() => removePids(product));

  // Both measured from the same start, in parallel: each line says when that side became ready.
  const seconds = () => Math.round((Date.now() - startedAt) / 1000);
  await Promise.all([
    waitHttp(`http://127.0.0.1:${product.ports.api}/actuator/health`, 600).then(() => log(`API ready after ${seconds()}s.`)),
    waitHttp(`http://127.0.0.1:${product.ports.web}/`, 600).then(() => log(`Web ready after ${seconds()}s.`)),
  ]);
  log(`\n${product.name} is up: http://localhost:${product.ports.web}  (API :${product.ports.api}). Ctrl+C or "run.mjs stop" stops everything.\n`);
}

/** PID of the lab's embedded PostgreSQL from its lock file (first line of postmaster.pid), or null. */
export function postmasterPid(lockFile) {
  if (!existsSync(lockFile)) return null;
  const pid = Number.parseInt(readFileSync(lockFile, 'utf8').split(/\r?\n/)[0], 10);
  return Number.isInteger(pid) && pid > 0 ? pid : null;
}

function isPostgres(pid) {
  if (WINDOWS) {
    const out = spawnSync('tasklist', ['/FI', `PID eq ${pid}`, '/FO', 'CSV', '/NH'], { encoding: 'utf8' }).stdout ?? '';
    return /^"postgres\.exe"/i.test(out.trim());
  }
  return /postgres/.test(spawnSync('ps', ['-p', String(pid), '-o', 'comm='], { encoding: 'utf8' }).stdout ?? '');
}

/** The lab database, in the toolchain (outside the repository): <toolchain>/data/<product>/postgres. */
export function labDataDir(product, root = toolchainRoot()) {
  return join(toolchainPaths(root).data(product.id), 'postgres');
}

/**
 * The embedded PostgreSQL is started by the backend through pg_ctl and outlives it: stopping the lab, or a closed
 * terminal, leaves it holding the data directory and the next lab cannot start. Stop the one that owns this data
 * (and one left in the repository by a lab older than the toolchain).
 */
function stopEmbeddedPostgres(product) {
  for (const dir of [labDataDir(product), join(product.backend, 'data/postgres')]) {
    const pid = postmasterPid(join(dir, 'postmaster.pid'));
    if (!pid || !isPostgres(pid)) continue;
    log(`Stopping the lab's embedded PostgreSQL (pid ${pid}).`);
    killTree(pid);
  }
}

function killTree(pid) {
  if (WINDOWS) spawnSync('taskkill', ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore' });
  else {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      // already gone
    }
  }
}

function killProcess(pid) {
  if (WINDOWS) spawnSync('taskkill', ['/pid', String(pid), '/F'], { stdio: 'ignore' });
  else {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      // already gone
    }
  }
}

const pidsFile = (product) => join(toolchainPaths().logs(product.id), 'lab.pids.json');

function writePids(product, pids) {
  mkdirSync(dirname(pidsFile(product)), { recursive: true });
  writeFileSync(pidsFile(product), JSON.stringify(pids));
}

function removePids(product) {
  try {
    unlinkSync(pidsFile(product));
  } catch {
    // already gone
  }
}

/** PIDs listening on a local port (the Spring Boot process runs under Gradle, the dev server under ng). */
function listeners(port) {
  if (WINDOWS) {
    const out = spawnSync('netstat', ['-ano', '-p', 'TCP'], { encoding: 'utf8' }).stdout ?? '';
    return [...new Set(out.split(/\r?\n/).map((line) => line.trim().split(/\s+/))
      .filter((cols) => cols[3] === 'LISTENING' && cols[1]?.endsWith(`:${port}`)).map((cols) => Number(cols[4])))];
  }
  const out = spawnSync('lsof', ['-t', `-iTCP:${port}`, '-sTCP:LISTEN'], { encoding: 'utf8' }).stdout ?? '';
  return out.split(/\s+/).filter(Boolean).map(Number);
}

/** Command line of a process, to kill only what belongs to this workspace. */
function commandLine(pid) {
  if (WINDOWS) {
    const out = spawnSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', `(Get-CimInstance Win32_Process -Filter "ProcessId=${pid}").CommandLine`], { encoding: 'utf8' }).stdout ?? '';
    return out.trim();
  }
  return (spawnSync('ps', ['-p', String(pid), '-o', 'args='], { encoding: 'utf8' }).stdout ?? '').trim();
}

/** Everything lab started for this product, and only that: its recorded processes, its ports, its PostgreSQL. */
function stopLab(product) {
  let stopped = 0;
  if (existsSync(pidsFile(product))) {
    const pids = JSON.parse(readFileSync(pidsFile(product), 'utf8'));
    // Web with its tree; the launcher and the Gradle client alone, so that the Gradle daemon stays warm.
    for (const [what, pid] of Object.entries(pids)) {
      if (!pid) continue;
      log(`Stopping ${what} (pid ${pid}).`);
      if (what === 'web') killTree(pid);
      else killProcess(pid);
      stopped++;
    }
    removePids(product);
  }
  stopped += stopWorkspaceListeners(product);
  stopEmbeddedPostgres(product);
  log(stopped ? `${product.name}: lab stopped.` : `${product.name}: nothing of the lab was running.`);
}

/** Processes of this workspace listening on the product's ports; a process from elsewhere is never touched. */
function stopWorkspaceListeners(product) {
  const normalize = (path) => path.toLowerCase().replaceAll('/', '\\').replace(/\\+$/, '');
  const workspace = normalize(WORKSPACE);
  let stopped = 0;
  for (const [what, port] of [['API', product.ports.api], ['web', product.ports.web]]) {
    for (const pid of listeners(port)) {
      const cmd = normalize(commandLine(pid));
      if (cmd.includes(workspace)) {
        log(`Stopping the ${what} still listening on ${port} (pid ${pid}).`);
        killTree(pid);
        stopped++;
      } else if (cmd) {
        log(`Port ${port} is held by a process outside this workspace (pid ${pid}): left alone.`);
      }
    }
  }
  return stopped;
}

// ---------------------------------------------------------------- doctor, clean

/** Checks the machine against the toolchain contract; fixes nothing silently. Exit code 1 on any failure. */
async function doctor(product) {
  const tools = toolchainPaths();
  const results = [];
  const report = (level, message) => results.push({ level, message });

  report('INFO', `toolchain: ${tools.root}`);
  try {
    mkdirSync(tools.root, { recursive: true });
    const probe = join(tools.root, `.doctor-${process.pid}`);
    writeFileSync(probe, 'ok');
    unlinkSync(probe);
    report('OK', 'toolchain folder writable');
  } catch (error) {
    report('FAIL', `toolchain folder not writable (${error.message}): set NAFURA_TOOLCHAIN to a folder you own`);
  }
  if (existsSync(tools.nodeExe)) report('OK', `Node ${tools.nodeName}`);
  else report('FAIL', `Node missing at ${tools.node}: ${SETUP}`);
  if (!existsSync(tools.java)) report('FAIL', `JDK missing at ${tools.jdk}: ${SETUP}`);
  else {
    // The failure that motivated the toolchain: a JDK that starts but cannot write (low-integrity executable).
    const probeDir = join(tools.gradle, `.doctor-${process.pid}`);
    const source = join(tools.root, 'DoctorProbe.java');
    writeFileSync(source, 'public class DoctorProbe { public static void main(String[] a) throws Exception { java.nio.file.Files.createDirectories(java.nio.file.Path.of(a[0])); java.io.File f = java.io.File.createTempFile("probe", ".tmp"); f.delete(); System.out.println("ok"); } }');
    const result = spawnSync(tools.java, [source, probeDir], { encoding: 'utf8' });
    rmSync(probeDir, { recursive: true, force: true });
    if (result.stdout?.trim() === 'ok') report('OK', 'JDK runs and writes to the Gradle cache and the temp folder');
    else report('FAIL', `JDK cannot write (${(result.stderr || result.error?.message || '').split(/\r?\n/)[0]}): run doctor again after "toolchain"; if it persists, see ops/README.md § Outillage`);
  }
  if (WINDOWS) {
    for (const [what, path] of [['repository', WORKSPACE], ['toolchain', tools.root]]) {
      const acl = spawnSync('icacls', [path], { encoding: 'utf8' }).stdout ?? '';
      if (/Mandatory Label\\Low/i.test(acl)) {
        report(what === 'toolchain' ? 'FAIL' : 'WARN', `${what} carries a low-integrity label (set by a sandbox such as Codex): programs started from it cannot write elsewhere${what === 'toolchain' ? '' : '; harmless as long as the JDK and Node come from the toolchain'}`);
      }
    }
  }
  if (/\s/.test(WORKSPACE)) report('INFO', `the repository path contains spaces (${WORKSPACE}): supported, but scripts must quote paths`);
  for (const [what, port] of [['API', product.ports.api], ['web', product.ports.web]]) {
    const pids = listeners(port);
    if (pids.length) report('WARN', `port ${port} (${what}) in use by pid ${pids.join(', ')}: "run.mjs stop" if it is a previous lab`);
    else report('OK', `port ${port} (${what}) free`);
  }
  const pg = postmasterPid(join(labDataDir(product), 'postmaster.pid')) ?? postmasterPid(join(product.backend, 'data/postgres/postmaster.pid'));
  if (pg && isPostgres(pg)) report('WARN', `the lab's PostgreSQL runs (pid ${pg}) without a lab: "run.mjs stop"`);
  try {
    const fs = statfsSync(existsSync(tools.root) ? tools.root : WORKSPACE);
    const freeGb = (fs.bavail * fs.bsize) / 1024 ** 3;
    report(freeGb < 5 ? 'WARN' : 'OK', `${freeGb.toFixed(1)} GB free on the toolchain drive${freeGb < 5 ? ' (5 GB recommended)' : ''}`);
  } catch {
    // statfs unsupported: skip
  }
  for (const { level, message } of results) console.log(`${level.padEnd(5)} ${message}`);
  if (results.some((r) => r.level === 'FAIL')) process.exitCode = 1;
}

/** Build outputs of the product; with --data, its lab database too (refused while the lab runs). */
function clean(product, { data = false } = {}) {
  for (const dir of [join(product.backend, 'build'), join(product.web, '.angular'), join(product.web, 'dist')]) {
    if (existsSync(dir)) {
      log(`Deleting ${dir}`);
      rmSync(dir, { recursive: true, force: true });
    }
  }
  if (data) {
    const pid = postmasterPid(join(labDataDir(product), 'postmaster.pid'));
    if (pid && isPostgres(pid)) throw new Error('The lab database is in use: "run.mjs stop" first.');
    log(`Deleting the lab database ${labDataDir(product)}`);
    rmSync(labDataDir(product), { recursive: true, force: true });
  }
}

/** KEY=value file (gitignored). Strips optional surrounding quotes; ignores blanks and # comments. */
function loadEnvFile(path) {
  if (!existsSync(path)) return null;
  const env = {};
  for (const raw of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

async function lab(product) {
  const logFile = openLog(product, 'lab');
  log(`Log: ${logFile}`);
  stopEmbeddedPostgres(product);
  cleanups.push(() => stopEmbeddedPostgres(product));
  process.on('SIGHUP', () => stopAll(0));
  const brevoLab = join(PLATFORM, 'ops/secrets/.brevo-lab.env');
  const emailEnv = loadEnvFile(brevoLab);
  if (!emailEnv?.BREVO_API_KEY) {
    log(`Lab: no Brevo key at ${brevoLab} — invitation emails will fail (EMAIL_DELIVERY_FAILED).`);
  }
  mkdirSync(dirname(labDataDir(product)), { recursive: true });
  await local(product, { ...(emailEnv ?? {}), NAFURA_LAB_DATA_DIR: labDataDir(product) });
}

async function localStaging(product) {
  const kube = kubectl('staging');
  const namespace = namespaceOf(product, 'staging');
  if (!exists(kube, ['secret', 'app-db', '-n', namespace])) {
    throw new Error(`${product.id} is not on staging yet: run "node ops/run.mjs staging" once.`);
  }
  const db = readSecret(kube, namespace, 'app-db');
  await assertFree(LOCAL_STAGING_POSTGRES_PORT, 'staging PostgreSQL port-forward');
  start('pg', 'kubectl', ['--context', process.env.KUBE_CONTEXT ?? ENVIRONMENTS.staging.context, 'port-forward', '-n', ENVIRONMENTS.staging.infra, 'svc/postgres', `${LOCAL_STAGING_POSTGRES_PORT}:5432`]);
  await waitTcp(LOCAL_STAGING_POSTGRES_PORT, 30);
  // Outside the cluster: keys through the public Keycloak URL (hosts entry iam.nafuralabs.staging).
  // The cluster profile blanks the lab secret and hides the user list. A local run keeps that list;
  // staging and prod pods do not (they stay on Keycloak).
  const oidc = oidcOf('staging', { inCluster: false });
  await local(product, {
    SPRING_PROFILES_ACTIVE: 'cluster',
    SERVER_PORT: String(product.ports.api),
    POSTGRES_HOST: '127.0.0.1',
    POSTGRES_PORT: String(LOCAL_STAGING_POSTGRES_PORT),
    POSTGRES_DB: db.database,
    POSTGRES_USER: db.username,
    POSTGRES_PASSWORD: db.password,
    KEYCLOAK_ISSUER_URI: oidc.issuer,
    KEYCLOAK_JWK_SET_URI: oidc.jwkSetUri,
    NAFURA_OWNERS: ownersOf(product, 'staging').join(','),
    NAFURA_SEED_DEMO: 'true',
    NAFURA_LAB_ENABLED: 'true',
    NAFURA_LAB_EMBEDDED_POSTGRES: 'false',
    NAFURA_SECURITY_JWT_HS256_SECRET: 'nafura-lab-local-jwt-secret-32-chars!',
    SPRING_LIQUIBASE_ENABLED: 'true',
  });
}

// ---------------------------------------------------------------- cluster modes

function preflight(kube, env, dryRun) {
  if (dryRun) return;
  exec('docker', ['info', '--format', '{{.ServerVersion}}'], { capture: true });
  kube(['get', 'namespace', ENVIRONMENTS[env].infra], { capture: true });
  kube(['-n', ENVIRONMENTS[env].infra, 'rollout', 'status', 'deploy/postgres', '--timeout=30s']);
  kube(['-n', ENVIRONMENTS[env].infra, 'rollout', 'status', 'deploy/keycloak', '--timeout=30s']);
}

function buildBackend(product, env, dryRun) {
  const [java, args, options] = gradle(product, ['-q', 'bootJar']);
  exec(java, args, { ...options, dryRun });
  const javaVersion = stackVersion('java.version');
  exec('docker', ['build', '-f', join(PRODUCT_OPS, 'Dockerfile.backend'), '--build-arg', `JAVA_VERSION=${javaVersion}`,
    '-t', imageOf(product, env, 'backend'), join(product.backend, 'build/libs')], { dryRun });
  exec('docker', ['build', '-f', join(PRODUCT_OPS, 'Dockerfile.migrations'),
    '-t', imageOf(product, env, 'migrations'), join(product.backend, 'build/resources/main')], { dryRun });
}

function buildWeb(product, env, dryRun) {
  ensureWebDependencies(product);
  const tools = nodeTools();
  exec(tools.node, [join(PLATFORM, 'scripts/product-web.mjs'), 'build'], { cwd: product.web, env: tools.env, dryRun });
  exec('docker', ['build', '-f', join(PRODUCT_OPS, 'Dockerfile.web'), '--build-context', `ops=${PRODUCT_OPS}`,
    '-t', imageOf(product, env, 'web'), join(product.web, 'dist/app/browser')], { dryRun });
}

/** First deploy creates what the product needs on the shared infra; later deploys find it and change nothing. */
function onboard(kube, product, env, dryRun) {
  const namespace = namespaceOf(product, env);
  const infra = ENVIRONMENTS[env].infra;
  const apply = (yaml) => kube(['apply', '-f', '-'], { input: yaml, dryRun });
  apply(`apiVersion: v1\nkind: Namespace\nmetadata:\n  name: ${namespace}\n  labels: { app.kubernetes.io/part-of: ${product.id}, nafura.io/env: ${env} }\n`);

  const psql = (sql) => kube(['exec', '-i', '-n', infra, 'deploy/postgres', '-c', 'postgres', '--', 'psql', '-U', 'nafura', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-q'], { input: sql, dryRun });
  const role = `${product.database}_app`;
  if (dryRun || !exists(kube, ['secret', 'app-db', '-n', namespace])) {
    const password = randomBytes(24).toString('hex');
    // CREATEROLE: platform migrations create the read-only AI roles.
    psql(`DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = '${role}') THEN ALTER ROLE ${role} WITH LOGIN CREATEROLE PASSWORD '${password}';
  ELSE CREATE ROLE ${role} WITH LOGIN CREATEROLE PASSWORD '${password}'; END IF;
END $$;\n`);
    apply(`apiVersion: v1\nkind: Secret\nmetadata:\n  name: app-db\n  namespace: ${namespace}\nstringData:\n  database: ${product.database}\n  username: ${role}\n  password: ${password}\n`);
  }
  psql(`SELECT 'CREATE DATABASE ${product.database} OWNER ${role}' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${product.database}')\\gexec\n`);

  if (ENVIRONMENTS[env].registry && (dryRun || !exists(kube, ['secret', 'nafura-registry', '-n', namespace]))) {
    const pull = dryRun ? '{}' : kube(['get', 'secret', 'nafura-registry', '-n', infra, '-o', 'json'], { capture: true, quiet: true });
    const secret = JSON.parse(pull);
    if (!dryRun) apply(JSON.stringify({ apiVersion: 'v1', kind: 'Secret', type: secret.type, data: secret.data, metadata: { name: 'nafura-registry', namespace } }));
  }

  onboardIdentity(kube, product, env, dryRun);
}

/**
 * The product's Keycloak client (created, or realigned on every deploy) and its owners' accounts (created once,
 * with a temporary password printed here only). Runs kcadm inside the Keycloak pod: no admin port exposed.
 */
function onboardIdentity(kube, product, env, dryRun) {
  const owners = ownersOf(product, env);
  const accounts = owners.map((email) => ({ email, password: randomBytes(12).toString('base64url') }));
  const script = `set -e
. /vault/secrets/keycloak
kc() { /opt/keycloak/bin/kcadm.sh "$@" --config /tmp/kcadm-${product.id}.config; }
kc config credentials --server http://localhost:8080 --realm master --user "$KC_BOOTSTRAP_ADMIN_USERNAME" --password "$KC_BOOTSTRAP_ADMIN_PASSWORD" >/dev/null
ID=$(kc get clients -r ${REALM} -q clientId=${product.id} --fields id --format csv --noquotes)
cat > /tmp/client-${product.id}.json <<'JSON'
${JSON.stringify(keycloakClientOf(product, env))}
JSON
if [ -z "$ID" ]; then kc create clients -r ${REALM} -f /tmp/client-${product.id}.json >/dev/null; echo "client ${product.id} created";
else kc update clients/$ID -r ${REALM} -f /tmp/client-${product.id}.json; echo "client ${product.id} updated"; fi
rm -f /tmp/client-${product.id}.json
${accounts.map(({ email, password }) => `if [ -z "$(kc get users -r ${REALM} -q email='${email}' -q exact=true --fields id --format csv --noquotes)" ]; then
  kc create users -r ${REALM} -s username='${email}' -s email='${email}' -s enabled=true -s emailVerified=true >/dev/null
  kc set-password -r ${REALM} --username '${email}' --new-password '${password}' --temporary
  echo "owner ${email} created, temporary password: ${password}"
else echo "owner ${email} exists"; fi`).join('\n')}
rm -f /tmp/kcadm-${product.id}.config
`;
  const output = kube(['exec', '-i', '-n', ENVIRONMENTS[env].infra, 'deploy/keycloak', '-c', 'keycloak', '--', 'sh', '-s'],
    { input: script, capture: true, dryRun });
  if (output) console.log(output.trim().split('\n').map((line) => `  ${line}`).join('\n'));
  if (!owners.length) {
    console.warn(`No spec.deploy.${env}.owners: nobody administers ${product.name} on ${env} until one is declared.`);
  }
}

async function migrate(kube, product, env, dryRun) {
  const namespace = namespaceOf(product, env);
  const pullSecret = ENVIRONMENTS[env].registry ? '\n      imagePullSecrets: [{ name: nafura-registry }]' : '';
  const fromDb = (key) => `{ secretKeyRef: { name: app-db, key: ${key} } }`;
  kube(['delete', 'job', 'migrations', '-n', namespace, '--ignore-not-found', '--wait=true'], { dryRun });
  kube(['apply', '-f', '-'], {
    dryRun,
    input: `apiVersion: batch/v1
kind: Job
metadata:
  name: migrations
  namespace: ${namespace}
spec:
  backoffLimit: 0
  ttlSecondsAfterFinished: 86400
  template:
    spec:
      restartPolicy: Never${pullSecret}
      containers:
        - name: migrations
          image: ${imageOf(product, env, 'migrations')}
          imagePullPolicy: ${ENVIRONMENTS[env].registry ? 'Always' : 'IfNotPresent'}
          env:
            - name: POSTGRES_DB
              valueFrom: ${fromDb('database')}
            - name: LIQUIBASE_COMMAND_URL
              value: jdbc:postgresql://postgres.${ENVIRONMENTS[env].infra}.svc:5432/$(POSTGRES_DB)
            - name: LIQUIBASE_COMMAND_USERNAME
              valueFrom: ${fromDb('username')}
            - name: LIQUIBASE_COMMAND_PASSWORD
              valueFrom: ${fromDb('password')}
`,
  });
  if (dryRun) return;
  for (let elapsed = 0; elapsed < 900; elapsed += 5) {
    const status = kube(['get', 'job', 'migrations', '-n', namespace, '-o', 'jsonpath={.status.succeeded},{.status.failed}'], { capture: true, quiet: true });
    const [succeeded, failed] = status.split(',');
    if (succeeded === '1') return console.log('Migrations applied.');
    if (failed && failed !== '0') {
      kube(['logs', 'job/migrations', '-n', namespace, '--tail=60']);
      throw new Error('Migrations failed: nothing was deployed.');
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error('Migrations still running after 15 min.');
}

function render(product, env) {
  const dir = join(product.root, 'ops/.render', env);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'kustomization.yaml'), renderKustomization(product, env));
  return exec('kubectl', ['kustomize', '--load-restrictor', 'LoadRestrictionsNone', dir], { capture: true });
}

async function confirmProd(product) {
  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await prompt.question(`Deploy ${product.name} to PROD (${hostOf(product, 'prod')})? Type "${product.id}" to confirm: `);
  prompt.close();
  if (answer.trim() !== product.id) throw new Error('Not confirmed: nothing was done.');
}

async function deploy(product, env, { scope = 'full', dryRun = false, yes = false }) {
  if (!['full', 'back', 'front'].includes(scope)) throw new Error(`--scope must be full, back or front (got ${scope}).`);
  const kube = kubectl(env);
  const back = scope !== 'front';
  const front = scope !== 'back';
  const manifests = render(product, env);
  if (dryRun) console.log(`\n--- rendered manifests (${env}) ---\n${manifests}--- end ---\n`);
  preflight(kube, env, dryRun);
  if (env === 'prod' && !yes && !dryRun) await confirmProd(product);

  if (back) buildBackend(product, env, dryRun);
  if (front) buildWeb(product, env, dryRun);
  if (ENVIRONMENTS[env].registry) {
    const images = [...(back ? ['backend', 'migrations'] : []), ...(front ? ['web'] : [])];
    for (const component of images) exec('docker', ['push', imageOf(product, env, component)], { dryRun });
  }

  onboard(kube, product, env, dryRun);
  if (back) await migrate(kube, product, env, dryRun);
  kube(['apply', '-f', '-'], { input: manifests, dryRun });

  const namespace = namespaceOf(product, env);
  for (const deployment of [...(back ? ['backend'] : []), ...(front ? ['web'] : [])]) {
    kube(['rollout', 'restart', `deployment/${deployment}`, '-n', namespace], { dryRun });
    kube(['rollout', 'status', `deployment/${deployment}`, '-n', namespace, '--timeout=600s'], { dryRun });
  }

  const url = `${ENVIRONMENTS[env].scheme}://${hostOf(product, env)}`;
  if (dryRun) return console.log(`Dry run: nothing changed. Would serve ${url}`);
  try {
    await waitHttp(`${url}/`, 30);
    console.log(`\n${product.name} (${env}) is up: ${url}\n`);
  } catch {
    console.warn(`\nDeployed, but ${url} does not answer from here (DNS/hosts entry for ${hostOf(product, env)}?).\n`);
  }
}

// ---------------------------------------------------------------- entry

function options(args) {
  const parsed = { dryRun: false, yes: false, data: false };
  for (let i = 0; i < args.length; i++) {
    const [flag, value] = args[i].split('=');
    if (flag === '--dry-run') parsed.dryRun = true;
    else if (flag === '--yes') parsed.yes = true;
    else if (flag === '--data') parsed.data = true;
    else if (flag === '--scope') parsed.scope = value ?? args[++i];
    else throw new Error(`Unknown option ${args[i]}\n\n${USAGE}`);
  }
  return parsed;
}

export async function run(productUrl, argv) {
  const [mode, ...rest] = argv;
  try {
    const product = productOf(fileURLToPath(productUrl));
    const opts = options(rest);
    if (mode === 'lab') await lab(product);
    else if (mode === 'local-staging') await localStaging(product);
    else if (mode === 'staging' || mode === 'prod') await deploy(product, mode, opts);
    else if (mode === 'check') check(product);
    else if (mode === 'toolchain') await installToolchain();
    else if (mode === 'doctor') await doctor(product);
    else if (mode === 'stop') stopLab(product);
    else if (mode === 'clean') clean(product, opts);
    else {
      console.log(USAGE);
      process.exitCode = mode && !['-h', '--help', 'help'].includes(mode) ? 2 : 0;
    }
  } catch (error) {
    console.error(`\nERROR: ${error.message}`);
    if (running.length) stopAll(1);
    process.exitCode = 1;
  }
}
