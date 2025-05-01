var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Email = mongoose.SchemaTypes.Email;
var forms = require('forms-mongoose');
var fs = require('fs');
const { type } = require('os');
var widgets = forms.widgets;
var bootstrapField = forms.defaultLayoutFields;
var template = forms.defaultLayoutTemplate;

async function openConnection() {
    try {
        await mongoose.connect('mongodb://192.168.18.4:27017/SampleDB');
    } catch (err) {
        fail('Invalid a mongodb connection. Try replace connection string. Error:' + err);
    }
}

describe("mongoose forms", () => {
    test("check if can render collection with one field", async () => {

        var PersonSchema = new Schema({
            email: {
                type: String, unique: true, forms: {
                    all: {}
                }
            }
        });

        openConnection();

        var PersonModel = mongoose.model('Person', PersonSchema);
        var form = forms.create(PersonModel, 'new'); // Creates a new form for a "new" Person
        console.log(form.toHTML());
        expect(form.toHTML()).toBe('<div class="field required"><label for="id_email">Email</label><input type="text" name="email" id="id_email" /></div>');
    });

    test("check if can render collection with multiple fields", async () => {
        openConnection();

        var PersonSchema = new Schema({
            email: {
                type: String, unique: true, forms: {
                    all: {}
                }
            },
            name: {
                type: String, forms: {
                    all: {}
                }
            }
        });

        var PersonModel = mongoose.model('Person2', PersonSchema);
        var form = forms.create(PersonModel, 'new'); // Creates a new form for a "new" Person
        console.log(form.toHTML());
        expect(form.toHTML()).toBe('<div class="field required"><label for="id_email">Email</label><input type="text" name="email" id="id_email" /></div><div class="field"><label for="id_name">Name</label><input type="text" name="name" id="id_name" /></div>');
    })

    test("check if can render collection with a simple field and nested field with one level.", async () => {
        openConnection();

        var addressSchema = new Schema({
            street: {
                type: String, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    }
                }
            },
            number: {
                type: Number, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    },
                    widget: widgets.text({ classes: ['input-with-feedback'] }),
                }
            }
        });

        var PersonSchema = new Schema({
            email: {
                type: String, unique: true, forms: {
                    all: {}
                }
            },
            address: addressSchema
        });

        var PersonModel = mongoose.model('Person3', PersonSchema, 'Person3', 'Register');
        var form = forms.create(PersonModel, 'new');
        expect(form.toHTML() != "").toBe(true);
    })

    test("check if can render collection with simple field and nestedField with another nestedField", async () => {

        var locationSchema = new Schema({
            city: {
                type: String, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    }
                }
            },
            state: {
                type: String, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    }
                }
            }
        });

        var addressSchema = new Schema({
            street: {
                type: String, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    }
                }
            },
            number: {
                type: Number, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    },
                    widget: widgets.text({ classes: ['input-with-feedback'] }),
                }
            },
            locationSchema: {type : locationSchema, forms: {all: {
                cssClasses: {
                    label: ['control-label col col-lg-3']
                }
            }}}
        });

        var PersonSchema = new Schema({
            email: {
                type: String, unique: true, forms: {
                    all: {}
                }
            },
            address: addressSchema
        });

        var PersonModel = mongoose.model('Person4', PersonSchema, 'Person4', 'Register');
        var form = forms.create(PersonModel, 'new'); // Creates a new form for a "new" Person
        console.log(template.expand({
            title: "test",
            form: form.toHTML(bootstrapField),
            method: 'POST',
            enctype: 'multipart/form-data',
            action: '/register'
        }));

    });

    test("check if can render collection with simple field and nestedField with multiple nestedFields with three levels and nestedField is last", async () => {

        var countrySchema = new Schema({
            name: {
                type: String, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    }
                }
            },
            code: {
                type: String, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    }
                }
            }
        });

        var locationSchema = new Schema({
            city: {
                type: String, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    }
                }
            },
            state: {
                type: String, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    }
                }
            },
            country: countrySchema
        });

        var addressSchema = new Schema({
            street: {
                type: String, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    }
                }
            },
            number: {
                type: Number, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    },
                    widget: widgets.text({ classes: ['input-with-feedback'] }),
                }
            },
            locationSchema: {
                type: locationSchema, forms: {
                    all: {
                        cssClasses: {
                            label: ['control-label col col-lg-3']
                        }
                    }
                }
            }
        });

        var PersonSchema = new Schema({
            email: {
                type: String, unique: true, forms: {
                    all: {}
                }
            },
            address: addressSchema
        });

        var PersonModel = mongoose.model('Person5', PersonSchema, 'Person5', 'Register');
        var form = forms.create(PersonModel, 'new');

        console.log(form.toHTML(bootstrapField))

        expect(form.toHTML(bootstrapField)).toBe(`<div class="form-group "><label for="id_email">Email</label><input type="text" name="email" id="id_email" class="form-control" /></div><div class='sub-group' id='address'><h1>address</h1><div class="form-group "><label for="id_address[street]" class="control-label col col-lg-3">Address[street]</label><input type="text" name="address[street]" id="id_address[street]" class="form-control" /></div><div class="form-group "><label for="id_address[number]" class="control-label col col-lg-3">Address[number]</label><input type="text" name="address[number]" id="id_address[number]" class="input-with-feedback" /></div><div class='sub-group' id='locationSchema'><h1>locationSchema</h1><div class="form-group "><label for="id_address[locationSchema][city]" class="control-label col col-lg-3">Address[location schema][city]</label><input type="text" name="address[locationSchema][city]" id="id_address[locationSchema][city]" class="form-control" /></div><div class="form-group "><label for="id_address[locationSchema][state]" class="control-label col col-lg-3">Address[location schema][state]</label><input type="text" name="address[locationSchema][state]" id="id_address[locationSchema][state]" class="form-control" /></div><div class='sub-group' id='country'><h1>country</h1><div class="form-group "><label for="id_address[locationSchema][country][name]" class="control-label col col-lg-3">Address[location schema][country][name]</label><input type="text" name="address[locationSchema][country][name]" id="id_address[locationSchema][country][name]" class="form-control" /></div><div class="form-group "><label for="id_address[locationSchema][country][code]" class="control-label col col-lg-3">Address[location schema][country][code]</label><input type="text" name="address[locationSchema][country][code]" id="id_address[locationSchema][country][code]" class="form-control" /></div></div></div></div>`);

    });

    test("check if can render collection with simple field and nestedField with multiple nestedFields with three levels and nesteField not last", async () => {

        var countrySchema = new Schema({
            name: {
                type: String, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    }
                }
            },
            code: {
                type: String, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    }
                }
            }
        });

        var locationSchema = new Schema({
            city: {
                type: String, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    }
                }
            },
            state: {
                type: String, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    }
                }
            },
            country: countrySchema
        });

        var addressSchema = new Schema({
            street: {
                type: String, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    }
                }
            },
            number: {
                type: Number, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    },
                    widget: widgets.text({ classes: ['input-with-feedback'] }),
                }
            },
            locationSchema: {
                type: locationSchema, forms: {
                    all: {
                        cssClasses: {
                            label: ['control-label col col-lg-3']
                        }
                    }
                }
            },
            zipCode: { type: String, forms: { all: {} } }
        });

        var PersonSchema = new Schema({
            email: {
                type: String, unique: true, forms: {
                    all: {}
                }
            },
            address: addressSchema
        });

        var PersonModel = mongoose.model('Person6', PersonSchema, 'Person6', 'Register');
        var form = forms.create(PersonModel, 'new');
        console.log(form.toHTML(bootstrapField))
        expect(form.toHTML(bootstrapField)).toBe(`<div class="form-group "><label for="id_email">Email</label><input type="text" name="email" id="id_email" class="form-control" /></div><div class='sub-group' id='address'><h1>address</h1><div class="form-group "><label for="id_address[street]" class="control-label col col-lg-3">Address[street]</label><input type="text" name="address[street]" id="id_address[street]" class="form-control" /></div><div class="form-group "><label for="id_address[number]" class="control-label col col-lg-3">Address[number]</label><input type="text" name="address[number]" id="id_address[number]" class="input-with-feedback" /></div><div class='sub-group' id='locationSchema'><h1>locationSchema</h1><div class="form-group "><label for="id_address[locationSchema][city]" class="control-label col col-lg-3">Address[location schema][city]</label><input type="text" name="address[locationSchema][city]" id="id_address[locationSchema][city]" class="form-control" /></div><div class="form-group "><label for="id_address[locationSchema][state]" class="control-label col col-lg-3">Address[location schema][state]</label><input type="text" name="address[locationSchema][state]" id="id_address[locationSchema][state]" class="form-control" /></div><div class='sub-group' id='country'><h1>country</h1><div class="form-group "><label for="id_address[locationSchema][country][name]" class="control-label col col-lg-3">Address[location schema][country][name]</label><input type="text" name="address[locationSchema][country][name]" id="id_address[locationSchema][country][name]" class="form-control" /></div><div class="form-group "><label for="id_address[locationSchema][country][code]" class="control-label col col-lg-3">Address[location schema][country][code]</label><input type="text" name="address[locationSchema][country][code]" id="id_address[locationSchema][country][code]" class="form-control" /></div></div></div><div class="form-group "><label for="id_address[zipCode]">Address[zip code]</label><input type="text" name="address[zipCode]" id="id_address[zipCode]" class="form-control" /></div></div>`);
    });

    test("check if can render collection with simple field and nestedField with multiple nestedFields with four levels and nestedField is last", async () => {

        var acronymSchema = new Schema({
            acronym: {
                type: String, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    }
                }
            },
            description: {
                type: String, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    }
                }
            }
        });

        var countrySchema = new Schema({
            name: {
                type: String, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    }
                }
            },
            code: {
                type: String, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    }
                }
            },
            acronymType: acronymSchema
        });

        var locationSchema = new Schema({
            city: {
                type: String, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    }
                }
            },
            state: {
                type: String, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    }
                }
            },
            country: countrySchema
        });

        var addressSchema = new Schema({
            street: {
                type: String, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    }
                }
            },
            number: {
                type: Number, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    },
                    widget: widgets.text({ classes: ['input-with-feedback'] }),
                }
            },
            locationSchema: {
                type: locationSchema, forms: {
                    all: {
                        cssClasses: {
                            label: ['control-label col col-lg-3']
                        }
                    }
                }
            }
        });

        var PersonSchema = new Schema({
            email: {
                type: String, unique: true, forms: {
                    all: {}
                }
            },
            address: addressSchema
        });

        var PersonModel = mongoose.model('Person7', PersonSchema, 'Person7', 'Register');
        var form = forms.create(PersonModel, 'new');

        console.log(form.toHTML(bootstrapField))

        expect(form.toHTML(bootstrapField)).toBe(`<div class="form-group "><label for="id_email">Email</label><input type="text" name="email" id="id_email" class="form-control" /></div><div class='sub-group' id='address'><h1>address</h1><div class="form-group "><label for="id_address[street]" class="control-label col col-lg-3">Address[street]</label><input type="text" name="address[street]" id="id_address[street]" class="form-control" /></div><div class="form-group "><label for="id_address[number]" class="control-label col col-lg-3">Address[number]</label><input type="text" name="address[number]" id="id_address[number]" class="input-with-feedback" /></div><div class='sub-group' id='locationSchema'><h1>locationSchema</h1><div class="form-group "><label for="id_address[locationSchema][city]" class="control-label col col-lg-3">Address[location schema][city]</label><input type="text" name="address[locationSchema][city]" id="id_address[locationSchema][city]" class="form-control" /></div><div class="form-group "><label for="id_address[locationSchema][state]" class="control-label col col-lg-3">Address[location schema][state]</label><input type="text" name="address[locationSchema][state]" id="id_address[locationSchema][state]" class="form-control" /></div><div class='sub-group' id='country'><h1>country</h1><div class="form-group "><label for="id_address[locationSchema][country][name]" class="control-label col col-lg-3">Address[location schema][country][name]</label><input type="text" name="address[locationSchema][country][name]" id="id_address[locationSchema][country][name]" class="form-control" /></div><div class="form-group "><label for="id_address[locationSchema][country][code]" class="control-label col col-lg-3">Address[location schema][country][code]</label><input type="text" name="address[locationSchema][country][code]" id="id_address[locationSchema][country][code]" class="form-control" /></div><div class='sub-group' id='acronymType'><h1>acronymType</h1><div class="form-group "><label for="id_address[locationSchema][country][acronymType][acronym]" class="control-label col col-lg-3">Address[location schema][country][acronym type][acronym]</label><input type="text" name="address[locationSchema][country][acronymType][acronym]" id="id_address[locationSchema][country][acronymType][acronym]" class="form-control" /></div><div class="form-group "><label for="id_address[locationSchema][country][acronymType][description]" class="control-label col col-lg-3">Address[location schema][country][acronym type][description]</label><input type="text" name="address[locationSchema][country][acronymType][description]" id="id_address[locationSchema][country][acronymType][description]" class="form-control" /></div></div></div></div></div>`);

    });

    test("check if can render collection with simple field and nestedField with multiple nestedFields with five levels and nestedField is not last", async () => {

        var flagSchema = new Schema({
            flag: {
                type: String, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    }
                }
            },
            description: {
                type: String, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    }
                }
            }
        });

        var acronymSchema = new Schema({
            acronym: {
                type: String, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    }
                }
            },
            description: {
                type: String, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    }
                }
            },
            flag: flagSchema
        });

        var countrySchema = new Schema({
            name: {
                type: String, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    }
                }
            },
            code: {
                type: String, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    }
                }
            },
            acronymType: acronymSchema
        });

        var locationSchema = new Schema({
            city: {
                type: String, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    }
                }
            },
            state: {
                type: String, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    }
                }
            },
            country: countrySchema
        });

        var addressSchema = new Schema({
            street: {
                type: String, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    }
                }
            },
            number: {
                type: Number, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    },
                    widget: widgets.text({ classes: ['input-with-feedback'] }),
                }
            },
            locationSchema: {
                type: locationSchema, forms: {
                    all: {
                        cssClasses: {
                            label: ['control-label col col-lg-3']
                        }
                    }
                }
            },
            zipCode: { type: String, forms: { all: {} } }
        });

        var PersonSchema = new Schema({
            email: {
                type: String, unique: true, forms: {
                    all: {}
                }
            },
            address: addressSchema
        });

        var PersonModel = mongoose.model('Person8', PersonSchema, 'Person8', 'Register');
        var form = forms.create(PersonModel, 'new');

        console.log(form.toHTML(bootstrapField))

        expect(form.toHTML(bootstrapField)).toBe(`<div class="form-group "><label for="id_email">Email</label><input type="text" name="email" id="id_email" class="form-control" /></div><div class='sub-group' id='address'><h1>address</h1><div class="form-group "><label for="id_address[street]" class="control-label col col-lg-3">Address[street]</label><input type="text" name="address[street]" id="id_address[street]" class="form-control" /></div><div class="form-group "><label for="id_address[number]" class="control-label col col-lg-3">Address[number]</label><input type="text" name="address[number]" id="id_address[number]" class="input-with-feedback" /></div><div class='sub-group' id='locationSchema'><h1>locationSchema</h1><div class="form-group "><label for="id_address[locationSchema][city]" class="control-label col col-lg-3">Address[location schema][city]</label><input type="text" name="address[locationSchema][city]" id="id_address[locationSchema][city]" class="form-control" /></div><div class="form-group "><label for="id_address[locationSchema][state]" class="control-label col col-lg-3">Address[location schema][state]</label><input type="text" name="address[locationSchema][state]" id="id_address[locationSchema][state]" class="form-control" /></div><div class='sub-group' id='country'><h1>country</h1><div class="form-group "><label for="id_address[locationSchema][country][name]" class="control-label col col-lg-3">Address[location schema][country][name]</label><input type="text" name="address[locationSchema][country][name]" id="id_address[locationSchema][country][name]" class="form-control" /></div><div class="form-group "><label for="id_address[locationSchema][country][code]" class="control-label col col-lg-3">Address[location schema][country][code]</label><input type="text" name="address[locationSchema][country][code]" id="id_address[locationSchema][country][code]" class="form-control" /></div><div class='sub-group' id='acronymType'><h1>acronymType</h1><div class="form-group "><label for="id_address[locationSchema][country][acronymType][acronym]" class="control-label col col-lg-3">Address[location schema][country][acronym type][acronym]</label><input type="text" name="address[locationSchema][country][acronymType][acronym]" id="id_address[locationSchema][country][acronymType][acronym]" class="form-control" /></div><div class="form-group "><label for="id_address[locationSchema][country][acronymType][description]" class="control-label col col-lg-3">Address[location schema][country][acronym type][description]</label><input type="text" name="address[locationSchema][country][acronymType][description]" id="id_address[locationSchema][country][acronymType][description]" class="form-control" /></div><div class='sub-group' id='flag'><h1>flag</h1><div class="form-group "><label for="id_address[locationSchema][country][acronymType][flag][flag]" class="control-label col col-lg-3">Address[location schema][country][acronym type][flag][flag]</label><input type="text" name="address[locationSchema][country][acronymType][flag][flag]" id="id_address[locationSchema][country][acronymType][flag][flag]" class="form-control" /></div><div class="form-group "><label for="id_address[locationSchema][country][acronymType][flag][description]" class="control-label col col-lg-3">Address[location schema][country][acronym type][flag][description]</label><input type="text" name="address[locationSchema][country][acronymType][flag][description]" id="id_address[locationSchema][country][acronymType][flag][description]" class="form-control" /></div></div></div></div></div><div class="form-group "><label for="id_address[zipCode]">Address[zip code]</label><input type="text" name="address[zipCode]" id="id_address[zipCode]" class="form-control" /></div></div>`);

    });

    test("check if can render collection with simple field and nestedField with multiple nestedFields with four levels and nestedField is not last", async () => {

        var acronymSchema = new Schema({
            acronym: {
                type: String, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    }
                }
            },
            description: {
                type: String, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    }
                }
            }
        });

        var countrySchema = new Schema({
            name: {
                type: String, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    }
                }
            },
            code: {
                type: String, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    }
                }
            },
            acronymType: acronymSchema
        });

        var locationSchema = new Schema({
            city: {
                type: String, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    }
                }
            },
            state: {
                type: String, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    }
                }
            },
            country: countrySchema
        });

        var addressSchema = new Schema({
            street: {
                type: String, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    }
                }
            },
            number: {
                type: Number, forms: {
                    all: {},
                    cssClasses: {
                        label: ['control-label col col-lg-3']
                    },
                    widget: widgets.text({ classes: ['input-with-feedback'] }),
                }
            },
            locationSchema: {
                type: locationSchema, forms: {
                    all: {
                        cssClasses: {
                            label: ['control-label col col-lg-3']
                        }
                    }
                }
            },
            zipCode: { type: String, forms: { all: {} } }
        });

        var PersonSchema = new Schema({
            email: {
                type: String, unique: true, forms: {
                    all: {}
                }
            },
            address: addressSchema
        });

        var PersonModel = mongoose.model('Person9', PersonSchema, 'Person9', 'Register');
        var form = forms.create(PersonModel, 'new');

        console.log(form.toHTML(bootstrapField))

        expect(form.toHTML(bootstrapField)).toBe(`<div class="form-group "><label for="id_email">Email</label><input type="text" name="email" id="id_email" class="form-control" /></div><div class='sub-group' id='address'><h1>address</h1><div class="form-group "><label for="id_address[street]" class="control-label col col-lg-3">Address[street]</label><input type="text" name="address[street]" id="id_address[street]" class="form-control" /></div><div class="form-group "><label for="id_address[number]" class="control-label col col-lg-3">Address[number]</label><input type="text" name="address[number]" id="id_address[number]" class="input-with-feedback" /></div><div class='sub-group' id='locationSchema'><h1>locationSchema</h1><div class="form-group "><label for="id_address[locationSchema][city]" class="control-label col col-lg-3">Address[location schema][city]</label><input type="text" name="address[locationSchema][city]" id="id_address[locationSchema][city]" class="form-control" /></div><div class="form-group "><label for="id_address[locationSchema][state]" class="control-label col col-lg-3">Address[location schema][state]</label><input type="text" name="address[locationSchema][state]" id="id_address[locationSchema][state]" class="form-control" /></div><div class='sub-group' id='country'><h1>country</h1><div class="form-group "><label for="id_address[locationSchema][country][name]" class="control-label col col-lg-3">Address[location schema][country][name]</label><input type="text" name="address[locationSchema][country][name]" id="id_address[locationSchema][country][name]" class="form-control" /></div><div class="form-group "><label for="id_address[locationSchema][country][code]" class="control-label col col-lg-3">Address[location schema][country][code]</label><input type="text" name="address[locationSchema][country][code]" id="id_address[locationSchema][country][code]" class="form-control" /></div><div class='sub-group' id='acronymType'><h1>acronymType</h1><div class="form-group "><label for="id_address[locationSchema][country][acronymType][acronym]" class="control-label col col-lg-3">Address[location schema][country][acronym type][acronym]</label><input type="text" name="address[locationSchema][country][acronymType][acronym]" id="id_address[locationSchema][country][acronymType][acronym]" class="form-control" /></div><div class="form-group "><label for="id_address[locationSchema][country][acronymType][description]" class="control-label col col-lg-3">Address[location schema][country][acronym type][description]</label><input type="text" name="address[locationSchema][country][acronymType][description]" id="id_address[locationSchema][country][acronymType][description]" class="form-control" /></div></div></div></div><div class="form-group "><label for="id_address[zipCode]">Address[zip code]</label><input type="text" name="address[zipCode]" id="id_address[zipCode]" class="form-control" /></div></div>`);

    });
});

