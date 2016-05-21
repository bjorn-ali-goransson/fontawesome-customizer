




var fontname = 'fontawesome-webfont';

var outputDirectory = 'generated';

var glyphs = ['play', 'times']; //process.argv;

if(!glyphs){
  console.log('Usage: node ./ thumbs-up thumbs-down play times'); return; // I think ... on my Windows machine, process.argv is always undefined
}





var _ = require('lodash');
var fs = require('fs');
var path = require('path');


require('./lessvars.js')(fs.readFileSync('node_modules/font-awesome/less/variables.less'), function(lessVars){
  
  _.each(lessVars, function(value, key){ lessVars[key.substr('fa-var-'.length)] = value.substr(1); delete lessVars[key]; });

  require('rimraf').sync(outputDirectory);
  require('mkdirp').sync(outputDirectory);

  
  
  

  // Generate initial SVG font.

  var svgOutput = fs.readFileSync('node_modules/font-awesome/fonts/fontawesome-webfont.svg').toString();

  _.each(glyphs, function(glyph){
    svgOutput = svgOutput.replace(' unicode="&#x' + lessVars[glyph] + ';"', ' unicode="DONOTDELETE&#x' + lessVars[glyph] + ';"');
  });

  svgOutput = svgOutput.replace(new RegExp('<glyph[^>]+unicode="&#x[a-f0-9]+;"[^>]*>', 'g'), ''); // TODO?   \\s*(?:<\\s*/\\s*glyph\\s*>)?

  _.each(glyphs, function(value){
    svgOutput = svgOutput.replace('DONOTDELETE', '');
  });

  // svgOutput = svgOutput.replace(/>\s+/g, '>');

  fs.writeFileSync(path.join(outputDirectory, fontname + '.svg'), svgOutput, 'utf8');
  
  
  


  // Convert SVG to TTF

  var ttf = require('svg2ttf')(svgOutput, { copyright: 'Font Awesome · Created by Dave Gandy' });
  fs.writeFileSync(path.join(outputDirectory, fontname + '.ttf'), new Buffer(ttf.buffer));

  // Read the resulting TTF

  var ttfOutput = new Uint8Array(fs.readFileSync(path.join(outputDirectory, fontname + '.ttf')));
  
  // Convert TTF to EOT.

  fs.writeFileSync(path.join(outputDirectory, fontname + '.eot'), new Buffer(require('ttf2eot')(ttfOutput).buffer));

  // Convert TTF to WOFF / WOFF2

  fs.writeFileSync(path.join(outputDirectory, fontname + '.woff'), new Buffer(require('ttf2woff')(ttfOutput).buffer));
  fs.writeFileSync(path.join(outputDirectory, fontname + '.woff2'), require('ttf2woff2')(ttfOutput));
});