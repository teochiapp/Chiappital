const fs = require('fs');
const path = require('path');

function renameJsToJsx(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      renameJsToJsx(fullPath);
    } else if (fullPath.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (/(?:<[A-Z]\w+)|(?:<\w+\s+)|(?:<\w+>)|(?:<\/\w+>)/.test(content) || content.includes('import React') || content.includes('from \'react\'') || content.includes('from "react"')) {
        const newPath = fullPath.substring(0, fullPath.length - 3) + '.jsx';
        fs.renameSync(fullPath, newPath);
        console.log('Renamed: ' + fullPath + ' -> ' + newPath);
      }
    }
  }
}

renameJsToJsx('./src');
