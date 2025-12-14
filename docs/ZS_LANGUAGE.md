# 🌴 ZS Language

It is a natural language, written in the style of different programming languages, and supports default styles. This language is not difficult, but if you do not learn carefully, you will mistake ZS for ZenScript or Z#

## 📖 How to learn my language
My language isn't difficult, just like we write a sentence for daily communication. You just need to use verbs, nouns, events and you can write code successfully. Here're the concepts of word types in ZS language, which are used to write code without being confusing and complicated like other programming languages:
- Events: Known as an event to trigger a function by verb. Always use clear event verbs and avoid misspellings as it will cause errors or unwanted results  
- Nouns: Special noun type. Use "itself" (no need to use `{}`) to make the prefab itself active, use `<>` (*Function noun*), function or local to call an external prefab. `/||\` is the Tilemap noun, you must write correct tilemap name, otherwise, your script won't work
- Verbs: Special type of verb. This verb is very important to initiate the function. Common verbs in English such as "do", "delete", "remove", "replace", "play", "run",... and almost all verbs (except emotional verbs, verbs that can't be suffixed with ING can't be used in this language) are used in ZS language to initiate the function. There are allowed auxiliary verbs such as "is", "are" but no past form ("was", "were", "had, "did"), no other auxiliary verbs ("have", "has", "must", "may", "might", "shall", "should", "do" and "does" are just normal verbs and not auxiliary verbs, etc.), no "am", and no other linking verbs. However, using "is" and "are" isn't easy, because of the restriction of adding ING to regular verbs
- Adjectives and Adverbs: Adjectives and adverbs are special and quite common, but rarely used. Almost all adjectives and adverbs (except comparative, irregular, compliment, and status adverbs which cannot be used in ZS language) are used to complement the code, but are rarely used.  

**Important note**: ZS language only allows "Present Simple", other tenses aren't allowed.

## 🎯 Features
### 🔨 Main features:
- Display text color: This is an important feature, it helps to determine whether the user has written correctly or not and also to make the language interface more standard for programming. If the user writes a misspelling, the feature will not color the word. If the user writes the correct spelling but still sees white, it is okay, as long as the spelling is correct. If you write a verb and it shows green, it is an allowed verb. If you write a verb and it shows red, it is an not allowed verb. Furthermore, blue is the color for nouns, adjectives, pronouns and some other words; cyan is for class variables; purple is for functions; yellow is for numbers
- Comments: The symbol is `-/`. This symbol comes from `//` of C# and `--` of LUA. I have supported block comments as `*/-` and `/-*`. Another comment is `!`. You should add `!` comment on the top of the file to let tools (and AI systems) know which ZS flavor is being used
- New `‘’` and `“”` to replace `'` and `"`: To add this symbols, just enter `'` or `"`, they'll be inserted
- "Verbs error detector": This is an important feature. It'll help you detect the wrong verbs with underline them with red lines, and show error. Not only color red on wrong verbs, but also underline with red lines
- "Warning verbs": This is small feature, but it'll warn you to use `is` and `are` carefully
- "Non-word/number characters detector": The important features, it contains previous features:
    + "Quotes detector": This is small feature, but it's important. When you write `'` and/or `"`, it'll underline them with red lines
    + "Commas Detector" and "Spaces Detector": Both features are the same in underline with red lines, but they're handle symbols differently, for noun symbols only
    + Moreover, it'll underline any non-word/number characters with red lines
- "Math selector": Because `-`, `*` and `:` aren't both negative sign and minus sign, multiplication sign, division sign; this feature will help you choose negative sign or real minus sign when you enter `-`, `*` or `:`

### ❌ Unsupported features:
- ZS to C# and LUA converter: it is very difficult to create this feature. Since my language is easy to write for non-programmers, creating a TS script to convert ZS code to C# and LUA code is very difficult, even failed and may never be done
- Spell checking for words: although possible, it is not possible because it still has to be added manually, making me have to search online, wasting time

## 🗃 Explain some symbols
### `<>` Symbol
This is the normal noun symbol, it's very important. For example, `<Noun>`

### `/||\` Symbol
This is the tilemap noun symbol, it's just used on C# style. This symbol is just replace `<>`. For example, `/|Tilemap|\`

### `!` comment
This is the important comment. It helps system know what style ZS language is written in. For example, `! ZS-NORMAL`

### `‘’` and `“”`
These are the important symbol. Instead of using `'` and `"` traditionaly, ZS language uses `‘’` and `“”`. `quotationMarkConverter.js` helps you convert `'` and `"` to `‘’` and `“”`. You should use them, otherwise system will throw an error

### 📄 New math signs
Most programming languages use available symbols like `-` (Hypen), `*` (Asterisk), `:` (Colon) or `/` (Slash) as negative and minus sign, multiplication sign, division sign. However, ZS Language prohibit them to use for mathematic (number) and you must use new math signs like `−` (Minus), `×` (Multiplication), `÷` (Division). To use old math signs, you must know that `-` is negative sign, `:` is for some styles, `*` isn't often used in ZS. To choose old and new math signs, `mathSignSelector.js` will help you when you press `Ctrl + '`/`Cmd + '`
- Example for `-` vs `−`:
    + `10 - 5`: ❌ Error
    + `10 − 5`: ✔ Correct
    + `-93 + 39`: ✔ Correct
- Example for `*` vs `×`:
    + `16 * 8`: ❌ Error
    + `16 × 8`: ✔ Corect
- Example for `:` vs `÷`:
    + `32 : 2`: ❌ Error
    + `32 ÷ 2`: ✔ Correct

### Set symbols
This is most common in PYTHON. The methods (but they are verbs) `difference`, `union`, `intersection` are all used, but other methods like `emptySet`, `complement`, `elementOf`, `subset`, `properSubset`, and even `infinity` are not used. In ZS, they are used but in symbolic form. I still allow the method keyword, but only for special cases where symbolic notation is not possible.

## Note for `null` keywords
Traditional languages use `null`/`None`/`nil` to represent "absence of value". This leads to the "billion-dollar mistake" of null pointer exceptions.

But ZS works differently. It prohibits the use of the null keyword, but it still allows the use of `∅` and `0` instead. So, avoid using these keywords for all types in ZS, use those replacement symbols instead.