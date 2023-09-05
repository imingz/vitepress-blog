---
tags: [golang, error]
---

# Error vs Exception

## 摘要

错误处理是任何编程语言中都必不可少的一部分。在 Go 语言中，错误处理采用一种不同的方式，没有像其他语言（如 Java 或 Python）中的异常机制。

本文将讲解 "Error" 和 "Exception" 的差异，并介绍 Go 语言中的错误处理机制。

## Error Exception 的差异

### 语义差异

- Error（错误）：在错误处理中，错误被视为一种正常的程序控制流。它是一种表示操作失败或异常条件的值。在 Go 语言中，错误通常是通过函数的返回值来表示的，例如，一个函数可能返回一个结果和一个错误值，以指示操作是否成功。
- Exception（异常）：异常是一种表示程序中不正常情况的事件，如崩溃、错误或其他意外情况。异常通常会中断当前的程序执行流程，并在异常处理机制中寻找匹配的处理器。在其他编程语言（如 Java、Python）中，异常通常使用 try-catch 语句来捕获和处理。

### 控制流

- Error：错误是一种预期的控制流。在 Go 语言中，开发者需要显式检查和处理错误，以确保错误不会被忽略。这种显式错误处理的方式可以使代码更加可靠和可预测。
- Exception：异常会中断当前的程序执行流程，并在异常处理机制中寻找匹配的处理器。异常处理器可以位于当前执行路径之外，导致程序的控制流转移到异常处理代码块。

### 延迟成本

- Error：由于错误处理是通过返回错误值的方式实现的，它通常具有较低的延迟成本。错误值的传递和处理是在正常的控制流中进行的，而不需要额外的异常处理器的介入。
- Exception：异常处理机制通常具有较高的延迟成本。当异常被抛出时，程序需要搜索异常处理器并进行栈展开，这可能导致性能上的开销。

## Go 语言中的错误处理机制

Go 语言采用了错误处理而不是异常处理的方式，以提供更可靠和可控的错误管理机制。

### "Errors are values" - Rob Pike[^1]

[^1]: [Errors are values](https://go.dev/blog/errors-are-values)

在 Go 语言中，错误被视为值，而不是异常。这意味着在函数中，我们可以通过返回错误值来指示发生了错误。

### 错误类型

在 Go 语言中，错误类型是一个接口类型 `error`。`error` 接口定义了一个 `Error()` 方法，用于返回错误的描述信息。通常，自定义的错误类型会实现 `error` 接口。

```go
// The error built-in interface type is the conventional interface for
// representing an error condition, with the nil value representing no error.
type error interface {
	Error() string
}
```

例如常用的 `errors.New()` 的底层实现 `errorString`

```go
// New returns an error that formats as the given text.
// Each call to New returns a distinct error value even if the text is identical.
func New(text string) error {
	return &errorString{text}
}

// errorString is a trivial implementation of error.
type errorString struct {
	s string
}

func (e *errorString) Error() string {
	return e.s
}
```

### 错误值的返回

- 一个简单的约定: `error` 为最后一个返回值。如果操作成功，则错误值为 nil，否则为一个非 nil 的错误值。
- 如果一个函数返回了 `(value, error)`，你不能对这个 `value` 做任何假设，必须先判定 `error`。唯一可以忽略 `error` 的是，如果你连 `value` 也不关心。

### 处理错误

[Error handling](./2-Error%20handling.md)

### panic

对于真正意外的情况，那些表示不可恢复的程序错误，例如索引越界、不可恢复的环境问题、栈溢出，我们使用 `panic`。这是真正异常的情况。它提供了一种在程序遇到无法恢复的错误时中断程序执行的方式。

- Panic 是一种表示程序中发生严重错误的机制。当程序遇到无法继续执行的错误时，可以使用 `panic` 关键字触发 `panic。`
- Panic 导致程序立即停止执行当前函数的剩余代码，并开始执行已注册的延迟函数（`defer`）。延迟函数的执行顺序与注册顺序相反。
- Panic 会一直向上返回调用栈，直到遇到恢复（`recover`）或程序终止。如果没有恢复机制，程序将终止并输出 `panic` 信息。

#### panic 最佳实践

- Panic 可以与错误处理机制结合使用，例如，在错误处理过程中触发 `panic` 来中断执行并进行必要的清理操作。
- 仅在出现无法恢复的错误时使用 `panic`，而不是作为常规错误处理机制的替代方案。在大多数情况下，应该使用错误处理机制来处理可预见的错误。
- 在 `panic` 之前，尽可能地执行必要的清理操作，以避免资源泄漏。
- 使用 `defer` 注册延迟函数，以确保在发生 `panic` 时执行必要的清理和恢复操作。
- 在程序的顶层或主要入口点处使用 `recover`，以避免未处理的 `panic` 导致程序终止。
