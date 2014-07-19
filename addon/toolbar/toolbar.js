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