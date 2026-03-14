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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const quotationMarkConverter_1 = require("./quotationMarkConverter");
const diagnosticProvider_1 = require("./diagnosticProvider");
const mathSignSelector_1 = require("./mathSignSelector");
const moduleValidator_1 = require("./moduleValidator");
const indentationProvider_1 = require("./indentationProvider");
let quoteConverter;
let diagnosticProvider;
let nounSymbolDiagnosticProvider;
let moduleValidator;
let indentationProvider;
function activate(context) {
    quoteConverter = new quotationMarkConverter_1.ZSQuoteConverter();
    diagnosticProvider = new diagnosticProvider_1.ZSDiagnosticProvider(context);
    nounSymbolDiagnosticProvider = new diagnosticProvider_1.ZSNounSymbolDiagnosticProvider();
    moduleValidator = new moduleValidator_1.ZSModuleValidator();
    indentationProvider = new indentationProvider_1.ZSIndentationProvider();
    quoteConverter.activate(context);
    mathSignSelector_1.ZSMathSignSelector.activate(context);
    const diagnosticDisposable = vscode.workspace.onDidChangeTextDocument((event) => {
        diagnosticProvider.updateDiagnostics(event.document);
        nounSymbolDiagnosticProvider.updateDiagnostics(event.document);
        moduleValidator.updateDiagnostics(event.document);
        indentationProvider.updateDiagnostics(event.document);
    });
    const openDisposable = vscode.workspace.onDidOpenTextDocument((document) => {
        if (document.languageId === 'zs') {
            diagnosticProvider.updateDiagnostics(document);
            nounSymbolDiagnosticProvider.updateDiagnostics(document);
            moduleValidator.updateDiagnostics(document);
            indentationProvider.updateDiagnostics(document);
        }
    });
    vscode.workspace.textDocuments.forEach(document => {
        if (document.languageId === 'zs') {
            diagnosticProvider.updateDiagnostics(document);
            nounSymbolDiagnosticProvider.updateDiagnostics(document);
            moduleValidator.updateDiagnostics(document);
            indentationProvider.updateDiagnostics(document);
        }
    });
    const commandDisposable = vscode.commands.registerCommand('zs.convertQuotes', () => {
        quoteConverter.convertDocumentQuotes();
    });
    context.subscriptions.push(diagnosticDisposable, openDisposable, commandDisposable, moduleValidator, { dispose: () => {
            if (quoteConverter) {
                quoteConverter.dispose?.();
            }
            if (diagnosticProvider) {
                diagnosticProvider.dispose();
            }
            if (nounSymbolDiagnosticProvider) {
                nounSymbolDiagnosticProvider.dispose();
            }
            if (moduleValidator) {
                moduleValidator.dispose();
            }
            if (indentationProvider) {
                indentationProvider.dispose();
            }
        } }, vscode.languages.registerCodeActionsProvider('zs', diagnosticProvider, {
        providedCodeActionKinds: [vscode.CodeActionKind.QuickFix]
    }));
}
function deactivate() {
    if (quoteConverter) {
        quoteConverter.dispose?.();
    }
    if (diagnosticProvider) {
        diagnosticProvider.dispose();
    }
    if (nounSymbolDiagnosticProvider) {
        nounSymbolDiagnosticProvider.dispose();
    }
    if (moduleValidator) {
        moduleValidator.dispose();
    }
    if (indentationProvider) {
        indentationProvider.dispose();
    }
    mathSignSelector_1.ZSMathSignSelector.deactivate();
}
//# sourceMappingURL=extension.js.map