const { exec } = require('child_process');
const fs = require('fs');

exec('npm run dev', { cwd: './frontend' }, (error, stdout, stderr) => {
    fs.writeFileSync('./frontend/crash_log.txt', `ERR: ${error}\nOUT: ${stdout}\nSTDERR: ${stderr}`);
    console.log('Done writing log');
});
