export function addTabStop(text: string, option: number): string | undefined {
    if (!hasJSXCode(text)) return;
    let modifiedCode: string = text;
    const regex = /<(\w+)((?:\s+\w+(?:\s*=\s*(?:"(?:\\.|[^\\"])*"|'(?:\\.|[^\\'])*'|\{(?:\\.|[^\\}]|\n)*\}|[^'">\s]+))?)+\s*|\s*)(\/)?>/g;
    if (option === 1) {
        modifiedCode = text.replace(regex, (match, tagName, attributes, selfClosing) => {
            const attributeString = ' ${1:key}=${2:"value"}';
            const closingSlash = selfClosing ? '/' : '';
            return `<${tagName}${attributes}${attributeString}${closingSlash}>`
        });
    } else if (option === 2) {
        let i = 2;
        modifiedCode = text.replace(regex, (match, tagName, attributes, selfClosing) => {
            const attributeString = ` $\{1:key}=$\{${i}:"value"}`;
            i++;
            const closingSlash = selfClosing ? '/' : '';
            return `<${tagName}${attributes}${attributeString}${closingSlash}>`
        });
    } else if (option === 3) {
        let i = 2;
        modifiedCode = text.replace(regex, (match, tagName, attributes, selfClosing) => {
            const attributeString = ` $\{${i}:key}=$\{1:"value"}`;
            i++;
            const closingSlash = selfClosing ? '/' : '';
            return `<${tagName}${attributes}${attributeString}${closingSlash}>`
        });
    } else {
        let i = 1;
        modifiedCode = text.replace(regex, (match, tagName, attributes, selfClosing) => {
            const attributeString = ` $\{${i}:key}=$\{${i + 1}:"value"}`;
            i += 2;
            const closingSlash = selfClosing ? '/' : '';
            return `<${tagName}${attributes}${attributeString}${closingSlash}>`
        });
    }

    return modifiedCode;
}
export function hasJSXCode(code: string): boolean {
    const regex = /<([a-zA-Z][\w.-]*)\b/g; // 匹配以大写字母开头的标签名称
    return regex.test(code);
}
