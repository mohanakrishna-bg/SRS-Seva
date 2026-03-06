const { exec } = require('child_process');
const fs = require('fs');

exec('npm install tailwindcss@3.4.17 postcss@8.4.38 autoprefixer@10.4.19 -D --save-exact', (error, stdout, stderr) => {
    console.log(`ERR: ${error}`);
    console.log(`OUT: ${stdout}`);
    console.log(`STDERR: ${stderr}`);
    fs.writeFileSync('install_v3_log.txt', `ERR: ${error}\nOUT: ${stdout}\nSTDERR: ${stderr}`);
    console.log('Done writing log');
});
