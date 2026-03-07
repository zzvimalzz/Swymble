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
    
    // Fix SWYMBLE_DATA references
    content = content.replace(/SWYMBLE_DATA\.services/g, 'SWYMBLE_DATA.whatIDo');
    content = content.replace(/SWYMBLE_DATA\.work/g, 'SWYMBLE_DATA.projects');
    
    // Fix MobileServices props
    content = content.replace(/\{ services \}: \{ whatIDo: SwymbleWhatIDo\[\] \}/g, '{ whatIDo }: { whatIDo: SwymbleWhatIDo[] }');
    content = content.replace(/services\.map\(/g, 'whatIDo.map(');
    content = content.replace(/<MobileServices services=\{/g, '<MobileServices whatIDo={');
    
    // Desktop Home & Projects
    content = content.replace(/SwymbleWork/g, 'SwymbleProject');
    content = content.replace(/SwymbleService/g, 'SwymbleWhatIDo');
    
    if (content !== orig) {
        fs.writeFileSync(filepath, content, 'utf8');
        console.log('Fixed: ' + filepath);
    }
});
