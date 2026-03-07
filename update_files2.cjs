const fs = require('fs');
const path = require('path');
function walk(dir, callback) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filepath = path.join(dir, file);
        const stats = fs.statSync(filepath);
        if (stats.isDirectory()) { walk(filepath, callback); }
        else if (filepath.endsWith('.ts') || filepath.endsWith('.tsx')) { callback(filepath); }
    }
}
walk('src', (filepath) => {
    let content = fs.readFileSync(filepath, 'utf8');
    const orig = content;
    content = content.replace(/services:/g, 'whatIDo:');
    content = content.replace(/services \\}/g, 'whatIDo }');
    content = content.replace(/services\\.map/g, 'whatIDo.map');
    content = content.replace(/services\\[]/g, 'whatIDo[]');
    if (content !== orig) {
        fs.writeFileSync(filepath, content, 'utf8');
        console.log('Updated: ' + filepath);
    }
});
