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
exports.ZSQuoteConverter = void 0;
const vscode = __importStar(require("vscode"));
class ZSQuoteConverter {
    constructor() {
        this.isActive = false;
    }
    activate(context) {
        if (this.isActive) {
            return;
        }
        this.isActive = true;
        const disposable = vscode.workspace.onDidChangeTextDocument((event) => {
            if (event.document.languageId !== 'zs') {
                return;
            }
            this.handleTextChange(event);
        });
        context.subscriptions.push(disposable);
    }
    handleTextChange(event) {
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
        editor.edit((editBuilder) => {
            const replacement = this.getReplacementQuote(typedText, isOpening);
            editBuilder.replace(change.range, replacement);
        });
    }
    shouldBeOpeningQuote(quote, textBefore, textAfter, document, position) {
        const charBefore = textBefore[textBefore.length - 1];
        const isAfterWhitespace = !charBefore || /[\s\{\(\[\<]/.test(charBefore);
        return isAfterWhitespace;
    }
    getReplacementQuote(originalQuote, isOpening) {
        if (originalQuote === "'") {
            return isOpening ? '‘' : '’';
        }
        else if (originalQuote === '"') {
            return isOpening ? '“' : '”';
        }
        return originalQuote;
    }
    async convertDocumentQuotes() {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'zs') {
            vscode.window.showWarningMessage('Please open a ZS file to convert quotes.');
            return;
        }
        const document = editor.document;
        const fullText = document.getText();
        const convertedText = this.convertQuotesInText(fullText);
        const success = await editor.edit((editBuilder) => {
            const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(fullText.length));
            editBuilder.replace(fullRange, convertedText);
        });
        if (success) {
            vscode.window.showInformationMessage('Successfully converted quotes to curly quotes!');
        }
    }
    convertQuotesInText(text) {
        let result = '';
        let inSingleQuote = false;
        let inDoubleQuote = false;
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === "'" && !inDoubleQuote) {
                result += inSingleQuote ? '’' : '‘';
                inSingleQuote = !inSingleQuote;
            }
            else if (char === '"' && !inSingleQuote) {
                result += inDoubleQuote ? '”' : '“';
                inDoubleQuote = !inDoubleQuote;
            }
            else {
                result += char;
                if (/\s/.test(char)) {
                    inSingleQuote = false;
                    inDoubleQuote = false;
                }
            }
        }
        return result;
    }
    dispose() {
    }
}
exports.ZSQuoteConverter = ZSQuoteConverter;
//# sourceMappingURL=quotationMarkConverter.js.map