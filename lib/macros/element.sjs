macro property {
  rule {
    get $key:ident ($args1 (,) ...) { $body1 ... } , set $key:ident ($args2 (,) ...) { $body2 ... }
  } => {
    $key : { 
      enumerable: true,
      get : function() {
        $body1 ...
      },
      set : function($args2 (,) ...) {
        $body2 ...
      }
    }
  }
  rule {
    set $key:ident ($args2 (,) ...) { $body2 ... }, get $key:ident ($args1 (,) ...) { $body1 ... } 
  } => {
    $key : { 
      enumerable: true,
      get : function() {
        $body1 ...
      },
      set : function($args2 (,) ...) {
        $body2 ...
      }
    }
  }
  rule { get $key:ident ($args (,) ...) { $body ... } } => { 
    $key : { 
      enumerable: true,
      get : function() {
        $body ...
      }
    }
  }
  rule { set $key:ident ($args (,) ...) { $body ... } } => { 
    $key : { 
      enumerable: true,
      set : function($args (,) ...) {
        $body ...
      }
    }
  }
  rule { $key:ident : protected function($args (,) ...) { $body ... } } => { 
    $key : { 
      value : function($args (,) ...) {
        $body ...
      }
    }
  }
  rule { $key:ident : function($args (,) ...) { $body ... } } => { 
    $key : { 
      enumerable: true,
      value : function($args (,) ...) {
        $body ...
      }
    }
  }
  rule { $key:ident : $value:expr } => { 
    $key : { value : $value }
  }
  rule { $key:ident : $value:lit } => { 
    $key : { value : $value }
  }
  rule { $key } => {
    $key : { value : null }
  }
}

macro def__element {
  case { _ $name:lit extends $extendee:ident { $properties:property (,) ... } } => {
    var stx = #{$name},
        name = stx[0].token.value,
        tagName = makeValue(name, #{$name}),
        elementName = makeIdent(name.camelize(), #{$name}),
        protoName = makeIdent(name.camelize() + 'Prototype', #{$name});
    
    letstx $tagName = [tagName];
    letstx $elementName = [elementName];
    letstx $protoName = [protoName];

    return #{
      var $protoName = Object.create($extendee.prototype, { $properties (,) ... }); 
      window.$elementName = document.registerElement($tagName, {
        prototype: $protoName
      });
      Object.defineProperty($elementName.prototype, '_super', {
        enumerable: false,
        writable: false,
        configurable: false,
        value: $extendee.prototype
      });
    }
  }

  case { $macro $name:lit extends $extendee:lit } => {
    var stx = #{$extendee},
        extendee = stx[0].token.value,
        extendeeName = makeIdent(extendee.camelize(), #{$extendee});
    
    letstx $extendeeName = [extendeeName];

    return #{
      $macro $name extends $extendeeName 
    }
  }

  case { $macro $name:lit } => {
    return #{
      $macro $name extends HTMLElement
    }
  }
}
