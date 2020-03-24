# sip-mitm
SIP에 MITM을 가해 다운그레이드 공격을 시도하여 ID와 패스워드를 알아냅니다.

# 사용방법
1. Node.js를 설치합니다.
2. `npm install`로 의존성을 해결합니다.
3. `node downgrade.js` 로 실행합니다.
4. DNS에 독을 타거나 SIP 서버를 변경하여 로컬로 접속할 수 있도록 합니다.
5. 단말기가 접속을 시도하면 ID와 패스워드가 출력됩니다.
