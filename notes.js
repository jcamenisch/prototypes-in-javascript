// Let's use prototypical inheritance.
// to model life, the universe, and everything.

// First, a root object:

thing = {
  location: 'the universe',
  organic: false,
  motile: false
};

// Then, to inherit. First, the old-fashioned way:

ConstructThing = function() {
  this.createdAt = new Date;
};
ConstructThing.prototype = thing;

mineral = new ConstructThing();
mineral.location;

ConstructMineral = function(){};
ConstructMineral.prototype = mineral;


organism = new ConstructThing();
organism.organic = true;

ConstructOrganism = function(){};
ConstructOrganism.prototype = organism;

vegetable = new ConstructOrganism;
ConstructVegetable = function(){};
ConstructVegetable.prototype = vegetable;


animal = new ConstructOrganism;
animal.motile = true;

ConstructAnimal = function(){};
ConstructAnimal.prototype = animal;


caveMan = new ConstructAnimal;
club = new ConstructVegetable;
rock = new ConstructMineral;

[caveMan, club, rock].map(function(o) { return o.location });
[caveMan, club, rock].map(function(o) { return o.organic });
[caveMan, club, rock].map(function(o) { return o.motile });


// Problems with this approach:

// 1. It's rather awkward. (verbose, and conflicted)

// 2. The danger of forgetting "new":

OtherWindow = function(location) {
  this.location = location;
}
anotherWindow = new OtherWindow();
anotherWindow = OtherWindow();

// 3. Constructors are not inheritable:

[caveMan, club, rock].map(function(o) { return o.createdAt });

// Back to constructors in a bit...


// Could there be a less awkward way to inherit?

// One great answer: ECMAScript5 gives us:

something = Object.create(thing);

// We can easily backport this (see http://javascript.crockford.com/prototypal.html):

Object.create = function (proto) {
  function Constructor() {}
  Constructor.prototype = proto;
  return new Constructor();
};

// Let's set up that taxonomy up again.

thing = {
  location: 'the universe',
  organic: false,
  motile: false
};
thing.location = 'the universe';

mineral = Object.create(thing);
organism = Object.create(thing);
vegetable = Object.create(organism);
animal = Object.create(organism);

organism.organic = true;
animal.motile = true;

caveMan = Object.create(animal);
club = Object.create(vegetable);
rock = Object.create(mineral);

[caveMan, club, rock].map(function(o) { return o.location });
[caveMan, club, rock].map(function(o) { return o.organic });
[caveMan, club, rock].map(function(o) { return o.motile });


// What about constructors?

// A simple proposal (inspired by http://javascript.crockford.com/prototypal.html):

thing.initialize = function() {
  this.createdAt = new Date;
}

thing.beget = function(properties) {
  var begotten = Object.create(this);

  begotten.initialize;

  return begotten;
}

mineral = thing.beget();


// A step further:

//     something = thing.beget({prop: 'value', ...});

thing.beget = function(properties) {
  var begotten = Object.create(this);

  begotten.initialize;

  for (key in properties) {
    if (properties.hasOwnProperty(key)) {
      begotten[key] = properties[key];
    }
  }

  return begotten;
};



mineral = thing.beget();
organism = thing.beget({organic: true});
vegetable = organism.beget();
animal = organism.beget({motile: true});

caveMan = animal.beget();
club = vegetable.beget();
rock = mineral.beget();

[caveMan, club, rock].map(function(o) { return o.location });
[caveMan, club, rock].map(function(o) { return o.organic });
[caveMan, club, rock].map(function(o) { return o.motile });
[caveMan, club, rock].map(function(o) { return o.createdAt });
