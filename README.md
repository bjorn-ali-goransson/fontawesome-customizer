Generate a webfont with only the glyphs you need. (Most of the code is from the Fontello project.)

Point is to be able to make a gulp task and automate the creation of an optimized webfont.

*Note:* I only made this because I couldn't find anything like it on the web. I barely know what I'm doing. If you can, fork it and improve it (or bring an alternative) so I can use that instead.

# Roadmap

* Get rid of Fontello `server_config.js`:
  * Remove `server_config.js`
  * `npm install fontawesome`
  * Parse `.less` files to find glyph names
  * Use `fontawesome.svg` as source for glyphs (why do those glyphs differ so much from `server_config.js`?)