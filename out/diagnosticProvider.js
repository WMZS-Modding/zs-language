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
exports.ZSQuotesDiagnosticProvider = exports.ZSSpaceDiagnosticProvider = exports.ZSCommaDiagnosticProvider = exports.ZSDiagnosticProviderWarning = exports.ZSDiagnosticProvider = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ZSDiagnosticProvider {
    constructor(context) {
        this.invalidPatterns = [];
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('zs');
        this.loadInvalidPatternsFromGrammar(context);
    }
    async loadInvalidPatternsFromGrammar(context) {
        try {
            const grammarPath = path.join(context.extensionPath, 'syntaxes', 'zs.tmLanguage.json');
            const grammarContent = await fs.promises.readFile(grammarPath, 'utf8');
            const grammar = JSON.parse(grammarContent);
            this.extractInvalidPatterns(grammar);
        }
        catch (error) {
            console.error('Failed to load grammar for diagnostics:', error);
        }
    }
    extractInvalidPatterns(grammar) {
        const findInvalidPatterns = (obj, path = []) => {
            if (typeof obj === 'object' && obj !== null) {
                if (obj.name && obj.name.includes('invalid.illegal')) {
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
        console.log('Found invalid patterns:', this.invalidPatterns);
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
            if (line.includes('-/') || line.includes('*/-') || line.includes('/-*') ||
                line.includes('<') || line.includes('(') || line.includes('/|') ||
                line.includes('>') || line.includes(')') || line.includes('|\\')) {
                continue;
            }
            let match;
            pattern.lastIndex = 0;
            while ((match = pattern.exec(line)) !== null) {
                const range = new vscode.Range(new vscode.Position(lineIndex, match.index), new vscode.Position(lineIndex, match.index + 1));
                if (this.shouldSkipRange(document, range)) {
                    continue;
                }
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
        if (this.isInsideSymbol(lineText, position, '/|', '|\\'))
            return true;
        if (text === '“' || text === '”' || text === '‘' || text === '’')
            return true;
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
        if (this.isInsideSymbol(lineText, position, '/|', '|\\'))
            return true;
        if (text === '“' || text === '”' || text === '‘' || text === '’')
            return true;
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
class ZSCommaDiagnosticProvider {
    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('zs-comma');
    }
    updateDiagnostics(document) {
        if (document.languageId !== 'zs') {
            return;
        }
        const diagnostics = [];
        const text = document.getText();
        this.detectCommasInNouns(text, diagnostics, document);
        this.diagnosticCollection.set(document.uri, diagnostics);
    }
    detectCommasInNouns(text, diagnostics, document) {
        const nounPatterns = [
            { regex: /<[^>]*>/g, symbol: '<>' },
            { regex: /\([^)]*\)/g, symbol: '()' },
            { regex: /\/\|[^|]*\|\\/g, symbol: '/||\\' }
        ];
        for (const pattern of nounPatterns) {
            let match;
            while ((match = pattern.regex.exec(text)) !== null) {
                const nounContent = match[0];
                let commaIndex = -1;
                while ((commaIndex = nounContent.indexOf(',', commaIndex + 1)) !== -1) {
                    const commaPosition = match.index + commaIndex;
                    const startPos = document.positionAt(commaPosition);
                    const endPos = document.positionAt(commaPosition + 1);
                    const range = new vscode.Range(startPos, endPos);
                    const diagnostic = new vscode.Diagnostic(range, `Comma not allowed inside ${pattern.symbol} noun symbols`, vscode.DiagnosticSeverity.Error);
                    diagnostic.source = 'ZS Nouns';
                    diagnostics.push(diagnostic);
                }
            }
        }
    }
    dispose() {
        this.diagnosticCollection.dispose();
    }
}
exports.ZSCommaDiagnosticProvider = ZSCommaDiagnosticProvider;
class ZSSpaceDiagnosticProvider {
    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('zs-space');
    }
    updateDiagnostics(document) {
        if (document.languageId !== 'zs') {
            return;
        }
        const diagnostics = [];
        const text = document.getText();
        this.detectSpacesInNouns(text, diagnostics, document);
        this.diagnosticCollection.set(document.uri, diagnostics);
    }
    detectSpacesInNouns(text, diagnostics, document) {
        const nounPatterns = [
            { regex: /<[^>]*>/g, symbol: '<>' },
            { regex: /\([^)]*\)/g, symbol: '()' },
            { regex: /\/\|[^|]*\|\\/g, symbol: '/||\\' }
        ];
        for (const pattern of nounPatterns) {
            let match;
            while ((match = pattern.regex.exec(text)) !== null) {
                const nounContent = match[0];
                for (let i = 0; i < nounContent.length; i++) {
                    const char = nounContent[i];
                    if (char === ' ') {
                        const spacePosition = match.index + i;
                        const startPos = document.positionAt(spacePosition);
                        const endPos = document.positionAt(spacePosition + 1);
                        const range = new vscode.Range(startPos, endPos);
                        const diagnostic = new vscode.Diagnostic(range, `Spaces/tabs not allowed inside ${pattern.symbol} noun symbols`, vscode.DiagnosticSeverity.Error);
                        diagnostic.source = 'ZS Nouns';
                        diagnostics.push(diagnostic);
                    }
                }
            }
        }
    }
    dispose() {
        this.diagnosticCollection.dispose();
    }
}
exports.ZSSpaceDiagnosticProvider = ZSSpaceDiagnosticProvider;
class ZSQuotesDiagnosticProvider {
    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('zs-quotes');
    }
    updateDiagnostics(document) {
        if (document.languageId !== 'zs') {
            return;
        }
        const diagnostics = [];
        const text = document.getText();
        this.detectSpacesInNouns(text, diagnostics, document);
        this.diagnosticCollection.set(document.uri, diagnostics);
    }
    detectSpacesInNouns(text, diagnostics, document) {
        const nounPatterns = [
            { regex: /<[^>]*>/g, symbol: '<>' },
            { regex: /\([^)]*\)/g, symbol: '()' },
            { regex: /\/\|[^|]*\|\\/g, symbol: '/||\\' }
        ];
        for (const pattern of nounPatterns) {
            let match;
            while ((match = pattern.regex.exec(text)) !== null) {
                const nounContent = match[0];
                for (let i = 0; i < nounContent.length; i++) {
                    const char = nounContent[i];
                    if (char === "\'" || char === "\"") {
                        const spacePosition = match.index + i;
                        const startPos = document.positionAt(spacePosition);
                        const endPos = document.positionAt(spacePosition + 1);
                        const range = new vscode.Range(startPos, endPos);
                        const diagnostic = new vscode.Diagnostic(range, `${char} not allowed inside ${pattern.symbol} noun symbols`, vscode.DiagnosticSeverity.Error);
                        diagnostic.source = 'ZS Nouns';
                        diagnostics.push(diagnostic);
                    }
                }
            }
        }
    }
    dispose() {
        this.diagnosticCollection.dispose();
    }
}
exports.ZSQuotesDiagnosticProvider = ZSQuotesDiagnosticProvider;
//# sourceMappingURL=diagnosticProvider.js.map