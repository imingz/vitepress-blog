---
tags: [Vercel]
---

# Vercel 部署时获取所有 Git 历史

Vercel 在部署时默认只保留最近的十次 Git 提交（也称为 "Deployments"）。这是为了限制部署历史的大小，以减少存储和管理的负担。

如果你想查看更多的部署历史记录，可以考虑以下方法：

使用 Vercel 的版本控制集成：Vercel 可以与 Git 仓库（如 GitHub、GitLab 或 Bitbucket）进行集成。

这里使用 Github。

参考官方文章： [How can I use GitHub Actions with Vercel?](https://vercel.com/guides/how-can-i-use-github-actions-with-vercel)

## 构建您的应用程序

可以在 GitHub Actions（或在 本地 中）构建应用程序，而无需授予 Vercel 对源代码的访问权限。

## 配置 GitHub Vercel 操作

预览的配置 `.github/workflows/preview.yaml`

```yaml
name: Vercel Preview Deployment
env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
on:
  push:
    branches-ignore:
      - main
jobs:
  Deploy-Preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
        with:   // [!code ++]
          fetch-depth: 0   // [!code ++]
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}
      - name: Build Project Artifacts
        run: vercel build --token=${{ secrets.VERCEL_TOKEN }}
      - name: Deploy Project Artifacts to Vercel
        run: vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }}
```

正式环境的配置 `.github/workflows/production.yaml`

```yaml
name: Vercel Production Deployment
env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
on:
  push:
    branches:
      - main
jobs:
  Deploy-Production:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
        with:   // [!code ++]
          fetch-depth: 0   // [!code ++]
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
      - name: Build Project Artifacts
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
      - name: Deploy Project Artifacts to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

可以看出来，两个文件差不多，仅部分命令不同，且 `production` 监听的是 `main` 分支的 `push` 操作。

注意代码新增部分。

::: details 新增部分解读

GitHub 的 Action Template 中默认带了一个 checkout 插件，这个插件可以实现将你的项目 Clone 到 CI 的运行环境中，从而执行各项操作。

为了提升速度，Github 在实际上实现的时候，默认会限制 depth=1，这就导致在 clone 的时候，仅 clone 一个 commit ，如果你需要依赖 git 进行操作，则需要更多的 commit 。

在具体的实现过程中，你需要做的仅仅是在配置 github action 中的 fetch-depth 选项，设置为你需要的 commit 数量。如果你需要的是所有的 commit， 则将该选项设置为 0。

具体配置参考官方 [Checkout](https://github.com/actions/checkout)

```yaml
- uses: actions/checkout@v4
  with:
    # Number of commits to fetch. 0 indicates all history for all branches and tags.
    # Default: 1
    fetch-depth: ""
```

:::

## 获取 `VERCEL_TOKEN`

参考官方文章：[How do I use a Vercel API Access Token?](https://vercel.com/guides/how-do-i-use-a-vercel-api-access-token)

1. 点击右上角头像
2. 选择 `Settings`
3. 选择左边栏的 `Tokens`
4. 输入 `TOKEN NAME`
5. 选择 `SCOPE` 和 `EXPIRATION`
6. 点击 `Create`

::: warning 注意
Token 仅出现一次，请注意保存。
:::

## 获取 `VERCEL_ORG_ID` 和 `VERCEL_PROJECT_ID`

在本地文件打开 shell 使用下面命令，将 `VERCEL_TOKEN` 换成上一步的

```sh
# 安装 Vercel CLI
yarn global add vercel

# 创建一个新的 Vercel 项目
vercel link
```

将自动生成本地文件，打开 `.vercel/project.json`，即可看到 `VERCEL_ORG_ID` 和 `VERCEL_PROJECT_ID`

## 在 GitHub 中添加

在 GitHub 中添加 `Secret`
