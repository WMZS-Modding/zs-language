import * as vscode from 'vscode';
import { ZSQuoteConverter } from './quotationMarkConverter';
import { ZSDiagnosticProvider, ZSDiagnosticProviderWarning } from './diagnosticProvider';

let quoteConverter: ZSQuoteConverter;
let diagnosticProvider: ZSDiagnosticProvider;
let warningDiagnosticProvider: ZSDiagnosticProviderWarning;

export function activate(context: vscode.ExtensionContext): void {
    console.log('ZS language extension is now active!');
    
    // Initialize both components
    quoteConverter = new ZSQuoteConverter();
    diagnosticProvider = new ZSDiagnosticProvider(context);
    warningDiagnosticProvider = new ZSDiagnosticProviderWarning();

    // Activate quote converter
    quoteConverter.activate(context);
    
    // Register diagnostic provider events
    const diagnosticDisposable = vscode.workspace.onDidChangeTextDocument((event) => {
        diagnosticProvider.updateDiagnostics(event.document);
        warningDiagnosticProvider.updateDiagnostics(event.document);
    });

    const openDisposable = vscode.workspace.onDidOpenTextDocument((document) => {
        if (document.languageId === 'zs') {
            diagnosticProvider.updateDiagnostics(document);
            warningDiagnosticProvider.updateDiagnostics(document);
        }
    });

    // Initial diagnostics for open documents
    vscode.workspace.textDocuments.forEach(document => {
        if (document.languageId === 'zs') {
            diagnosticProvider.updateDiagnostics(document);
            warningDiagnosticProvider.updateDiagnostics(document);
        }
    });

    // Register manual conversion command
    const commandDisposable = vscode.commands.registerCommand('zs.convertQuotes', () => {
        quoteConverter.convertDocumentQuotes();
    });

    // Add all disposables to context
    context.subscriptions.push(
        diagnosticDisposable,
        openDisposable,
        commandDisposable,
        { dispose: () => {
            if (quoteConverter) { quoteConverter.dispose?.(); }
            if (diagnosticProvider) { diagnosticProvider.dispose(); }
            if (warningDiagnosticProvider) { warningDiagnosticProvider.dispose(); }
        }}
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
}