#!/usr/bin/env node

/// # doctool.js
///
/// Usage: `doctool.js ...jsfiles...`
///
/// Reads each `.js` file and writes a `.md` file in the same directory.
/// The output file consists of the concatenation of the "doc comments"
/// in the input file, which are assumed to contain Markdown content,
/// including any section headings necessary to organize the file.
///
/// A "doc comment" must begin at the start of a line or after
/// whitespace.  There are two kinds of doc comments: `/** ... */`
/// (block) comments and `/// ...` (triple-slash) comments.
///
/// If a file begins with the magic string "///!README", the output
/// filename is changed to `README.md`.
///
/// Examples:
///
/// ```
/// /**
///  * This is a block comment.  The parser strips the sequence,
///  * [optional whitespace, `*`, optional single space] from
///  * every line that has it.
///  *
/// For lines that don't, no big deal.
///
///     Leading whitspace will be preserved here.
///
///  * We can create a bullet list in here:
///  *
///  * * This is a bullet
///  */
/// ```
///
/// ```
/// /** Single-line block comments are also ok. */
/// ```
///
/// ```
/// /**
/// A block comment whose first line doesn't have a `*` receives
/// no stripping of `*` characters on any line.
///
/// * This is a bullet
///
/// */
/// ```
///
/// ```
/// /// A triple-slash comment starts with `///` followed by an
/// /// optional space (i.e. one space is removed if present).
/// /// Multiple consecutive lines that start with `///` are
/// /// treated together as a single doc comment.
/// /** Separate doc comments get separate paragraphs. */
/// ```

var fs = require('fs');
var path = require('path');

process.argv.slice(2).forEach(function (fileName) {
  var text = fs.readFileSync(fileName, "utf8");

  var outFileName = fileName.replace(/\.js$/, '') + '.md';
  if (text.slice(0, 10) === '///!README') {
    outFileName = path.join(path.dirname(fileName), 'README.md');
    text = text.slice(10);
  }

  var docComments = [];
  for (;;) {
    // This regex breaks down as follows:
    //
    // 1. Start of line
    // 2. Optional whitespace (not newline!)
    // 3. `///` (capturing group 1) or `/**` (group 2)
    // 4. Looking ahead, NOT `/` or `*`
    var nextOpener = /^[ \t]*(?:(\/\/\/)|(\/\*\*))(?![\/\*])/m.exec(text);
    if (! nextOpener)
      break;
    text = text.slice(nextOpener.index + nextOpener[0].length);
    if (nextOpener[1]) {
      // triple-slash
      text = text.replace(/^[ \t]/, ''); // optional space
      var comment = text.match(/^[^\n]*/)[0];
      text = text.slice(comment.length);
      var match;
      while ((match = /^\n[ \t]*\/\/\/[ \t]?/.exec(text))) {
        // multiple lines in a row become one comment
        text = text.slice(match[0].length);
        var restOfLine = text.match(/^[^\n]*/)[0];
        text = text.slice(restOfLine.length);
        comment += '\n' + restOfLine;
      }
      if (comment.trim())
        docComments.push(['///', comment]);
    } else if (nextOpener[2]) {
      // block comment
      var rawComment = text.match(/^[\s\S]*?\*\//);
      if ((! rawComment) || (! rawComment[0]))
        continue;
      rawComment = rawComment[0];
      text = text.slice(rawComment.length);
      rawComment = rawComment.slice(0, -2); // remove final `*/`
      if (rawComment.slice(-1) === ' ')
        // make that ' */' for the benefit of single-line blocks
        rawComment = rawComment.slice(0, -1);

      var lines = rawComment.split('\n');

      var stripStars = false;
      if (lines[0].trim().length === 0) {
        // The comment has a newline after the `/**` (with possible whitespace
        // between).  This is like most comments, though occasionally people
        // may write `/** foo */` on one line.  Skip the blank line.
        lines.splice(0, 1);
        if (! lines.length)
          continue;
        // Now we determine whether this is block comment with a column of
        // asterisks running down the left side, so we can strip them.
        stripStars = /^[ \t]*\*/.test(lines[1]);
      } else {
        // Trim beginning of line after `/**`
        lines[0] = lines[0].replace(/^\s*/, '');
      }

      lines = lines.map(function (s) {
        // Strip either up to an asterisk and then an optional space,
        // or just an optional space, depending on `stripStars`.
        if (stripStars)
          return s.replace(/^[ \t]*\* ?/, '');
        else
          return s;
      });

      var result = lines.join('\n');

      if (result.trim())
        docComments.push(['/**', result]);
    }
  }

  if (docComments.length) {
    var output = docComments.map(function (x) { return x[1]; }).join('\n\n');
    var fileShortName = path.basename(fileName);
    output = '*This file is automatically generated from [`' +
      fileShortName + '`](' + fileShortName + ').*\n\n' + output;
    fs.writeFileSync(outFileName, output, 'utf8');
    console.log("Wrote " + docComments.length + " comments to " + outFileName);
  }


});
