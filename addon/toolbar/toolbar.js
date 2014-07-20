(function(mod) {
  /* globals define, CodeMirror */
  'use strict';
  if (typeof exports === 'object' && typeof module === 'object') { // CommonJS
    mod(require('../../lib/codemirror'));
  } else if (typeof define === 'function' && define.amd) { // AMD
    define(['../../lib/codemirror'], mod);
  } else { // Plain browser env
    mod(CodeMirror);
  }
})(function(CodeMirror) {
  'use strict';

  function cancelBubble(e) {
    var evt = e ? e:window.event;
    if (evt.stopPropagation)
      evt.stopPropagation();
    if (evt.cancelBubble!=null)
      evt.cancelBubble = true;
  }

  function toolbarInit(cm) {
    var wrapper = document.createElement('div');
    wrapper.className = 'toolbar-wrapper';
    cm.toolbar = {
      wrapper: wrapper
    };
    cm.options.toolbarOpt.toolbarParent.insertBefore(wrapper, cm.options.toolbarOpt.toolbarParent.children[0]);
    toolbarButtons(cm);
  }

  function toolbarDelete(cm) {
    cm.options.toolbarOpt.toolbarParent.removeChild(cm.toolbar.wrapper);
  }

  function toolbarButtons(cm) {
    var buttons = cm.options.toolbarOpt.buttons;
    for (var i = 0; i < buttons.length; i++) {
      if (buttons[i].type === 'delimiter') {
        cm.toolbar.wrapper.appendChild(toolbarDelimiter());
      }
      else if (buttons[i].type === 'select') {
        cm.toolbar.wrapper.appendChild(toolbarSelect(cm, buttons[i]));
      }
      else {
        cm.toolbar.wrapper.appendChild(toolbarButton(cm, buttons[i]));
      }
    }
  }

  function toolbarButton(cm, obj) {
    var button = document.createElement('div');
    button.className = 'toolbar-button toolbar-button-' + obj.id;
    button.setAttribute('title', obj.title);
    button.innerHTML = obj.title;
    CodeMirror.on(button, 'click', function(event) {
      cancelBubble(event);
      if (obj.type === 'codemirror') {
        cm[obj.fn]();
      }
      else {
        insert(cm, obj);
      }
    });
    return button;
  }

  function toolbarDelimiter() {
    var delimiter = document.createElement('div');
    delimiter.className = 'toolbar-button-delimiter';
    return delimiter;
  }

  function toolbarSelect(cm, obj) {
    var select = document.createElement('div');
    var buttons = document.createElement('div');
    select.className = 'toolbar-button toolbar-select toolbar-button-' + obj.id;
    select.setAttribute('title', obj.title);
    select.setAttribute('tabindex', -1);
    buttons.className = 'toolbar-select-container';
    select.appendChild(buttons);
    for (var i = 0; i < obj.items.length; i++) {
      buttons.appendChild(toolbarButton(cm, obj.items[i]));
    }
    CodeMirror.on(select, 'click', function() {
      if (select.className.indexOf('open') === -1) {
        select.className += ' open';
      }
      else {
        select.className = select.className.replace('open', '');
      }
    });
    CodeMirror.on(select, 'blur', function() {
      select.className = select.className.replace('open', '');
    });
    return select;
  }

  function insert(cm, obj) {
    var isSelected = cm.somethingSelected();
    var selections = cm.getSelections();
    var newSelections = [];
    var newSelectionsL = [];
    var newSelectionsR = [];
    var left = obj.left || '';
    var right = obj.right || '';
    
    if (isSelected) {
      for (var i = 0; i < selections.length; i++) {
        newSelections[i] = left + selections[i] + right;
      }
      cm.replaceSelections(newSelections);
    }
    else {
      for (var i = 0; i < selections.length; i++) {
        newSelectionsL[i] = left + selections[i];
        newSelectionsR[i] = selections[i] + right;
      }
      cm.replaceSelections(newSelectionsL);
      cm.replaceSelections(newSelectionsR, 'start');
    }
    
    cm.focus();
  }


  CodeMirror.defineOption('toolbar', false, function(cm, val, old) {
    var defaults = {
      toolbarParent: cm.getWrapperElement().parentNode,
      buttons: []
    };
    if (!cm.options.toolbarOpt) {
      cm.options.toolbarOpt = {};
    }
    for (var key in defaults) {
      if (defaults.hasOwnProperty(key)) {
        cm.options.toolbarOpt[key] = (cm.options.toolbarOpt[key] !== undefined) ? cm.options.toolbarOpt[key] : defaults[key];
      }
    }

    var prev = old && old != CodeMirror.Init;
    if (val && !prev) {
      toolbarInit(cm);
    } else if (!val && prev) {
      toolbarDelete(cm);
    }
  });
});