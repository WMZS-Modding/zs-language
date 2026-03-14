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
class ZSIndentationProvider {
    constructor() {
        this.blockStack = [0];
        this.currentIndent = 0;
        this.expectingBlockContent = false;
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
        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            const lineDiagnostics = this.validateLine(line, lineIndex, document);
            diagnostics.push(...lineDiagnostics);
        }
        this.diagnosticCollection.set(document.uri, diagnostics);
    }
    validateLine(line, lineIndex, document) {
        const diagnostics = [];
        const hasNonSpaceChar = /\S/.test(line);
        if (!hasNonSpaceChar) {
            this.blockStack = [0];
            this.currentIndent = 0;
            this.expectingBlockContent = false;
            return [];
        }
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('-/')) {
            return [];
        }
        const indentLevel = line.length - line.trimStart().length;
        if (this.isBlockStarter(trimmedLine)) {
            this.blockStack.push(this.currentIndent);
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
                for (let i = this.blockStack.length - 1; i >= 0; i--) {
                    if (this.blockStack[i] === indentLevel) {
                        this.currentIndent = indentLevel;
                        this.blockStack = this.blockStack.slice(0, i + 1);
                        return diagnostics;
                    }
                }
            }
            diagnostics.push(this.createDiagnostic(lineIndex, this.currentIndent, indentLevel, 'Incorrect indentation', document));
        }
        return diagnostics;
    }
    isBlockStarter(trimmedLine) {
        if (trimmedLine.endsWith(':'))
            return true;
        if (trimmedLine.startsWith('if ') && (trimmedLine.endsWith(':') || trimmedLine.includes(' then')))
            return true;
        if (trimmedLine.startsWith('else if ') && (trimmedLine.endsWith(':') || trimmedLine.includes(' then')))
            return true;
        if (trimmedLine === 'else' || trimmedLine === 'else:')
            return true;
        if (trimmedLine.startsWith('for ') && (trimmedLine.endsWith(':') || trimmedLine.includes(' do')))
            return true;
        if (trimmedLine.startsWith('while ') && (trimmedLine.endsWith(':') || trimmedLine.includes(' do')))
            return true;
        if (trimmedLine.startsWith('repeat ') && trimmedLine.endsWith(' times:'))
            return true;
        // attempt-except blocks (ZS's replacement for try-catch)
        if (trimmedLine === 'attempt:' || trimmedLine.startsWith('except '))
            return true;
        return false;
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