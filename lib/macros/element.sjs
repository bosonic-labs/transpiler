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
  case { _ $name:lit { $properties:property (,) ... } } => {
    function getNames(str) {
      var matches = str.match(/^([A-Za-z0-9\-]+)\s+extends\s+([A-Za-z0-9\-]+)$/);
      if (matches) {
        console.log(matches);
        var elementName = matches[1].camelize();
        return {
          tag: matches[1],
          element: elementName, 
          prototype: elementName + 'Prototype',
          extendee: matches[2].camelize()
        };
      } else {
        //console.log(str);
        var elementName = str.camelize();
        return {
          tag: str,
          element: elementName, 
          prototype: elementName + 'Prototype',
          extendee: 'HTMLElement'
        };
      }
    }
    
    var stx = #{$name},
        racine = stx[0].token.value,
        names = getNames(racine);
    
    var tagName = makeValue(names.tag, #{$name});
    letstx $tagName = [tagName];
    var protoName = makeIdent(names.prototype, #{$name});
    letstx $protoName = [protoName];
    var elementName = makeIdent(names.element, #{$name});
    letstx $elementName = [elementName];
    var extendeeName = makeIdent(names.extendee, #{$name});
    letstx $extendeeName = [extendeeName];
    
    return #{
      var $protoName = Object.create($extendeeName.prototype, { $properties (,) ... }); 
      var $elementName = document.registerElement($tagName, {
        prototype: $protoName
      }); 
    }
  }
}

macro def__template {
  case { _ $name:lit $html:lit } => {
    var stx = #{$name},
        tagName = stx[0].token.value,
        protoName = makeIdent(tagName.camelize() + 'Prototype', #{$name});
    
    letstx $protoName = [protoName];

    return #{
      Object.defineProperty($protoName, 'template', {
        get: function() {
          var fragment = document.createDocumentFragment();
          var div = fragment.appendChild(document.createElement('div'));
          div.innerHTML = $html;
          while (child = div.firstChild) {
            fragment.insertBefore(child, div);
          }
          fragment.removeChild(div);
          return { content: fragment }
        }
      });
    }
  }
}
