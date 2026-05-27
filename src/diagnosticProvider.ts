import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class ZSDiagnosticProvider {
    private diagnosticCollection: vscode.DiagnosticCollection;
    private invalidPatterns: string[] = [];
    private suffixExceptions: Set<string>;

    constructor(context: vscode.ExtensionContext) {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('zs');
        this.loadInvalidPatternsFromGrammar(context);
        this.loadSuffixExceptions();
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
                if (obj.name && obj.name.includes('invalid.illegal') || obj.name && obj.name.includes('zs.red')) {
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

    private loadSuffixExceptions(): void {
        this.suffixExceptions = new Set([
            'when', 'then', 'prefab', 'unitysystem', 'unityengine', 'union', 'undo', 'redo',

            'light', 'right', 'night', 'fight', 'sight',
            'bright', 'tight', 'eight', 'weight', 'height', 'thought', 'read', 'reads', 'repeat', 'report', 'repr', 'remove', 'removes', 'replaces', 'replace',

            'elapsed', 'onEventPushed', 'onTweenCompleted', 'onTimerCompleted',
            'onSoundFinished', 'onRecalculateRating', 'onCountdownStarted',
            'retry', 'preUpdateScore', 'miss', 'proceed', 'unless', 'misses', 'resumes', 'resume', 'reverse', 'reverses', 'removeprefix', 'removesuffix', 'rearrange', 'rearranges',

            'using', 'excluding', 'including', 'nothing',
            'overrides', 'overwrites', 'override', 'overwrite',

            'uniform', 'register'
        ]);
    }

    private shouldFlagAsInvalid(matchedText: string): boolean {
        const lowerText = matchedText.toLowerCase();
        return !this.suffixExceptions.has(lowerText);
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
                const matchedText = match[0];

                if (!this.shouldFlagAsInvalid(matchedText)) {
                    continue;
                }

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
        if (this.isInsideSymbol(lineText, position, '[', ']')) return true;
        if (this.isInsideSymbol(lineText, position, '{', '}')) return true;
        if (this.isInsideSymbol(lineText, position, '(', ')')) return true;
        if (this.isInsideSymbol(lineText, position, '‘', '’')) return true;
        if (this.isInsideSymbol(lineText, position, '“', '”')) return true;
        if (this.isInsideSymbol(lineText, position, '/|', '|\\')) return true;

        if (this.isInsideRepeaterBlock(document, lineIndex)) {
            return true;
        }

        return false;
    }

    private isInsideRepeaterBlock(document: vscode.TextDocument, lineIndex: number): boolean {
        for (let i = lineIndex; i >= 0; i--) {
            const line = document.lineAt(i).text;
            const trimmedLine = line.trim();

            if ((trimmedLine.startsWith('for ') || trimmedLine.startsWith('while ')) && trimmedLine.includes(':')) {
                const repeaterIndentation = line.length - line.trimStart().length;
                const currentLine = document.lineAt(lineIndex).text;
                const currentIndentation = currentLine.length - currentLine.trimStart().length;

                return currentIndentation > repeaterIndentation;
            }

            const currentLine = document.lineAt(lineIndex).text;
            const currentIndentation = currentLine.length - currentLine.trimStart().length;
            const searchLineIndentation = line.length - line.trimStart().length;
        
            if (i < lineIndex && searchLineIndentation <= currentIndentation && line.trim() !== '') {
                break;
            }
        }
    
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
        const lines = text.split('\n');

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];

            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('-/')) {
                continue;
            }

            if (this.isInsideMultiLineComment(document, lineIndex, 0)) {
                continue;
            }

            let nounMatch;
            const nounRegex = /<([^>]+)>/g;
            while ((nounMatch = nounRegex.exec(line)) !== null) {
                const [fullMatch, content] = nounMatch;
                const matchIndex = nounMatch.index;

                if (this.isInsideComment(document, lineIndex, matchIndex)) {
                    continue;
                }

                if (!this.isComparisonOperator(line, matchIndex)) {
                    this.validateNounContent(content, matchIndex + 1, lineIndex, '<>', diagnostics, document);
                }
            }

            let tileMatch;
            const tileRegex = /\/\|([^|]+)\|\\/g;
            while ((tileMatch = tileRegex.exec(line)) !== null) {
                const [fullMatch, content] = tileMatch;
                const matchIndex = tileMatch.index;

                if (this.isInsideComment(document, lineIndex, matchIndex)) {
                    continue;
                }

                this.validateNounContent(content, matchIndex + 2, lineIndex, '/||\\', diagnostics, document);
            }
        }
    }

    private isInsideComment(document: vscode.TextDocument, lineIndex: number, characterIndex: number): boolean {
        const line = document.lineAt(lineIndex).text;

        const commentIndex = line.indexOf('-/');
        if (commentIndex !== -1 && characterIndex >= commentIndex) {
            return true;
        }

        if (this.isInsideMultiLineComment(document, lineIndex, characterIndex)) {
            return true;
        }

        return false;
    }

    private isInsideMultiLineComment(document: vscode.TextDocument, lineIndex: number, characterIndex: number): boolean {
        const text = document.getText();
        const docPosition = document.offsetAt(new vscode.Position(lineIndex, characterIndex));

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

    private isComparisonOperator(line: string, position: number): boolean {
        const before = line.substring(Math.max(0, position - 3), position);
        const after = line.substring(position + 1, position + 4);

        const hasWordBefore = /[a-zA-Z0-9_]\s*$/.test(before);
        const hasWordAfter = /^\s*[a-zA-Z0-9_]/.test(after);

        return hasWordBefore && hasWordAfter;
    }

    private validateNounContent(content: string, startOffset: number, lineIndex: number, symbolType: string, diagnostics: vscode.Diagnostic[], document: vscode.TextDocument): void {
        for (let i = 0; i < content.length; i++) {
            const char = content[i];
            if (!/[a-zA-Z0-9_]/.test(char)) {
                const charPosition = startOffset + i;
                const startPos = new vscode.Position(lineIndex, charPosition);
                const endPos = new vscode.Position(lineIndex, charPosition + 1);
                const range = new vscode.Range(startPos, endPos);

                const diagnostic = new vscode.Diagnostic(
                    range,
                    `Invalid symbol "${char}" in ${symbolType} noun - only letters, numbers and _ allowed`,
                    vscode.DiagnosticSeverity.Error
                );
                diagnostic.source = 'ZS Nouns';
                diagnostics.push(diagnostic);
            }
        }
    }

    public dispose(): void {
        this.diagnosticCollection.dispose();
    }
}