window.__ModuleLoader__.load({
  id: "dsh-update-command",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    var react = require("react");

    var NS = "dsh-update-command";
    var COMMANDS_URL = "/dsh-update-command/commands.json";
    var HEALTH_URL = "/dsh-update-command/health.json";

    /* ── styles ─────────────────────────────────────────────────────────────
     * Scoped under .dsuc- so nothing leaks into the shell. Colours come from
     * the shell's own alias tokens with neutral fallbacks, so the section looks
     * native in both light and dark themes.
     */
    var CSS =
      ".dsuc-root{display:flex;flex-direction:column;gap:14px;font-size:13px;line-height:1.5;}" +
      ".dsuc-head{display:flex;flex-direction:column;gap:4px;}" +
      ".dsuc-title{font-weight:600;font-size:14px;}" +
      ".dsuc-sub{color:var(--dsw-alias-label-secondary,#5b6472);font-size:12px;}" +
      ".dsuc-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;}" +
      ".dsuc-btn{appearance:none;border:1px solid var(--dsw-alias-border-l2,#d1d5db);background:var(--dsw-alias-bg-base,transparent);color:var(--dsw-alias-label-primary,inherit);border-radius:6px;padding:4px 10px;font-size:12px;cursor:pointer;line-height:1.6;}" +
      ".dsuc-btn:hover:not(:disabled){border-color:var(--dsw-alias-brand-primary,#4f8cff);color:var(--dsw-alias-brand-primary,#4f8cff);}" +
      ".dsuc-btn:disabled{opacity:.5;cursor:not-allowed;}" +
      ".dsuc-btn.dsuc-primary{background:var(--dsw-alias-button-primary-fill,var(--dsw-alias-brand-primary,#4f8cff));border-color:var(--dsw-alias-button-primary-fill,var(--dsw-alias-brand-primary,#4f8cff));color:var(--dsw-alias-label-primary-foreground,#fff);}" +
      ".dsuc-btn.dsuc-primary:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover,var(--dsw-alias-button-primary-fill,var(--dsw-alias-brand-primary,#4f8cff)));border-color:var(--dsw-alias-button-primary-hover,var(--dsw-alias-button-primary-fill,var(--dsw-alias-brand-primary,#4f8cff)));color:var(--dsw-alias-label-primary-foreground,#fff);}" +
      ".dsuc-toggle{display:inline-flex;border:1px solid var(--dsw-alias-border-l2,#d1d5db);border-radius:6px;overflow:hidden;}" +
      ".dsuc-toggle button{appearance:none;border:0;background:transparent;color:inherit;font-size:12px;padding:4px 10px;cursor:pointer;}" +
      ".dsuc-toggle button[data-on='1']{background:var(--dsw-alias-button-primary-fill,var(--dsw-alias-brand-primary,#4f8cff));color:var(--dsw-alias-label-primary-foreground,#fff);}" +
      ".dsuc-spacer{flex:1 1 auto;}" +
      ".dsuc-list{display:flex;flex-direction:column;gap:8px;}" +
      ".dsuc-row{display:flex;flex-direction:column;gap:5px;padding:9px 11px;border:1px solid var(--dsw-alias-border-l2,#e5e7eb);border-radius:8px;background:var(--dsw-alias-bg-layer-2,rgba(127,127,127,.06));}" +
      ".dsuc-row.dsuc-muted{opacity:.62;}" +
      ".dsuc-rowhead{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}" +
      ".dsuc-name{font-weight:600;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;word-break:break-all;}" +
      ".dsuc-chip{font-size:11px;padding:1px 7px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2,#d1d5db);color:var(--dsw-alias-label-secondary,#5b6472);white-space:nowrap;}" +
      ".dsuc-chip.dsuc-up{border-color:var(--dsw-alias-brand-primary,#4f8cff);color:var(--dsw-alias-brand-primary,#4f8cff);}" +
      ".dsuc-chip.dsuc-warnchip{border-color:var(--dsw-alias-state-warn-primary,#f59e0b);color:var(--dsw-alias-state-warn-label,#b45309);}" +
      ".dsuc-chip.dsuc-target{border-color:var(--dsw-alias-brand-primary,#4f8cff);color:var(--dsw-alias-brand-primary,#4f8cff);font-weight:600;}" +
      ".dsuc-chip.dsuc-detected{border-style:dashed;color:var(--dsw-alias-label-secondary,#5b6472);}" +
      ".dsuc-vers{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;color:var(--dsw-alias-label-secondary,#5b6472);}" +
      ".dsuc-cmd{display:flex;align-items:stretch;gap:6px;}" +
      ".dsuc-code{flex:1 1 auto;min-width:0;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;padding:5px 8px;border-radius:6px;border:1px solid var(--dsw-alias-border-l2,#d1d5db);background:var(--dsw-alias-bg-layer-1,rgba(127,127,127,.10));overflow-x:auto;white-space:pre;user-select:all;}" +
      ".dsuc-hint{font-size:11px;color:var(--dsw-alias-label-secondary,#5b6472);}" +
      ".dsuc-warn{padding:8px 11px;border-radius:8px;border:1px solid var(--dsw-alias-state-warn-primary,#f59e0b);background:var(--dsw-alias-state-warn-tertiary,rgba(245,158,11,.12));color:var(--dsw-alias-label-primary,#0f1115);font-size:12px;}" +
      ".dsuc-empty{padding:16px;text-align:center;color:var(--dsw-alias-label-secondary,#5b6472);font-size:12px;}" +
      ".dsuc-flash{font-size:12px;color:var(--dsw-alias-brand-primary,#4f8cff);}";

    if (typeof document !== "undefined" && document.querySelector('style[data-plugin-css="' + NS + '"]') === null) {
      var tag = document.createElement("style");
      tag.dataset.plugin = NS;
      tag.dataset.pluginCss = NS;
      tag.textContent = CSS;
      document.head.appendChild(tag);
    }

    var ZH = {
      "settings.label": "更新命令",
      "title": "插件更新命令",
      "sub": "读取 dsh-update-checker 查到的版本，生成可以直接粘贴到终端的更新命令。本插件只生成命令，不会执行任何更新。",
      "refresh": "重新读取",
      "copy": "复制",
      "copyAll": "复制全部",
      "copied": "已复制",
      "copiedAll": "已复制 {n} 条命令",
      "copyFailed": "复制失败，请手动选中命令复制",
      "onlyUpdates": "仅显示有更新的",
      "actionAdd": "add（推荐）",
      "actionUpdate": "update",
      "actionHintAdd": "add 会写入确切的版本号，插件未在清单中时也能用。",
      "actionHintUpdate": "update 只改动已声明的依赖条目。",
      "loading": "正在读取版本信息…",
      "empty": "没有可生成的更新命令。",
      "unreachable": "读取不到 dsh-update-checker 的版本信息：{detail}。请在它的设置页点一次「重新检查」，然后回来刷新。",
      "unresolved": "版本未解析（检查器失败），已退化为 @latest",
      "summary": "共 {total} 个插件，其中 {up} 个可更新",
      "profileChip": "profile: {profile}",
      "targetChip": "→ {profile}",
      "detectedChip": "实际装在 {profile}",
      "basisDeclaredInstalled": "清单声明 + 已安装",
      "basisInstalled": "仅已安装",
      "basisDeclared": "仅清单声明",
      "basisRunning": "当前 profile",
      "upToDate": "已是最新",
      "statusUpdate": "可更新",
      "statusUnresolved": "版本未解析",
      "inProfile": "位于 {profile}",
      "hintRestart": "命令执行后需要重启 DSH 才会生效。",
      "error": "读取失败：{detail}",
    };

    var EN = {
      "settings.label": "Update commands",
      "title": "Plugin update commands",
      "sub": "Reads the versions dsh-update-checker resolved and renders commands you can paste into a terminal. This plugin only generates commands; it never runs an update.",
      "refresh": "Reload",
      "copy": "Copy",
      "copyAll": "Copy all",
      "copied": "Copied",
      "copiedAll": "Copied {n} commands",
      "copyFailed": "Copy failed; select the command and copy it manually",
      "onlyUpdates": "Only plugins with updates",
      "actionAdd": "add (recommended)",
      "actionUpdate": "update",
      "actionHintAdd": "add pins the exact version and also works when the plugin is missing from the manifest.",
      "actionHintUpdate": "update only rewrites an existing dependency entry.",
      "loading": "Reading version information…",
      "empty": "No commands to generate.",
      "unreachable": "Could not read versions from dsh-update-checker: {detail}. Click its own \"Recheck\" once, then reload here.",
      "unresolved": "version unresolved (checker failed); fell back to @latest",
      "summary": "{total} plugins, {up} with updates",
      "profileChip": "profile: {profile}",
      "targetChip": "→ {profile}",
      "detectedChip": "installed in {profile}",
      "basisDeclaredInstalled": "declared + installed",
      "basisInstalled": "installed only",
      "basisDeclared": "declared only",
      "basisRunning": "running profile",
      "upToDate": "up to date",
      "statusUpdate": "update available",
      "statusUnresolved": "version unresolved",
      "inProfile": "in {profile}",
      "hintRestart": "Restart DSH after running a command for it to take effect.",
      "error": "Read failed: {detail}",
    };

    function fallbackT(key, params) {
      var text = ZH[key] !== undefined ? ZH[key] : key;
      if (params) {
        text = text.replace(/\{(\w+)\}/g, function (m, name) {
          return name in params ? String(params[name]) : m;
        });
      }
      return text;
    }

    /* ── clipboard ──────────────────────────────────────────────────────────
     * navigator.clipboard needs a secure context; the GUI on 127.0.0.1 is one,
     * but a LAN/plain-http session is not, so keep the legacy path as a fallback
     * rather than showing a dead button.
     */
    function copyText(text) {
      return new Promise(function (resolve) {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
          navigator.clipboard.writeText(text).then(
            function () { resolve(true); },
            function () { resolve(legacyCopy(text)); }
          );
          return;
        }
        resolve(legacyCopy(text));
      });
    }

    function legacyCopy(text) {
      try {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.top = "-1000px";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        var ok = document.execCommand("copy");
        document.body.removeChild(ta);
        return ok;
      } catch (e) {
        return false;
      }
    }

    function fetchJson(url) {
      return fetch(url, { cache: "no-store" }).then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      });
    }

    function basisLabel(basis, t) {
      if (basis === "declared+installed") return t("basisDeclaredInstalled");
      if (basis === "installed") return t("basisInstalled");
      if (basis === "declared") return t("basisDeclared");
      if (basis === "running") return t("basisRunning");
      return basis || "";
    }

    function SettingsSection(props) {
      var t = props.t || fallbackT;

      var state = react.useState(null);
      var data = state[0];
      var setData = state[1];

      var errState = react.useState(null);
      var err = errState[0];
      var setErr = errState[1];

      var busyState = react.useState(false);
      var busy = busyState[0];
      var setBusy = busyState[1];

      var actionState = react.useState("add");
      var mode = actionState[0];
      var setMode = actionState[1];

      var onlyState = react.useState(false);
      var onlyUpdates = onlyState[0];
      var setOnlyUpdates = onlyState[1];

      var flashState = react.useState("");
      var flash = flashState[0];
      var setFlash = flashState[1];

      var flashTimer = react.useRef(null);

      var say = function (msg) {
        setFlash(msg);
        if (flashTimer.current) clearTimeout(flashTimer.current);
        flashTimer.current = setTimeout(function () { setFlash(""); }, 2200);
      };

      var load = function () {
        setBusy(true);
        setErr(null);
        fetchJson(COMMANDS_URL)
          .then(function (d) {
            setData(d);
            setBusy(false);
          })
          .catch(function (e) {
            setErr(String((e && e.message) || e));
            setBusy(false);
          });
      };

      react.useEffect(function () {
        load();
        return function () {
          if (flashTimer.current) clearTimeout(flashTimer.current);
        };
      }, []);

      var rows = (data && Array.isArray(data.commands) ? data.commands : []).filter(function (c) {
        if (!onlyUpdates) return true;
        return c.hasUpdate === true;
      });

      var pickCommand = function (c) {
        return mode === "update" ? c.altCommand || c.command : c.command;
      };

      // A copied command ends with one newline so the terminal executes it on
      // paste; without it the cursor just sits at the end of the line.
      var withEnter = function (cmd) {
        return cmd + "\n";
      };

      var copyOne = function (c) {
        copyText(withEnter(pickCommand(c))).then(function (ok) {
          if (ok) say(t("copied"));
          else say(t("copyFailed"));
        });
      };

      var copyAll = function () {
        var lines = rows.map(pickCommand).filter(Boolean);
        if (!lines.length) return;
        copyText(lines.map(withEnter).join("")).then(function (ok) {
          if (ok) say(t("copiedAll", { n: lines.length }));
          else say(t("copyFailed"));
        });
      };

      var checkerDown = data && data.source === "none";

      var children = [];

      var head = react.createElement(
        "div",
        { className: "dsuc-head" },
        react.createElement("div", { className: "dsuc-title" }, t("title")),
        react.createElement("div", { className: "dsuc-sub" }, t("sub"))
      );
      children.push(head);

      if (checkerDown) {
        var detail = data && data.warnings && data.warnings.length ? data.warnings[0] : "?";
        children.push(
          react.createElement("div", { className: "dsuc-warn" }, t("unreachable", { detail: detail }))
        );
      } else if (err) {
        children.push(react.createElement("div", { className: "dsuc-warn" }, t("error", { detail: err })));
      }

      var toggle = react.createElement(
        "div",
        { className: "dsuc-toggle" },
        react.createElement(
          "button",
          { type: "button", "data-on": mode === "add" ? "1" : "0", onClick: function () { setMode("add"); } },
          t("actionAdd")
        ),
        react.createElement(
          "button",
          { type: "button", "data-on": mode === "update" ? "1" : "0", onClick: function () { setMode("update"); } },
          t("actionUpdate")
        )
      );

      var toolbar = react.createElement(
        "div",
        { className: "dsuc-toolbar" },
        toggle,
        react.createElement(
          "button",
          {
            type: "button",
            className: "dsuc-btn",
            "data-on": onlyUpdates ? "1" : "0",
            onClick: function () { setOnlyUpdates(!onlyUpdates); },
          },
          t("onlyUpdates")
        ),
        react.createElement("span", { className: "dsuc-spacer" }),
        react.createElement(
          "button",
          { type: "button", className: "dsuc-btn", onClick: load, disabled: busy },
          t("refresh")
        ),
        react.createElement(
          "button",
          { type: "button", className: "dsuc-btn dsuc-primary", onClick: copyAll, disabled: !rows.length },
          t("copyAll")
        ),
        flash ? react.createElement("span", { className: "dsuc-flash" }, flash) : null
      );
      children.push(toolbar);

      var hintParts = [];
      hintParts.push(mode === "update" ? t("actionHintUpdate") : t("actionHintAdd"));
      if (data && data.summary) {
        hintParts.push(t("summary", { total: data.summary.total, up: data.summary.updatable }));
      }
      hintParts.push(t("hintRestart"));
      children.push(react.createElement("div", { className: "dsuc-hint" }, hintParts.join("  ·  ")));

      if (busy && !data) {
        children.push(react.createElement("div", { className: "dsuc-empty" }, t("loading")));
      } else if (!rows.length) {
        children.push(react.createElement("div", { className: "dsuc-empty" }, t("empty")));
      } else {
        var list = react.createElement(
          "div",
          { className: "dsuc-list" },
          rows.map(function (c) {
            var rowKids = [];

            var chips = [];
            if (c.profile) {
              chips.push(
                react.createElement("span", { key: "p", className: "dsuc-chip dsuc-target" }, t("targetChip", { profile: c.profile }))
              );
            }
            // Show where the installed copy actually lives when it differs from
            // the target, so "updates here, installed there" is visible rather than
            // silently producing a fresh install.
            if (c.detectedProfile && c.detectedProfile !== c.profile) {
              chips.push(
                react.createElement("span", { key: "d", className: "dsuc-chip dsuc-detected" }, t("detectedChip", { profile: c.detectedProfile }))
              );
            }
            if (c.basis) {
              chips.push(
                react.createElement("span", { key: "b", className: "dsuc-chip" }, basisLabel(c.basis, t))
              );
            }
            var statusText = c.hasUpdate
              ? t("statusUpdate")
              : c.versionResolved === false
                ? t("statusUnresolved")
                : t("upToDate");
            chips.push(
              react.createElement(
                "span",
                {
                  key: "s",
                  className:
                    "dsuc-chip" + (c.hasUpdate ? " dsuc-up" : c.versionResolved === false ? " dsuc-warnchip" : ""),
                },
                statusText
              )
            );

            var versText = c.installed || "—";
            if (c.latest) versText += " → " + c.latest;
            else versText += " → ?";

            rowKids.push(
              react.createElement(
                "div",
                { className: "dsuc-rowhead" },
                react.createElement("span", { className: "dsuc-name" }, c.name),
                react.createElement("span", { className: "dsuc-vers" }, versText),
                react.createElement("span", { className: "dsuc-spacer" }),
                chips
              )
            );

            var rowCmd = pickCommand(c);
            var cmdRow = react.createElement(
              "div",
              { className: "dsuc-cmd" },
              react.createElement("code", { className: "dsuc-code" }, rowCmd),
              react.createElement(
                "button",
                { type: "button", className: "dsuc-btn", onClick: function () { copyOne(c); } },
                t("copy")
              )
            );
            rowKids.push(cmdRow);

            var notes = [];
            if (c.versionResolved === false) notes.push(t("unresolved"));
            if (c.copies && c.copies.length) {
              var others = c.copies
                .filter(function (x) { return x && x.profile && x.profile !== c.profile; })
                .map(function (x) { return x.profile + " " + (x.installed || "?"); });
              if (others.length) notes.push(t("inProfile", { profile: others.join(", ") }));
            }
            if (notes.length) {
              rowKids.push(react.createElement("div", { className: "dsuc-hint" }, notes.join("  ·  ")));
            }

            return react.createElement(
              "div",
              { key: c.name, className: "dsuc-row" + (c.hasUpdate ? "" : " dsuc-muted") },
              rowKids
            );
          })
        );
        children.push(list);
      }

      return react.createElement("div", { className: "dsuc-root" }, children);
    }

    function apply(ctx) {
      ctx.inject(["slots", "locale"], function (scope) {
        var locale = ctx.get("locale");
        if (locale !== undefined) {
          ctx.effect(function () {
            return locale.register(NS, { zh: ZH, en: EN });
          }, NS + ": dictionaries");
        }
        var sectionT = locale !== undefined ? locale.bind(NS) : fallbackT;

        var opts = {
          name: "settings.section",
          id: NS,
          order: 45,
          label: function () { return sectionT("settings.label"); },
        };
        if (locale !== undefined) opts.locale = NS;

        scope.slots.inject("settings.section", function () {
          return scope.slots.register(opts, SettingsSection);
        });
      });
    }

    exports.apply = apply;
    exports.inject = ["slots"];
    return module.exports;
  },
});
