# 把本地项目推到 GitHub（Railway / Vercel 部署的前置一步）

## 已帮你做好的（本地，已执行）
- ✅ 已在项目目录 `git init`
- ✅ 已 `git add .` 并**自动排除** `node_modules/`、`.env`、`.env.*`、`dist/`、`logs/`（密钥和依赖不会被上传）
- ✅ 已提交：共 **158 个文件**，分支名为 **`main`**
- ⏳ 还差：**GitHub 上还没有仓库** + **代码还没 push 上去**

> 为什么必须做这步：Railway「Deploy from GitHub」和 Vercel 导入，都是从 GitHub 拉代码。你之前看到 Railway 列表为空，就是因为 GitHub 上还没这个仓库。

---

## ① 在 GitHub 建一个空仓库

1. 打开 https://github.com → 右上角 **「+」** → **「New repository」**
2. **Repository name**：填 `gaokao-zhiyuan-app`（用英文，别用中文和空格）
3. **不要**勾选下面三个（本地已经有了，勾了反而冲突）：
   - ☐ Add a README file
   - ☐ Add .gitignore
   - ☐ Choose a license
4. 点绿色 **「Create repository」**

建完后会跳到一个页面，上面有 `git remote add origin ...` 的提示——**先别管它**，按下面 ② 做。

---

## ② 生成 Personal Access Token（PAT，push 时当密码用）

> GitHub 已经**禁用账号密码推送**，必须用 token 代替密码。这是最容易卡的一步，照着点：

1. 右上角**头像** → **「Settings」**
2. 页面**最底部左侧** → **「Developer settings」**
3. → **「Personal access tokens」** → **「Tokens (classic)」**
4. 点 **「Generate new token (classic)」**
5. **Note**：填 `railway-deploy`
6. **Expiration**：选 `90 days`（或 No expiration）
7. 勾选 **「repo」**（这一组最上面那个，点一下展开全勾上）
8. 滚到最底点 **「Generate token」**
9. **立刻复制那串 `ghp_xxxx...`** —— 它**只显示这一次**，关掉就没了，存到备忘录

---

## ③ 把代码 push 上去

把下面两条命令里的 `<你的GitHub用户名>` 和 `<仓库名>` 换成你实际的，复制到**终端**跑：

```bash
git remote add origin https://github.com/<你的GitHub用户名>/<仓库名>.git
git push -u origin main
```

- 提示 **Username** 时：填你的 **GitHub 用户名**
- 提示 **Password** 时：**粘贴刚才复制的 PAT**（不是登录密码；光标不动、不显示星号是正常的，粘贴完直接回车）

> 如果提示 `remote origin already exists`，说明之前加过，先跑 `git remote remove origin` 再重跑 ③。

---

## ④ 验证

刷新 https://github.com/<你的GitHub用户名>/<仓库名> ，能看到项目文件（含 `railway.json`、`vercel.json`、`deploy/`）就成功了。

---

## ⑤ 回到 Railway 继续

回到 Railway 的 **「Deploy from GitHub」** 页面 → 点 **「Refresh」**（或刷新整个网页）→ 现在列表里**能看到你的仓库了** → 选中它 → 按 `FREE-DEPLOY-CHECKLIST.md` 的 ② 继续填变量、拿域名。

---

### 附：关于 commit 作者
本次提交用的是占位身份 `gaokao-app / dev@example.com`，不影响推送和部署。若想让 GitHub 把 commit 关联到你的账号，可运行：
```bash
git config user.email "你的GitHub邮箱"
git commit --amend --reset-author --no-edit
git push -f origin main
```
（可选，不做也完全没问题。）
