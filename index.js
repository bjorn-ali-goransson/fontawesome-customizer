




var fontname = 'fontawesome-webfont';

var tmpDir = 'generated';

var glyphs = ['play', 'times']; //process.argv;

if(!glyphs){
  console.log('Usage: node ./ thumbs-up thumbs-down play times'); return; // I think ... on my Windows machine, process.argv is always undefined
}





var less = require('less');
var _ = require('lodash');





function process(contents, callback) { // https://github.com/aarki/grunt-lessvars/
  return less.parse(contents.toString(), {})
    .then(function(root){
      callback(collect(root, new less.contexts.Eval({}, [ less.transformTree(root) ]), {}));
    });
}

function collect(node, context, variables) { // https://github.com/aarki/grunt-lessvars/
    _.each(node.rules, function(rule) {
        if (rule.isRuleset)
            collect(rule, context, variables);
        else if (rule.importedFilename)
            collect(rule.root, context, variables);
        else if (rule.variable === true) {
            var name = rule.name.substring(1);
            var value = rule.value.eval(context);
            
            variables[name] = toJS(value, context);
        }
    });

    return variables;
}

function toJS(node, context) { // https://github.com/aarki/grunt-lessvars/
    switch (node.type) {
      case 'Dimension':
        return node.toCSS(context)
      case 'Quoted':
        return node.value;
      case 'Expression':
        return node.value.map(function(child){ return toJS(child, options, context); });
    }

    return node.toCSS(context);
}





var fs = require('fs');

process(fs.readFileSync('node_modules/font-awesome/less/variables.less'), function(lessVars){

  _.each(lessVars, function(value, key){ lessVars[key.substr('fa-var-'.length)] = value.substr(1); delete lessVars[key]; });





  // Prepare temporary working directory.

  require('rimraf').sync(tmpDir);
  require('mkdirp').sync(tmpDir);
  
  
  
  
  
  // Collect file paths.
  
  var path = require('path');

  var files = {
    svg:         path.join(tmpDir, fontname + '.svg'),
    ttf:         path.join(tmpDir, fontname + '.ttf'),
    eot:         path.join(tmpDir, fontname + '.eot'),
    woff:        path.join(tmpDir, fontname + '.woff'),
    woff2:       path.join(tmpDir, fontname + '.woff2')
  };





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

  fs.writeFileSync(files.svg, svgOutput, 'utf8');
  
  
  


  // Convert SVG to TTF

  var ttf = require('svg2ttf')(svgOutput, { copyright: 'Font Awesome · Created by Dave Gandy' });
  fs.writeFileSync(files.ttf, new Buffer(ttf.buffer));





  // Read the resulting TTF

  var ttfOutput = new Uint8Array(fs.readFileSync(files.ttf));
  
  
  
  
  
  // Convert TTF to EOT.

  fs.writeFileSync(files.eot, new Buffer(require('ttf2eot')(ttfOutput).buffer));
  
  
    
  

  // Convert TTF to WOFF / WOFF2

  fs.writeFileSync(files.woff, new Buffer(require('ttf2woff')(ttfOutput).buffer));
  fs.writeFileSync(files.woff2, require('ttf2woff2')(ttfOutput));
});