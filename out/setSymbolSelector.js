"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZSSetSymbolSelector = void 0;
const vscode = __importStar(require("vscode"));
class ZSSetSymbolSelector {
    static activate(context) {
        const setSymbolCommand = vscode.commands.registerCommand('zs.selectSetSymbol', () => {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document.languageId === 'zs') {
                this.showSetSymbolSelector(editor);
            }
        });
        context.subscriptions.push(setSymbolCommand);
    }
    static showSetSymbolSelector(editor) {
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
exports.ZSSetSymbolSelector = ZSSetSymbolSelector;
ZSSetSymbolSelector.isActive = false;
//# sourceMappingURL=setSymbolSelector.js.map