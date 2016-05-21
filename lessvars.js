




// This little gold nugget is taken from https://github.com/aarki/grunt-lessvars/

var less = require('less');
var _ = require('lodash');





module.exports = function(contents, callback) {
  less
  .parse(contents.toString(), {})
  .then(function(root){
    callback(collect(root, new less.contexts.Eval({}, [ less.transformTree(root) ]), {}));
  });
}

function collect(node, context, variables) {
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

function toJS(node, context) {
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