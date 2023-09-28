# demouser 开发

## idl 定义

1. 定义注解使用 [`thrift-gen—validator`](https://github.com/cloudwego/thrift-gen-validator) 插件进行结构体校验。
2. 预先在 thrift IDL 中定义错误码。这样 Kitex 会生成对应的代码，再直接使用即可。
    1. 再定义一些错误类型与函数，对业务异常进行转换，让错误处理一致化。

### idl 生成

```bash
# root dir
kitex_gen_user:
    kitex --thrift-plugin validator -module demo/easy_note idl/user.thrift
    go mod tidy

# user dir
kitex_gen_server:
    kitex --thrift-plugin validator -module demo/easy_note -service demouser -use demo/easy_note/kitex_gen ../../idl/user.thrift
    go mod tidy
```

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

## 准备工作

### dal 准备工作

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

### service 准备工作

以 `service/create_user.go` 举例

::: code-group

```go [user/service/create_user.go]
type CreateUserService struct {
    ctx context.Context
}

// NewCreateUserService new CreateUserService
func NewCreateUserService(ctx context.Context) *CreateUserService {
    return &CreateUserService{ctx: ctx}
}
```

:::

## 开发 Handler

### create user

#### handler

业务流程梳理

1. `validate`
2. `create`

`validate` 由于借助了插件，可以直接完成。

主要考虑 `create`，很显然可以借助 `service` 层的 `CreateUser(req)`

::: code-group

```go [validate]
// CreateUser implements the UserServiceImpl interface.
func (s *UserServiceImpl) CreateUser(ctx context.Context, req *demouser.CreateUserRequest) (resp *demouser.CreateUserResponse, err error) {
    // TODO: Your code here... // [!code --]
    resp = new(demouser.CreateUserResponse) // [!code ++:7]

    // 1. validate
    if err = req.IsValid(); err != nil {
        resp.BaseResp = pack.BuildBaseResp(errno.ParamErr)
        return resp, nil
    }
    return
}
```

```go [create]
// CreateUser implements the UserServiceImpl interface.
func (s *UserServiceImpl) CreateUser(ctx context.Context, req *demouser.CreateUserRequest) (resp *demouser.CreateUserResponse, err error) {
    resp = new(demouser.CreateUserResponse)

    // 1. validate
    if err = req.IsValid(); err != nil {
        resp.BaseResp = pack.BuildBaseResp(errno.ParamErr)
        return resp, nil
    }

    // 2. create  // [!code ++:9]
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

```go [user/handler.go]
// CreateUser implements the UserServiceImpl interface.
func (s *UserServiceImpl) CreateUser(ctx context.Context, req *demouser.CreateUserRequest) (resp *demouser.CreateUserResponse, err error) {
    resp = new(demouser.CreateUserResponse)

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
}
```

:::

#### Service

1. Query user to check user exists or not(use `db.QueryUser`)
2. Encrypt password
3. Create user(use `db.CreateUser`)

::: code-group

```go [check user]
// Query user to check user exists or not
users, err := db.QueryUser(s.ctx, req.Username)
if err != nil {
    return err
}
if len(users) != 0 {
    return errno.UserAlreadyExistErr
}
```

```go [Encrypt password]
// Encrypt password
hasher := md5.New()
if _, err = io.WriteString(hasher, req.Password); err != nil {
    return err
}
password := fmt.Sprintf("%x", hasher.Sum(nil))
```

```go [Create user]
// Create user
return db.CreateUser(s.ctx, []*db.User{{
    Username: req.Username,
    Password: password,
}})
```

```go [user/service/create_user]
// CreateUser create user info.
func (s *CreateUserService) CreateUser(req *demouser.CreateUserRequest) error {
    // Query user to check user exists or not
    users, err := db.QueryUser(s.ctx, req.Username)
    if err != nil {
        return err
    }
    if len(users) != 0 {
        return errno.UserAlreadyExistErr
    }

    // Encrypt password
    hasher := md5.New()
    if _, err = io.WriteString(hasher, req.Password); err != nil {
        return err
    }
    password := fmt.Sprintf("%x", hasher.Sum(nil))

    // Create user
    return db.CreateUser(s.ctx, []*db.User{{
        Username: req.Username,
        Password: password,
    }})
}
```

:::

#### dal

1. `QueryUser`
2. `CreateUser`

::: code-group

```go [user/dal/db/user.go]
// QueryUser query list of user info
func QueryUser(ctx context.Context, userName string) ([]*User, error) {
    var users []*User
    if err := DB.WithContext(ctx).Where("username = ?", userName).Find(&users).Error; err != nil {
        return nil, err
    }
    return users, nil
}
```

```go [user/dal/db/user.go]
// CreateUser create user info
func CreateUser(ctx context.Context, users []*User) error {
    return DB.WithContext(ctx).Create(users).Error
}
```

:::

### check user

#### handler

use `service` `CheckUser()`

::: code-group

```txt [idl/user.thrift]
struct CheckUserRequest {
    1: string username (vt.min_size = "1"),
    2: string password (vt.min_size = "1"),
}

struct CheckUserResponse {
    1: i64 user_id,
    2: BaseResp base_resp,
}

service UserService {
    CheckUserResponse CheckUser(1: CheckUserRequest req),
}
```

```Makefile [user/Makefile]
kitex_gen_server:
    kitex --thrift-plugin validator -module demo/easy_note/user -service demouser -use demo/easy_note/kitex_gen ../../idl/user.thrift
    go mod tidy
```

```go [user/handler.go]
// CheckUser implements the UserServiceImpl interface.
func (s *UserServiceImpl) CheckUser(ctx context.Context, req *demouser.CheckUserRequest) (resp *demouser.CheckUserResponse, err error) {
    resp = new(demouser.CheckUserResponse)

    if err = req.IsValid(); err != nil {
        resp.BaseResp = pack.BuildBaseResp(errno.ParamErr)
        return resp, nil
    }

    uid, err := service.NewCheckUserService(ctx).CheckUser(req)
    if err != nil {
        resp.BaseResp = pack.BuildBaseResp(err)
        return resp, nil
    }

    resp.UserId = uid
    resp.BaseResp = pack.BuildBaseResp(errno.Success)
    return resp, nil
}
```

:::

#### service

::: code-group

```go [user/service/check_user.go]
// CheckUser 根据用户名和密码验证用户是否存在
func (s *CheckUserService) CheckUser(req *demouser.CheckUserRequest) (int64, error) {
    // 对密码进行MD5加密
    hasher := md5.New()
    if _, err := io.WriteString(hasher, req.Password); err != nil {
        return 0, err
    }
    pwd := fmt.Sprintf("%x", hasher.Sum(nil))

    // 查询用户
    users, err := db.QueryUser(s.ctx, req.Username)
    if err != nil {
        return 0, err
    }
    if len(users) == 0 {
        return 0, errno.UserNotExistErr
    }
    u := users[0]
    if pwd != u.Password {
        return 0, errno.PasswordErr
    }
    return int64(u.ID), nil
}
```

:::

## etcd 服务注册

::: code-group

```go [pkg/consts/consts.go]
package consts

const (
    ETCDAddress     = "127.0.0.1:2379"
)
```

```yaml [docker-compose]
version: "3.7"
services:
    # MySQL
    # ...
    # ETCD
    Etcd:
        image: "bitnami/etcd:latest"
        environment:
            - ALLOW_NONE_AUTHENTICATION=yes
            - ETCD_ADVERTISE_CLIENT_URLS=http://etcd:2379
        ports:
            - "2379:2379"
            - "2380:2380"
```

```go [main.go]
func main() {
    Init()

    addr, err := net.ResolveTCPAddr(consts.Network, consts.UserServiceAddr)
    if err != nil {
        panic(err)
    }

    r, err := etcd.NewEtcdRegistry([]string{consts.ETCDAddress})    // [!code ++:4]
    if err != nil {
        panic(err)
    }

    svr := demouser.NewServer(new(UserServiceImpl),
        server.WithServiceAddr(addr),
        server.WithRegistry(r), // [!code ++:2]
        server.WithServerBasicInfo(&rpcinfo.EndpointBasicInfo{ServiceName: consts.UserServiceName}),
        server.WithLimit(&limit.Option{MaxConnections: 1000, MaxQPS: 100}),
        server.WithMuxTransport(),
    )

    err = svr.Run()

    if err != nil {
        klog.Fatal(err)
    }
}
```

```bash
docker-compose up -d
cd cmd/user && make run
```

:::
