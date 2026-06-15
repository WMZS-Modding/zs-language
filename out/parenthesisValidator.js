"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZSParenthesisValidator = void 0;
const vscode = __importStar(require("vscode"));
class ZSParenthesisValidator {
    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('zs-parenthesis');
    }
    updateDiagnostics(document) {
        if (document.languageId !== 'zs') {
            return;
        }
        const diagnostics = [];
        const text = document.getText();
        const lines = text.split('\n');
        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            const lineDiagnostics = this.validateLine(line, lineIndex, document);
            diagnostics.push(...lineDiagnostics);
        }
        this.diagnosticCollection.set(document.uri, diagnostics);
    }
    validateLine(line, lineIndex, document) {
        const diagnostics = [];
        const trimmed = line.trim();
        if (trimmed.startsWith('-/')) {
            return [];
        }
        if (trimmed.startsWith('*/-') && trimmed.endsWith('/-*')) {
            return [];
        }
        let inCollection = false;
        let inBlockComment = false;
        let collectionStart = -1;
        let blockCommentStart = -1;
        const maskedLine = line.split('');
        for (let i = 0; i < line.length; i++) {
            if (!inBlockComment && line[i] === '*' && line[i + 1] === '/' && line[i + 2] === '-') {
                inBlockComment = true;
                blockCommentStart = i;
                i += 2;
                continue;
            }
            if (inBlockComment && line[i] === '/' && line[i + 1] === '-' && line[i + 2] === '*') {
                inBlockComment = false;
                for (let k = blockCommentStart; k <= i + 2; k++) {
                    maskedLine[k] = ' ';
                }
                i += 2;
                continue;
            }
            if (inBlockComment) {
                maskedLine[i] = ' ';
            }
        }
        const commentIndex = line.indexOf('-/');
        if (commentIndex !== -1) {
            for (let i = commentIndex; i < line.length; i++) {
                maskedLine[i] = ' ';
            }
        }
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (!inCollection && (char === '[' || char === '{')) {
                const closeBracket = char === '[' ? ']' : '}';
                let depth = 0;
                let endIndex = -1;
                for (let j = i + 1; j < line.length; j++) {
                    if (line[j] === char)
                        depth++;
                    if (line[j] === closeBracket) {
                        if (depth === 0) {
                            endIndex = j;
                            break;
                        }
                        else {
                            depth--;
                        }
                    }
                }
                if (endIndex !== -1) {
                    const content = line.substring(i + 1, endIndex);
                    const hasComma = content.includes(',');
                    const hasColon = content.includes(':');
                    const hasQuote = content.includes('"') || content.includes('\'') || content.includes('‘') || content.includes('’') || content.includes('“') || content.includes('”');
                    if (hasComma || hasColon || hasQuote) {
                        inCollection = true;
                        collectionStart = i;
                        for (let k = i + 1; k < endIndex; k++) {
                            maskedLine[k] = ' ';
                        }
                        i = endIndex;
                        inCollection = false;
                        continue;
                    }
                }
            }
        }
        const maskedLineStr = maskedLine.join('');
        const stack = [];
        const pairs = [];
        let inString = false;
        let stringChar = '';
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const maskedChar = maskedLineStr[i];
            if (maskedChar === ' ') {
                continue;
            }
            if (!inString && (char === '"' || char === '"' || char === "'" || char === '’')) {
                inString = true;
                stringChar = char;
                continue;
            }
            if (inString && char === stringChar) {
                inString = false;
                continue;
            }
            if (inString)
                continue;
            if (char === '(' || char === '[' || char === '{') {
                stack.push({ char, pos: i });
            }
            else if (char === ')' || char === ']' || char === '}') {
                if (stack.length === 0)
                    continue;
                const open = stack.pop();
                let expectedClose = '';
                if (open.char === '(')
                    expectedClose = ')';
                else if (open.char === '[')
                    expectedClose = ']';
                else if (open.char === '{')
                    expectedClose = '}';
                if (char === expectedClose) {
                    pairs.push({
                        open: open.char,
                        close: char,
                        openPos: open.pos,
                        closePos: i,
                        type: open.char === '(' ? 'paren' : open.char === '[' ? 'bracket' : 'brace'
                    });
                }
                else {
                    const range = new vscode.Range(new vscode.Position(lineIndex, i), new vscode.Position(lineIndex, i + 1));
                    diagnostics.push(this.createDiagnostic(range, `Expected ${expectedClose} but found ${char}`, document));
                }
            }
        }
        if (stack.length > 0) {
            for (const open of stack) {
                const range = new vscode.Range(new vscode.Position(lineIndex, open.pos), new vscode.Position(lineIndex, open.pos + 1));
                diagnostics.push(this.createDiagnostic(range, `Unclosed bracket: ${open.char}`, document));
            }
        }
        for (const pair of pairs) {
            const content = line.substring(pair.openPos + 1, pair.closePos).trim();
            if (pair.type === 'brace') {
                const content = line.substring(pair.openPos + 1, pair.closePos).trim();
                if (content === '') {
                    const range = new vscode.Range(new vscode.Position(lineIndex, pair.openPos), new vscode.Position(lineIndex, pair.closePos + 1));
                    diagnostics.push(this.createDiagnostic(range, '{ } cannot be empty - must contain [ ] for math grouping', document));
                }
                else {
                    const hasBracket = content.includes('[') || content.includes(']');
                    if (!hasBracket) {
                        const range = new vscode.Range(new vscode.Position(lineIndex, pair.openPos), new vscode.Position(lineIndex, pair.openPos + 1));
                        diagnostics.push(this.createDiagnostic(range, '{ } must contain [ ] for math grouping', document));
                    }
                    else {
                        let firstBracketPos = -1;
                        let firstParenPos = -1;
                        for (let i = pair.openPos + 1; i < pair.closePos; i++) {
                            if (line[i] === '[' && firstBracketPos === -1) {
                                firstBracketPos = i;
                            }
                            if (line[i] === '(' && firstParenPos === -1) {
                                firstParenPos = i;
                            }
                        }
                        if (firstBracketPos !== -1 && firstParenPos !== -1 && firstParenPos < firstBracketPos) {
                            const range = new vscode.Range(new vscode.Position(lineIndex, pair.openPos), new vscode.Position(lineIndex, pair.openPos + 1));
                            diagnostics.push(this.createDiagnostic(range, '[ ] must come before ( ) inside { }', document));
                        }
                    }
                }
            }
            else if (pair.type === 'bracket') {
                const hasParen = content.includes('(') || content.includes(')');
                if (!hasParen && content !== '') {
                    const range = new vscode.Range(new vscode.Position(lineIndex, pair.openPos), new vscode.Position(lineIndex, pair.openPos + 1));
                    diagnostics.push(this.createDiagnostic(range, '[ ] must contain ( ) inside them for math expressions', document));
                }
            }
            else if (pair.type === 'paren') {
                if (content === '') {
                    const range = new vscode.Range(new vscode.Position(lineIndex, pair.openPos), new vscode.Position(lineIndex, pair.closePos + 1));
                    diagnostics.push(this.createDiagnostic(range, '( ) must contain content (numbers, variables, or expressions)', document));
                }
            }
        }
        pairs.sort((a, b) => a.openPos - b.openPos);
        for (let i = 0; i < pairs.length; i++) {
            for (let j = i + 1; j < pairs.length; j++) {
                if (pairs[i].openPos < pairs[j].openPos && pairs[i].closePos > pairs[j].closePos) {
                    const outerType = pairs[i].type;
                    const innerType = pairs[j].type;
                    const order = { 'paren': 1, 'bracket': 2, 'brace': 3 };
                    if (outerType === innerType) {
                        const range = new vscode.Range(new vscode.Position(lineIndex, pairs[j].openPos), new vscode.Position(lineIndex, pairs[j].openPos + 1));
                        diagnostics.push(this.createDiagnostic(range, `Cannot nest same bracket type: ${pairs[j].open}`, document));
                    }
                    else if (order[innerType] > order[outerType]) {
                        const range = new vscode.Range(new vscode.Position(lineIndex, pairs[j].openPos), new vscode.Position(lineIndex, pairs[j].openPos + 1));
                        diagnostics.push(this.createDiagnostic(range, `Cannot put ${pairs[j].open} inside ${pairs[i].open}`, document));
                    }
                }
            }
        }
        return diagnostics;
    }
    createDiagnostic(range, message, document) {
        const diagnostic = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error);
        diagnostic.source = 'ZS Parenthesis';
        return diagnostic;
    }
    activate(context) {
        const changeDisposable = vscode.workspace.onDidChangeTextDocument((event) => {
            if (event.document.languageId === 'zs') {
                this.updateDiagnostics(event.document);
            }
        });
        const openDisposable = vscode.workspace.onDidOpenTextDocument((document) => {
            if (document.languageId === 'zs') {
                this.updateDiagnostics(document);
            }
        });
        vscode.workspace.textDocuments.forEach(document => {
            if (document.languageId === 'zs') {
                this.updateDiagnostics(document);
            }
        });
        context.subscriptions.push(changeDisposable, openDisposable, this.diagnosticCollection);
    }
    dispose() {
        this.diagnosticCollection.dispose();
    }
}
exports.ZSParenthesisValidator = ZSParenthesisValidator;
//# sourceMappingURL=parenthesisValidator.js.map