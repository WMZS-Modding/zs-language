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

                if (this.shouldSkipRange(document, range)) {
                    continue;
                }

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

    private detectStraightQuotes(text: string, pattern: RegExp, expectedQuotes: string, diagnostics: vscode.Diagnostic[], document: vscode.TextDocument): void {
        const lines = text.split('\n');

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];

            if (line.trim().startsWith('-/')) {
                continue;
            }

            let match: RegExpExecArray | null;
            pattern.lastIndex = 0;

            while ((match = pattern.exec(line)) !== null) {
                const range = new vscode.Range(
                    new vscode.Position(lineIndex, match.index),
                    new vscode.Position(lineIndex, match.index + 1)
                );

                if (this.shouldSkipRange(document, range)) {
                    continue;
                }

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

    private shouldSkipRange(document: vscode.TextDocument, range: vscode.Range): boolean {
        const text = document.getText(range);
        const lineIndex = range.start.line;
        const position = range.start.character;
        const lineText = document.lineAt(lineIndex).text;

        if (this.isInsideMultiLineComment(document, lineIndex, position)) {
            return true;
        }

        if (lineText.includes('-/') && position >= lineText.indexOf('-/')) {
            return true;
        }

        if (this.isInsideSymbol(lineText, position, '<', '>')) return true;
        if (this.isInsideSymbol(lineText, position, '(', ')')) return true;
        if (this.isInsideSymbol(lineText, position, '/|', '|\\')) return true;

        if (text === '“' || text === '”' || text === '‘' || text === '’') return true;

        return false;
    }

    private isInsideMultiLineComment(document: vscode.TextDocument, lineIndex: number, position: number): boolean {
        const text = document.getText();
        const docPosition = document.offsetAt(new vscode.Position(lineIndex, position));
    
        let inComment = false;
        let lastIndex = 0;
    
        while (lastIndex < text.length) {
            const openIndex = text.indexOf('*/-', lastIndex);
            const closeIndex = text.indexOf('/-*', lastIndex);

            if (openIndex === -1 && closeIndex === -1) break;

            let nextIndex = -1;
            let isOpen = false;
        
            if (openIndex !== -1 && closeIndex !== -1) {
                if (openIndex < closeIndex) {
                    nextIndex = openIndex;
                    isOpen = true;
                } else {
                    nextIndex = closeIndex;
                    isOpen = false;
                }
            } else if (openIndex !== -1) {
                nextIndex = openIndex;
                isOpen = true;
            } else {
                nextIndex = closeIndex;
                isOpen = false;
            }

            if (inComment && docPosition < nextIndex) {
                return true;
            }

            if (isOpen) {
                inComment = true;
                lastIndex = openIndex + 3;
            } else {
                inComment = false;
                lastIndex = closeIndex + 3;
            }

            if (nextIndex > docPosition) break;
        }
    
        return inComment && docPosition >= lastIndex;
    }

    private isInsideSymbol(lineText: string, position: number, startSymbol: string, endSymbol: string): boolean {
        const startIndex = lineText.indexOf(startSymbol);
        const endIndex = lineText.indexOf(endSymbol, startIndex + startSymbol.length);
    
        return startIndex !== -1 && endIndex !== -1 && position > startIndex && position < endIndex;
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

                    if (this.shouldSkipRange(document, range)) {
                        continue;
                    }

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

    private shouldSkipRange(document: vscode.TextDocument, range: vscode.Range): boolean {
        const text = document.getText(range);
        const lineIndex = range.start.line;
        const position = range.start.character;
        const lineText = document.lineAt(lineIndex).text;

        if (this.isInsideMultiLineComment(document, lineIndex, position)) {
            return true;
        }

        if (lineText.includes('-/') && position >= lineText.indexOf('-/')) {
            return true;
        }

        if (this.isInsideSymbol(lineText, position, '<', '>')) return true;
        if (this.isInsideSymbol(lineText, position, '(', ')')) return true;
        if (this.isInsideSymbol(lineText, position, '/|', '|\\')) return true;

        if (text === '“' || text === '”' || text === '‘' || text === '’') return true;

        return false;
    }

    private isInsideMultiLineComment(document: vscode.TextDocument, lineIndex: number, position: number): boolean {
        const text = document.getText();
        const docPosition = document.offsetAt(new vscode.Position(lineIndex, position));
    
        let inComment = false;
        let lastIndex = 0;
    
        while (lastIndex < text.length) {
            const openIndex = text.indexOf('*/-', lastIndex);
            const closeIndex = text.indexOf('/-*', lastIndex);

            if (openIndex === -1 && closeIndex === -1) break;

            let nextIndex = -1;
            let isOpen = false;
        
            if (openIndex !== -1 && closeIndex !== -1) {
                if (openIndex < closeIndex) {
                    nextIndex = openIndex;
                    isOpen = true;
                } else {
                    nextIndex = closeIndex;
                    isOpen = false;
                }
            } else if (openIndex !== -1) {
                nextIndex = openIndex;
                isOpen = true;
            } else {
                nextIndex = closeIndex;
                isOpen = false;
            }

            if (inComment && docPosition < nextIndex) {
                return true;
            }

            if (isOpen) {
                inComment = true;
                lastIndex = openIndex + 3;
            } else {
                inComment = false;
                lastIndex = closeIndex + 3;
            }

            if (nextIndex > docPosition) break;
        }
    
        return inComment && docPosition >= lastIndex;
    }

    private isInsideSymbol(lineText: string, position: number, startSymbol: string, endSymbol: string): boolean {
        const startIndex = lineText.indexOf(startSymbol);
        const endIndex = lineText.indexOf(endSymbol, startIndex + startSymbol.length);
    
        return startIndex !== -1 && endIndex !== -1 && position > startIndex && position < endIndex;
    }

    public clearDiagnostics(): void {
        this.diagnosticCollection.clear();
    }

    public dispose(): void {
        this.diagnosticCollection.dispose();
    }
}

export class ZSNounSymbolDiagnosticProvider {
    private diagnosticCollection: vscode.DiagnosticCollection;

    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('zs-noun-symbols');
    }

    public updateDiagnostics(document: vscode.TextDocument): void {
        if (document.languageId !== 'zs') {
            return;
        }

        const diagnostics: vscode.Diagnostic[] = [];
        const text = document.getText();

        this.detectInvalidSymbolsInNouns(text, diagnostics, document);

        this.diagnosticCollection.set(document.uri, diagnostics);
    }

    private detectInvalidSymbolsInNouns(text: string, diagnostics: vscode.Diagnostic[], document: vscode.TextDocument): void {
        const nounPatterns = [
            { regex: /<[^>]*>/g, symbol: '<>' },
            { regex: /\([^)]*\)/g, symbol: '()' },
            { regex: /\/\|[^|]*\|\\/g, symbol: '/||\\' }
        ];

        for (const pattern of nounPatterns) {
            let match: RegExpExecArray | null;
            while ((match = pattern.regex.exec(text)) !== null) {
                const nounContent = match[0];

                const contentStart = pattern.symbol === '/||\\' ? 2 : 1;
                const contentEnd = nounContent.length - (pattern.symbol === '/||\\' ? 2 : 1);
                
                for (let i = contentStart; i < contentEnd; i++) {
                    const char = nounContent[i];
                    if (!/[\w]/.test(char)) {
                        const symbolPosition = match.index + i;
                        const startPos = document.positionAt(symbolPosition);
                        const endPos = document.positionAt(symbolPosition + 1);
                        const range = new vscode.Range(startPos, endPos);

                        const diagnostic = new vscode.Diagnostic(
                            range,
                            `Symbol "${char}" not allowed inside ${pattern.symbol} noun symbols - only letters, numbers and underscores allowed`,
                            vscode.DiagnosticSeverity.Error
                        );

                        diagnostic.source = 'ZS Nouns';
                        diagnostics.push(diagnostic);
                    }
                }
            }
        }
    }

    public dispose(): void {
        this.diagnosticCollection.dispose();
    }
}