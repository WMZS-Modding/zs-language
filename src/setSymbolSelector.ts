import * as vscode from 'vscode';

export class ZSSetSymbolSelector {
    private static isActive = false;

    static activate(context: vscode.ExtensionContext) {
        const setSymbolCommand = vscode.commands.registerCommand('zs.selectSetSymbol', () => {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document.languageId === 'zs') {
                this.showSetSymbolSelector(editor);
            }
        });

        context.subscriptions.push(setSymbolCommand);
    }

    static showSetSymbolSelector(editor: vscode.TextEditor) {
        if (this.isActive) {
            return;
        }
        
        this.isActive = true;
        const quickPick = vscode.window.createQuickPick();
        quickPick.title = 'Select Set Operation Symbol';
        quickPick.placeholder = 'Choose the correct mathematical set symbol';
        
        quickPick.items = [
            {
                label: '∩',
                description: 'Intersection',
                detail: 'A ∩ B - Elements in both A and B'
            },
            {
                label: '∪', 
                description: 'Union',
                detail: 'A ∪ B - Elements in A or B or both'
            },
            {
                label: '∅',
                description: 'Empty Set',
                detail: 'The set with no elements'
            },
            {
                label: 'C∨',
                description: 'Complement',
                detail: 'C∨A(B) - Elements in A but not in B (Complement)'
            },
            {
                label: '∈',
                description: 'Element of', 
                detail: 'x ∈ A - x is an element of A'
            },
            {
                label: '⊆',
                description: 'Proper Subset',
                detail: 'A ⊆ B - A is a proper subset of B'
            },
            {
                label: '⊂',
                description: 'Subset',
                detail: 'A ⊂ B - A is a subset of B'
            },
            {
                label: '+∞',
                description: 'Positive Infinity'
            },
            {
                label: "−∞",
                description: "Negative Infinity"
            }
        ];

        quickPick.onDidChangeSelection(selection => {
            if (selection[0]) {
                const position = editor.selection.active;
                const edit = new vscode.WorkspaceEdit();
                const range = new vscode.Range(position, position);
                
                edit.insert(editor.document.uri, position, selection[0].label);
                vscode.workspace.applyEdit(edit).then(success => {
                    if (success) {
                        const newPosition = position.translate(0, selection[0].label.length);
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

    static deactivate() {
        this.isActive = false;
    }
}