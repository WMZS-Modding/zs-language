import * as vscode from 'vscode';

export class ZSMathSignSelector {
    private static isActive = false;

    static activate(context: vscode.ExtensionContext) {
        const mathSignCommand = vscode.commands.registerCommand('zs.selectMathSign', () => {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document.languageId === 'zs') {
                this.showMathSignSelector(editor);
            }
        });

        context.subscriptions.push(mathSignCommand);
    }

    static showMathSignSelector(editor: vscode.TextEditor) {
        if (this.isActive) {
            return;
        }
        
        this.isActive = true;
        const quickPick = vscode.window.createQuickPick();
        quickPick.title = 'Select Set Operation Symbol';
        quickPick.placeholder = 'Choose the correct mathematical set symbol';
        
        quickPick.items = [
            { label: '−', description: 'Minus', detail: 'Real minus sign (not hyphen)' },
            { label: '×', description: 'Multiplication', detail: 'Real multiplication sign' },
            { label: '÷', description: 'Division', detail: 'Real division sign' },
            { label: '⋮', description: 'Divisibility' },
            { label: '⋮̸', description: 'Not divisibility' },
            { label: '≠', description: 'Not Equal', detail: 'Mathematical inequality symbol' },
            { label: '≤', description: 'Less Than or Equal', detail: '≤ (replaces <=)' },
            { label: '≥', description: 'Greater Than or Equal', detail: '≥ (replaces >=)' },
            { label: '±', description: 'Plus-minus' },
            { label: '∓', description: 'Minus-plus' },

            { label: '∩', description: 'Intersection', detail: 'A ∩ B - Elements in both' },
            { label: '∪', description: 'Union', detail: 'A ∪ B - Elements in either' },
            { label: '∅', description: 'Empty Set', detail: 'The set with no elements' },
            { label: 'C∨', description: 'Complement', detail: 'C∨A(B) - Complement of B in A' },
            { label: '∈', description: 'Element of', detail: 'x ∈ A - x is an element of A' },
            { label: '∉', description: 'Not element of' },
            { label: '⊆', description: 'Equal Subset', detail: 'A ⊆ B - A is an equal subset of B' },
            { label: '⊂', description: 'Subset', detail: 'A ⊂ B - A is a subset of B' },
            { label: '⊄', description: 'Not Subset' },
            { label: '⊇', description: 'Equal Superset', detail: 'A ⊇ B - A is an equal superset of B' },
            { label: '⊃', description: 'Superset', detail: 'A ⊃ B - A is a superset of B' },
            { label: '⊅', description: 'Not Superset' },
            { label: '∀', description: 'For all' },
            { label: '∃', description: 'There exists' },
            { label: '∄', description: 'There doesn\'t exist' },
            { label: '→', description: 'Implies' },
            { label: '↔', description: 'Iff' },
            { label: '≈', description: 'Approximation' },
            { label: '≡', description: 'Congruence' },

            { label: '¬', description: 'Not', detail: 'You can use "not" or "¬", both are valid' },
            { label: '∧', description: 'And', detail: 'You can use "and" or "∧", both are valid' },
            { label: '∨', description: 'Or', detail: 'You can use "or" or "∨", both are valid' },

            { label: 'ℕ', description: 'Natural Numbers', detail: 'ℕ = {0, 1, 2, 3, ...}' },
            { label: 'ℤ', description: 'Integers', detail: 'ℤ = {..., -2, -1, 0, 1, 2, ...}' },
            { label: 'ℚ', description: 'Rational Numbers', detail: 'ℚ = {p / q where p, q ∈ ℤ, q ≠ 0}' },
            { label: 'ℝ', description: 'Real Numbers', detail: 'All numbers on number line' },
            { label: 'ℂ', description: 'Complex Numbers', detail: 'ℂ = {a + bi where a, b ∈ ℝ}' },
            { label: 'ℙ', description: 'Prime Numbers', detail: 'ℙ = {2, 3, 5, 7, 11, ...}' },
            { label: '𝕀', description: 'Irrational/Imaginary Numbers', detail: 'ℝ \\ ℚ (reals not rational) | ℂ \\ ℝ (complex not reals)' },
            { label: '𝔸', description: 'Algebraic Numbers' },

            { label: '△', description: 'Triangle', detail: '△(A, B, C)' },
            { label: '□', description: 'Square/Quadrilateral', detail: '□(A, B, C, D)' },
            { label: '○', description: 'Circle', detail: '○(x, y, z)' },
            { label: '∠', description: 'Angle', detail: '∠A = 90°' },
            { label: '⊥', description: 'Perpendicular', detail: 'AB ⊥ CD' },
            { label: '∥', description: 'Parallel', detail: 'AB ∥ CD' },
            { label: 'Δ', description: 'Delta (Triangle shape)' },
            { label: '∇', description: 'Nabla' },
            { label: '∽', description: 'Similarity', detail: '△(A, B, C) ∽ △(M, N, P)' },
            { label: '°', description: 'Degree' },
            { label: 'α', description: 'Alpha' },
            { label: 'β', description: 'Beta' },
            { label: 'δ', description: 'Delta (S shape)' },
            { label: 'ϵ', description: 'Epsilon' },
            { label: 'η', description: 'Eta' },
            { label: 'γ', description: 'Gamma' },
            { label: 'ω', description: 'Omega (W shape)' },
            { label: 'Ω', description: 'Omega (Q shape)' },
            { label: 'π', description: 'Pi' },
            { label: '∂', description: 'Partial' },
            { label: 'ρ', description: 'Rho' },
            { label: 'τ', description: 'Tau' },

            { label: '+∞', description: 'Positive Infinity', detail: 'Limit approaching infinity' },
            { label: '−∞', description: 'Negative Infinity', detail: 'Limit approaching negative infinity' }
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