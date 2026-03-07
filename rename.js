const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filepath = path.join(dir, file);
        const stats = fs.statSync(filepath);
        if (stats.isDirectory()) {
            walk(filepath, callback);
        } else if (filepath.endsWith('.ts') || filepath.endsWith('.tsx') || filepath.endsWith('.css')) {
            callback(filepath);
        }
    }
}

walk('src', (filepath) => {
    let content = fs.readFileSync(filepath, 'utf8');
    const orig = content;

    content = content.replace(/SwymbleWork/g, 'SwymbleProject');
    content = content.replace(/SwymbleService/g, 'SwymbleWhatIDo');
    content = content.replace(/SWYMBLE_DATA\.work/g, 'SWYMBLE_DATA.projects');
    content = content.replace(/SWYMBLE_DATA\.services/g, 'SWYMBLE_DATA.whatIDo');
    
    // Also fix local variable names/param destructuring if they exist:
    // e.g. { services }: { services: SwymbleService[] }
    // we should replace strictly in views as well. Let's do that manually if needed.

    if (content !== orig) {
        fs.writeFileSync(filepath, content, 'utf8');
        console.log('Updated: ' + filepath);
    }
});
