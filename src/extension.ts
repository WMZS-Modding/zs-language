import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('ZS language extension is now active!');
    
    // Register the quote converter
    const quoteConverter = new ZSQuoteConverter();
    quoteConverter.activate(context);
    
    // Register manual conversion command
    let disposable = vscode.commands.registerCommand('zs.convertQuotes', () => {
        quoteConverter.convertDocumentQuotes();
    });

    context.subscriptions.push(disposable);
}

class ZSQuoteConverter {
    private isActive: boolean = false;

    activate(context: vscode.ExtensionContext) {
        if (this.isActive) {
            return;
        }

        this.isActive = true;
        
        // Listen for text changes in ZS documents
        let disposable = vscode.workspace.onDidChangeTextDocument((event) => {
            if (event.document.languageId !== 'zs') {
                return;
            }

            this.handleTextChange(event);
        });

        context.subscriptions.push(disposable);
    }

    private handleTextChange(event: vscode.TextDocumentChangeEvent) {
        // Only process if this is a content change
        if (event.contentChanges.length === 0) {
            return;
        }

        const change = event.contentChanges[0];
        const typedText = change.text;

        // Only process single character quotes
        if (typedText !== "'" && typedText !== '"') {
            return;
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document !== event.document) {
            return;
        }

        const position = change.range.start;
        const document = editor.document;
        const lineText = document.lineAt(position.line).text;

        // Get text before and after the cursor
        const textBefore = lineText.substring(0, position.character);
        const textAfter = lineText.substring(position.character + 1); // +1 because we're replacing the typed character

        // Determine if this is an opening or closing quote
        const isOpening = this.shouldBeOpeningQuote(typedText, textBefore, textAfter, document, position);

        // Perform the replacement
        editor.edit((editBuilder) => {
            const replacement = this.getReplacementQuote(typedText, isOpening);
            editBuilder.replace(change.range, replacement);
        });
    }

    private shouldBeOpeningQuote(
        quote: string, 
        textBefore: string, 
        textAfter: string, 
        document: vscode.TextDocument, 
        position: vscode.Position
    ): boolean {
        // Simple heuristic: if preceded by whitespace or start of line, it's opening
        const charBefore = textBefore[textBefore.length - 1];
        const isAfterWhitespace = !charBefore || /[\s\{\(\[\<]/.test(charBefore);
        
        return isAfterWhitespace;
    }

    private getReplacementQuote(originalQuote: string, isOpening: boolean): string {
        if (originalQuote === "'") {
            return isOpening ? '‘' : '’';
        } else if (originalQuote === '"') {
            return isOpening ? '“' : '”';
        }
        return originalQuote;
    }

    // Manual conversion for entire document
    async convertDocumentQuotes() {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'zs') {
            vscode.window.showWarningMessage('Please open a ZS file to convert quotes.');
            return;
        }

        const document = editor.document;
        const fullText = document.getText();
        
        // Convert straight quotes to curly quotes with basic context awareness
        let convertedText = this.convertQuotesInText(fullText);

        // Apply the conversion
        const success = await editor.edit(editBuilder => {
            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(fullText.length)
            );
            editBuilder.replace(fullRange, convertedText);
        });

        if (success) {
            vscode.window.showInformationMessage('Successfully converted quotes to curly quotes!');
        }
    }

    private convertQuotesInText(text: string): string {
        // Simple conversion - you can enhance this with better context awareness
        let result = '';
        let inSingleQuote = false;
        let inDoubleQuote = false;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            
            if (char === "'" && !inDoubleQuote) {
                result += inSingleQuote ? '’' : '‘';
                inSingleQuote = !inSingleQuote;
            } else if (char === '"' && !inSingleQuote) {
                result += inDoubleQuote ? '”' : '“';
                inDoubleQuote = !inDoubleQuote;
            } else {
                result += char;
                
                // Reset quote state on whitespace or punctuation (simple heuristic)
                if (/\s/.test(char)) {
                    inSingleQuote = false;
                    inDoubleQuote = false;
                }
            }
        }

        return result;
    }
}

export function deactivate() {}