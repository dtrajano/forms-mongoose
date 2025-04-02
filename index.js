var forms = require('forms')
  , fields = forms.fields
  , widgets = forms.widgets
  , validators = forms.validators
  , _ = require('underscore')
  , fs = require('fs')
  , jsontemplate = require('./json-template');

var _fields = {
  'String': 'string',
  'Number': 'number',
  'Password': 'password',
  'Email': 'email',
  'Date': 'string',
  'Boolean': 'boolean'
}


var nesteFieldCount = 0;
var countClosed = 0;
var countLevels = 0;
var reduceLevels = false;
var differenceLevels = 0;
var currentGroup = undefined;
var globalPath = null;

function _configureFieldsValidators(_options, path, _field) {
    var _fields = {};
    _options = _.defaults(_options, {
        required: ((typeof _options.required === 'undefined') ? (path.options.required || path.options.unique) : _options.required),
        validators: []
    });
    if (path.validators)
        for (var i = path.options.required ? 1 : 0; i < path.validators.length; i++)
            (function (validator) {
                _options.validators.push(function (form, field, callback) {
                    callback(validator[0](field.value) ? undefined : validator[1]);
                });
            })(path.validators[i]);
    _fields[path.path] = null;
    if (_options.confirm) {
        var _options_confirm = _.clone(_options);
        _options_confirm.validators = _options.validators.slice(0);
        _options_confirm.validators.unshift(validators.matchField(path.path));
        _fields[path.path + '.confirm'] = _field(_options_confirm);
    }
    if (_options.existing) {
        var _options_existing = _.clone(_options);
        _options_existing.validators = [function (form, field, callback) {
            if (!form.existing)
                return callback('Server error');
            var existing = form.existing[path.path];
            if (typeof existing === 'function') {
                existing(field.data, function (err, result) {
                    if (err) return callback('Server error: ' + err);
                    if (!result) return callback('Does not match existing value!!!');
                    callback();
                });
            } else if (form.existing[field.name] != field.data) {
                return callback('Does not match existing value!');
            } else {
                callback();
            }
        }];
        _fields[path.path + '.existing'] = _field(_options_existing);
    }
    _options.validators.unshift(function (form, field, callback) {
        if (field.data && _options.confirm)
            form.fields[path.path + '.confirm'].required = true;
        if (field.data && _options.existing)
            form.fields[path.path + '.existing'].required = true;
        callback();
    });
    _fields[path.path] = _field(_options);
    return { _fields, _options };
}

function _configureNestedField(path) {
    var customField = {};
    var customFieldName = path.path;

    for (var subPathName in path.schema.paths) {
        var subPath = path.schema.paths[subPathName];
        var field = get_field(subPath, null, null, path);
        if (field)
            customField = _.extend(customField, field);
    }

    var first = _.first(Object.keys(customField));
    var last = _.last(Object.keys(customField));

    for (var currentField in customField) {
        if (customField[currentField].all != undefined) {
            if (customField[currentField].all.nestedGroup != undefined) {
                _.extend(customField[currentField].all.nestedGroup, {
                    isFirst: currentField == first,
                    isLast: currentField == last,
                });
            } else {
                customField[currentField].all.nestedGroup = {
                    name: customFieldName,
                    isFirst: currentField == first,
                    isLast: currentField == last,
                };
            }
        }
    }

    return { [customFieldName]: customField };
}

function convert_mongoose_field(mongoose_field) {
  return fields[_fields[mongoose_field]];
}

function _checkPathIsValid(path, form_name, form_category) {
    if (!(path.options && path.options.forms))
        return false;

    var forms = path.options.forms;
    if (!(
        forms[form_name] ||
        (forms['all'] && !forms[form_category]) ||
        (forms[form_category] && forms[form_category].all) ||
        (forms[form_category] && forms[form_category][form_name]) ||
        (form_name === '*' && forms._all)
    ))
        return false;
    return true;
}

function removeProperty(obj, propToRemove) {
    if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
            if (key === propToRemove) {
                delete obj[key];
            } else if (typeof obj[key] === 'object') {
                removeProperty(obj[key], propToRemove);
            }
        }
    }
}

function setPropertyToFalse(json, path) {
    let current = json;
    const parts = path.split('.');
    const lastKey = parts.pop();

    parts.forEach(key => {
        if (current[key]) {
            current = current[key];
        } else {
            throw new Error('Path não encontrado!');
        }
    });

    current[lastKey] = false;
    return json;
}


// Função para remover um path do JSON
function removePathFromJson(json, path) {
    let current = json;
    const parts = path.split('.');
    const lastKey = parts.pop();

    parts.forEach(key => {
        if (current[key]) {
            current = current[key];
        } else {
            throw new Error('Path não encontrado!');
        }
    });

    delete current[lastKey];
    return json;
}

function updateIsLastFromParentIfFoundNewLast(path) {
    switch (typeof path.options.type) {
        case "object":
            for (var subPathName in path.schema.paths) {
                var subPath = path.schema.paths[subPathName];
                updateIsLastFromParentIfFoundNewLast(subPath);
            }
        default:
            if (!_checkPathIsValid(path, null, null))
                return;
            if (path.options.forms.all.nestedGroup != undefined && 
                path.options.forms.all.nestedGroup.isLastFromParent != null) { 
                path.options.forms.all.nestedGroup.isLastFromParent = false;
            }
    }
}

function get_field(path, form_name, form_category, parentField) {
    var _field = null;

    switch (typeof path.options.type) {
        case "object":
            nesteFieldCount += 1;
            currentField = _configureNestedField(path);
            nesteFieldCount -= 1;
            return currentField
        default:
            if (!_checkPathIsValid(path, form_name, form_category))
                return null;

            if (parentField != undefined) {
                var last = _.last(Object.keys(parentField.schema.obj));

                if (path.options.forms != undefined &&
                    path.options.forms.all != undefined &&
                    path.path == last) {

                    if (countClosed > 0) {
                        nesteFieldCount -= 1;
                    }

                    for (var pathName in globalPath) {
                        var currentPath = globalPath[pathName];
                        updateIsLastFromParentIfFoundNewLast(currentPath);
                    }
                    
                    if (path.options.forms.all.nestedGroup == undefined) {
                        path.options.forms.all.nestedGroup = {};
                    }        

                    path.options.forms.all.nestedGroup.isLastFromParent = true;
                    path.options.forms.all.nestedGroup.name = parentField.path;
                    path.options.forms.all.nestedGroup.nesteFieldCount = nesteFieldCount;
                    
                    countClosed += 1;
                }
            }
    }

    if (!_checkPathIsValid(path, form_name, form_category))
        return null;

    var forms = path.options.forms;

  var _options = _.extend(
      {},
      forms
  );
  
  if (_options.type)
    _field = (typeof _options.type === 'string') ? fields[_options.type] : _options.type
  if (!_field)
    _field = convert_mongoose_field( path.options.type ? path.options.type.name : path.instance );
  if (!_field)
    throw new Error('Model does not have forms.type, probably on a virtual', path);


  var _fields;
    ({ _fields, _options } = _configureFieldsValidators(_options, path, _field));
  return _fields;
}

module.exports.create = function (model, extra_params, form_name, form_category) {
    nesteFieldCount = 0;
    countClosed = 0;

    countLevels = 0;
    currentGroup = undefined;
  var schema = model.schema
    , paths = schema.paths
    , virtuals = schema.virtuals
    , params = {};

    globalPath = paths;
  for (var pathName in paths) {
    var path = paths[pathName];
    var field = get_field(path, form_name, form_category);
    if (field)
      params = _.extend(params, field);
  }
  for (var virtName in virtuals) {
    var virt = virtuals[virtName];
    virt.path = virtName;
    var field = get_field(virt, form_name, form_category);
    if (field)
      params = _.extend(params, field);
  }
  params = _.extend({}, params, extra_params);
  var form = forms.create(params);
  return form;
}

var bootstrapField = function (name, object) {
    if (!Array.isArray(object.widget.classes)) { object.widget.classes = []; }
    if (object.widget.classes.indexOf('form-control') === -1) {
        object.widget.classes.push('form-control');
    }

    var label = object.labelHTML(name);
    var error = object.error ? '<div class="alert alert-error help-block">' + object.error + '</div>' : '';

    var validationclass = object.value && !object.error ? 'has-success' : '';
    validationclass = object.error ? 'has-error' : validationclass;

    var widget = object.widget.toHTML(name, object);

    var bodyFieldHtml = "";

    var arrayNames = name.split(/\[|\]/).filter(Boolean);

    if (countLevels > arrayNames.length) {
        reduceLevels = true;
        differenceLevels = countLevels - arrayNames.length;
    }

    countLevels = arrayNames.length;
    if (countLevels >= 2) {
        var nestedGroupName = arrayNames[countLevels - 2];

        if (countLevels >= arrayNames.length && reduceLevels) {
            for (var i = 0; i < differenceLevels; i++) {
                bodyFieldHtml += "</div>";
            }
            reduceLevels = false
            countLevels = arrayNames.length;
        } else if (currentGroup != nestedGroupName) {
            currentGroup = nestedGroupName;
            bodyFieldHtml += "<div class='sub-group' id='" + nestedGroupName + "'><h1>" + nestedGroupName + "</h1>"
        }
    }

    bodyFieldHtml += '<div class="form-group ' + validationclass + '">' + label + widget + error + '</div>';

    if (object.all.nestedGroup != null && object.all.nestedGroup.isLastFromParent) {
        for (var i = 0; i < countLevels - 1; i++) {
            bodyFieldHtml += "</div>";
        }
        countLevels = 0;
        differenceLevels = 0;
        currentGroup = undefined;
    }

    return bodyFieldHtml;
};

module.exports.defaultLayoutTemplate = jsontemplate.Template(String(fs.readFileSync(__dirname + '/template.jsont')));
module.exports.fields = fields;
module.exports.widgets = widgets;
module.exports.validators = validators;
module.exports.defaultLayoutFields = bootstrapField;
module.exports.createNewTemplate = function (template, params) {
  var template = jsontemplate.Template(template);
  return template.expand(params);
};
module.exports.createForm = function (params, extra_params) {
  params = _.extend({}, params, extra_params);
  var form = forms.create(params)
  return form;
};