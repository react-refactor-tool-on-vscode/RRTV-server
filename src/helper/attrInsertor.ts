export function addTabStop(text: string, option: number): string | undefined {
    if (!hasJSXCode(text)) return;
    let modifiedCode: string = text;
    const regex = /<(\w+)((?:\s+\w+(?:\s*=\s*(?:".*?"|'.*?'|[\^'">\s]+))?)+\s*|\s*)>/g;
    if (option === 1) {
        modifiedCode = text.replace(regex, (match, tagName, attributes) => {
            const attributeString = ' $1=$2';
            return `<${tagName}${attributes}${attributeString}>`;
        });
    } else if (option === 2) {
        let i = 2;
        modifiedCode = text.replace(regex, (match, tagName, attributes) => {
            const attributeString = ` $1=$${i}`;
            i++;
            return `<${tagName}${attributes}${attributeString}>`;
        });
    } else if (option === 3) {
        let i = 2;
        modifiedCode = text.replace(regex, (match, tagName, attributes) => {
            const attributeString = ` $${i}=$1`;
            i++;
            return `<${tagName}${attributes}${attributeString}>`;
        });
    } else {
        let i = 1;
        modifiedCode = text.replace(regex, (match, tagName, attributes) => {
            const attributeString = ` $${i}=$${i + 1}`;
            i += 2;
            return `<${tagName}${attributes}${attributeString}>`;
        });
    }

    return modifiedCode;
}
export function hasJSXCode(code: string): boolean {
    const regex = /<([a-zA-Z][\w.-]*)\b/g; // 匹配以大写字母开头的标签名称
    return regex.test(code);
}
