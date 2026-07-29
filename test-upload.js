// 临时测试脚本：上传一个测试文件到媒体库
const fs = require('fs');
const http = require('http');

async function main() {
  // 1. 登录获取 token
  const loginBody = JSON.stringify({ username: 'admin', password: 'admin123' });
  const token = await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost', port: 3000, path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginBody) }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data).data.token); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(loginBody);
    req.end();
  });
  console.log('Token acquired:', token.substring(0, 30) + '...');

  // 2. 构造 multipart/form-data 上传 test.png
  const fileBytes = fs.readFileSync('e:\\code\\blog\\test.png');
  const boundary = '----TestBoundary' + Date.now();
  const parts = [];

  // storage field
  parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="storage"\r\n\r\nminio\r\n`));
  // file field
  parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.png"\r\nContent-Type: image/png\r\n\r\n`));
  parts.push(fileBytes);
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

  const body = Buffer.concat(parts);

  const uploadResp = await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost', port: 3000, path: '/api/v1/media',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        console.log('Upload status:', res.statusCode);
        resolve(data);
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
  console.log('Upload response:', uploadResp);

  // 3. 列出媒体库
  const listResp = await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost', port: 3000, path: '/api/v1/media?page=1&pageSize=10',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.end();
  });
  console.log('Media list:', listResp);
}

main().catch(err => { console.error('Error:', err.message); process.exit(1); });
