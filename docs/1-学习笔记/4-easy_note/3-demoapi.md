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
