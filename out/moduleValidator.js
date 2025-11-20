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
exports.ZSModuleValidator = void 0;
const vscode = __importStar(require("vscode"));
class ZSModuleValidator {
    constructor() {
        this.importedModules = new Set();
        this.moduleAliases = new Map();
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('zs-modules');
    }
    updateDiagnostics(document) {
        if (document.languageId !== 'zs') {
            return;
        }
        const text = document.getText();
        const diagnostics = [];
        this.importedModules.clear();
        this.moduleAliases.clear();
        if (!text.includes('! ZS-PYTHON')) {
            this.diagnosticCollection.set(document.uri, diagnostics);
            return;
        }
        const lines = text.split('\n');
        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            const trimmedLine = line.trim();
            const importAsRegex = /^import\s+(\w+)(?:\s+as\s+(\w+))?/;
            const importAsMatch = trimmedLine.match(importAsRegex);
            if (importAsMatch) {
                const moduleName = importAsMatch[1];
                const alias = importAsMatch[2];
                this.importedModules.add(moduleName);
                if (alias) {
                    this.moduleAliases.set(alias, moduleName);
                    this.importedModules.add(alias);
                }
            }
            const fromImportRegex = /^from\s+(\w+)\s+import\s+(\w+)(?:\s+as\s+(\w+))?/;
            const fromImportMatch = trimmedLine.match(fromImportRegex);
            if (fromImportMatch) {
                const moduleName = fromImportMatch[1];
                this.importedModules.add(moduleName);
            }
            const fromImportSimpleRegex = /^from\s+(\w+)\s+import\s+(\w+)/;
            const fromImportSimpleMatch = trimmedLine.match(fromImportSimpleRegex);
            if (fromImportSimpleMatch) {
                const moduleName = fromImportSimpleMatch[1];
                this.importedModules.add(moduleName);
            }
        }
        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            this.validateModuleUsage(line, lineIndex, diagnostics, document);
        }
        this.diagnosticCollection.set(document.uri, diagnostics);
    }
    validateModuleUsage(line, lineIndex, diagnostics, document) {
        const moduleUsageRegex = /\b(\w+)<\w+>/g;
        let match;
        while ((match = moduleUsageRegex.exec(line)) !== null) {
            const moduleName = match[1];
            const startPos = match.index;
            const endPos = startPos + moduleName.length;
            if (!this.importedModules.has(moduleName)) {
                const range = new vscode.Range(new vscode.Position(lineIndex, startPos), new vscode.Position(lineIndex, endPos));
                const diagnostic = new vscode.Diagnostic(range, `Module "${moduleName}" is used but not imported`, vscode.DiagnosticSeverity.Error);
                diagnostic.source = 'ZS Modules';
                diagnostics.push(diagnostic);
            }
        }
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
exports.ZSModuleValidator = ZSModuleValidator;
//# sourceMappingURL=moduleValidator.js.map