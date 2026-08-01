# 📜 LUA
Lua is a popular language, though less widespread than C#. It is commonly used for game scripting in platforms like Roblox and FNF. While Lua does not require `{}`, the frequent use of `function` and `end` keywords makes it challenging to learn. ZS makes Lua-style scripting more accessible.

## ✏ How to use
Guidelines for using the Lua style:
- The use of `function` and `end` keywords is prohibited
- To declare a function, write the function name followed by `:`
- For "elapsed" events, use `()` as in Lua syntax
- Empty parentheses `()` after a function name will cause an error
- The system automatically handles function and script calls
- Use `=`, `and`, and `with` carefully, as this style prohibits `()` inside functions

This style is planned for integration into [ZS Engine](https://github.com/SuperHero2010/FNF-ZSEngine). You can now program ZS scripts using Lua style in [ZS Engine](https://github.com/SuperHero2010/FNF-ZSEngine).