# ZS Language

It is a new language, used for my games. This language plays an important role in creating Plugins for my games.

## How to learn my language

My language isn't difficult, just like we write a sentence for daily communication. You just need to use verbs, nouns, events and you can write code successfully. Here're the concepts of word types in ZS language, which are used to write code without being confusing and complicated like other programming languages:

- Events: Known as an event to trigger a function by verb. Always use clear event verbs and avoid misspellings as it will cause errors or unwanted results  
- Nouns: Special noun type. Use "itself" (no need to use `{}`) to make the prefab itself active, use `<>` and `()` for tag or prefab to call an external prefab  
- Verbs: Special type of verb. This verb is very important to initiate the function. Common verbs in English such as "do", "delete", "remove", "replace", "play", "run",... and almost all verbs (except emotional verbs, verbs that can't be suffixed with ING can't be used in this language) are used in ZS language to initiate the function. There are allowed auxiliary verbs such as "is", "are" but no past form ("was", "were", "had, "did"), no other auxiliary verbs ("have", "has", "must", "may", "might", "shall", "should", "do" and "does" are just normal verbs and not auxiliary verbs, etc.), no "am", and no other linking verbs. However, using "is" and "are" isn't easy, because of the restriction of adding ING to regular verbs
- Adjectives and Adverbs: Adjectives and adverbs are special and quite common, but rarely used. Almost all adjectives and adverbs (except comparative, irregular, compliment, and status adverbs which cannot be used in ZS language) are used to complement the code, but are rarely used.  

**Important note**: ZS language only allows "Present Simple", other tenses aren't allowed.

# ZS Language Extension

This is an extension for Visual Studio Code. The role of this extension is to clarify what the ZS language is, showing wrong words in red, only showing correct verbs and some other words in green/blue. Currently, this extension is only a test version, not supporting many new features. In the future, if there is any user to help, I will develop additional features for this extension.

## Features

ZS-C#:

![ZS-C#](https://raw.githubusercontent.com/SuperHero2010/Test/refs/heads/main/Archive/20250626_094438_Modified.gif)

ZS-LUA:

![ZS-LUA](https://raw.githubusercontent.com/SuperHero2010/Test/refs/heads/main/Archive/20250709_120624.gif)

Currently, I cannot post illustrations such as PNG/JPG or GIF. I do not have time to create them because this is just a test version. Here're the main features and features that are not supported.

### Main features:
- Display text color: This is an important feature, it helps to determine whether the user has written correctly or not and also to make the language interface more standard for programming. If the user writes a misspelling, the feature will not color the word. If the user writes the correct spelling but still sees white, it is okay, as long as the spelling is correct. If you write a verb and it shows green, it is an allowed verb. If you write a verb and it shows red, it is an not allowed verb. Furthermore, blue is the color for nouns, adjectives, pronouns and some other words; cyan is for class variables; purple is for functions; yellow is for numbers
- Comments: The symbol is `-/`. This symbol comes from `//` of C# and `--` of LUA. I have supported block comments as `*/-` and `/-*`
### Unsupported features:
- ZS to C# and LUA converter: it is very difficult to create this feature. Since my language is easy to write for non-programmers, creating a TS script to convert ZS code to C# and LUA code is very difficult, even failed and may never be done
- Suggesting edits, catching errors and warnings for users: I use the feature of displaying text color instead, but there are no suggestions for edits, catching errors and warnings for users like other extensions
- Spell checking for words: although possible, it is not possible because it still has to be added manually, making me have to search online, wasting time

## Known Issues

The duplicate issue isn't important. I just send them the link to the same issue and close that issue.

## Release Notes

I don't display changes directly in `README.md`, I display them in Release (each Release will clearly state the changes so it is not necessary to state them in `README.md`)

---

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
