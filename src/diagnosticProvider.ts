import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class ZSDiagnosticProvider {
    private diagnosticCollection: vscode.DiagnosticCollection;
    private invalidPatterns: string[] = [];

    constructor(context: vscode.ExtensionContext) {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('zs');
        this.loadInvalidPatternsFromGrammar(context);
    }

    private async loadInvalidPatternsFromGrammar(context: vscode.ExtensionContext): Promise<void> {
        try {
            const grammarPath = path.join(context.extensionPath, 'syntaxes', 'zs.tmLanguage.json');
            const grammarContent = await fs.promises.readFile(grammarPath, 'utf8');
            const grammar = JSON.parse(grammarContent);
            
            this.extractInvalidPatterns(grammar);
        } catch (error) {
            console.error('Failed to load grammar for diagnostics:', error);
        }
    }

    private extractInvalidPatterns(grammar: any): void {
        const findInvalidPatterns = (obj: any, path: string[] = []): void => {
            if (typeof obj === 'object' && obj !== null) {
                if (obj.name && obj.name.includes('invalid.illegal')) {
                    if (obj.match) {
                        this.invalidPatterns.push(obj.match);
                    }
                    if (obj.patterns) {
                        obj.patterns.forEach((pattern: any) => findInvalidPatterns(pattern, [...path, 'patterns']));
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

    public updateDiagnostics(document: vscode.TextDocument): void {
        if (document.languageId !== 'zs') {
            return;
        }

        const diagnostics: vscode.Diagnostic[] = [];
        const text = document.getText();

        this.detectStraightQuotes(text, /"/g, '“”', diagnostics, document);
        this.detectStraightQuotes(text, /'/g, '‘’', diagnostics, document);

        this.invalidPatterns.forEach(pattern => {
            let regex: RegExp;
        
            if (pattern && (pattern as any).exec && (pattern as any).source) {
                regex = new RegExp((pattern as any).source, 'gi');
            } else {
                const cleanPattern = String(pattern).replace(/^\(\?i\)/, '');
                regex = new RegExp(cleanPattern, 'gi');
            }
        
            let match: RegExpExecArray | null;
            regex.lastIndex = 0;

            while ((match = regex.exec(text)) !== null) {
                const startPos = document.positionAt(match.index);
                const endPos = document.positionAt(match.index + match[0].length);
                const range = new vscode.Range(startPos, endPos);

                const diagnostic = new vscode.Diagnostic(
                    range,
                    `Invalid ZS syntax: "${match[0]}"`,
                    vscode.DiagnosticSeverity.Error
                );

                diagnostic.source = 'ZS';
                diagnostics.push(diagnostic);
            }
        });

        this.diagnosticCollection.set(document.uri, diagnostics);
    }

    private detectStraightQuotes(
        text: string,
        pattern: RegExp,
        expectedQuotes: string,
        diagnostics: vscode.Diagnostic[],
        document: vscode.TextDocument
    ): void {
        const lines = text.split('\n');
    
        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
        
            if (line.trim().startsWith('-/')) continue;
        
            let match: RegExpExecArray | null;
            pattern.lastIndex = 0;
        
            while ((match = pattern.exec(line)) !== null) {
                const range = new vscode.Range(
                    new vscode.Position(lineIndex, match.index),
                    new vscode.Position(lineIndex, match.index + 1)
                );

                const diagnostic = new vscode.Diagnostic(
                    range,
                    `Use ${expectedQuotes} instead of "${match[0]}" in ZS code`,
                    vscode.DiagnosticSeverity.Error
                );
            
                diagnostic.source = 'ZS Quotes';
                diagnostics.push(diagnostic);
            }
        }
    }

    provideCodeActions(
        document: vscode.TextDocument, 
        range: vscode.Range, 
        context: vscode.CodeActionContext
    ): vscode.CodeAction[] {
        const actions: vscode.CodeAction[] = [];

        context.diagnostics.forEach(diagnostic => {
            if (diagnostic.source === 'ZS Quotes') {
                const action = new vscode.CodeAction(
                    'Convert to curly quotes',
                    vscode.CodeActionKind.QuickFix
                );
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

    public dispose(): void {
        this.diagnosticCollection.dispose();
    }
}

export class ZSDiagnosticProviderWarning {
    private diagnosticCollection: vscode.DiagnosticCollection;
    private warningPatterns: RegExp[] = [];

    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('zs');
        this.loadwarningPatterns();
    }

    private loadwarningPatterns(): void {
        this.warningPatterns = [
            /\b(is|are)\b/gi,
        ];
    }

    public updateDiagnostics(document: vscode.TextDocument): void {
        if (document.languageId !== 'zs') {
            return;
        }

        const diagnostics: vscode.Diagnostic[] = [];

        for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
            const line = document.lineAt(lineIndex);
            const lineText = line.text;

            this.warningPatterns.forEach(pattern => {
                let match: RegExpExecArray | null;
                while ((match = pattern.exec(lineText)) !== null) {
                    const startPos = new vscode.Position(lineIndex, match.index);
                    const endPos = new vscode.Position(lineIndex, match.index + match[0].length);
                    const range = new vscode.Range(startPos, endPos);

                    const diagnostic = new vscode.Diagnostic(
                        range,
                        `Warning: If you use "${match[0]}", you must be careful. Otherwise, your script is error`,
                        vscode.DiagnosticSeverity.Warning
                    );

                    diagnostic.source = 'ZS Language';
                    diagnostics.push(diagnostic);
                }
            });
        }

        this.diagnosticCollection.set(document.uri, diagnostics);
    }

    public clearDiagnostics(): void {
        this.diagnosticCollection.clear();
    }

    public dispose(): void {
        this.diagnosticCollection.dispose();
    }
}