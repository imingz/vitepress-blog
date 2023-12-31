---
tags: [golang, error]
---

# Error handling[^1]

[^1]: [云原生系列 Go 语言篇-错误处理](https://juejin.cn/post/7201509055713427513)

介绍 Go 中常见的 error 使用方式。

## 用字符串表示简单错误

Go 标准提供了两种方式由字符串创建错误。

第二种是 `errors.New()` 函数。它接收一个 `string` 返回 `error`。在对返回错误实例调用 `Error` 方法时会返回这一字符吕。如果对 `fmt` 里的函数传递错误，它会自动调用 `Error` 方法。

```go
errors.New("hello error")
```

第二种方式是使用 `fmt.Errorf` 函数。这一函数可以使用与 `fmt.Printf` 相同的格式化动词来创建错误。类似 `errors.New`，在对返回错误实例调用 `Error` 方法时会返回该字符串：

```go
fmt.Errorf("hello %s", "error")
```

## 哨兵错误（Sentinel Error）

> Sentinel 这个名字来源于计算机编程中使用一个特定值来表示不可能进行进一步处理的做法。

哨兵是通过预定义的错误值来表示特定的错误条件。在 Go 语言中，常见的做法是将错误值声明为包级别的变量，以便在整个代码库中重复使用。

按照惯例，它们的名称以 `Err` 开头（其中有一个特别的例外 `io.EOF`）。它们应为只读，Go 编译器无法进行这一强制，修改它们的值是一种编程错误。

哨兵错误通常用于表示无法开始或继续处理。

### 哨兵错误的检测

使用 `==` 来对调用函数显式表明会返回哨兵错误的情况进行检测。

这是最不灵活的错误处理策略，当想要提供更多的上下文时，这就出现了一个问题，因为返回一个不同的错误将破坏相等性检查。甚至是一些有意义的 `fmt.Errorf()` 携带一些上下文，也会破坏调用者的 `==` ，调用者将被迫查看 `error.Error()` 方法的输出，以查看它是否与特定的字符串匹配。

::: warning 不依赖检查 `error.Error()` 的输出
不应该依赖检测 `error.Error()` 的输出，`Error()` 方法存在于 `error` 接口主要用于方便程序员使用，但不是程序。这个输出的字符串用于记录日志、输出到 `stdout` 等。
:::

### 哨兵错误的分析

- Sentinel errors 成为你 API 公共部分
  > 如果您的公共函数或方法返回一个特定值的错误，那么该值必须是公共的，当然要有文档记录，这会增加 API 的表面积。  
  > 如果 API 定义了一个返回特定错误的 interface，则该接口的所有实现都将被限制为仅返回该错误，即使它们可以提供更具描述性的错误。  
  > 比如 io.Reader。像 io.Copy 这类函数需要 reader 的实现者比如返回 io.EOF 来告诉调用者没有更多数据了，但这又不是错误。
- Sentinel errors 在两个包之间创建了依赖
  > sentinel errors 最糟糕的问题是它们在两个包之间创建了源代码依赖关系。例如，检查错误是否等于 io.EOF，您的代码必须导入 io 包。这个特定的例子听起来并不那么糟糕，因为它非常常见，但是想象一下，当项目中的许多包导出错误值时，存在耦合，项目中的其他包必须导入这些错误值才能检查特定的错误条件（in the form of an import loop）。

### 哨兵错误的使用建议

尽可能避免 sentinel errors。

我的建议是避免在编写的代码中使用 sentinel errors。在标准库中有一些使用它们的情况，但这不是一个应该模仿的模式。

## Error types

Error type 是实现了 error 接口的自定义类型。例如 MyError 类型记录了文件和行号以展示发生了什么。

```go
type MyErr struct {
    Msg string
    File string
    Line int
}

func (e *MyErr) Error() string {
    return fmt.Sprintf("%s:%d %s", e.File, e.Line, e.Msg)
}
```

因为 MyError 是一个 type，调用者可以使用断言转换成这个类型，来获取更多的上下文信息。

```go
switch err.(type) {
case nil: // do
case: *MyErr: // do
default: // do
}
```

与错误值相比，错误类型的一大改进是它们能够包装底层错误以提供更多上下文。

调用者要使用类型断言和类型 switch，就要让自定义的 error 变为 public。这种模型会导致和调用者产生强耦合，从而导致 API 变得脆弱。

结论是尽量避免使用 error types，虽然错误类型比 sentinel errors 更好，因为它们可以捕获关于出错的更多上下文，但是 error types 共享 error values 许多相同的问题。

因此，我的建议是避免错误类型，或者至少避免将它们作为公共 API 的一部分。

## Opaque errors

不透明错误处理的全部功能–只需返回错误而不假设其内容。

```go
err := foo()
if err != nil {
    // do
}
```

我将这种风格称为不透明错误处理，因为虽然您知道发生了错误，但您没有能力看到错误的内部。作为调用者，关于操作的结果，您所知道的就是它起作用了，或者没有起作用（成功还是失败）。

在少数情况下，这种二分错误处理方法是不够的。例如，与进程外的世界进行交互（如网络活动），需要调用方调查错误的性质，以确定重试该操作是否合理。在这种情况下，我们可以断言错误实现了特定的行为，而不是断言错误是特定的类型或值。
