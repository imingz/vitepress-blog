---
tags: [golang, "6.5840"]
---

# 6.5840 Lab 1: MapReduce 第一天

::: info 前言
其实不是第一天，前面也看了一点，但是畏难而退。
:::

## 前言

迷茫，迷茫，迷茫。。。

## 课程资源

1. [课程主页](https://pdos.csail.mit.edu/6.824/)
2. [2020 学期视频](https://www.bilibili.com/video/av91748150)

## 任务梳理

::: info Lab1 地址
[Lab1](https://pdos.csail.mit.edu/6.824/labs/lab-mr.html)
:::

### Introduction / Job

-   实现一个分布式的 MapReduce，包括两个程序， `coordinator` 和 `worker` 。
-   只有一个 `coordinator` ，但是可以有多个 `worker` 。
-   `worker` 将通过 _RPC_ 与 `coordinator` 通信。
-   每个 `worker` 进程都会询问 `coordinator` ，从一个或多个文件中读取任务的输入，执行任务，并将任务的输出写入一个或更多文件。
-   `coordinator` 应注意 `worker` 是否尚未完成 在合理的时间内完成任务（对于本实验，请使用十秒），并将相同的任务分配给不同的 `worker`。

### A few rules

-   `map` 阶段需要将中间 `keys` 分成 `nReduce` 个数, `nReduce` 通过 `main/mrcoordinator.go` 传给 `MakeCoordinator()`
-   `worker` 需要将第 `X` 个 `reduce` 任务的结果放到 `mr-out-X` 中。
-   `mr-out-X` 要一行一行生成 `%v %v` 形式。参考 `main/mrsequential.go`
-   `main/mrcoordinator.go` 期望 `mr/coordinator.go` 实现一个 `Done()` 方法，该方法在 MapReduce 作业完全完成时返回 `true`; 此时，`mrcoordinator.go` 将退出。
-   作业完全完成后，`worker` 进程应退出。

### Hints

-   开始的方法是修改 `mr/worker.go` 的 `Worker()` 以向协调器发送请求任务的 RPC。然后，修改 `mr/coordinator.go` 的 `MakeCoordinator()` 以接受这些 RPC 并将任务分配给 `worker`。
-   `map` `reduce` 函数都是通过 go 插件装载 (`.so` 文件)
-   `mr/` 文件变了就需要重新 `build`
-   中间文件的合理命名约定是 `mr-X-Y`， 其中 X 是 `map` 任务编号，Y 是 `reduce` 任务编号。
-   多参考 `mrsequential.go`
-   `worker` 的 `map` 方法用 json 存储中间 kv 对，`reduce` 再读回来，因为真正分布式 `worker` 都不在一个机器上，涉及网络传输，所以用 json 编码解码走个过场。
-   使用 `go run -race`
-   `coordinator` 里面的共享数据需要加锁
-   `worker` 的 `map` 可以用 `worker.go` 里面的 `ihash(key)` 得到特定 `key` 的 `reduce` 任务号
-   懒得翻译了

## 开始

### `mrsequential.go` 分析

根据提示，多参考 `mrsequential.go`。

运行参数为

```bash
go run mrsequential.go xxx.so input_files...
```

0.  编译 `wc/*` 为 `wc.so`
1.  `loadPlugin` 加载 `map` 函数和 `reduce` 函数
2.  读取每个输入文件，将其传递给 `map`，累积中间 `map` 输出到 `intermediate`
3.  对 `intermediate` 按 `key` 排序
4.  对 `intermediate` 中的每个 `key` 调用 `reduce`，将输出写入 `mr-out-0` 文件

### 调试分析

::: code-group

```bash [前置]
go build -buildmode=plugin ../mrapps/wc.go
```

```bash [mrcoordinator]
rm mr-out*
go run mrcoordinator.go pg-*.txt
```

```bash [mrworker]
go run mrworker.go wc.so
```

```bash [查看输出]
cat mr-out-* | sort | more
```

:::

### `coordinator.go` 和 `worker` 通信

`mrcoordinator` 调用 `mr/coordinator.go` 的 `MakeCoordinator()` 创建一个 `Coordinator` 对象，然后调用 `Coordinator` 的 `Done()` 方法，该方法在 MapReduce 作业完全完成时返回 `true`。

`mrworker` 调用 `mr/worker.go` 的 `Worker()` 方法，该方法向 `coordinator` 发送 RPC，以请求任务。`coordinator` 将任务分配给 `worker`，并将任务的类型和参数作为 `Worker()` 的返回值返回。

`sockname := coordinatorSock()` 用于获取 `socket` 地址。

`net.Listen("unix", sockname)` 用于 `coordinator` 监听 `socket`。

`rpc.DialHTTP("unix", sockname)` 用于 `worker` 连接 `socket`。

`call("Coordinator.Example", &args, &reply)` 用于 `worker` 向 `coordinator` 发送 RPC。调用 `Coordinator.Example` 方法，参数为 `args`，返回值为 `reply`。
