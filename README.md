# dsh-update-command

[Dsh-update-checker](../) 的**附加插件**：读取它查到的插件版本，生成可以直接复制粘贴到终端的更新命令。

> 本插件只**生成命令**，不执行任何更新——不会安装、不会升级、不会移动或删除任何文件。

## 为什么需要它

`dsh-update-checker` 已经能算出每个插件该升级到哪个版本（npm / GitHub 取较高者），
但它的一键更新在下面这些情况下会失败：

- GitHub 拉取被限流或超时（日志里的 `github rate limited (403)`）
- pnpm store 漂移、`node_modules` 写到一半
- 插件在清单里的声明与实际安装位置对不上

失败之后，真正有用的东西就是那行确切的命令，自己粘到终端里跑：

```powershell
dsh plugin --profile web add dsh-connect-workbuddy@5.19.1
```

这个插件负责把这一行生成出来，并且判断清楚 **是哪个 profile**、**要不要带版本号**。

## 它怎么判断

| 依据 | 说明 |
| --- | --- |
| 读谁的版本 | `/dsh-update-checker/plugins.json`（检查器自己已经解析好的结果，尊重它的缓存） |
| 归到哪个 profile | 优先「清单里声明 + 磁盘上真的装着」的那份；其次只看磁盘副本；再次看清单声明；最后才退回当前运行的 profile |
| 命令里的 profile | **固定写 desktop**（无条件）。检测到的原 profile 另作「实际装在 x」展示，不参与命令生成 |
| `add` 还是 `update` | 默认 `add`——这是**真正能锁定版本**的写法，插件不在清单里时也能用。`update` 只改动已声明的依赖条目，作为可切换的备选 |
| 版本解析失败时 | 退化成 `@latest`，并在界面上明确标注「版本未解析」，不假装已是最新 |

## 界面

在 DSH 设置里新增一节 **「更新命令」**（`settings.section`）：

- 每个插件一行，显示 `已安装 → 目标版本`、归属 profile、判断依据
- 每行一个**复制**按钮；顶部 **「复制全部」** 一次复制所有命令（每行一条，末尾带回车，粘进终端即执行）
- 可切换 `add` / `update`、可只看「有更新的」
- 检查器读不到数据时，直接说明原因并让你去它的设置页点一次「重新检查」

## 安装

### A. 直接从 GitHub 装（推荐）

```powershell
dsh plugin --profile web add https://github.com/bancraft/dsh-update-command
```

装完**重启 DSH**，然后在设置里找「更新命令」一节。

### B. 从 release 的 tarball 装（GitHub 直装不通时）

GitHub 直装被网络挡住时（国内环境常见），把 release 里的
`dsh-update-command-0.1.1.tgz` 拷过去，在**那台机器**上执行：

```powershell
dsh plugin --profile web add C:\path\to\dsh-update-command-0.1.1.tgz
```

> **注意 profile 名。** CLI 把 `desktop` 设为 Electron 独占，普通命令行
> `dsh plugin --profile desktop ...` 会被拒。别的电脑上装到 `web` profile 最省事；
> 要装进桌面端，用桌面端自带的「插件」界面装这个 tgz。

装完**重启 DSH**，然后在设置里找「更新命令」一节。

### C. 本机开发（改完即生效）

```powershell
dsh plugin --profile web add link:C:/path/to/dsh-update-command
```

`link:` 装的是一个符号链接，改动源码后刷新页面就能看到，适合边改边看；
但它**不能跨机器**，拷给别人请用 A 或 B 的方式。

### D. 从源码重新打包

改完源码要重新出包：

```powershell
cd <本仓库>
pnpm pack --pack-destination .
```

`package.json` 的 `files` 已限定只打包 `lib / client / cordis.patch.yml / README.md`，
测试脚本和 `.map` 不会混进去。pack 出来的包是**真实目录**，不依赖本机任何路径。

## 路由

两个只读 GET 接口，方便排查或者在脚本里用：

| 路由 | 内容 |
| --- | --- |
| `/dsh-update-command/commands.json` | `{ ok, source, profile, summary, commands: [...] }` |
| `/dsh-update-command/health.json` | 插件自身状态、profile 列表、检查器是否可达 |

## 边界

- **不执行命令。** 复制出去以后由你决定什么时候跑、在哪个目录跑。
- **不改别人。** 对 `dsh-update-checker` 只读，不依赖它改版；它挂掉时本插件会明确报错而不是瞎猜。
- 命令执行完要**重启 DSH** 才生效。
