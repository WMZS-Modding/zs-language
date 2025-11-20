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
exports.ZSNounSymbolDiagnosticProvider = exports.ZSDiagnosticProviderWarning = exports.ZSDiagnosticProvider = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ZSDiagnosticProvider {
    constructor(context) {
        this.invalidPatterns = [];
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('zs');
        this.loadInvalidPatternsFromGrammar(context);
        this.loadSuffixExceptions();
    }
    async loadInvalidPatternsFromGrammar(context) {
        try {
            const grammarPath = path.join(context.extensionPath, 'syntaxes', 'zs.tmLanguage.json');
            const grammarContent = await fs.promises.readFile(grammarPath, 'utf8');
            const grammar = JSON.parse(grammarContent);
            this.extractInvalidPatterns(grammar);
        }
        catch (error) {
        }
    }
    extractInvalidPatterns(grammar) {
        const findInvalidPatterns = (obj, path = []) => {
            if (typeof obj === 'object' && obj !== null) {
                if (obj.name && obj.name.includes('invalid.illegal') || obj.name && obj.name.includes('zs.red')) {
                    if (obj.match) {
                        this.invalidPatterns.push(obj.match);
                    }
                    if (obj.patterns) {
                        obj.patterns.forEach((pattern) => findInvalidPatterns(pattern, [...path, 'patterns']));
                    }
                }
                Object.entries(obj).forEach(([key, value]) => {
                    if (typeof value === 'object') {
                        findInvalidPatterns(value, [...path, key]);
                    }
                });
            }
        };
        findInvalidPatterns(grammar);
    }
    loadSuffixExceptions() {
        this.suffixExceptions = new Set([
            'when', 'then', 'prefab', 'unitysystem', 'unityengine', 'union', 'undo', 'redo',
            'light', 'right', 'night', 'fight', 'sight',
            'bright', 'tight', 'eight', 'weight', 'height', 'thought'
        ]);
    }
    shouldFlagAsInvalid(matchedText) {
        const lowerText = matchedText.toLowerCase();
        return !this.suffixExceptions.has(lowerText);
    }
    updateDiagnostics(document) {
        if (document.languageId !== 'zs') {
            return;
        }
        const diagnostics = [];
        const text = document.getText();
        this.detectStraightQuotes(text, /"/g, '“”', diagnostics, document);
        this.detectStraightQuotes(text, /'/g, '‘’', diagnostics, document);
        this.invalidPatterns.forEach(pattern => {
            let regex;
            if (pattern && pattern.exec && pattern.source) {
                regex = new RegExp(pattern.source, 'gi');
            }
            else {
                const cleanPattern = String(pattern).replace(/^\(\?i\)/, '');
                regex = new RegExp(cleanPattern, 'gi');
            }
            let match;
            regex.lastIndex = 0;
            while ((match = regex.exec(text)) !== null) {
                const startPos = document.positionAt(match.index);
                const endPos = document.positionAt(match.index + match[0].length);
                const range = new vscode.Range(startPos, endPos);
                const matchedText = match[0];
                if (!this.shouldFlagAsInvalid(matchedText)) {
                    continue;
                }
                if (this.shouldSkipRange(document, range)) {
                    continue;
                }
                const diagnostic = new vscode.Diagnostic(range, `Invalid ZS syntax: "${match[0]}"`, vscode.DiagnosticSeverity.Error);
                diagnostic.source = 'ZS';
                diagnostics.push(diagnostic);
            }
        });
        this.diagnosticCollection.set(document.uri, diagnostics);
    }
    detectStraightQuotes(text, pattern, expectedQuotes, diagnostics, document) {
        const lines = text.split('\n');
        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            if (line.trim().startsWith('-/')) {
                continue;
            }
            let match;
            pattern.lastIndex = 0;
            while ((match = pattern.exec(line)) !== null) {
                const range = new vscode.Range(new vscode.Position(lineIndex, match.index), new vscode.Position(lineIndex, match.index + 1));
                const diagnostic = new vscode.Diagnostic(range, `Use ${expectedQuotes} instead of "${match[0]}" in ZS code`, vscode.DiagnosticSeverity.Error);
                diagnostic.source = 'ZS Quotes';
                diagnostics.push(diagnostic);
            }
        }
    }
    provideCodeActions(document, range, context) {
        const actions = [];
        context.diagnostics.forEach(diagnostic => {
            if (diagnostic.source === 'ZS Quotes') {
                const action = new vscode.CodeAction('Convert to curly quotes', vscode.CodeActionKind.QuickFix);
                action.diagnostics = [diagnostic];
                action.edit = new vscode.WorkspaceEdit();
                const quoteChar = document.getText(diagnostic.range);
                const replacement = quoteChar === '"' ? '“”' : '‘’';
                action.edit.replace(document.uri, diagnostic.range, replacement);
                actions.push(action);
            }
        });
        return actions;
    }
    shouldSkipRange(document, range) {
        const text = document.getText(range);
        const lineIndex = range.start.line;
        const position = range.start.character;
        const lineText = document.lineAt(lineIndex).text;
        if (this.isInsideMultiLineComment(document, lineIndex, position)) {
            return true;
        }
        if (lineText.includes('-/') && position >= lineText.indexOf('-/')) {
            return true;
        }
        if (this.isInsideSymbol(lineText, position, '<', '>'))
            return true;
        if (this.isInsideSymbol(lineText, position, '(', ')'))
            return true;
        if (this.isInsideSymbol(lineText, position, '‘', '’'))
            return true;
        if (this.isInsideSymbol(lineText, position, '“', '”'))
            return true;
        if (this.isInsideSymbol(lineText, position, '/|', '|\\'))
            return true;
        if (this.isInsideRepeaterBlock(document, lineIndex)) {
            return true;
        }
        return false;
    }
    isInsideRepeaterBlock(document, lineIndex) {
        for (let i = lineIndex; i >= 0; i--) {
            const line = document.lineAt(i).text;
            const trimmedLine = line.trim();
            if ((trimmedLine.startsWith('for ') || trimmedLine.startsWith('while ')) && trimmedLine.includes(':')) {
                const repeaterIndentation = line.length - line.trimStart().length;
                const currentLine = document.lineAt(lineIndex).text;
                const currentIndentation = currentLine.length - currentLine.trimStart().length;
                return currentIndentation > repeaterIndentation;
            }
            const currentLine = document.lineAt(lineIndex).text;
            const currentIndentation = currentLine.length - currentLine.trimStart().length;
            const searchLineIndentation = line.length - line.trimStart().length;
            if (i < lineIndex && searchLineIndentation <= currentIndentation && line.trim() !== '') {
                break;
            }
        }
        return false;
    }
    isInsideMultiLineComment(document, lineIndex, position) {
        const text = document.getText();
        const docPosition = document.offsetAt(new vscode.Position(lineIndex, position));
        let inComment = false;
        let lastIndex = 0;
        while (lastIndex < text.length) {
            const openIndex = text.indexOf('*/-', lastIndex);
            const closeIndex = text.indexOf('/-*', lastIndex);
            if (openIndex === -1 && closeIndex === -1)
                break;
            let nextIndex = -1;
            let isOpen = false;
            if (openIndex !== -1 && closeIndex !== -1) {
                if (openIndex < closeIndex) {
                    nextIndex = openIndex;
                    isOpen = true;
                }
                else {
                    nextIndex = closeIndex;
                    isOpen = false;
                }
            }
            else if (openIndex !== -1) {
                nextIndex = openIndex;
                isOpen = true;
            }
            else {
                nextIndex = closeIndex;
                isOpen = false;
            }
            if (inComment && docPosition < nextIndex) {
                return true;
            }
            if (isOpen) {
                inComment = true;
                lastIndex = openIndex + 3;
            }
            else {
                inComment = false;
                lastIndex = closeIndex + 3;
            }
            if (nextIndex > docPosition)
                break;
        }
        return inComment && docPosition >= lastIndex;
    }
    isInsideSymbol(lineText, position, startSymbol, endSymbol) {
        const startIndex = lineText.indexOf(startSymbol);
        const endIndex = lineText.indexOf(endSymbol, startIndex + startSymbol.length);
        return startIndex !== -1 && endIndex !== -1 && position > startIndex && position < endIndex;
    }
    dispose() {
        this.diagnosticCollection.dispose();
    }
}
exports.ZSDiagnosticProvider = ZSDiagnosticProvider;
class ZSDiagnosticProviderWarning {
    constructor() {
        this.warningPatterns = [];
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('zs');
        this.loadwarningPatterns();
    }
    loadwarningPatterns() {
        this.warningPatterns = [
            /\b(is|are)\b/gi,
        ];
    }
    updateDiagnostics(document) {
        if (document.languageId !== 'zs') {
            return;
        }
        const diagnostics = [];
        for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
            const line = document.lineAt(lineIndex);
            const lineText = line.text;
            this.warningPatterns.forEach(pattern => {
                let match;
                while ((match = pattern.exec(lineText)) !== null) {
                    const startPos = new vscode.Position(lineIndex, match.index);
                    const endPos = new vscode.Position(lineIndex, match.index + match[0].length);
                    const range = new vscode.Range(startPos, endPos);
                    if (this.shouldSkipRange(document, range)) {
                        continue;
                    }
                    const diagnostic = new vscode.Diagnostic(range, `Warning: If you use "${match[0]}", you must be careful. Otherwise, your script is error`, vscode.DiagnosticSeverity.Warning);
                    diagnostic.source = 'ZS Language';
                    diagnostics.push(diagnostic);
                }
            });
        }
        this.diagnosticCollection.set(document.uri, diagnostics);
    }
    shouldSkipRange(document, range) {
        const text = document.getText(range);
        const lineIndex = range.start.line;
        const position = range.start.character;
        const lineText = document.lineAt(lineIndex).text;
        if (this.isInsideMultiLineComment(document, lineIndex, position)) {
            return true;
        }
        if (lineText.includes('-/') && position >= lineText.indexOf('-/')) {
            return true;
        }
        if (this.isInsideSymbol(lineText, position, '<', '>'))
            return true;
        if (this.isInsideSymbol(lineText, position, '(', ')'))
            return true;
        if (this.isInsideSymbol(lineText, position, '‘', '’'))
            return true;
        if (this.isInsideSymbol(lineText, position, '“', '”'))
            return true;
        if (this.isInsideSymbol(lineText, position, '/|', '|\\'))
            return true;
        if (this.isInsideRepeaterBlock(document, lineIndex)) {
            return true;
        }
        return false;
    }
    isInsideRepeaterBlock(document, lineIndex) {
        for (let i = lineIndex; i >= 0; i--) {
            const line = document.lineAt(i).text;
            const trimmedLine = line.trim();
            if ((trimmedLine.startsWith('for ') || trimmedLine.startsWith('while ')) && trimmedLine.includes(':')) {
                const repeaterIndentation = line.length - line.trimStart().length;
                const currentLine = document.lineAt(lineIndex).text;
                const currentIndentation = currentLine.length - currentLine.trimStart().length;
                return currentIndentation > repeaterIndentation;
            }
            const currentLine = document.lineAt(lineIndex).text;
            const currentIndentation = currentLine.length - currentLine.trimStart().length;
            const searchLineIndentation = line.length - line.trimStart().length;
            if (i < lineIndex && searchLineIndentation <= currentIndentation && line.trim() !== '') {
                break;
            }
        }
        return false;
    }
    isInsideMultiLineComment(document, lineIndex, position) {
        const text = document.getText();
        const docPosition = document.offsetAt(new vscode.Position(lineIndex, position));
        let inComment = false;
        let lastIndex = 0;
        while (lastIndex < text.length) {
            const openIndex = text.indexOf('*/-', lastIndex);
            const closeIndex = text.indexOf('/-*', lastIndex);
            if (openIndex === -1 && closeIndex === -1)
                break;
            let nextIndex = -1;
            let isOpen = false;
            if (openIndex !== -1 && closeIndex !== -1) {
                if (openIndex < closeIndex) {
                    nextIndex = openIndex;
                    isOpen = true;
                }
                else {
                    nextIndex = closeIndex;
                    isOpen = false;
                }
            }
            else if (openIndex !== -1) {
                nextIndex = openIndex;
                isOpen = true;
            }
            else {
                nextIndex = closeIndex;
                isOpen = false;
            }
            if (inComment && docPosition < nextIndex) {
                return true;
            }
            if (isOpen) {
                inComment = true;
                lastIndex = openIndex + 3;
            }
            else {
                inComment = false;
                lastIndex = closeIndex + 3;
            }
            if (nextIndex > docPosition)
                break;
        }
        return inComment && docPosition >= lastIndex;
    }
    isInsideSymbol(lineText, position, startSymbol, endSymbol) {
        const startIndex = lineText.indexOf(startSymbol);
        const endIndex = lineText.indexOf(endSymbol, startIndex + startSymbol.length);
        return startIndex !== -1 && endIndex !== -1 && position > startIndex && position < endIndex;
    }
    clearDiagnostics() {
        this.diagnosticCollection.clear();
    }
    dispose() {
        this.diagnosticCollection.dispose();
    }
}
exports.ZSDiagnosticProviderWarning = ZSDiagnosticProviderWarning;
class ZSNounSymbolDiagnosticProvider {
    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('zs-noun-symbols');
    }
    updateDiagnostics(document) {
        if (document.languageId !== 'zs') {
            return;
        }
        const diagnostics = [];
        const text = document.getText();
        this.detectInvalidSymbolsInNouns(text, diagnostics, document);
        this.diagnosticCollection.set(document.uri, diagnostics);
    }
    detectInvalidSymbolsInNouns(text, diagnostics, document) {
        const nounPatterns = [
            { regex: /<[^>]*>/g, symbol: '<>' },
            { regex: /\/\|[^|]*\|\\/g, symbol: '/||\\' }
        ];
        for (const pattern of nounPatterns) {
            let match;
            while ((match = pattern.regex.exec(text)) !== null) {
                const nounContent = match[0];
                if (this.isComparisonOperator(nounContent, match.index, text)) {
                    continue;
                }
                const contentStart = pattern.symbol === '/||\\' ? 2 : 1;
                const contentEnd = nounContent.length - (pattern.symbol === '/||\\' ? 2 : 1);
                for (let i = contentStart; i < contentEnd; i++) {
                    const char = nounContent[i];
                    if (!/[\w]/.test(char)) {
                        const symbolPosition = match.index + i;
                        const startPos = document.positionAt(symbolPosition);
                        const endPos = document.positionAt(symbolPosition + 1);
                        const range = new vscode.Range(startPos, endPos);
                        const diagnostic = new vscode.Diagnostic(range, `Symbol "${char}" not allowed inside ${pattern.symbol} noun symbols`, vscode.DiagnosticSeverity.Error);
                        diagnostic.source = 'ZS Nouns';
                        diagnostics.push(diagnostic);
                    }
                }
            }
        }
    }
    isComparisonOperator(nounContent, position, fullText) {
        if (nounContent === '<' || nounContent === '>' || nounContent === '<=' || nounContent === '>=') {
            return true;
        }
        const before = fullText.substring(Math.max(0, position - 10), position);
        const after = fullText.substring(position + nounContent.length, position + nounContent.length + 10);
        const comparisonBefore = /\b[\w\d]+\s*$/.test(before);
        const comparisonAfter = /^\s*[\w\d]+\b/.test(after);
        return comparisonBefore && comparisonAfter;
    }
    dispose() {
        this.diagnosticCollection.dispose();
    }
}
exports.ZSNounSymbolDiagnosticProvider = ZSNounSymbolDiagnosticProvider;
//# sourceMappingURL=diagnosticProvider.js.map