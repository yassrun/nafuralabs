// The project's toolchain: JDK, Node, Gradle and npm caches, lab data and logs, in one folder outside the repository.
// No admin rights, nothing installed on the system: see nafura-platform/ops/README.md § Outillage.
//   node toolchain.mjs install     download what stack.versions.properties pins, verify it, unpack it
//   node toolchain.mjs where       print the toolchain folder
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PLATFORM_DIR = fileURLToPath(new URL('../..', import.meta.url));
const WINDOWS = process.platform === 'win32';

/** NAFURA_TOOLCHAIN, else %LOCALAPPDATA%\nafura on Windows (always writable, no admin), else ~/.nafura. */
export function toolchainRoot(env = process.env, platform = process.platform) {
  if (env.NAFURA_TOOLCHAIN) return env.NAFURA_TOOLCHAIN;
  if (platform === 'win32') return join(env.LOCALAPPDATA || join(env.USERPROFILE || homedir(), 'AppData', 'Local'), 'nafura');
  return join(env.HOME || homedir(), '.nafura');
}

export function stackVersions(file = join(PLATFORM_DIR, 'stack.versions.properties')) {
  const versions = {};
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([^#=\s][^=]*?)\s*=\s*(.*?)\s*$/);
    if (match) versions[match[1]] = match[2];
  }
  return versions;
}

const OS = { win32: 'windows', linux: 'linux', darwin: 'mac' };
const NODE_OS = { win32: 'win', linux: 'linux', darwin: 'darwin' };
const ARCH = { x64: 'x64', arm64: 'aarch64' };

/** Where each tool lives for these versions on this machine. */
export function toolchainPaths(root = toolchainRoot(), versions = stackVersions(), platform = process.platform, arch = process.arch) {
  const nodeName = `node-v${versions['node.version']}-${NODE_OS[platform]}-${arch}`;
  const node = join(root, 'node', nodeName);
  const jdk = join(root, 'jdk', versions['jdk.release']);
  const win = platform === 'win32';
  return {
    root,
    jdk: platform === 'darwin' ? join(jdk, 'Contents', 'Home') : jdk,
    java: join(platform === 'darwin' ? join(jdk, 'Contents', 'Home') : jdk, 'bin', win ? 'java.exe' : 'java'),
    node,
    nodeExe: win ? join(node, 'node.exe') : join(node, 'bin', 'node'),
    npmCli: win ? join(node, 'node_modules', 'npm', 'bin', 'npm-cli.js') : join(node, 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    nodeName,
    gradle: join(root, 'gradle'),
    npmCache: join(root, 'npm-cache'),
    downloads: join(root, 'downloads'),
    data: (product) => join(root, 'data', product),
    logs: (product) => join(root, 'logs', product),
  };
}

// ---------------------------------------------------------------- install

/** curl, present on Windows 10+, Linux and macOS, honours HTTPS_PROXY (Node's fetch does not). */
function curl(args) {
  const result = spawnSync('curl', ['-fsSL', '--retry', '3', ...args], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (result.error) throw new Error(`curl: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`curl ${args.at(-1)} failed: ${(result.stderr || '').trim()}`);
  return result.stdout;
}

function sha256(file) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    createReadStream(file).on('data', (chunk) => hash.update(chunk)).on('end', () => resolve(hash.digest('hex'))).on('error', reject);
  });
}

/** Downloads once into downloads/, then checks the publisher's SHA-256 (also for an archive already there). */
async function fetchVerified(url, file, expected) {
  if (!existsSync(file)) {
    console.log(`  téléchargement ${url}`);
    curl(['-o', `${file}.part`, url]);
    renameSync(`${file}.part`, file);
  }
  const actual = await sha256(file);
  if (actual !== expected.toLowerCase()) {
    rmSync(file, { force: true });
    throw new Error(`Empreinte inattendue pour ${file} : ${actual} au lieu de ${expected}. Archive supprimée, relancer.`);
  }
}

/** tar handles .zip (bsdtar, Windows 10+) as well as .tar.gz / .tar.xz. */
function unpack(archive, into) {
  mkdirSync(into, { recursive: true });
  const result = spawnSync('tar', ['-xf', archive, '-C', into], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`Décompression impossible : ${archive}`);
}

async function installJdk(paths, versions, platform, arch) {
  if (existsSync(paths.java)) return console.log(`  JDK ${versions['jdk.release']} : présent`);
  const query = new URLSearchParams({ architecture: ARCH[arch], heap_size: 'normal', image_type: 'jdk', jvm_impl: 'hotspot', os: OS[platform], project: 'jdk' });
  const release = JSON.parse(curl([`https://api.adoptium.net/v3/assets/release_name/eclipse/${encodeURIComponent(versions['jdk.release'])}?${query}`]));
  const pkg = release.binaries?.[0]?.package;
  if (!pkg) throw new Error(`Adoptium ne publie pas ${versions['jdk.release']} pour ${OS[platform]}/${ARCH[arch]}.`);
  const archive = join(paths.downloads, pkg.name);
  await fetchVerified(pkg.link, archive, pkg.checksum);
  unpack(archive, join(paths.root, 'jdk'));
  if (!existsSync(paths.java)) throw new Error(`JDK décompressé, mais ${paths.java} est introuvable.`);
  console.log(`  JDK ${versions['jdk.release']} : installé`);
}

async function installNode(paths, versions, platform) {
  const ext = platform === 'win32' ? 'zip' : 'tar.gz';
  const name = `${paths.nodeName}.${ext}`;
  const base = `https://nodejs.org/dist/v${versions['node.version']}`;
  const archive = join(paths.downloads, name);
  const sums = curl([`${base}/SHASUMS256.txt`]);
  const expected = sums.split(/\r?\n/).find((line) => line.endsWith(`  ${name}`))?.split(/\s+/)[0];
  if (!expected) throw new Error(`nodejs.org ne publie pas ${name}.`);
  if (existsSync(paths.nodeExe)) {
    // Installed by bootstrap: its archive is checked here, after the fact.
    if (existsSync(archive)) await fetchVerified(`${base}/${name}`, archive, expected);
    return console.log(`  Node ${versions['node.version']} : présent`);
  }
  await fetchVerified(`${base}/${name}`, archive, expected);
  unpack(archive, join(paths.root, 'node'));
  console.log(`  Node ${versions['node.version']} : installé`);
}

export async function install({ root = toolchainRoot(), platform = process.platform, arch = process.arch } = {}) {
  const versions = stackVersions();
  const paths = toolchainPaths(root, versions, platform, arch);
  console.log(`Outillage Nafura dans ${root}`);
  for (const dir of [paths.downloads, paths.gradle, paths.npmCache, join(root, 'data'), join(root, 'logs')]) mkdirSync(dir, { recursive: true });
  await installNode(paths, versions, platform);
  await installJdk(paths, versions, platform, arch);
  pruneOldVersions(root, versions, paths);
  console.log(`Prêt. Gradle et npm utiliseront ${paths.gradle} et ${paths.npmCache}.`);
  return paths;
}

/** Older JDKs and Nodes left by a version change: removed, so that only the pinned ones can be found. */
function pruneOldVersions(root, versions, paths) {
  for (const [dir, keep] of [[join(root, 'jdk'), versions['jdk.release']], [join(root, 'node'), paths.nodeName]]) {
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      if (name !== keep) {
        console.log(`  ancienne version retirée : ${join(dir, name)}`);
        rmSync(join(dir, name), { recursive: true, force: true });
      }
    }
  }
}

// ---------------------------------------------------------------- entry

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const command = process.argv[2] ?? 'install';
  if (command === 'where') console.log(toolchainRoot());
  else if (command === 'install') {
    install().catch((error) => {
      console.error(`\nERREUR : ${error.message}`);
      process.exitCode = 1;
    });
  } else {
    console.error('usage: node toolchain.mjs install|where');
    process.exitCode = 2;
  }
}

export const isWindows = WINDOWS;
