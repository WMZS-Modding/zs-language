import * as vscode from 'vscode';
import { ZSQuoteConverter } from './quotationMarkConverter';
import { ZSDiagnosticProvider, ZSDiagnosticProviderWarning, ZSNounSymbolDiagnosticProvider } from './diagnosticProvider';
import { ZSMinusSignSelector, ZSMultiplicationSignSelector, ZSDivisionSignSelector } from './mathSignSelector';
import { ZSSetSymbolSelector } from './setSymbolSelector';
import { ZSModuleValidator } from './moduleValidator';

let quoteConverter: ZSQuoteConverter;
let diagnosticProvider: ZSDiagnosticProvider;
let warningDiagnosticProvider: ZSDiagnosticProviderWarning;
let nounSymbolDiagnosticProvider: ZSNounSymbolDiagnosticProvider;
let moduleValidator: ZSModuleValidator;

export function activate(context: vscode.ExtensionContext): void {
    quoteConverter = new ZSQuoteConverter();
    diagnosticProvider = new ZSDiagnosticProvider(context);
    warningDiagnosticProvider = new ZSDiagnosticProviderWarning();
    nounSymbolDiagnosticProvider = new ZSNounSymbolDiagnosticProvider();
    moduleValidator = new ZSModuleValidator();

    quoteConverter.activate(context);
    ZSMinusSignSelector.activate(context);
    ZSMultiplicationSignSelector.activate(context);
    ZSDivisionSignSelector.activate(context);
    ZSSetSymbolSelector.activate(context);
    
    const diagnosticDisposable = vscode.workspace.onDidChangeTextDocument((event) => {
        diagnosticProvider.updateDiagnostics(event.document);
        warningDiagnosticProvider.updateDiagnostics(event.document);
        nounSymbolDiagnosticProvider.updateDiagnostics(event.document);
        moduleValidator.updateDiagnostics(event.document);
    });

    const openDisposable = vscode.workspace.onDidOpenTextDocument((document) => {
        if (document.languageId === 'zs') {
            diagnosticProvider.updateDiagnostics(document);
            warningDiagnosticProvider.updateDiagnostics(document);
            nounSymbolDiagnosticProvider.updateDiagnostics(document);
            moduleValidator.updateDiagnostics(document);
        }
    });

    vscode.workspace.textDocuments.forEach(document => {
        if (document.languageId === 'zs') {
            diagnosticProvider.updateDiagnostics(document);
            warningDiagnosticProvider.updateDiagnostics(document);
            nounSymbolDiagnosticProvider.updateDiagnostics(document);
            moduleValidator.updateDiagnostics(document);
        }
    });

    const commandDisposable = vscode.commands.registerCommand('zs.convertQuotes', () => {
        quoteConverter.convertDocumentQuotes();
    });

    context.subscriptions.push(
        diagnosticDisposable,
        openDisposable,
        commandDisposable,
        moduleValidator,
        { dispose: () => {
            if (quoteConverter) { quoteConverter.dispose?.(); }
            if (diagnosticProvider) { diagnosticProvider.dispose(); }
            if (warningDiagnosticProvider) { warningDiagnosticProvider.dispose(); }
            if (nounSymbolDiagnosticProvider) { nounSymbolDiagnosticProvider.dispose(); }
            if (moduleValidator) { moduleValidator.dispose(); }
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
    if (warningDiagnosticProvider) {
        warningDiagnosticProvider.dispose();
    }
    if (nounSymbolDiagnosticProvider) {
        nounSymbolDiagnosticProvider.dispose();
    }
    if (moduleValidator) {
        moduleValidator.dispose();
    }

    ZSMinusSignSelector.deactivate();
    ZSMultiplicationSignSelector.deactivate();
    ZSDivisionSignSelector.deactivate();
    ZSSetSymbolSelector.deactivate();
}
