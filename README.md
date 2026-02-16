# Code-folder Extension For Quarto

This is a code folding plugin for Quarto Reveal.js presentations.
It allows you to fold specified lines or inline ranges within code blocks, and toggle folding and unfolding with a click.

## Features
- ✅ Fold arbitrary ranges of lines in code blocks
- ✅ Fold arbitrary inline ranges within a single line of a code block
- ✅ Preserve line numbers (line counting continues even when folded)
- ✅ Preserve syntax highlighting
- ✅ Support multiple folding regions
- ✅ Configurable via a configuration file or attributes
- ✅ Customizable styling

## Installing

```bash
quarto add herosi/code-folder
```

This will install the extension under the `_extensions` subdirectory.
If you're using version control, you will want to check in this directory.

## Using
Include this plugin as shown below in the front matter of a qmd or `_quarto.yaml`.

```yaml
revealjs-plugins:
  - code-folder
```

Here is the source code for a minimal example: [example.qmd](example.qmd). View an example presentation at [example.html](https://herosi.github.io/code-folder/demo/example.html).
