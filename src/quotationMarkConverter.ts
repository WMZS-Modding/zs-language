import * as vscode from 'vscode';

export class ZSQuoteConverter {
    private isActive: boolean = false;

    activate(context: vscode.ExtensionContext): void {
        if (this.isActive) {
            return;
        }

        this.isActive = true;
        
        // Listen for text changes in ZS documents
        const disposable = vscode.workspace.onDidChangeTextDocument((event: vscode.TextDocumentChangeEvent) => {
            if (event.document.languageId !== 'zs') {
                return;
            }
            this.handleTextChange(event);
        });

        context.subscriptions.push(disposable);
    }

    private handleTextChange(event: vscode.TextDocumentChangeEvent): void {
        // Your existing quote conversion logic here
        if (event.contentChanges.length === 0) {
            return;
        }

        const change = event.contentChanges[0];
        const typedText = change.text;

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

        const textBefore = lineText.substring(0, position.character);
        const textAfter = lineText.substring(position.character + 1);

        const isOpening = this.shouldBeOpeningQuote(typedText, textBefore, textAfter, document, position);

        editor.edit((editBuilder: vscode.TextEditorEdit) => {
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

    async convertDocumentQuotes(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'zs') {
            vscode.window.showWarningMessage('Please open a ZS file to convert quotes.');
            return;
        }

        const document = editor.document;
        const fullText = document.getText();
        const convertedText = this.convertQuotesInText(fullText);

        const success = await editor.edit((editBuilder: vscode.TextEditorEdit) => {
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
                if (/\s/.test(char)) {
                    inSingleQuote = false;
                    inDoubleQuote = false;
                }
            }
        }
        return result;
    }

    // Optional dispose method if needed
    dispose(): void {
        // Clean up if needed
    }
}