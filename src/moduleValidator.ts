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

    private validateModuleUsage(line: string, lineIndex: number, diagnostics: vscode.Diagnostic[], document: vscode.TextDocument): void {
        const moduleUsageRegex = /\b(\w+)<\w+>/g;
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

        vscode.workspace.textDocuments.forEach(document => {
            if (document.languageId === 'zs') {
                this.updateDiagnostics(document);
            }
        });

        context.subscriptions.push(
            changeDisposable,
            openDisposable,
            this.diagnosticCollection
        );
    }

    dispose(): void {
        this.diagnosticCollection.dispose();
    }
}