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
      $pages: $(selector),
      pages:  $(selector).map(function(i, el) {
        return ss_Page.from_el(el);
      })
    });
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
  }
});

// Wrapper object a page
ss_Page = ss_Object.beget({
  // factory that takes a DOM element:
  from_el: function(el) {
    var $el = $(el);
    if ($el.data('ss-page-object')) {
      return $el.data('ss-page-object');
    } else {
      var ret = this.beget({
        $el: $el,
        el:  el
      });
      // Use jQuery to memoize:
      $el.data('ss-page-object', ret);
      return ret;
    }
  },
  initialize: function() {
    this.parts = this.$el.children().hide();
    this.advance();
  },
  hiddenParts: function() {
    return this.parts.filter(':hidden');
  },
  complete: function() {
    return !this.hiddenParts().length;
  },
  advance: function() {
    if (this.complete()) return false;

    this.hiddenParts().first().show();
    return true;
  },
  hide: function() { this.$el.hide() },
  show: function() { this.$el.show() }
});


jQuery(function($) {
  $('.page').hide();

  var deck = ss_Deck.from_selector('.page');

  deck.navigateTo(0);

  $(document).click(function(){ deck.advance() });
  Mousetrap.bind(['right', 'down', 'space', 'enter'], function(){ deck.advance() });
  Mousetrap.bind(['left', 'up'], function(){ deck.rewind() });
});
