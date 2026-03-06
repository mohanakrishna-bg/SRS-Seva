const fs = require('fs');
try {
    if (fs.existsSync('postcss.config.js')) fs.unlinkSync('postcss.config.js');
    if (fs.existsSync('tailwind.config.js')) fs.unlinkSync('tailwind.config.js');
    console.log('Successfully deleted legacy config files.');
} catch (err) {
    console.error('Error deleting files:', err);
}
