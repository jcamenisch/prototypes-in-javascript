// Shim Object.create for older browsers:
if (typeof Object.create !== 'function') {
  Object.create = function (o) {
    function F(){}
    F.prototype = o;
    return new F();
  };
}


ss_Object = {
  beget: function(properties) {
    var ret = Object.create(this);

    for (name in properties) {
      if (properties.hasOwnProperty(name)) {
        ret[name] = properties[name];
      }
    }

    if (typeof this.initialize == 'function') this.initialize.call(ret);

    return ret;
  }
}


ss_Deck = ss_Object.beget({
  // factory that takes a css selector:
  from_selector: function(selector) {
    return this.beget({
      $pages: $(selector)
    });
  },
  initialize: function() {
    var that = this;

    this.$pages.hide();
    this.pages = this.$pages.map(function(i, el) {
      return ss_Page.from_el(el, that);
    })

    this.navigateTo(0);
  },
  currentPage: null,
  $pages: null,
  pages: [],
  navigateTo: function(index) {
    var nextPage = this.pages[index];
    if (nextPage) {
      if (this.currentPage) this.currentPage.hide();
      nextPage.show();
      this.currentPage = nextPage;
      this.index = index;
    }
  },
  advance: function() {
    if (this.currentPage.complete()) {
      this.navigateTo(this.index + 1);
    } else {
      this.currentPage.advance();
    }
  },
  rewind: function() {
    this.navigateTo(this.index - 1);
  },
  compile: function(code) {
    if (!this.compiler) this.compiler = ss_Compiler.beget();

    return this.compiler.compile(code);
  }
});


ss_Page = ss_Object.beget({
  // factory that takes a DOM element:
  from_el: function(el, deck) {
    var $el = $(el);
    if ($el.data('ss-page-object')) {
      return $el.data('ss-page-object');
    } else {
      var ret = this.beget({
        deck: deck,
        $el: $el,
        el:  el
      });
      // Use jQuery to memoize:
      $el.data('ss-page-object', ret);
      return ret;
    }
  },
  initialize: function() {
    this.parts = this.$el.children();
    this.parts.hide();
    this.hiddenParts = this.parts.toArray();
    this.advance();
  },
  complete: function() {
    return !this.hiddenParts.length;
  },
  splitPart: function(part) {
    var piece, pieces = $(part).children().toArray();
    pieces.shift();
    while (piece = pieces.pop()) {
      $(piece).hide();
      this.hiddenParts.unshift(piece);
    }
  },
  initCompiler: function(part) {
    var $outputContainer = $('<div class="compiler" style="display: none" />');
    $outputContainer.insertAfter(part);
    $outputContainer.data('code', $(part).html());
    this.hiddenParts.unshift($outputContainer[0]);
  },
  compile: function(part) {
    $(part).html(
      this.deck.compile($(part).data('code'))
    );
  },
  processPart: function(part) {
    var $part = $(part);
    if ($part.is('.split')) this.splitPart(part);
    if ($part.is('pre'))    this.initCompiler(part);
    if ($part.data('code')) this.compile(part)
  },
  advance: function() {
    if (this.complete()) return false;

    var nextPart = this.hiddenParts.shift();

    this.processPart(nextPart);
    $(nextPart).show();
    return true;
  },
  hide: function() { this.$el.hide() },
  show: function() { this.$el.show() }
});


ss_Compiler = ss_Object.beget({
  context: {},
  compile: function(code) {
    var _output, lines, variable, context = this.context;
    try {
      with (context) {
        _output = eval(code);
      }
      lines = code.split("\n");
      $.each(lines, function(i, line) {
        if (line.match(/^var /)) {
          variable = line.split(' ')[1];
          context[variable] = eval(variable);
        }
      })
    } catch (e) {
      _output = e.toLocaleString();
    }
    return _output;
  }
});

jQuery(function($) {
  var deck = ss_Deck.from_selector('.page');

  deck.navigateTo(0);

  $(document).click(function(){ deck.advance() });
  Mousetrap.bind(['right', 'down', 'space', 'enter'], function(){ deck.advance() });
  Mousetrap.bind(['left', 'up'], function(){ deck.rewind() });
});
