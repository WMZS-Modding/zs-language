# 🌴 ZS Language

ZS is a natural programming language designed to be written in the style of various programming languages, supporting multiple syntax styles. While the language is approachable, careful learning is required to distinguish ZS from similar languages like ZenScript or Z#.

## 📖 How to learn ZS
ZS is designed to be as intuitive as writing daily sentences in English. To write code successfully, you primarily use verbs, nouns, and events. Here are the core word type concepts in ZS:

- **Events**: Triggers that activate functions when specific conditions occur. Always use clear event verbs and avoid misspellings, as errors will cause unexpected behavior or failures
- **Nouns**: Special noun types with specific syntax:
  - Use "itself" (no `{}` needed) to reference the current prefab
  - Use `<>` (Function noun) to call external functions or prefabs
  - Use `/||\` (Tilemap noun) for tilemap references - must use exact tilemap names or scripts will fail
- **Verbs**: Action words that initiate functions. Most common English verbs ("do", "delete", "remove", "replace", "play", "run", etc.) are valid in ZS. However:
  - Emotional verbs cannot be used
  - Verbs that cannot take the -ING suffix cannot be used
  - Allowed auxiliary verbs: "is", "are" only
  - Forbidden forms: past tense ("was", "were", "had", "did"), other auxiliaries ("have", "has", "must", "may", "might", "shall", "should"), "am", and other linking verbs
  - "do" and "does" function as normal verbs, not auxiliaries
  - Using "is" and "are" requires careful attention due to -ING suffix restrictions
- **Adjectives and Adverbs**: Used to complement code but rarely utilized. Most adjectives and adverbs are allowed except:
  - Comparative forms
  - Irregular forms
  - Compliment adverbs
  - Status adverbs  

**Important note**: ZS language only allows "Present Simple", other tenses aren't allowed.

## 🎯 Features
### 🔨 Main features:
- **Syntax highlighting**: Color-coded text helps identify correct syntax and provides a standard programming interface:
  - Misspelled words will not be colored
  - Correctly spelled words may appear white (this is normal)
  - Green verbs = allowed verbs
  - Red verbs = forbidden verbs
  - Blue = nouns, adjectives, pronouns, and related words
  - Cyan = class variables
  - Purple = functions
  - Yellow = numbers
- **Comments**: 
  - Single-line comments use `-/` (inspired by C#'s `//` and LUA's `--`)
  - Block comments use `*/-` to open and `/-*` to close
  - File-level comments use `!` at the top of the file to indicate the ZS flavor/style being used (important for tools and AI systems)
- **Curly quotes**: ZS uses `‘’` and `“”` instead of traditional `'` and `"`. Simply type `'` or `"` and they will automatically convert to curly quotes
- **Verb error detection**: Invalid verbs are highlighted with red underlines and error messages
- **Verb warnings**: Provides warnings when using `is` and `are` to ensure careful usage
- **Invalid character detection**: Detects and highlights problematic characters:
    + Straight quotes (`'` and `"`) are underlined in red
    + Invalid commas and spaces in noun symbols are underlined in red
    + Any non-word/number characters in invalid contexts are underlined in red
- **Math symbol selector**: Since `-`, `*`, and `:` have multiple meanings, this feature helps you choose the correct mathematical symbols. Press `Ctrl/Cmd + '` to open the symbol picker
- **Parenthesis validator**: Enforces mathematical bracket ordering rules in ZS syntax

### ❌ Unsupported features:
- **ZS to C# converter**: Converting natural language ZS code to C# is extremely complex due to the language's design for non-programmers. This feature may never be implemented
- **Spell checking**: While technically possible, manual word list maintenance would be required, which is not feasible due to the time investment needed

## 🗃 Explain some symbols
### `<>` Symbol
This is the normal noun symbol, it's very important. For example, `<Noun>`

### `/||\` Symbol
This is the tilemap noun symbol, primarily used in C# style. It serves as an alternative to `<>`. For example: `/|Tilemap|\

### `!` comment
This is a file-level comment that indicates which ZS style is being used. For example: `! ZS-NORMAL`

### `‘’` and `“”`
ZS uses curly quotes instead of traditional straight quotes. The extension automatically converts `'` and `"` to `‘’` and `“”`. Using curly quotes is required, otherwise the system will report errors

### 📄 Mathematical symbols
Most programming languages use ASCII symbols like `-` (hyphen), `*` (asterisk), `:` (colon), or `/` (slash) for mathematical operations. ZS prohibits these for mathematical calculations and requires proper mathematical symbols:
- `−` (minus sign) instead of hyphen
- `×` (multiplication sign) instead of asterisk  
- `÷` (division sign) instead of colon

Note: `-` is reserved for negative numbers, `:` has specific uses in certain styles, and `*` is rarely used in ZS. Press `Ctrl + '`/`Cmd + '` to access the math symbol selector.
**Examples:**
- Subtraction:
  + `10 - 5`: ❌ Error (hyphen used)
  + `10 − 5`: ✔ Correct (minus sign)
  + `-93 + 39`: ✔ Correct (negative number)
- Multiplication:
  + `16 * 8`: ❌ Error (asterisk used)
  + `16 × 8`: ✔ Correct (multiplication sign)
- Division:
  + `32 : 2`: ❌ Error (colon used)
  + `32 ÷ 2`: ✔ Correct (division sign)

### Set symbols
Common in Python, set operations like `difference`, `union`, and `intersection` are available as verbs. However, ZS also supports symbolic forms for operations like `emptySet`, `complement`, `elementOf`, `subset`, `properSubset`, and `infinity`. Method keywords are still allowed for special cases where symbolic notation cannot be used.

## Note on `null` keywords
Traditional languages use `null`/`None`/`nil` to represent "absence of value", which can lead to null pointer exceptions. ZS prohibits these keywords entirely. Instead, use `∅` (empty set symbol) or `0` to represent absence of value across all types.