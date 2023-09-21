---
tags: [Ubuntu]
---

# zsh 配置

## 下载 zsh

```sh
apt install zsh
```

## 下载 oh-my-zsh

```sh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

## 修改配置文件

```zshrc
# Path to your oh-my-zsh installation.
export ZSH=$HOME/.oh-my-zsh

# 主题
ZSH_THEME="robbyrussell"

# 插件
plugins=(
    # git
    git
    # 文件夹快捷跳转
    z
    # 解压插件
    extract
    # 命令提示
    zsh-autosuggestions
    # 语法校验
    zsh-syntax-highlighting
    # 双击 esc 在行首添加或者移除 sudo
    sudo
    )

source $ZSH/oh-my-zsh.sh

# You may need to manually set your language environment
export LANG=zh_CN.UTF-8

```

## 下载插件

::: code-group

```zsh-autosuggestions
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
```

```zsh-syntax-highlighting
git clone https://github.com/zsh-users/zsh-syntax-highlighting ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
```

:::
