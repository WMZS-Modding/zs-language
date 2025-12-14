import * as vscode from 'vscode';

export class ZSMinusSignSelector {
    private static isActive = false;
    private static lastChangeTime = 0;

    public static activate(context: vscode.ExtensionContext) {
        const selectMinusCommand = vscode.commands.registerCommand('zs.selectMinusSign', () => {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document.languageId === 'zs') {
                this.showSignSelector(editor);
            }
        });

        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument((event) => {
            if (this.isActive) return;
            
            const editor = vscode.window.activeTextEditor;
            if (!editor || event.document !== editor.document || event.document.languageId !== 'zs') {
                return;
            }

            const now = Date.now();
            if (now - this.lastChangeTime < 100) return;
            this.lastChangeTime = now;

            event.contentChanges.forEach(change => {
                if (change.text === '-') {
                    this.isActive = true;
                    setTimeout(() => {
                        this.showSignSelector(editor);
                    }, 50);
                }
            });
        });

        context.subscriptions.push(selectMinusCommand);
        context.subscriptions.push(changeDocumentSubscription);
    }

    public static showSignSelector(editor: vscode.TextEditor): void {
        const document = editor.document;
        const position = editor.selection.active;

        const previousPosition = position.translate(0, -1);
        if (previousPosition.character < 0) return;
        
        const rangeBefore = new vscode.Range(previousPosition, position);
        const textBefore = document.getText(rangeBefore);
        
        if (textBefore !== '-') {
            this.isActive = false;
            return;
        }

        const quickPick = vscode.window.createQuickPick();
        
        quickPick.title = 'Select Minus Sign Type';
        quickPick.placeholder = 'Choose the correct mathematical symbol';
        
        quickPick.items = [
            { 
                label: '-', 
                description: 'Negative sign',
                detail: 'Use for negative numbers'
            },
            { 
                label: '−', 
                description: 'Minus sign',
                detail: 'Use for subtraction'
            }
        ];

        quickPick.onDidChangeSelection(selection => {
            if (selection[0]) {
                const edit = new vscode.WorkspaceEdit();

                const rangeToReplace = new vscode.Range(previousPosition, position);
                edit.replace(document.uri, rangeToReplace, selection[0].label);
                
                vscode.workspace.applyEdit(edit).then(success => {
                    if (success) {
                        const newPosition = previousPosition.translate(0, selection[0].label.length);
                        editor.selection = new vscode.Selection(newPosition, newPosition);
                    }
                    this.isActive = false;
                });
                
                quickPick.dispose();
            }
        });

        quickPick.onDidHide(() => {
            this.isActive = false;
            quickPick.dispose();
        });

        quickPick.show();
    }

    public static deactivate() {
        this.isActive = false;
    }
}

export class ZSMultiplicationSignSelector {
    private static isActive = false;
    private static lastChangeTime = 0;

    public static activate(context: vscode.ExtensionContext) {
        const selectMultiplicationCommand = vscode.commands.registerCommand('zs.selectMultiplicationSign', () => {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document.languageId === 'zs') {
                this.showSignSelector(editor);
            }
        });

        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument((event) => {
            if (this.isActive) return;
            
            const editor = vscode.window.activeTextEditor;
            if (!editor || event.document !== editor.document || event.document.languageId !== 'zs') {
                return;
            }

            const now = Date.now();
            if (now - this.lastChangeTime < 100) return;
            this.lastChangeTime = now;

            event.contentChanges.forEach(change => {
                if (change.text === '*') {
                    this.isActive = true;
                    setTimeout(() => {
                        this.showSignSelector(editor);
                    }, 50);
                }
            });
        });

        context.subscriptions.push(selectMultiplicationCommand);
        context.subscriptions.push(changeDocumentSubscription);
    }

    public static showSignSelector(editor: vscode.TextEditor): void {
        const document = editor.document;
        const position = editor.selection.active;

        const previousPosition = position.translate(0, -1);
        if (previousPosition.character < 0) return;
        
        const rangeBefore = new vscode.Range(previousPosition, position);
        const textBefore = document.getText(rangeBefore);
        
        if (textBefore !== '*') {
            this.isActive = false;
            return;
        }

        const quickPick = vscode.window.createQuickPick();
        
        quickPick.title = 'Select Multiplication Sign Type';
        quickPick.placeholder = 'Choose the correct mathematical symbol';
        
        quickPick.items = [
            { 
                label: '*', 
                description: 'Normal Multiplication sign',
                detail: 'The normal Multiplication sign, but it isn\'t recommend'
            },
            { 
                label: '×', 
                description: 'Multiplication sign',
                detail: 'The real Multiplication sign'
            }
        ];

        quickPick.onDidChangeSelection(selection => {
            if (selection[0]) {
                const edit = new vscode.WorkspaceEdit();

                const rangeToReplace = new vscode.Range(previousPosition, position);
                edit.replace(document.uri, rangeToReplace, selection[0].label);
                
                vscode.workspace.applyEdit(edit).then(success => {
                    if (success) {
                        const newPosition = previousPosition.translate(0, selection[0].label.length);
                        editor.selection = new vscode.Selection(newPosition, newPosition);
                    }
                    this.isActive = false;
                });
                
                quickPick.dispose();
            }
        });

        quickPick.onDidHide(() => {
            this.isActive = false;
            quickPick.dispose();
        });

        quickPick.show();
    }

    public static deactivate() {
        this.isActive = false;
    }
}

export class ZSDivisionSignSelector {
    private static isActive = false;
    private static lastChangeTime = 0;

    public static activate(context: vscode.ExtensionContext) {
        const selectDivisionCommand = vscode.commands.registerCommand('zs.selectDivisionSign', () => {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document.languageId === 'zs') {
                this.showSignSelector(editor);
            }
        });

        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument((event) => {
            if (this.isActive) return;
            
            const editor = vscode.window.activeTextEditor;
            if (!editor || event.document !== editor.document || event.document.languageId !== 'zs') {
                return;
            }

            const now = Date.now();
            if (now - this.lastChangeTime < 100) return;
            this.lastChangeTime = now;

            event.contentChanges.forEach(change => {
                if (change.text === ':') {
                    this.isActive = true;
                    setTimeout(() => {
                        this.showSignSelector(editor);
                    }, 50);
                }
            });
        });

        context.subscriptions.push(selectDivisionCommand);
        context.subscriptions.push(changeDocumentSubscription);
    }

    public static showSignSelector(editor: vscode.TextEditor): void {
        const document = editor.document;
        const position = editor.selection.active;

        const previousPosition = position.translate(0, -1);
        if (previousPosition.character < 0) return;
        
        const rangeBefore = new vscode.Range(previousPosition, position);
        const textBefore = document.getText(rangeBefore);
        
        if (textBefore !== ':') {
            this.isActive = false;
            return;
        }

        const quickPick = vscode.window.createQuickPick();
        
        quickPick.title = 'Select Division Sign Type';
        quickPick.placeholder = 'Choose the correct mathematical symbol';
        
        quickPick.items = [
            { 
                label: ':', 
                description: 'Colon',
                detail: 'Use for coding, not for math'
            },
            { 
                label: '÷', 
                description: 'Division sign',
                detail: 'Real Division sign, use for math'
            }
        ];

        quickPick.onDidChangeSelection(selection => {
            if (selection[0]) {
                const edit = new vscode.WorkspaceEdit();

                const rangeToReplace = new vscode.Range(previousPosition, position);
                edit.replace(document.uri, rangeToReplace, selection[0].label);
                
                vscode.workspace.applyEdit(edit).then(success => {
                    if (success) {
                        const newPosition = previousPosition.translate(0, selection[0].label.length);
                        editor.selection = new vscode.Selection(newPosition, newPosition);
                    }
                    this.isActive = false;
                });
                
                quickPick.dispose();
            }
        });

        quickPick.onDidHide(() => {
            this.isActive = false;
            quickPick.dispose();
        });

        quickPick.show();
    }

    public static deactivate() {
        this.isActive = false;
    }
}