import { marked } from 'marked';
import { minify } from 'terser';
import { glob } from 'glob';
import { parse } from 'yaml'
import fs from 'node:fs';

const files = parse(fs.readFileSync("./bookmarklets/toc.yml", 'utf-8')).map(h => `./bookmarklets/${h.href}`);
const outputDir = "./build";

const result = [];
result.push({
    "toplevel_name": "SPShortcuts"
})
for (const file of files) {
    const markdown = fs.readFileSync(file, 'utf-8');
    const tokens = marked.lexer(markdown);
    const title = tokens.filter(token => token.type === 'heading')[0].text;
    const codeBlock = fs.readFileSync(file.replace(".md", ".js"), 'utf-8');

    try {
        result.push({
            "name": title,
            "url": `javascript:${(await minify(codeBlock)).code}`
        });
    } catch (e) {
        console.log(codeBlock);
        console.error(`Error minifying code block for ${file}: ${e}`);
        continue
    }
}

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}
const minified = JSON.stringify(result);
const output = ["Windows Registry Editor Version 5.00"]
output.push("");
output.push("[HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Microsoft\\Edge]");
output.push(`"ManagedFavorites"=${JSON.stringify(minified)}`);
fs.writeFileSync(`${outputDir}/edge-favorites.reg`, output.join("\n"));
