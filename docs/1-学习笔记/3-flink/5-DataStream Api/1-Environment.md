---
tags: [flink]
---

# Environment 执行环境

Flink 程序可以在各种上下文环境中运行：我们可以在本地 JVM 中执行程序，也可以提交到远程集群上运行。

不同的环境，代码的提交运行的过程会有所不同。这就要求我们在提交作业执行计算时，首先必须获取当前 Flink 的运行环境，从而建立起与 Flink 框架之间的联系。

## 创建

我们要获取的执行环境，是 `StreamExecutionEnvironment` 类的对象，这是所有 Flink 程序的基础。在代码中创建执行环境的方式，就是调用这个类的静态方法，具体有以下三种。

1. [`getExecutionEnvironment`](./1-Environment.md#getexecutionenvironment)
2. [`createLocalEnvironment`](./1-Environment.md#createlocalenvironment)
3. [`createRemoteEnvironment`](./1-Environment.md#createremoteenvironment)

### getExecutionEnvironment

```java
StreamExecutionEnvironment.getExecutionEnvironment();
```

最简单的方式，就是直接调用 `getExecutionEnvironment` 方法。它会根据当前运行的上下文直接得到正确的结果：如果程序是独立运行的，就返回一个本地执行环境；如果是创建了 jar 包，然后从命令行调用它并提交到集群执行，那么就返回集群的执行环境。

也就是说，这个方法会根据当前运行的方式，自行决定该返回什么样的运行环境。

这种方式，用起来简单高效，是最常用的一种创建执行环境的方式。

### createLocalEnvironment

```java
StreamExecutionEnvironment.createLocalEnvironment();
```

这个方法返回一个本地执行环境。可以在调用时传入一个参数，指定默认的并行度；如果不传入，则默认并行度就是本地的 CPU 核心数。

### createRemoteEnvironment

```java
StreamExecutionEnvironment
    .createRemoteEnvironment(
        "host", // JobManager 主机名
        1234, // JobManager 进程端口号
        "path/to/jarFile.jar" // 提交给 JobManager 的 JAR 包)
    );
```

这个方法返回集群执行环境。需要在调用时指定 JobManager 的主机名和端口号，并指定要在集群中运行的 Jar 包。

## 执行模式（Execution Mode）

从 Flink 1.12 开始，官方推荐的做法是直接使用 DataStream API，在提交任务时通过将执行模式设为 BATCH 来进行批处理。不建议使用 DataSet API。

```java
// 流处理环境
StreamExecutionEnvironment env =StreamExecutionEnvironment.getExecutionEnvironment();
```

DataStream API 执行模式包括：

- 流执行模式（Streaming）
  > 这是 DataStream API 最经典的模式，一般用于需要持续实时处理的无界数据流。 **默认** 情况下，程序使用的就是 Streaming 执行模式。
- 批执行模式（Batch）
  > 专门用于批处理的执行模式。
- 自动模式（AutoMatic）
  > 在这种模式下，将由程序根据输入数据源是否有界，来自动选择执行模式。

批执行模式的使用。主要有两种方式：

1. 通过代码配置

   > 在代码中，直接基于执行环境调用 `setRuntimeMode` 方法，传入 `BATCH` 模式。
   >
   > ```java
   > env.setRuntimeMode(RuntimeExecutionMode.BATCH);
   > ```

2. 通过命令行配置

   > 在提交作业时，增加 execution.runtime-mode 参数，指定值为 `BATCH。`
   >
   > ```java
   > bin/flink run -Dexecution.runtime-mode=BATCH ...
   > ```

**实际应用中一般不会在代码中配置，而是使用命令行，这样更加灵活。**
