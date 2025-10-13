import * as vscode from 'vscode';
import { ZSQuoteConverter } from './quotationMarkConverter';
import { ZSDiagnosticProvider, ZSDiagnosticProviderWarning, ZSCommaDiagnosticProvider, ZSSpaceDiagnosticProvider } from './diagnosticProvider';

let quoteConverter: ZSQuoteConverter;
let diagnosticProvider: ZSDiagnosticProvider;
let warningDiagnosticProvider: ZSDiagnosticProviderWarning;
let commaDiagnosticProvider : ZSCommaDiagnosticProvider;
let spaceDiagnosticProvider : ZSSpaceDiagnosticProvider;

export function activate(context: vscode.ExtensionContext): void {
    console.log('ZS language extension is now active!');
    
    quoteConverter = new ZSQuoteConverter();
    diagnosticProvider = new ZSDiagnosticProvider(context);
    warningDiagnosticProvider = new ZSDiagnosticProviderWarning();
    commaDiagnosticProvider = new ZSCommaDiagnosticProvider();
    spaceDiagnosticProvider = new ZSSpaceDiagnosticProvider();

    quoteConverter.activate(context);
    
    const diagnosticDisposable = vscode.workspace.onDidChangeTextDocument((event) => {
        diagnosticProvider.updateDiagnostics(event.document);
        warningDiagnosticProvider.updateDiagnostics(event.document);
        commaDiagnosticProvider.updateDiagnostics(event.document);
        spaceDiagnosticProvider.updateDiagnostics(event.document);
    });

    const openDisposable = vscode.workspace.onDidOpenTextDocument((document) => {
        if (document.languageId === 'zs') {
            diagnosticProvider.updateDiagnostics(document);
            warningDiagnosticProvider.updateDiagnostics(document);
            commaDiagnosticProvider.updateDiagnostics(document);
            spaceDiagnosticProvider.updateDiagnostics(document);
        }
    });

    vscode.workspace.textDocuments.forEach(document => {
        if (document.languageId === 'zs') {
            diagnosticProvider.updateDiagnostics(document);
            warningDiagnosticProvider.updateDiagnostics(document);
            commaDiagnosticProvider.updateDiagnostics(document);
            spaceDiagnosticProvider.updateDiagnostics(document);
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
            if (warningDiagnosticProvider) { warningDiagnosticProvider.dispose(); }
            if (commaDiagnosticProvider) { commaDiagnosticProvider.dispose(); }
            if (spaceDiagnosticProvider) { spaceDiagnosticProvider.dispose(); }
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
    if (commaDiagnosticProvider) {
        commaDiagnosticProvider.dispose();
    }
    if (spaceDiagnosticProvider) {
        spaceDiagnosticProvider.dispose();
    }
}