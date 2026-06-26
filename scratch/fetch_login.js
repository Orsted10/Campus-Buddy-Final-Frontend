const https = require('https');
https.get('https://student.culko.in/Login.aspx', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const scripts = data.match(/<script[^>]+src="([^"]+)"/g);
    console.log("Scripts found:", scripts);
  });
});
