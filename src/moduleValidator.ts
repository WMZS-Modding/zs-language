import * as vscode from 'vscode';

export class ZSModuleValidator {
    private diagnosticCollection: vscode.DiagnosticCollection;
    private importedModules: Set<string> = new Set();
    private moduleAliases: Map<string, string> = new Map();

    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('zs-modules');
    }

    updateDiagnostics(document: vscode.TextDocument): void {
        if (document.languageId !== 'zs') {
            return;
        }

        const text = document.getText();
        const diagnostics: vscode.Diagnostic[] = [];
        this.importedModules.clear();
        this.moduleAliases.clear();

        if (!text.includes('! ZS-PYTHON') || !text.includes('! ZS-LUA') || !text.includes('! ZS-NORMAL')) {
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

            const fromImportRegex = /^from\s+(\w+)\s+import/;
            const fromImportMatch = trimmedLine.match(fromImportRegex);

            if (fromImportMatch) {
                const moduleName = fromImportMatch[1];
                this.importedModules.add(moduleName);
            }
        }

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            this.validateModuleUsage(line, lineIndex, diagnostics, document);
        }

        this.diagnosticCollection.set(document.uri, diagnostics);
    }

    private validateModuleUsage(line: string, lineIndex: number, diagnostics: vscode.Diagnostic[], document: vscode.TextDocument): void {
        const moduleUsageRegex = /\b(\w+)\s*:\s*(\w+)/g;
        let match;

        while ((match = moduleUsageRegex.exec(line)) !== null) {
            const moduleName = match[1];
            const startPos = match.index;
            const endPos = startPos + moduleName.length;

            if (!this.importedModules.has(moduleName)) {
                const range = new vscode.Range(
                    new vscode.Position(lineIndex, startPos),
                    new vscode.Position(lineIndex, endPos)
                );

                const diagnostic = new vscode.Diagnostic(
                    range,
                    `Module "${moduleName}" is used but not imported`,
                    vscode.DiagnosticSeverity.Error
                );
                diagnostic.source = 'ZS Modules';
                diagnostics.push(diagnostic);
            }
        }
    }

    provideSemanticTokens(document: vscode.TextDocument): vscode.SemanticTokens | null {
        if (document.languageId !== 'zs') return null;
        if (!document.getText().includes('! ZS-PYTHON') || !document.getText().includes('! ZS-LUA') || !document.getText().includes('! ZS-NORMAL')) return null;

        const lines = document.getText().split('\n');
        const tokenBuilder = new vscode.SemanticTokensBuilder();
        const MODULE = 0;
        const ALIAS = 1;

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];

            // Color module after 'from'
            const fromMatch = line.match(/\bfrom\s+(\w+)\b/);
            if (fromMatch) {
                const startIndex = fromMatch.index + 5;
                tokenBuilder.push(lineIndex, startIndex, fromMatch[1].length, MODULE, 0);
            }

            // Color module after 'import' (standalone)
            const importMatch = line.match(/\bimport\s+(\w+)\b/);
            if (importMatch && !line.includes('from')) {
                const startIndex = importMatch.index + 7;
                tokenBuilder.push(lineIndex, startIndex, importMatch[1].length, MODULE, 0);
            }

            // Color alias after 'as'
            const asMatch = line.match(/\bas\s+(\w+)\b/);
            if (asMatch) {
                const startIndex = asMatch.index + 3;
                tokenBuilder.push(lineIndex, startIndex, asMatch[1].length, ALIAS, 0);
            }

            // Color imported functions (between import and optional as)
            const funcMatch = line.match(/\bimport\s+(\w+)(?:\s+as\s+\w+)?/);
            if (funcMatch && !line.includes('from')) {
                const startIndex = funcMatch.index + 7;
                tokenBuilder.push(lineIndex, startIndex, funcMatch[1].length, MODULE, 0);
            }

            // Color functions in from...import (comma separated)
            const fromFuncMatch = line.match(/from\s+\w+\s+import\s+([\w,\s]+)/);
            if (fromFuncMatch) {
                const funcs = fromFuncMatch[1].split(',').map(f => f.trim());
                let currentPos = fromFuncMatch.index + fromFuncMatch[0].length - fromFuncMatch[1].length;
                for (const func of funcs) {
                    const funcPart = func.split(/\s+as\s+/)[0];
                    if (funcPart) {
                        tokenBuilder.push(lineIndex, currentPos, funcPart.length, MODULE, 0);
                        currentPos += func.length + 1;
                    }
                }
            }
        }
        
        return tokenBuilder.build();
    }

    activate(context: vscode.ExtensionContext): void {
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

        // Register semantic tokens provider
        const selector: vscode.DocumentSelector = { language: 'zs' };
        const provider: vscode.DocumentSemanticTokensProvider = {
            provideDocumentSemanticTokens: (document) => {
                return this.provideSemanticTokens(document);
            }
        };

        const legend = new vscode.SemanticTokensLegend(['module', 'alias']);

        const semanticTokensDisposable = vscode.languages.registerDocumentSemanticTokensProvider(
            selector,
            provider,
            legend
        );

        vscode.workspace.textDocuments.forEach(document => {
            if (document.languageId === 'zs') {
                this.updateDiagnostics(document);
            }
        });

        context.subscriptions.push(
            changeDisposable,
            openDisposable,
            semanticTokensDisposable,
            this.diagnosticCollection
        );
    }

    dispose(): void {
        this.diagnosticCollection.dispose();
    }
}