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
exports.ZSIndentationProvider = void 0;
const vscode = __importStar(require("vscode"));
// ============================================================
// ZS Indentation Provider
// Based on Python Indent Extension Logic (Kevin Rose)
// Adapted for ZS Language
// ============================================================
class ZSIndentationProvider {
    constructor() {
        this.blockStack = [0];
        this.currentIndent = 0;
        this.expectingBlockContent = false;
        this.inBlockComment = false;
        this.lastSeenIndenters = {
            if_: undefined,
            for_: undefined,
            while_: undefined,
            attempt_: undefined
        };
        this.dedentKeywords = {
            'else': ['if', 'for', 'while'],
            'else if': ['if'],
            'except': ['attempt'],
            'ensure': ['attempt']
        };
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('zs-indentation');
    }
    updateDiagnostics(document) {
        if (document.languageId !== 'zs') {
            return;
        }
        const diagnostics = [];
        const lines = document.getText().split('\n');
        this.blockStack = [0];
        this.currentIndent = 0;
        this.expectingBlockContent = false;
        this.inBlockComment = false;
        this.lastSeenIndenters = {
            if_: undefined,
            for_: undefined,
            while_: undefined,
            attempt_: undefined
        };
        const tabSize = 4;
        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            const lineDiagnostics = this.validateLine(line, lineIndex, document, tabSize);
            diagnostics.push(...lineDiagnostics);
            this.updateLastSeenIndenters(line);
        }
        this.diagnosticCollection.set(document.uri, diagnostics);
    }
    validateLine(line, lineIndex, document, tabSize) {
        const diagnostics = [];
        const expandedLine = line.replace(/\t/g, ' '.repeat(tabSize));
        const hasNonSpaceChar = /\S/.test(expandedLine);
        if (!hasNonSpaceChar) {
            return [];
        }
        const trimmedLine = expandedLine.trim();
        const indentLevel = expandedLine.length - expandedLine.trimStart().length;
        if (trimmedLine.includes('*/-')) {
            this.inBlockComment = true;
            return [];
        }
        if (trimmedLine.includes('/-*')) {
            this.inBlockComment = false;
            return [];
        }
        if (this.inBlockComment) {
            return [];
        }
        if (trimmedLine.startsWith('-/')) {
            return [];
        }
        let isDedentKeyword = false;
        for (const [keyword] of Object.entries(this.dedentKeywords)) {
            if (trimmedLine.startsWith(keyword + ' ') || trimmedLine === keyword || trimmedLine.startsWith(keyword + ':')) {
                isDedentKeyword = true;
                break;
            }
        }
        if (isDedentKeyword) {
            this.currentIndent = indentLevel;
            this.expectingBlockContent = true;
            return diagnostics;
        }
        if (trimmedLine.endsWith(':') && !this.expectingBlockContent) {
            this.blockStack.push(indentLevel);
            this.currentIndent = indentLevel;
            this.expectingBlockContent = true;
            return diagnostics;
        }
        if (trimmedLine.includes(' then') && (trimmedLine.startsWith('if ') || trimmedLine.startsWith('else if '))) {
            this.blockStack.push(indentLevel);
            this.currentIndent = indentLevel;
            this.expectingBlockContent = true;
            return diagnostics;
        }
        if (trimmedLine.includes(' do') && (trimmedLine.startsWith('for ') || trimmedLine.startsWith('while '))) {
            this.blockStack.push(indentLevel);
            this.currentIndent = indentLevel;
            this.expectingBlockContent = true;
            return diagnostics;
        }
        if (this.expectingBlockContent) {
            const expectedMinIndent = this.blockStack[this.blockStack.length - 1] + 4;
            if (indentLevel < expectedMinIndent) {
                diagnostics.push(this.createDiagnostic(lineIndex, expectedMinIndent, indentLevel, 'Expected indented block', document));
            }
            this.expectingBlockContent = false;
            this.currentIndent = indentLevel;
            return diagnostics;
        }
        if (indentLevel !== this.currentIndent) {
            if (indentLevel < this.currentIndent) {
                let found = false;
                for (let i = this.blockStack.length - 1; i >= 0; i--) {
                    if (this.blockStack[i] === indentLevel) {
                        this.currentIndent = indentLevel;
                        this.blockStack = this.blockStack.slice(0, i + 1);
                        found = true;
                        return diagnostics;
                    }
                }
                if (!found) {
                    diagnostics.push(this.createDiagnostic(lineIndex, this.currentIndent, indentLevel, 'Incorrect dedent (no matching parent indent)', document));
                    this.currentIndent = indentLevel;
                }
            }
            else {
                diagnostics.push(this.createDiagnostic(lineIndex, this.currentIndent, indentLevel, 'Unexpected indentation', document));
                this.currentIndent = indentLevel;
            }
        }
        else {
            this.currentIndent = indentLevel;
        }
        return diagnostics;
    }
    updateLastSeenIndenters(line) {
        const trimmed = line.trim();
        if (trimmed.startsWith('if ') || trimmed === 'if:' || trimmed.startsWith('if:')) {
            this.lastSeenIndenters.if_ = this.currentIndent;
        }
        if (trimmed.startsWith('for ') || trimmed === 'for:' || trimmed.startsWith('for:')) {
            this.lastSeenIndenters.for_ = this.currentIndent;
        }
        if (trimmed.startsWith('while ') || trimmed === 'while:' || trimmed.startsWith('while:')) {
            this.lastSeenIndenters.while_ = this.currentIndent;
        }
        if (trimmed.startsWith('attempt') || trimmed === 'attempt:') {
            this.lastSeenIndenters.attempt_ = this.currentIndent;
        }
    }
    createDiagnostic(lineIndex, expected, actual, message, document) {
        const range = new vscode.Range(new vscode.Position(lineIndex, 0), new vscode.Position(lineIndex, actual));
        const diagnostic = new vscode.Diagnostic(range, `${message} (expected ${expected} spaces, got ${actual})`, vscode.DiagnosticSeverity.Error);
        diagnostic.source = 'ZS Indentation';
        return diagnostic;
    }
    activate(context) {
        const changeSubscription = vscode.workspace.onDidChangeTextDocument(event => {
            if (event.document.languageId === 'zs') {
                this.updateDiagnostics(event.document);
            }
        });
        const openSubscription = vscode.workspace.onDidOpenTextDocument(document => {
            if (document.languageId === 'zs') {
                this.updateDiagnostics(document);
            }
        });
        vscode.workspace.textDocuments.forEach(document => {
            if (document.languageId === 'zs') {
                this.updateDiagnostics(document);
            }
        });
        context.subscriptions.push(changeSubscription, openSubscription, this.diagnosticCollection);
    }
    dispose() {
        this.diagnosticCollection.dispose();
    }
}
exports.ZSIndentationProvider = ZSIndentationProvider;
//# sourceMappingURL=indentationProvider.js.map