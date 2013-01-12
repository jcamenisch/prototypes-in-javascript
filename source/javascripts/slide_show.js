// Shim Object.create for older browsers:
if (typeof Object.create !== 'function') {
  Object.create = function (o) {
    function F(){}
    F.prototype = o;
    return new F();
  };
}


ss_Object = {
  copyMembers: function(fromObject, toObject) {
    if (typeof toObject === 'undefined') {
      toObject = this;
    }

    for (name in fromObject) {
      if (fromObject.hasOwnProperty(name)) {
        toObject[name] = fromObject[name];
      }
    }
  },
  requiredProperties: {},
  beget: function(properties) {
    for (name in this.requiredProperties) {
      if (!(properties && properties.hasOwnProperty(name))) {
        var errorMsg = "Must provide property " + name;
        if (this.requiredProperties[name]) {
          errorMsg += ': ' + this.requiredProperties[name];
        }
        throw errorMsg;
      }
    }

    var ret = Object.create(this);

    ret.copyMembers(properties);

    if (typeof this.initialize == 'function') this.initialize.call(ret);

    return ret;
  }
}


ss_Deck = ss_Object.beget({
  requiredProperties: {
    $pages: 'a jQuery object containing all the html elements that will function as pages (or slides)'
  },
  initialize: function() {
    var that = this;

    this.$pages.hide();
    this.pages = this.$pages.map(function(i, el) {
      return ss_Page.beget({el: el, deck: that});
    });

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
    this.currentPage.scrollToBottom(0);
  },
  compile: function(code) {
    if (!this.compiler) this.compiler = ss_Compiler.beget();

    return this.compiler.compile(code);
  }
});


ss_Page = ss_Object.beget({
  requiredProperties: {
    el: 'the DOM element that this page object wraps',
    deck: 'the ss_Deck object that contins this page',
  },
  initialize: function() {
    this.$el = $(this.el);
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
    var output = this.deck.compile($(part).data('code'));
    if (typeof output !== 'undefined') {
      var $prev = $(part).prev();
      $prev.html($prev.html() + '  //=> ' + output);
    } else {
      $(part).data('skip', true);
    }
    $(part).detach();
  },
  appendToPrev: function(part) {
    var
      $part = $(part),
      $prev = $part.prev(),
      prev = $prev[0]
    ;
    if (prev && part.tagName == prev.tagName && part.className == prev.className) {
      $prev.html($prev.html() + "\n" + $part.html());
      $part.detach();
    }
  },
  processPart: function(part) {
    var $part = $(part);
    if ($part.is('.split')) this.splitPart(part);
    if ($part.is('pre')) {
      this.initCompiler(part);
      this.appendToPrev(part);
    }
    if ($part.data('code')) this.compile(part);
  },
  advance: function() {
    if (this.complete()) return false;

    var nextPart = this.hiddenParts.shift();

    this.processPart(nextPart);
    if (!$(nextPart).data('skip')) {
      $(nextPart).show();
      this.scrollToBottom(500);
      return true;
    } else {
      return this.advance();
    }
  },
  scrollToBottom: function(milliseconds) {
    $('body').stop().animate({scrollTop: document.height - window.innerHeight}, milliseconds || 0);
  },
  hide: function() { this.$el.hide() },
  show: function() { this.$el.show() }
});


ss_Compiler = ss_Object.beget({
  context: {},
  compile: function(code) {
    var _output, _lines, _variable, _context = this.context;
    try {
      with (_context) {
        _output = eval(code);
        _lines = code.split("\n");
        $.each(_lines, function(__, _line) {
          if (_line.match(/^var /)) {
            _variable = _line.split(' ')[1];
            _context[_variable] = eval(_variable);
          }
        })
      }
    } catch (e) {
      _output = e.toLocaleString();
    }
    return JSON.stringify(_output);
  }
});

jQuery(function($) {
  var deck = ss_Deck.beget({$pages: $('.page')});

  deck.navigateTo(0);

  Mousetrap.bind(['right', 'down', 'space', 'enter'], function(){ deck.advance() });
  Mousetrap.bind(['left', 'up'], function(){ deck.rewind() });
});
