---
tags: [flink]
---

# Source 源算子

Flink 可以从各种来源获取数据，然后构建 DataStream 进行转换处理。一般将数据的输入来源称为数据源（data source），而读取数据的算子就是源算子（source operator）。所以，source 就是我们整个处理程序的输入端。

从 Flink1.12 开始，主要使用流批统一的新 Source 架构：

```java
DataStreamSource<String> stream = env.fromSource(…)
```

Flink 直接提供了很多预实现的接口，此外还有很多外部连接工具也帮我们实现了对应的 Source，通常情况下足以应对我们的实际需求。

> 在 Flink1.12 以前，旧的添加 source 的方式，是调用执行环境的 addSource()方法：  
> `DataStream<String> stream = env.addSource(...);`  
> 方法传入的参数是一个“源函数”（source function），需要实现 SourceFunction 接口。

## 模拟准备工作

为了方便练习，这里使用 WaterSensor 作为数据模型。

| 字段名 | 数据类型 | 说明             |
| ------ | -------- | ---------------- |
| id     | String   | 水位传感器类型   |
| ts     | Long     | 传感器记录时间戳 |
| vc     | Integer  | 水位记录         |

源代码见 [附录 WaterSensor](./2-Source.md#watersensor)

Flink 会把这样的类作为一种特殊的 POJO 数据类型来对待，方便数据的解析和序列化。另外我们在类中还重写了 toString 方法，主要是为了测试输出显示更清晰。

:::info POJO

Plain Ordinary Java Object 简单的 Java 对象，实际就是普通 JavaBeans。

1. 类是公有（public）的
2. 有一个无参的构造方法
3. 所有属性都是公有（public）的
4. 所有属性的类型都是可以序列化的

:::

## 从集合中读取数据

最简单的读取数据的方式，就是在代码中直接创建一个 Java 集合，然后调用执行环境的 `fromCollection()` 方法进行读取。这相当于将数据临时存储到内存中，形成特殊的数据结构后，作为数据源使用，一般用于 **测试**。

```java
public static void main(String[] args) throws Exception {
    StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
    List<Integer> data = Arrays.asList(1, 22, 3);
    DataStreamSource<Integer> source = env.fromCollection(data);
    source.print();
    env.execute();
}
```

另一个常用的是 `fromElements()`

```java
public static void main(String[] args) throws Exception {
    StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
    DataStreamSource<Integer> source = env.fromElements(1, 2, 3);
    source.print();
    env.execute();
}
```

## 从文件读取数据

真正的实际应用中，自然不会直接将数据写在代码中。通常情况下，我们会从存储介质中获取数据，一个比较常见的方式就是读取日志文件。这也是批处理中最常见的读取方式。

读取文件，需要添加文件连接器依赖:

```xml
 <dependency>
    <groupId>org.apache.flink</groupId>
    <artifactId>flink-connector-files</artifactId>
    <version>${flink.version}</version>
</dependency>
```

```java
public static void main(String[] args) throws Exception {
    StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
    FileSource<String> fileSource = FileSource.forRecordStreamFormat(new TextLineInputFormat(), new Path("input/word.txt")).build();
    env.fromSource(fileSource, WatermarkStrategy.noWatermarks(), "file")
            .print();
    env.execute();
}
```

## 从 Socket 读取数据

不论从集合还是文件，我们读取的其实都是有界数据。在流处理的场景中，数据往往是无界的。

我们之前用到的读取 socket 文本流，就是流处理场景。但是这种方式由于吞吐量小、稳定性较差，一般也是用于 **测试**。

```java
DataStream<String> stream = env.socketTextStream("localhost", 8080);
```

## 从 Kafka 读取数据

Flink 官方提供了连接工具 `flink-connector-kafka`，直接帮我们实现了一个消费者 `FlinkKafkaConsumer`，它就是用来读取 Kafka 数据的 `SourceFunction`。

所以想要以 Kafka 作为数据源获取数据，我们只需要引入 Kafka 连接器的依赖。Flink 官方提供的是一个通用的 Kafka 连接器，它会自动跟踪最新版本的 Kafka 客户端。目前最新版本只支持 0.10.0 版本以上的 Kafka。这里我们需要导入的依赖如下:

```xml
<dependency>
    <groupId>org.apache.flink</groupId>
    <artifactId>flink-connector-kafka</artifactId>
    <version>${flink.version}</version>
</dependency>

```

## 从数据生成器读取数据

Flink 从 1.11 开始提供了一个内置的 DataGen 连接器，主要是用于生成一些随机数，用于在没有数据源的时候，进行流任务的测试以及性能测试等。

1.17 提供了新的 Source 写法，需要导入依赖：

```xml
<dependency>
    <groupId>org.apache.flink</groupId>
    <artifactId>flink-connector-datagen</artifactId>
    <version>${flink.version}</version>
</dependency>
```

## Flink 支持的数据类型

Flink 使用“类型信息”（TypeInformation）来统一表示数据类型。TypeInformation 类是 Flink 中所有类型描述符的基类。它涵盖了类型的一些基本属性，并为每个数据类型生成特定的序列化器、反序列化器和比较器。

Flink 在内部，Flink 对支持不同的类型进行了划分，这些类型可以在 Types 工具类中找到：

- 基本类型: 所有 Java 基本类型及其包装类，再加上 Void、String、Date、BigDecimal 和 BigInteger。
- 数组类型: 包括基本类型数组（PRIMITIVE_ARRAY）和对象数组（OBJECT_ARRAY）。
- 复合数据类型:Java 元组类型（TUPLE）、Scala 样例类及 Scala 元组、行类型（ROW）、POJO
- 辅助类型: Option、Either、List、Map 等
- 泛型类型（GENERIC）: Flink 支持所有的 Java 类和 Scala 类。不过如果没有按照上面 POJO 类型的要求来定义，就会被 Flink 当作泛型类来处理。Flink 会把泛型类型当作黑盒，无法获取它们内部的属性；它们也不是由 Flink 本身序列化的，而是由 Kryo 序列化的。

Flink 还具有一个类型提取系统，可以分析函数的输入和返回类型，自动获取类型信息，从而获得对应的序列化器和反序列化器。但是，由于 Java 中泛型擦除的存在，在某些特殊情况下（比如 Lambda 表达式中），自动提取的信息是不够精细的——只告诉 Flink 当前的元素由“船头、船身、船尾”构成，根本无法重建出“大船”的模样；这时就需要显式地提供类型信息，才能使应用程序正常工作或提高其性能。

为了解决这类问题，Java API 提供了专门的“类型提示”（type hints）

## 附录

### WaterSensor

```java
public class WaterSensor {
    public String id;   // 水位传感器类型
    public Long ts; // 传感器记录时间戳
    public Integer vc;  // 水位记录

    public WaterSensor() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Long getTs() {
        return ts;
    }

    public void setTs(Long ts) {
        this.ts = ts;
    }

    public Integer getVc() {
        return vc;
    }

    public void setVc(Integer vc) {
        this.vc = vc;
    }

    @Override
    public String toString() {
        return "WaterSensor{" +
                "id='" + id + '\'' +
                ", ts=" + ts +
                ", vc=" + vc +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        WaterSensor that = (WaterSensor) o;
        return Objects.equals(getId(), that.getId()) && Objects.equals(getTs(), that.getTs()) && Objects.equals(getVc(), that.getVc());
    }

    @Override
    public int hashCode() {
        return Objects.hash(getId(), getTs(), getVc());
    }
}
```
