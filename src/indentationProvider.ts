import * as vscode from 'vscode';

// ============================================================
// ZS Indentation Provider
// Based on Python Indent Extension Logic (Kevin Rose)
// Adapted for ZS Language
// ============================================================

export class ZSIndentationProvider {
    private diagnosticCollection: vscode.DiagnosticCollection;
    private blockStack: number[] = [0];
    private currentIndent = 0;
    private expectingBlockContent = false;
    private inBlockComment = false;

    private lastSeenIndenters: {
        if_: number | undefined;
        for_: number | undefined;
        while_: number | undefined;
        attempt_: number | undefined;
    } = {
        if_: undefined,
        for_: undefined,
        while_: undefined,
        attempt_: undefined
    };

    private dedentKeywords: { [key: string]: string[] } = {
        'else': ['if', 'for', 'while'],
        'else if': ['if'],
        'except': ['attempt'],
        'ensure': ['attempt']
    };

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

    private validateLine(
        line: string,
        lineIndex: number,
        document: vscode.TextDocument,
        tabSize: number
    ): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];

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
                    diagnostics.push(this.createDiagnostic(
                        lineIndex,
                        this.currentIndent,
                        indentLevel,
                        'Incorrect dedent (no matching parent indent)',
                        document
                    ));
                    this.currentIndent = indentLevel;
                }
            } else {
                diagnostics.push(this.createDiagnostic(
                    lineIndex,
                    this.currentIndent,
                    indentLevel,
                    'Unexpected indentation',
                    document
                ));
                this.currentIndent = indentLevel;
            }
        } else {
            this.currentIndent = indentLevel;
        }

        return diagnostics;
    }

    private updateLastSeenIndenters(line: string): void {
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