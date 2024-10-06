## Wepin Demo

### Description

위핀 지갑 데모 프로젝트.

### Problem

1. 위핀 인스턴스 초기화 과정에서 발생하는 에러

```shell
Access to fetch at 'https://sdk.wepin.io/v1/user/firebase-config' from origin 'https://wepin-demo.vercel.app' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource. If an opaque response serves your needs, set the request's mode to 'no-cors' to fetch the resource with CORS disabled.
```

- CORS 문제 발생
- options 요청에 대한 500 Internal Server Error 발생
- 이로 인해 본 요청에 cors 헤더를 추가할 수 없어서 위핀 인스턴스 초기화에 실패
- vercel로 배포한 origin은 차단을 하는 건가??? (로컬에서는 잘 동작함)

### Solution

- 아직 해결하지 못함
