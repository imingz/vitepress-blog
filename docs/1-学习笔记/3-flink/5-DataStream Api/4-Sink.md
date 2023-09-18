---
tags: [flink]
---

# Sink 输出

Flink 作为数据处理框架，最终还是要把计算处理的结果写入外部存储，为外部应用提供
支持。

## 连接到外部系统

Flink 的 DataStream API 专门提供了向外部写入数据的方法：`addSink`。与 `addSource` 类似，`addSink` 方法对应着一个“Sink”算子，主要就是用来实现与外部系统连接、并将数据提交写入的；Flink 程序中所有对外的输出操作，一般都是利用 Sink 算子完成的。

Flink1.12 开始，同样重构了 Sink 架构，

```java
stream.sinkTo(...)
```

当然，Sink 多数情况下同样并不需要我们自己实现。之前我们一直在使用的 print 方法其实就是一种 Sink，它表示将数据流写入标准控制台打印输出。Flink 官方为我们提供了一部分的框架的 Sink 连接器。

我们可以看到，像 Kafka 之类流式系统，Flink 提供了完美对接，source/sink 两端都能连接，可读可写；而对于 Elasticsearch、JDBC 等数据存储系统，则只提供了输出写入的 sink 连接器。

除 Flink 官方之外，Apache Bahir 框架，也实现了一些其他第三方系统与 Flink 的连接器。

除此以外，就需要用户自定义实现 sink 连接器了。

### 输出到文件

Flink 专门提供了一个流式文件系统的连接器：`FileSink`，为批处理和流处理提供了一个统一的 Sink，它可以将分区文件写入 Flink 支持的文件系统。

`FileSink` 支持行编码（Row-encoded）和批量编码（Bulk-encoded）格式。这两种不同的方式都有各自的构建器（builder），可以直接调用 `FileSink` 的静态方法：

- 行编码： `FileSink.forRowFormat(basePath，rowEncoder)`
- 批量编码： `FileSink.forBulkFormat(basePath，bulkWriterFactory)`

::: details 导入依赖

```xml
<!-- 文件连接器 -->
<!-- https://mvnrepository.com/artifact/org.apache.flink/flink-connector-files -->
<dependency>
    <groupId>org.apache.flink</groupId>
    <artifactId>flink-connector-files</artifactId>
    <version>${flink.version}</version>
```

:::

::: details 示例

```java
public class FileSinkDemo {
    /**
     * 该程序演示了如何使用 Flink 的 FileSink 将数据写入文件。
     * 在流模式下使用 FileSink 时需要启用 Checkpoint ，每次做 Checkpoint 时写入完成。如果 Checkpoint
     * 被禁用，部分文件（part file）将永远处于 ‘in-progress’ 或 ‘pending’ 状态，下游系统无法安全地读取。
     */
    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();

        env.setParallelism(2);

        // 在流模式下使用 FileSink 时需要启用 Checkpoint ，每次做 Checkpoint 时写入完成。如果 Checkpoint
        // 被禁用，部分文件（part file）将永远处于 ‘in-progress’ 或 ‘pending’ 状态，下游系统无法安全地读取。
        env.enableCheckpointing(2000, CheckpointingMode.EXACTLY_ONCE);

        DataGeneratorSource<String> dataGenerator = new DataGeneratorSource<>(
                new GeneratorFunction<Long, String>() {

                    @Override
                    public String map(Long value) throws Exception {
                        return "Number: " + value;
                    }

                },
                100,
                // Long.MAX_VALUE,
                RateLimiterStrategy.perSecond(100),
                Types.STRING);

        DataStreamSource<String> fromSource = env.fromSource(dataGenerator, WatermarkStrategy.noWatermarks(),
                "data-generator");

        FileSink<String> fileSink = FileSink
                // 输出行式存储的文件，指定路径、指定编码
                .<String>forRowFormat(new Path("_output"), new SimpleStringEncoder<>("UTF-8"))
                // 输出文件的一些配置： 文件名的前缀、后缀
                .withOutputFileConfig(
                        OutputFileConfig.builder().withPartPrefix("imingz").withPartSuffix(".log").build())
                // 文件滚动策略
                .withRollingPolicy(DefaultRollingPolicy.builder().withMaxPartSize(new MemorySize(1 * 1024)).build())
                .build();

        fromSource.sinkTo(fileSink);

        env.execute();
    }
}
```

:::

### 输出到 Kafka

// todo p82

本地 kafka 失效了，后面有空补。
