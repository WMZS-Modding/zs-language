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
exports.ZSDiagnosticProviderWarning = exports.ZSDiagnosticProvider = void 0;
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
            // Extract patterns that trigger invalid.illegal coloring
            this.extractInvalidPatterns(grammar);
        }
        catch (error) {
            console.error('Failed to load grammar for diagnostics:', error);
        }
    }
    extractInvalidPatterns(grammar) {
        // Recursively find all patterns with 'invalid.illegal' in their name
        const findInvalidPatterns = (obj, path = []) => {
            if (typeof obj === 'object' && obj !== null) {
                // Check if this pattern marks text as invalid
                if (obj.name && obj.name.includes('invalid.illegal')) {
                    if (obj.match) {
                        this.invalidPatterns.push(obj.match);
                    }
                    if (obj.patterns) {
                        obj.patterns.forEach((pattern) => findInvalidPatterns(pattern, [...path, 'patterns']));
                    }
                }
                // Search in all object properties
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
        if (document.languageId !== 'zs' || this.invalidPatterns.length === 0) {
            return;
        }
        const diagnostics = [];
        const text = document.getText();
        this.invalidPatterns.forEach(pattern => {
            try {
                const regex = new RegExp(pattern, 'gi');
                let match;
                while ((match = regex.exec(text)) !== null) {
                    const startPos = document.positionAt(match.index);
                    const endPos = document.positionAt(match.index + match[0].length);
                    const range = new vscode.Range(startPos, endPos);
                    const diagnostic = new vscode.Diagnostic(range, `ZS syntax error: "${match[0]}" matches invalid pattern`, vscode.DiagnosticSeverity.Error);
                    diagnostics.push(diagnostic);
                }
            }
            catch (error) {
                console.warn('Invalid regex pattern:', pattern, error);
            }
        });
        this.diagnosticCollection.set(document.uri, diagnostics);
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
    // Update diagnostics for a document
    updateDiagnostics(document) {
        if (document.languageId !== 'zs') {
            return;
        }
        const diagnostics = [];
        // Check each line for invalid patterns
        for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
            const line = document.lineAt(lineIndex);
            const lineText = line.text;
            this.warningPatterns.forEach(pattern => {
                let match;
                while ((match = pattern.exec(lineText)) !== null) {
                    const startPos = new vscode.Position(lineIndex, match.index);
                    const endPos = new vscode.Position(lineIndex, match.index + match[0].length);
                    const range = new vscode.Range(startPos, endPos);
                    const diagnostic = new vscode.Diagnostic(range, `Warning: If you use "${match[0]}", you must be careful. Otherwise, your script is error`, vscode.DiagnosticSeverity.Warning);
                    diagnostic.source = 'ZS Language';
                    diagnostics.push(diagnostic);
                }
            });
        }
        this.diagnosticCollection.set(document.uri, diagnostics);
    }
    clearDiagnostics() {
        this.diagnosticCollection.clear();
    }
    dispose() {
        this.diagnosticCollection.dispose();
    }
}
exports.ZSDiagnosticProviderWarning = ZSDiagnosticProviderWarning;
//# sourceMappingURL=diagnosticProvider.js.map