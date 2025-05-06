## setup

cline によるAIコーディングを行う開発環境を subtreeで配置する

> git subtree add --prefix=mizchi https://github.com/mhiroe/ailab.git main --squash

symlinkをはる
```
m@c  pwd
/Users/m/Documents/ai_interactive
m@c  ./mizchi/setup.sh
```

# mizchi テンプレートの更新

普通に git add , git commit 
> git subtree push --prefix=mizchi https://github.com/mhiroe/ailab.git main

# 他のプロジェクトで更新した内容を取り込む
> git subtree pull --prefix=mizchi  https://github.com/mhiroe/ailab.git main --squash


## 本家のfetch

設定
```
git remote add upstream https://github.com/mizchi/ailab.git
git fetch
git branch -a
```
- 
