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
exports.ZSMinusSignSelector = void 0;
const vscode = __importStar(require("vscode"));
class ZSMinusSignSelector {
    static activate(context) {
        const selectMinusCommand = vscode.commands.registerCommand('zs.selectMinusSign', () => {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document.languageId === 'zs') {
                this.showSignSelector(editor);
            }
        });
        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument((event) => {
            if (this.isActive)
                return;
            const editor = vscode.window.activeTextEditor;
            if (!editor || event.document !== editor.document || event.document.languageId !== 'zs') {
                return;
            }
            const now = Date.now();
            if (now - this.lastChangeTime < 100)
                return;
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
    static showSignSelector(editor) {
        const document = editor.document;
        const position = editor.selection.active;
        const previousPosition = position.translate(0, -1);
        if (previousPosition.character < 0)
            return;
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
                detail: 'Use for negative numbers: -5, -3.14, -value'
            },
            {
                label: '−',
                description: 'Minus sign (true subtraction)',
                detail: 'Use for subtraction: 10 − 2, x − y, result − offset'
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
    static deactivate() {
        this.isActive = false;
    }
}
exports.ZSMinusSignSelector = ZSMinusSignSelector;
ZSMinusSignSelector.isActive = false;
ZSMinusSignSelector.lastChangeTime = 0;
//# sourceMappingURL=minusSignSelector.js.map