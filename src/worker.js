// Working procedure for the font builder queue.

'use strict';





var taskInfo = {
  tmpDir: __dirname + '/../tmp',
  clientConfig: {
    "name": "",
    "css_prefix_text": "icon-",
    "css_use_suffix": false,
    "hinting": true,
    "units_per_em": 1000,
    "ascent": 850,
    "glyphs": [
      {
        "uid": "17c21cd98db80e521e573eba247bd69b",
        "css": "mail-squared",
        "code": 59392,
        "src": "fontawesome"
      },
      {
        "uid": "d73eceadda1f594cec0536087539afbf",
        "css": "heart",
        "code": 59393,
        "src": "fontawesome"
      },
      {
        "uid": "f3dc2d6d8fe9cf9ebff84dc260888cdf",
        "css": "heart-empty",
        "code": 59394,
        "src": "fontawesome"
      }
    ]
  }
};



var fontConfig = require('./config.js');

taskInfo.builderConfig = fontConfig(taskInfo.clientConfig);





var _         = require('lodash');
var path      = require('path');
var fs        = require('fs');
var ttf2eot   = require('ttf2eot');
var ttf2woff  = require('ttf2woff');
var ttf2woff2 = require('ttf2woff2');
var svg2ttf   = require('svg2ttf');
var jade      = require('jade');
var b64       = require('base64-js');
var rimraf    = require('rimraf');
var mkdirp    = require('mkdirp');
var glob      = require('glob');





var FONTNAME = 'fontello';
var TEMPLATES_DIR = path.join(__dirname, '../font-templates');
var TEMPLATES = {};
var SVG_FONT_TEMPLATE = _.template(fs.readFileSync(path.join(TEMPLATES_DIR, 'font/svg.tpl'), 'utf8'));





_.forEach({
  'demo.jade':              'demo.html',
  'css/css.jade':           'css/' + FONTNAME + '.css',
  'css/css-ie7.jade':       'css/' + FONTNAME + '-ie7.css',
  'css/css-codes.jade':     'css/' + FONTNAME + '-codes.css',
  'css/css-ie7-codes.jade': 'css/' + FONTNAME + '-ie7-codes.css',
  'css/css-embedded.jade':  'css/' + FONTNAME + '-embedded.css',
  'LICENSE.jade':           'LICENSE.txt',
  'css/animation.css':      'css/animation.css',
  'README.txt':             'README.txt'
}, function(outputName, inputName) {
  var inputFile = path.join(TEMPLATES_DIR, inputName);
  var inputData = fs.readFileSync(inputFile, 'utf8');
  var outputData;

  switch (path.extname(inputName)) {
    case '.jade': // Jade template.
      outputData = jade.compile(inputData, {
        pretty: true,
        filename: inputFile
      });
      break;

    case '.tpl': // Lodash template.
      outputData = _.template(inputData);
      break;

    default: // Static file - just do a copy.
      outputData = function(){return inputData};
      break;
  }

  TEMPLATES[outputName] = outputData;
});





var logPrefix = '[font::' + taskInfo.fontId + ']';
var timeStart = Date.now();
var fontname = FONTNAME;





console.log('Start generation');





// Collect file paths.

var files = {
  config:      path.join(taskInfo.tmpDir, 'config.json'),
  svg:         path.join(taskInfo.tmpDir, 'font', fontname + '.svg'),
  ttf:         path.join(taskInfo.tmpDir, 'font', fontname + '.ttf'),
  ttfUnhinted: path.join(taskInfo.tmpDir, 'font', fontname + '-unhinted.ttf'),
  eot:         path.join(taskInfo.tmpDir, 'font', fontname + '.eot'),
  woff:        path.join(taskInfo.tmpDir, 'font', fontname + '.woff'),
  woff2:       path.join(taskInfo.tmpDir, 'font', fontname + '.woff2')
};





// Generate initial SVG font.

var svgOutput = SVG_FONT_TEMPLATE(taskInfo.builderConfig);




// Prepare temporary working directory.

rimraf.sync(taskInfo.tmpDir);
mkdirp.sync(taskInfo.tmpDir);
mkdirp.sync(path.join(taskInfo.tmpDir, 'font'));
mkdirp.sync(path.join(taskInfo.tmpDir, 'css'));





// Write clinet config and initial SVG font.

var configOutput = JSON.stringify(taskInfo.clientConfig, null, '  ');

fs.writeFileSync(files.config, configOutput, 'utf8');
fs.writeFileSync(files.svg, svgOutput, 'utf8');





// Convert SVG to TTF

var ttf = svg2ttf(svgOutput, { copyright: taskInfo.builderConfig.font.copyright });

fs.writeFileSync(files.ttf, new Buffer(ttf.buffer));





// // Autohint the resulting TTF.
// //
// var max_segments = _.maxBy(taskInfo.builderConfig.glyphs, function(glyph){ return glyph.segments}).segments;

// // KLUDGE :)
// // Don't allow hinting if font has "strange" glyphs.
// // That's useless anyway, and can hang ttfautohint < 1.0
// if (max_segments <= 500 && taskInfo.builderConfig.hinting) {
  // fs.renameSync(files.ttf, files.ttfUnhinted);
  // child_process.execFile('ttfautohint', [
    // '--no-info',
    // '--windows-compatibility',
    // '--symbol',
    // // temporary workaround for #464
    // // https://github.com/fontello/fontello/issues/464#issuecomment-202244651
    // '--fallback-script=latn',
    // files.ttfUnhinted,
    // files.ttf
  // ], { cwd: taskInfo.cwdDir });
  // fs.unlinkSync(files.ttfUnhinted);
// }





// Read the resulting TTF to produce EOT and WOFF.

var ttfOutput = new Uint8Array(fs.readFileSync(files.ttf));


// Convert TTF to EOT.

var eotOutput = ttf2eot(ttfOutput).buffer;

fs.writeFileSync(files.eot, new Buffer(eotOutput));





// Convert TTF to WOFF.

var woffOutput = ttf2woff(ttfOutput).buffer;

fs.writeFileSync(files.woff, new Buffer(woffOutput));





// Convert TTF to WOFF2.

fs.writeFileSync(files.woff2, ttf2woff2(ttfOutput));





// Write template files. (generate dynamic and copy static)

var templatesNames = Object.keys(TEMPLATES);

for (var i = 0; i < templatesNames.length; i++) {
  var templateName = templatesNames[i];
  var templateData = TEMPLATES[templateName];

  // don't create license file when no copyright data exists
  if ((templateName === 'LICENSE.txt') && (!taskInfo.builderConfig.fonts_list.length)) {
    continue;
  }

  var outputName = templateName.replace(FONTNAME, fontname);
  var outputFile = path.join(taskInfo.tmpDir, outputName);
  var outputData = templateData(taskInfo.builderConfig);

  outputData = outputData
                  .replace('%WOFF64%', b64.fromByteArray(woffOutput))
                  .replace('%TTF64%', b64.fromByteArray(ttfOutput));

  fs.writeFileSync(outputFile, outputData, 'utf8');
}