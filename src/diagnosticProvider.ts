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
            
            // Extract patterns that trigger invalid.illegal coloring
            this.extractInvalidPatterns(grammar);
        } catch (error) {
            console.error('Failed to load grammar for diagnostics:', error);
        }
    }

    private extractInvalidPatterns(grammar: any): void {
        // Recursively find all patterns with 'invalid.illegal' in their name
        const findInvalidPatterns = (obj: any, path: string[] = []): void => {
            if (typeof obj === 'object' && obj !== null) {
                // Check if this pattern marks text as invalid
                if (obj.name && obj.name.includes('invalid.illegal')) {
                    if (obj.match) {
                        this.invalidPatterns.push(obj.match);
                    }
                    if (obj.patterns) {
                        obj.patterns.forEach((pattern: any) => findInvalidPatterns(pattern, [...path, 'patterns']));
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

    public updateDiagnostics(document: vscode.TextDocument): void {
        if (document.languageId !== 'zs' || this.invalidPatterns.length === 0) {
            return;
        }

        const diagnostics: vscode.Diagnostic[] = [];
        const text = document.getText();

        this.invalidPatterns.forEach(pattern => {
            try {
                const regex = new RegExp(pattern, 'gi');
                let match: RegExpExecArray | null;

                while ((match = regex.exec(text)) !== null) {
                    const startPos = document.positionAt(match.index);
                    const endPos = document.positionAt(match.index + match[0].length);
                    const range = new vscode.Range(startPos, endPos);

                    const diagnostic = new vscode.Diagnostic(
                        range,
                        `ZS syntax error: "${match[0]}" matches invalid pattern`,
                        vscode.DiagnosticSeverity.Error
                    );

                    diagnostics.push(diagnostic);
                }
            } catch (error) {
                console.warn('Invalid regex pattern:', pattern, error);
            }
        });

        this.diagnosticCollection.set(document.uri, diagnostics);
    }

    public dispose(): void {
        this.diagnosticCollection.dispose();
    }
}