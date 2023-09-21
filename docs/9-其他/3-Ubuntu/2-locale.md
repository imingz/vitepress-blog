---
tags: [Ubuntu]
---

# locale 配置为简体中文

## 查询语言环境

```sh
locale
locale -a
```

## 安装基本的软件包

```sh
sudo apt-get update
sudo apt-get install  -y language-pack-zh-hans
```

## 修改 shell 配置文件

```zshrc
export LANG=zh_CN.UTF-8
```
