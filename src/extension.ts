import * as vscode from 'vscode';
import { ZSQuoteConverter } from './quotationMarkConverter';
import { ZSDiagnosticProvider, ZSNounSymbolDiagnosticProvider } from './diagnosticProvider';
import { ZSMathSignSelector } from './mathSignSelector';
import { ZSModuleValidator } from './moduleValidator';
import { ZSParenthesisValidator } from './parenthesisValidator';

let quoteConverter: ZSQuoteConverter;
let diagnosticProvider: ZSDiagnosticProvider;
let nounSymbolDiagnosticProvider: ZSNounSymbolDiagnosticProvider;
let moduleValidator: ZSModuleValidator;
let parenthesisValidator: ZSParenthesisValidator;

export function activate(context: vscode.ExtensionContext): void {
    quoteConverter = new ZSQuoteConverter();
    diagnosticProvider = new ZSDiagnosticProvider(context);
    nounSymbolDiagnosticProvider = new ZSNounSymbolDiagnosticProvider();
    moduleValidator = new ZSModuleValidator();
    parenthesisValidator = new ZSParenthesisValidator();

    quoteConverter.activate(context);
    ZSMathSignSelector.activate(context);
    moduleValidator.activate(context);
    parenthesisValidator.activate(context);

    const diagnosticDisposable = vscode.workspace.onDidChangeTextDocument((event) => {
        diagnosticProvider.updateDiagnostics(event.document);
        nounSymbolDiagnosticProvider.updateDiagnostics(event.document);
    });

    const openDisposable = vscode.workspace.onDidOpenTextDocument((document) => {
        if (document.languageId === 'zs') {
            diagnosticProvider.updateDiagnostics(document);
            nounSymbolDiagnosticProvider.updateDiagnostics(document);
        }
    });

    vscode.workspace.textDocuments.forEach(document => {
        if (document.languageId === 'zs') {
            diagnosticProvider.updateDiagnostics(document);
            nounSymbolDiagnosticProvider.updateDiagnostics(document);
        }
    });

    const commandDisposable = vscode.commands.registerCommand('zs.convertQuotes', () => {
        quoteConverter.convertDocumentQuotes();
    });

    context.subscriptions.push(
        diagnosticDisposable,
        openDisposable,
        commandDisposable,
        { dispose: () => {
            if (quoteConverter) { quoteConverter.dispose?.(); }
            if (diagnosticProvider) { diagnosticProvider.dispose(); }
            if (nounSymbolDiagnosticProvider) { nounSymbolDiagnosticProvider.dispose(); }
        }},
        vscode.languages.registerCodeActionsProvider('zs', diagnosticProvider, {
            providedCodeActionKinds: [vscode.CodeActionKind.QuickFix]
        })
    );
}

export function deactivate(): void {
    if (quoteConverter) {
        quoteConverter.dispose?.();
    }
    if (diagnosticProvider) {
        diagnosticProvider.dispose();
    }
    if (nounSymbolDiagnosticProvider) {
        nounSymbolDiagnosticProvider.dispose();
    }

    ZSMathSignSelector.deactivate();
}