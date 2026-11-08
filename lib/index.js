/**
 * dsh-update-command — a companion to dsh-update-checker.
 *
 * The checker already resolves, for every installed plugin, the version it would
 * update to (npm and/or GitHub, whichever is higher). What it does NOT do is turn
 * that answer into a command you can run: when its one-click updater fails (git
 * fetch blocked, pnpm store drift, a half-written node_modules), the useful thing
 * left is the exact "dsh plugin --profile <p> add <name>@<version>" line, which
 * you paste into a terminal yourself.
 *
 * This plugin is read-only with respect to every other plugin. It never installs,
 * updates, moves or deletes anything. It reads:
 *   - <checker>/plugins.json        the versions the checker resolved
 *   - <profiles>/<p>/package.json   which profile declares which plugin, and how
 *   - <profiles>/<p>/node_modules   which profile actually holds the copy on disk
 * and renders both the command and the reason it is that command.
 *
 * Routes (all read-only, all GET):
 *   /dsh-update-command/commands.json   { ok, generatedAt, host, commands: [...] }
 *   /dsh-update-command/health.json     { ok, checker, profiles, warnings }
 */

import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";

const SELF = "dsh-update-command";
const CHECKER = "dsh-update-checker";
const SELF_LIB_DIR = dirname(fileURLToPath(import.meta.url));

/* ── profile / home resolution ───────────────────────────────────────────────
 * Mirrors the checker's own resolution so both halves agree on which profile is
 * running. The node_modules that contains this plugin is the most reliable
 * anchor: <home>/profiles/<name>/node_modules/dsh-update-command/lib/index.js.
 */

function pickProfilesRoot(profileNodeModules) {
  const owner = dirname(profileNodeModules);
  if (basename(owner).toLowerCase() === "profiles") return owner;
  const grand = dirname(owner);
  if (basename(grand).toLowerCase() === "profiles") return grand;
  return owner;
}

function findProfileNodeModules(selfLibDir) {
  let cur = resolve(selfLibDir);
  for (let i = 0; i < 8; i++) {
    if (basename(cur) === "node_modules") return cur;
    const parent = dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  return null;
}

function dshHomeFromEnv(env) {
  const raw = typeof env.DSH_HOME === "string" ? env.DSH_HOME.trim() : "";
  return raw ? resolve(raw) : join(homedir(), ".dsh");
}

function resolveProfilesRoot() {
  const explicit = String(process.env.DSH_UC_PROFILES_ROOT || "").trim();
  if (explicit) return resolve(explicit);
  const selfNodeModules = findProfileNodeModules(SELF_LIB_DIR);
  if (selfNodeModules) {
    const root = pickProfilesRoot(selfNodeModules);
    if (basename(root).toLowerCase() === "profiles") return root;
  }
  return join(dshHomeFromEnv(process.env), "profiles");
}

const PROFILES_ROOT = resolveProfilesRoot();

/** The profile this Host is currently serving, or null when it cannot be told. */
function runningProfileName() {
  const explicit = String(process.env.DSH_UC_PROFILE || "").trim();
  if (explicit) return explicit;
  const name = String(process.env.DSH_PROFILE || "").trim();
  if (name) return name;
  const dir = String(process.env.DSH_PROFILE_DIR || "").trim();
  if (dir) return basename(resolve(dir));
  // Last resort: the profile whose node_modules holds this very plugin.
  const selfNodeModules = findProfileNodeModules(SELF_LIB_DIR);
  if (selfNodeModules) {
    const owner = dirname(selfNodeModules);
    const parent = dirname(owner);
    if (basename(parent).toLowerCase() === "profiles") return basename(owner);
  }
  return null;
}

/* ── small filesystem helpers ─────────────────────────────────────────────── */

async function readJson(p) {
  try {
    const raw = await readFile(p, "utf8");
    return JSON.parse(raw.replace(/^\uFEFF/, ""));
  } catch {
    return null;
  }
}

async function listProfileDirs() {
  let entries;
  try {
    entries = await readdir(PROFILES_ROOT, { withFileTypes: true });
  } catch {
    return [];
  }
  const out = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const dir = join(PROFILES_ROOT, e.name);
    const pkg = await readJson(join(dir, "package.json"));
    if (!pkg || typeof pkg !== "object") continue;
    out.push({ name: e.name, dir, pkg, isHarnessProfile: Boolean(pkg.dsh) });
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

/** Which dependency section a profile declares a plugin in, or null. */
function declaredSection(pkg, name) {
  for (const section of ["dependencies", "optionalDependencies", "devDependencies"]) {
    const table = pkg && pkg[section];
    if (table && typeof table === "object" && typeof table[name] === "string") return section;
  }
  return null;
}

/* ── profile attribution ─────────────────────────────────────────────────────
 * The checker reports one primary "dir" plus "copies". A profile is a candidate
 * when it declares the plugin OR physically holds it. Preference order matters:
 * a plugin that is both declared and installed is updated where it is installed,
 * because that is the copy the Host actually loads.
 */

function profileOfPath(p) {
  if (typeof p !== "string" || !p) return null;
  const norm = resolve(p).split("\\").join("/");
  const root = PROFILES_ROOT.split("\\").join("/");
  if (norm.toLowerCase().indexOf(root.toLowerCase() + "/") !== 0) return null;
  const rest = norm.slice(root.length + 1);
  const slash = rest.indexOf("/");
  if (slash <= 0) return null;
  return rest.slice(0, slash);
}

/** Pick the profile whose copy of "name" is the one to update. */
function pickTargetProfile(name, item, profiles, running) {
  const declared = profiles.filter((p) => declaredSection(p.pkg, name) !== null);

  const holders = [];
  const pushHolder = (dir, installed) => {
    if (!dir) return;
    const prof = profileOfPath(dir);
    if (!prof) return;
    if (holders.some((h) => h.profile === prof)) return;
    holders.push({ profile: prof, dir, installed: installed || null });
  };
  pushHolder(item.dir, item.installed);
  for (const c of Array.isArray(item.copies) ? item.copies : []) pushHolder(c.dir, c.installed);

  // A declared profile that also holds the copy is the strongest answer.
  for (const h of holders) {
    if (declared.some((d) => d.name === h.profile)) {
      return { profile: h.profile, basis: "declared+installed", installed: h.installed, declared: true };
    }
  }
  // Installed but never declared: still the real copy on disk.
  if (holders.length > 0) {
    return { profile: holders[0].profile, basis: "installed", installed: holders[0].installed, declared: false };
  }
  // Declared but nothing on disk: the profile that would install it.
  const preferred = declared.find((d) => d.name === running) || declared[0];
  if (preferred) {
    return { profile: preferred.name, basis: "declared", installed: null, declared: true };
  }
  // Nowhere at all — fall back to the running profile so the command is runnable.
  if (running) return { profile: running, basis: "running", installed: null, declared: false };
  return null;
}

/* ── command building ────────────────────────────────────────────────────────
 * "add" vs "update": the official CLI forwards to pnpm, where "update" can only
 * rewrite an existing dependency entry and re-derives the range. "add" with an
 * explicit @version is what actually pins a version, and it also works when the
 * plugin is missing from the manifest. This mirrors what the checker's own
 * auto-updater ends up doing.
 */

/** Quote an argument only when a shell would otherwise split or expand it. */
function shellArg(arg) {
  const s = String(arg);
  if (s === "") return '""';
  if (/^[A-Za-z0-9@._/:+~^=-]+$/.test(s)) return s;
  return '"' + s.replace(/"/g, '\\"') + '"';
}

/**
 * Build both command forms for one plugin.
 *
 * Primary is "add", because that is the form that actually pins a version and is
 * also the only one that works when the plugin is missing from the manifest.
 * "update" is offered as the gentler alternative: it only rewrites an existing
 * dependency entry.
 *
 * When the checker failed to resolve a version (its "latest" is null — the exact
 * situation this plugin exists for), fall back to "@latest" so the line is still
 * runnable, and mark it so the UI can say the version was not resolved.
 *
 * @param {object} o - profile, plugin name, resolved version, installed version.
 */
function buildCommand(o) {
  const profile = o.profile;
  const name = o.name;
  const version = typeof o.version === "string" && o.version ? o.version : null;
  const installed = o.installed || null;
  const resolved = version !== null;

  // Pin the exact version: "@latest" re-resolves the range and can land back on
  // the broken release the user is trying to escape.
  const target = resolved ? name + "@" + version : name + "@latest";

  const make = (action) => {
    const args = ["dsh", "plugin", "--profile", profile, action, target];
    return { action, args, command: args.map(shellArg).join(" ") };
  };

  const add = make("add");
  const update = make("update");

  const reason = resolved
    ? (installed ? installed + " → " + version : "not installed in " + profile + "; installs " + version)
    : "version unresolved by the checker; falls back to @latest";

  return {
    command: add.command,
    action: add.action,
    args: add.args,
    quoted: add.args.some((a) => shellArg(a) !== a),
    altCommand: update.command,
    altAction: update.action,
    altArgs: update.args,
    versionResolved: resolved,
    reason,
  };
}

/* ── reading the checker ─────────────────────────────────────────────────────
 * The live HTTP route is authoritative (it honours the checker's own cache).
 * There is no on-disk fallback: the checker keeps its results in memory, so a
 * silent guess here would be worse than an honest "checker unreachable".
 */

const CHECKER_TIMEOUT_MS = 8000;

function httpGetJson(port, pathname) {
  return new Promise((resolvePromise) => {
    let settled = false;
    const done = (v) => {
      if (settled) return;
      settled = true;
      resolvePromise(v);
    };
    let req;
    try {
      req = http.request(
        {
          host: "127.0.0.1",
          port,
          path: pathname,
          method: "GET",
          headers: { accept: "application/json" },
          timeout: CHECKER_TIMEOUT_MS,
        },
        (res) => {
          let body = "";
          res.setEncoding("utf8");
          res.on("data", (c) => {
            if (body.length < 4 * 1024 * 1024) body += c;
          });
          res.on("end", () => {
            if (res.statusCode !== 200) return done(null);
            try {
              done(JSON.parse(body));
            } catch {
              done(null);
            }
          });
        }
      );
    } catch {
      return done(null);
    }
    req.on("timeout", () => {
      req.destroy();
      done(null);
    });
    req.on("error", () => done(null));
    req.end();
  });
}

/** Ask the running checker for its plugin list. */
async function fetchFromChecker(port) {
  if (typeof port !== "number" || !Number.isFinite(port)) return null;
  const data = await httpGetJson(port, "/" + CHECKER + "/plugins.json");
  if (!data || !Array.isArray(data.plugins)) return null;
  return data;
}

/* ── assembling the answer ─────────────────────────────────────────────────── */

async function collect(port) {
  const warnings = [];
  const running = runningProfileName();

  const profiles = await listProfileDirs();
  if (profiles.length === 0) {
    warnings.push("no profile with a package.json under " + PROFILES_ROOT);
  }

  let source = "checker";
  const live = await fetchFromChecker(port);
  let list = [];
  let checkedAt = null;
  if (live) {
    list = live.plugins;
    checkedAt = live.checkedAt || null;
    if (live.error) warnings.push("checker reported: " + live.error);
  } else {
    source = "none";
    warnings.push(
      "dsh-update-checker/plugins.json did not answer; open the checker settings once, then reload"
    );
  }

  const commands = [];
  for (const item of list) {
    const name = item && typeof item.name === "string" ? item.name : "";
    if (!name) continue;
    const latest = typeof item.latest === "string" ? item.latest : null;
    const hasUpdate = item.hasUpdate === true;

    const pick = pickTargetProfile(name, item, profiles, running);
    const installed = item.installed || (pick && pick.installed) || null;

    // Report every plugin, not only pending updates: the same line repairs a
    // plugin that sits at the wrong version in the wrong profile.
    const built = buildCommand({
      profile: (pick && pick.profile) || running || "desktop",
      name,
      version: latest,
      installed,
    });

    commands.push({
      name,
      profile: (pick && pick.profile) || running || null,
      basis: (pick && pick.basis) || null,
      installed,
      latest,
      hasUpdate,
      status: item.status || null,
      source: item.source || null,
      targetSource: item.targetSource || null,
      ghTag: item.ghTag || null,
      error: item.error || null,
      ghError: item.ghError || null,
      copies: (Array.isArray(item.copies) ? item.copies : []).map((c) => ({
        profile: profileOfPath(c.dir),
        installed: c.installed || null,
      })),
      command: built.command,
      action: built.action,
      args: built.args,
      quoted: built.quoted,
      altCommand: built.altCommand,
      altAction: built.altAction,
      altArgs: built.altArgs,
      versionResolved: built.versionResolved,
      reason: built.reason,
    });
  }

  // Updates first, then version-unknown, then already-current.
  commands.sort((a, b) => {
    if (a.hasUpdate !== b.hasUpdate) return a.hasUpdate ? -1 : 1;
    if (Boolean(a.latest) !== Boolean(b.latest)) return a.latest ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return {
    generatedAt: Date.now(),
    source,
    checkedAt,
    profile: running,
    profilesRoot: PROFILES_ROOT,
    profiles: profiles.map((p) => p.name),
    warnings,
    summary: {
      total: commands.length,
      updatable: commands.filter((c) => c.hasUpdate).length,
    },
    commands,
  };
}

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

export default {
  name: SELF,
  apply(ctx) {
    ctx.inject(["webServer"], (webCtx) => {
      const webServer = webCtx.webServer;

      webServer.register({
        kind: "prefix",
        path: "/" + SELF,
        handler: async (req, res) => {
          if (req.method !== "GET" && req.method !== "HEAD") {
            return json(res, 405, { ok: false, error: "read-only plugin: GET only" });
          }
          const url = new URL(req.url || "/", "http://localhost");
          const port = typeof webServer.port === "number" ? webServer.port : null;
          const head = url.pathname.replace(/^\/+/, "").split("/")[1] || "";
          try {
            if (head === "commands.json") {
              const data = await collect(port);
              return json(res, 200, { ok: true, ...data });
            }
            if (head === "health.json") {
              const running = runningProfileName();
              const profiles = await listProfileDirs();
              const live = await fetchFromChecker(port);
              return json(res, 200, {
                ok: true,
                plugin: SELF,
                profile: running,
                profilesRoot: PROFILES_ROOT,
                profiles: profiles.map((p) => p.name),
                checker: live
                  ? { reachable: true, plugins: live.plugins.length }
                  : { reachable: false },
                warnings: live ? [] : ["dsh-update-checker/plugins.json unreachable"],
              });
            }
            return json(res, 404, {
              ok: false,
              error: "not found",
              routes: ["/commands.json", "/health.json"],
            });
          } catch (err) {
            return json(res, 500, { ok: false, error: String((err && err.message) || err) });
          }
        },
      });
    });
  },
};
