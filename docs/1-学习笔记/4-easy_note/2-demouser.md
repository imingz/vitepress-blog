# demouser 开发

## idl 定义

1. 定义注解使用 [`thrift-gen—validator`](https://github.com/cloudwego/thrift-gen-validator) 插件进行结构体校验。
2. 预先在 thrift IDL 中定义错误码。这样 Kitex 会生成对应的代码，再直接使用即可。
   1. 再定义一些错误类型与函数，对业务异常进行转换，让错误处理一致化。

## 完善错误码

::: code-group

```go [pkg/errno/errno.go]
package errno

import (
    "demo/easy_note/kitex_gen/demouser"
    "errors"
    "fmt"
)

type ErrNo struct {
    ErrCode int64
    ErrMsg  string
}

func (e ErrNo) Error() string {
    return fmt.Sprintf("err_code=%d, err_msg=%s", e.ErrCode, e.ErrMsg)
}

func NewErrNo(code int64, msg string) ErrNo {
    return ErrNo{
        ErrCode: code,
        ErrMsg:  msg,
    }
}

func (e ErrNo) WithMessage(msg string) ErrNo {
    e.ErrMsg = msg
    return e
}

var (
    Success                = NewErrNo(int64(demouser.ErrCode_SuccessCode), "Success")
    ServiceErr             = NewErrNo(int64(demouser.ErrCode_ServiceErrCode), "Service is unable to start successfully")
    ParamErr               = NewErrNo(int64(demouser.ErrCode_ParamErrCode), "Wrong Parameter has been given")
    UserAlreadyExistErr    = NewErrNo(int64(demouser.ErrCode_UserAlreadyExistErrCode), "User already exists")
    AuthorizationFailedErr = NewErrNo(int64(demouser.ErrCode_AuthorizationFailedErrCode), "Authorization failed")
)

// ConvertErr convert error to Errno
func ConvertErr(err error) ErrNo {
    Err := ErrNo{}
    if errors.As(err, &Err) {
        return Err
    }
    s := ServiceErr
    s.ErrMsg = err.Error()
    return s
}
```

```go [user/pack/resp.go]
package pack

import (
    "demo/easy_note/kitex_gen/demouser"
    "demo/easy_note/pkg/errno"
    "errors"
    "time"
)

// BuildBaseResp build baseResp from error
func BuildBaseResp(err error) *demouser.BaseResp {
    if err == nil {
        return baseResp(errno.Success)
    }

    e := errno.ErrNo{}
    if errors.As(err, &e) {
        return baseResp(e)
    }

    s := errno.ServiceErr.WithMessage(err.Error())
    return baseResp(s)
}

func baseResp(err errno.ErrNo) *demouser.BaseResp {
    return &demouser.BaseResp{StatusCode: err.ErrCode, StatusMessage: err.ErrMsg, ServiceTime: time.Now().Unix()}
}
```

:::

## 改造入口函数

```go
package main

import (
	demouser "demo/easy_note/kitex_gen/demouser/userservice"
	"demo/easy_note/pkg/consts"
	"net"

	"github.com/cloudwego/kitex/pkg/klog"
	"github.com/cloudwego/kitex/pkg/limit"
	"github.com/cloudwego/kitex/server"
	kitexlogrus "github.com/kitex-contrib/obs-opentelemetry/logging/logrus"
)

func Init() {
	klog.SetLogger(kitexlogrus.NewLogger())
	klog.SetLevel(klog.LevelInfo)
}

func main() {
	Init()

	addr, err := net.ResolveTCPAddr(consts.Network, consts.UserServiceAddr)
	if err != nil {
		panic(err)
	}

	svr := demouser.NewServer(new(UserServiceImpl),
		server.WithServiceAddr(addr),
		server.WithLimit(&limit.Option{MaxConnections: 1000, MaxQPS: 100}),
		server.WithMuxTransport(),
	)

	err = svr.Run()

	if err != nil {
		klog.Fatal(err)
	}
}
```

## dal 准备工作

::: code-group

```go [user/dal/init.go]
package dal

// Init init dal
func Init() {
    db.Init()
}

```

```go [user/main.go]
func Init() {
    dal.Init()  // [!code ++]
    klog.SetLogger(kitexlogrus.NewLogger())
    klog.SetLevel(klog.LevelInfo)
}
```

```go [user/dal/db/init.go]
package db

import (
    "demo/easy_note/pkg/consts"
    "time"

    "gorm.io/driver/mysql"
    "gorm.io/gorm"
    "gorm.io/gorm/logger"
    "gorm.io/plugin/opentelemetry/logging/logrus"
)

var DB *gorm.DB

// Init init DB
func Init() {
    var err error
    gormlogrus := logger.New(
        logrus.NewWriter(),
        logger.Config{
            SlowThreshold: time.Millisecond,
            Colorful:      false,
            LogLevel:      logger.Info,
        },
    )
    DB, err = gorm.Open(mysql.Open(consts.MySQLDefaultDSN),
        &gorm.Config{
            PrepareStmt: true,
            Logger:      gormlogrus,
        },
    )
    if err != nil {
        panic(err)
    }
}
```

```go [user/dal/db/init.go]
package db

import (
    "demo/easy_note/pkg/consts"

    "gorm.io/gorm"
)

type User struct {
    gorm.Model
    Username string `json:"username"`
    Password string `json:"password"`
}

func (u *User) TableName() string {
    return consts.UserTableName
}

```

:::

::: code-group

```go [pkg/consts/consts.go]
const (
    Network         = "tcp"
    UserServiceAddr = ":8001"
    MySQLDefaultDSN = "gorm:gorm@tcp(localhost:3306)/gorm?charset=utf8&parseTime=True&loc=Local"
    UserTableName   = "user"
)
```

```go [user/pack/user.go]
package pack

import (
    "demo/easy_note/kitex_gen/demouser"
    "demo/easy_note/user/dal/db"
)

// User pack user info
func User(u *db.User) *demouser.User {
    if u == nil {
        return nil
    }

    return &demouser.User{UserId: int64(u.ID), Username: u.Username, Avatar: "test Avatar"}
}

// Users pack list of user info
func Users(us []*db.User) []*demouser.User {
    users := make([]*demouser.User, 0)
    for _, u := range us {
        if temp := User(u); temp != nil {
            users = append(users, temp)
        }
    }
    return users
}

```

:::

由于需要 mysql 环境，这里使用 `docker-compose`

::: code-group

```yaml [docker-compose.yaml]
version: "3.7"
services:
  # MySQL
  mysql:
    image: mysql:latest
    ports:
      - "3306:3306"
    environment:
      - MYSQL_DATABASE=gorm
      - MYSQL_USER=gorm
      - MYSQL_PASSWORD=gorm
      - MYSQL_RANDOM_ROOT_PASSWORD="yes"
```

```bash [启动]
docker-compose up -d
```

:::

## 开发 Handler

### create_user

#### dandler

业务流程梳理

1. validate
2. create

::: code-group

```go [validate]
// CreateUser implements the UserServiceImpl interface.
func (s *UserServiceImpl) CreateUser(ctx context.Context, req *demouser.CreateUserRequest) (resp *demouser.CreateUserResponse, err error) {
    // TODO: Your code here... // [!code --]
    resp = new(demouser.CreateUserResponse) // [!code ++:8]

    // 1. validate
    if err = req.IsValid(); err != nil {
        resp.BaseResp = pack.BuildBaseResp(errno.ParamErr)
        return resp, nil
    }

    return
}
```

```go [user/handler.go]
// CreateUser implements the UserServiceImpl interface.
func (s *UserServiceImpl) CreateUser(ctx context.Context, req *demouser.CreateUserRequest) (resp *demouser.CreateUserResponse, err error) {
    // TODO: Your code here... // [!code --]
    resp = new(demouser.CreateUserResponse) // [!code ++:17]

    // 1. validate
    if err = req.IsValid(); err != nil {
        resp.BaseResp = pack.BuildBaseResp(errno.ParamErr)
        return resp, nil
    }

    // 2. create
    err = service.NewCreateUserService(ctx).CreateUser(req)
    if err != nil {
        resp.BaseResp = pack.BuildBaseResp(err)
        return resp, nil
    }

    resp.BaseResp = pack.BuildBaseResp(errno.Success)
    return resp, nil
    return  // [!code --]
}
```

:::
