# demoapi

## 新建项目

::: code-group

```bash
cd cmd/api
hz new -module demo/easy_note/api
```

```go [api/main.go]
func Init() {
    rpc.Init()
}

func main() {
    Init()
    h := server.Default(
        server.WithHostPorts(consts.ApiServiceAddr),
    )

    register(h)
    h.Spin()
}
```

```go [api/biz/rpc/init.go]
package rpc

func Init() {
    initUser()
}
```

```go [api/biz/rpc/user.go]
package rpc

import (
    "context"
    "demo/easy_note/kitex_gen/demouser"
    "demo/easy_note/kitex_gen/demouser/userservice"
    "demo/easy_note/pkg/consts"
    "demo/easy_note/pkg/errno"

    "github.com/cloudwego/kitex/client"
    "github.com/cloudwego/kitex/pkg/rpcinfo"
    etcd "github.com/kitex-contrib/registry-etcd"
)

var userClient userservice.Client

func initUser() {
    r, err := etcd.NewEtcdResolver([]string{consts.ETCDAddress})
    if err != nil {
        panic(err)
    }

    c, err := userservice.NewClient(
        consts.UserServiceName,
        client.WithResolver(r),
        client.WithClientBasicInfo(&rpcinfo.EndpointBasicInfo{ServiceName: consts.ApiServiceName}),
        client.WithMuxConnection(1),
    )
    if err != nil {
        panic(err)
    }
    userClient = c
}

// CreateUser create user info
func CreateUser(ctx context.Context, req *demouser.CreateUserRequest) error {
    resp, err := userClient.CreateUser(ctx, req)
    if err != nil {
        return err
    }
    if resp.BaseResp.StatusCode != 0 {
        return errno.NewErrNo(resp.BaseResp.StatusCode, resp.BaseResp.StatusMessage)
    }
    return nil
}

```

:::

## 编写 idl 和 生成

::: code-group

```[idl/api.thrift]
namespace go demoapi

struct BaseResp {
    1: i64 status_code,
    2: string status_message,
    3: i64 service_time,
}

struct User {
    1: i64 user_id,
    2: string username,
    3: string avatar,
}

struct CreateUserRequest {
    1: string username (api.form = "username", api.vd = "len($) > 0"),
    2: string password (api.form = "password", api.vd = "len($) > 0"),
}

struct CreateUserResponse {
    1: BaseResp base_resp,
}

service UserService {
    CreateUserResponse CreateUser(1: CreateUserRequest req) (api.post = "/v1/user/register"),
}
```

```Makefile [Makefile]
hertz_gen_model:
    hz model --idl=idl/api.thrift --mod=demo/easy_note --model_dir=hertz_gen
    go mod tidy
```

```Makefile [api/Makefile]
hertz_new_api:
    hz new --idl=../../idl/api.thrift --service=hello.api -use=demo/easy_note/hertz_gen
    hertz_gen

hertz_update_api:
    hz update --idl=../../idl/api.thrift -use=demo/easy_note/hertz_gen
```

:::

## pack response

::: warning 疑问
为啥不使用 idl 定义的返回，或者说使用 idl 定义的返回作为 data 部分呢
:::

::: code-group

```go [api/biz/pack/SendResponse.go]
package pack

type Response struct {
    Code    int64       `json:"code"`
    Message string      `json:"message"`
    Data    interface{} `json:"data"`
}

// SendResponse pack response
func SendResponse(c *app.RequestContext, err error, data interface{}) {
    Err := errno.ConvertErr(err)
    c.JSON(consts.StatusOK, Response{
        Code:    Err.ErrCode,
        Message: Err.ErrMsg,
        Data:    data,
    })
}
```

:::

## create user

::: code-group

```go [api/biz/handler/demoapi/user_service.go]
// CreateUser .
// @router /v1/user/register [POST]
func CreateUser(ctx context.Context, c *app.RequestContext) {
    var err error
    var req demoapi.CreateUserRequest
    err = c.BindAndValidate(&req)
    if err != nil {
        pack.SendResponse(c, errno.ConvertErr(err), nil)
        return
    }

    err = rpc.CreateUser(context.Background(), &demouser.CreateUserRequest{
        Username: req.Username,
        Password: req.Password,
    })

    if err != nil {
        pack.SendResponse(c, errno.ConvertErr(err), nil)
        return
    }
    pack.SendResponse(c, errno.Success, nil)
}
```

:::
