// import { addTabStop } from "../handler/attributeEdit";

const code = `
    <div>
    <h1>Title</h1>
    <p>Lorem ipsum dolor sit amet.</p>
    </div>
`

function addTabStop(text) {
    if(!hasJSXCode(text)) return;
    const regex = /<(\w+)((?:\s+\w+(?:\s*=\s*(?:".*?"|'.*?'|[\^'">\s]+))?)+\s*|\s*)>/g;
    const modifiedCode = text.replace(regex, (match, tagName, attributes) => {
        const attributeString = ' $1=$2';
        return `<${tagName}${attributes}${attributeString}>`;
    });
    return modifiedCode;
}

function hasJSXCode(code) {
    const regex = /<([a-zA-Z][\w.-]*)\b/g;
    return regex.test(code);
}

console.log(addTabStop(code));