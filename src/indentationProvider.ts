import * as vscode from 'vscode';

export class ZSIndentationProvider {
    private diagnosticCollection: vscode.DiagnosticCollection;
    private blockStack: number[] = [0];
    private currentIndent = 0;
    private expectingBlockContent = false;

    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('zs-indentation');
    }

    updateDiagnostics(document: vscode.TextDocument): void {
        if (document.languageId !== 'zs') {
            return;
        }

        const diagnostics: vscode.Diagnostic[] = [];
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

    private validateLine(line: string, lineIndex: number, document: vscode.TextDocument): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];

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
                diagnostics.push(this.createDiagnostic(
                    lineIndex,
                    expectedMinIndent,
                    indentLevel,
                    'Expected indented block',
                    document
                ));
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

            diagnostics.push(this.createDiagnostic(
                lineIndex,
                this.currentIndent,
                indentLevel,
                'Incorrect indentation',
                document
            ));
        }

        return diagnostics;
    }

    private isBlockStarter(trimmedLine: string): boolean {
        if (trimmedLine.endsWith(':')) return true;
        if (trimmedLine.startsWith('if ') && (trimmedLine.endsWith(':') || trimmedLine.includes(' then'))) return true;
        if (trimmedLine.startsWith('else if ') && (trimmedLine.endsWith(':') || trimmedLine.includes(' then'))) return true;
        if (trimmedLine === 'else' || trimmedLine === 'else:') return true;
        if (trimmedLine.startsWith('for ') && (trimmedLine.endsWith(':') || trimmedLine.includes(' do'))) return true;
        if (trimmedLine.startsWith('while ') && (trimmedLine.endsWith(':') || trimmedLine.includes(' do'))) return true;
        if (trimmedLine.startsWith('repeat ') && trimmedLine.endsWith(' times:')) return true;
        // attempt-except blocks (ZS's replacement for try-catch)
        if (trimmedLine === 'attempt:' || trimmedLine.startsWith('except ')) return true;

        return false;
    }

    private createDiagnostic(
        lineIndex: number,
        expected: number,
        actual: number,
        message: string,
        document: vscode.TextDocument
    ): vscode.Diagnostic {
        const range = new vscode.Range(
            new vscode.Position(lineIndex, 0),
            new vscode.Position(lineIndex, actual)
        );

        const diagnostic = new vscode.Diagnostic(
            range,
            `${message} (expected ${expected} spaces, got ${actual})`,
            vscode.DiagnosticSeverity.Error
        );
        diagnostic.source = 'ZS Indentation';

        return diagnostic;
    }

    activate(context: vscode.ExtensionContext): void {
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

        context.subscriptions.push(
            changeSubscription,
            openSubscription,
            this.diagnosticCollection
        );
    }

    dispose(): void {
        this.diagnosticCollection.dispose();
    }
}