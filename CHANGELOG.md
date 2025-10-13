# Change Log
- Fix `diagnosticProvider.ts` that doesn't underline wrong verbs with red underline before/after `<>`, `()`, `/||\`, `-/`, `*/-`, `/-*`
- Delete `detectInvalidSpaces` and keep all functions of class `ZSSpaceDiagnosticProvider`
- Copy class `ZSSpaceDiagnosticProvider` and rename to `ZSQuotesDiagnosticProvider`, then modify to underline `'` and `"` with red underline
- Up to version 0.1.11