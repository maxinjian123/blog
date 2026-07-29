// MinIO 直接测试脚本
const Minio = require('minio');
const fs = require('fs');

const client = new Minio.Client({
  endPoint: '111.228.9.147',
  port: 9000,
  useSSL: false,
  accessKey: 'admin',
  secretKey: 'admin123'
});

async function test() {
  try {
    console.log('1. Testing bucketExists...');
    const exists = await client.bucketExists('blog');
    console.log('   bucket exists:', exists);

    console.log('2. Testing putObject with buffer...');
    const fileBytes = fs.readFileSync('e:\\code\\blog\\test.png');
    console.log('   file size:', fileBytes.length, 'bytes');
    
    // 尝试不带 metadata
    const result = await client.putObject('blog', 'test-' + Date.now() + '.png', fileBytes, fileBytes.length);
    console.log('   putObject result:', result);

    console.log('3. Testing listObjects...');
    const objects = [];
    const stream = await client.listObjects('blog', '', true);
    for await (const obj of stream) {
      objects.push(obj.name);
      if (objects.length >= 5) break;
    }
    console.log('   objects:', objects);
  } catch (err) {
    console.error('ERROR:', err.message);
    console.error('Code:', err.code);
    console.error('Stack:', err.stack);
  }
}

test();
