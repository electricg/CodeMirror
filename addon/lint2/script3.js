//
TagManagerIde = function (textAreaEl, config) {
	config = config || {};
	// General tools
	var $2 = document.querySelectorAll.bind(document);
	var $$2 = document.querySelector.bind(document);
	function hasClass(ele, cls) {
		if (ele) {
			return ele.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
		}
	}
	function addClass(ele, cls) {
		if (ele) {
			if (!hasClass(ele, cls)) ele.className += " " + cls;
		}
	}
	function removeClass(ele, cls) {
		if (ele) {
			if (hasClass(ele, cls)) {
				var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
				ele.className = ele.className.replace(reg, '');
			}
		}
	}


	// Additional html elements
	function createEl(tag, id, klass, html) {
		if (!tag) {
			tag = 'div';
		}
		var el = document.createElement(tag);

		if (id) {
			el.id = id;
		}
		if (klass) {
			el.className = klass;
		}
		if (html) {
			el.innerHTML = html;
		}

		return el;
	}
	function createMarkup(textAreaEl) {
		var parent = textAreaEl.parentNode;

		var ideWrapper = createEl('div', 'ide-wrapper', 'ide-wrapper'),
			cmWrapper = createEl('div', 'cm-wrapper', 'cm-wrapper');
		parent.appendChild(ideWrapper);
		ideWrapper.appendChild(cmWrapper);
		cmWrapper.appendChild(textAreaEl);

		// JSHint
		var consoleWrapper = createEl('div', 'console-wrapper', 'console-wrapper'),
			consoleLog = createEl('div', 'console-log', 'console-log'),
			consoleLogHead = createEl('div', 'console-log-head', 'console-log-head', 'Editor Console'),
			consoleLogCount = createEl('span', 'console-log-count', 'console-log-count');
		ideWrapper.appendChild(consoleWrapper);
		consoleWrapper.appendChild(consoleLog);
		consoleWrapper.appendChild(consoleLogHead);
		consoleLogHead.appendChild(consoleLogCount);

		return {
			consoleLog: consoleLog,
			consoleLogHead: consoleLogHead,
			consoleLogCount: consoleLogCount,
			consoleWrapper: consoleWrapper,
			ideWrapper: ideWrapper,
			cmWrapper: cmWrapper
		};
	}
	var markup = createMarkup(textAreaEl);
		// JSHint & Collapsible
	var consoleLog = markup.consoleLog,
		consoleLogHead = markup.consoleLogHead,
		consoleLogCount = markup.consoleLogCount,
		consoleWrapper = markup.consoleWrapper,
		ideWrapper = markup.ideWrapper,
		cmWrapper = markup.cmWrapper;


	// JSHint
	var gutterJSHint = 'Codemirror-gutter-jshint',
	gutterJSHintError = 'lint-icon-error',
	gutterJSHintAlert = 'lint-icon-alert';

	function getExtraOpts(opts){
		if (config.opts) {
			for (var p in config.opts) {
				if (config.opts.hasOwnProperty(p)) {
					opts[p] = config.opts[p];
				}
			}
		}
	}
	function getOpts() {
		var opts = {};

		opts.asi = true;
		opts.eqeqeq = false;
		opts["-W041"] = false;
		opts.smarttabs = true;
		opts["-W099"] = false;
		opts.sub = true;
		opts.expr = true;
		opts["-W004"] = false;
		opts.scripturl = true;
		opts.supernew = true;
		opts.loopfunc = true;
		opts["-W032"] = false;
		opts["-W080"] = false;

		getExtraOpts(opts);

		return opts;
	}
	var widgets = [];
	function updateHints() {
		editor.operation(function () {
			for (var i = 0; i < widgets.length; ++i) {
				editor.removeLineWidget(widgets[i]);
			}
			widgets.length = 0;

			var counterE = 0,
				counterW = 0;

			editor.clearGutter(gutterJSHint);

			if(consoleLog) consoleLog.innerHTML = '';

			var jshintOpts = getOpts();
			JSHINT(editor.getValue(), jshintOpts);
			for (var i = 0; i < JSHINT.errors.length; ++i) {
				var err = JSHINT.errors[i];
				if (!err) continue;

				var iconGutterClass = gutterJSHintError;
				if (err.code[0].toLowerCase() === 'w') {
					iconGutterClass = gutterJSHintAlert;
					counterW++;
				}
				else {
					counterE++;
				}


				// gutter
				var iconGutterError = document.createElement("span");
				iconGutterError.title = err.reason;
				iconGutterError.className = 'lint-icon-gutter ' + iconGutterClass;
				editor.setGutterMarker(err.line - 1, gutterJSHint, iconGutterError);


				// console
				if (consoleLog) {
					var consoleLogTxt = 'Line ' + err.line + ': ';
					var consoleLogMsg = document.createElement('div');
					consoleLogMsg.appendChild(document.createTextNode(consoleLogTxt + err.reason));
					consoleLogMsg.className = iconGutterClass + ' console-log-line';
					consoleLogMsg.setAttribute('data-ch', err.character);
					consoleLogMsg.setAttribute('data-line', err.line);
					consoleLogMsg.setAttribute('data-reason', err.reason);
					consoleLog.appendChild(consoleLogMsg);

					consoleLogMsg.addEventListener('click', function () {
						var ch = this.getAttribute('data-ch');
						var line = this.getAttribute('data-line');
						var reason = this.getAttribute('data-reason');
						var lineHeight = editor.defaultTextHeight();
						editor.setCursor({ line: (line - 1), ch: (ch - 1) });
						editor.scrollIntoView(null, lineHeight * 3);
						editor.focus();

						removeClass($$2('.console-log-line-selected'), 'console-log-line-selected');
						addClass(this, 'console-log-line-selected');


						for (var i = 0; i < widgets.length; ++i) {
							editor.removeLineWidget(widgets[i]);
						}
						widgets.length = 0;
						var msg = document.createElement("div");
						msg.appendChild(document.createTextNode(reason));
						msg.className = "lint-error";
						widgets.push(editor.addLineWidget(line - 1, msg, { coverGutter: false, noHScroll: true }));
					});
				}
			}

			var counterEclass = counterWclass = '';
			if (counterE === 0) counterEclass = ' dis';
			if (counterW === 0) counterWclass = ' dis';

			consoleLogCount.innerHTML = ' <i class="lint-icon-error'+counterEclass+'"></i> ' + counterE + ' errors  <i class="lint-icon-alert'+counterWclass+'"></i> ' + counterW + ' warnings';
		});
		var info = editor.getScrollInfo();
		var after = editor.charCoords({ line: editor.getCursor().line + 1, ch: 0 }, "local").top;
		if (info.top + info.clientHeight < after) {
			editor.scrollTo(null, after - info.clientHeight + 3);
		}
	}


	// CodeMirror
	window.editor = CodeMirror.fromTextArea(textAreaEl, {
		lineNumbers: true,
		mode: "javascript",
		highlightSelectionMatches: true,
		styleActiveLine: true,
		gutters: ['CodeMirror-linenumbers', gutterJSHint],
		//lineWrapping: true,
		matchBrackets: true,
		autoCloseBrackets: true
	});


	// JSHint
	var waiting;
	editor.on("change", function () {
		clearTimeout(waiting);
		waiting = setTimeout(updateHints, 500);
	});
	setTimeout(updateHints, 100);


	// Tern
	function initTern(defs){
		var keyMap = {
			"Ctrl-I": function(cm) { server.showType(cm); },
			"Ctrl-Space": function(cm) { server.complete(cm); },
			"Alt-.": function(cm) { server.jumpToDef(cm); },
			"Alt-,": function(cm) { server.jumpBack(cm); },
			"Alt-Q": function(cm) { server.renameHighlight(cm); }
		};

		var server = new CodeMirror.TernServer({
			defs: defs,
			useWorker: false,
			tooltipType: 'output', // output | balloon
			cm: editor
		});

		editor.addKeyMap(keyMap);
		editor.on("cursorActivity", function(cm) { server.updateArgHints(cm); });
	}

	if (typeof defs == "undefined") {
		defs = [];
	}
	initTern(defs);


	// Comments
	editor.addKeyMap({"Ctrl-/": function(cm) { CodeMirror.commands.toggleComment(cm); }});


	// Collapsible
	function collapsible() {
		var ternOutput = 'CodeMirror-Tern-output',
			t = 250; // timeout to redraw the output element

		var a = 2, // pixels for the border
			b = -1, // it's a negative margin
			c = 1, // console-log border
			p = 'px',
			p_reg = new RegExp(p, 'gi'),
			hideClass = 'ide-wrapper-hide',
			openClass = 'x-tool-expand-south',
			closeClass = 'x-tool-expand-north';

		var consoleWrapperHeight = consoleWrapper.offsetHeight,
			consoleLogHeadHeight = consoleLogHead.offsetHeight,
			output = document.getElementById(ternOutput),
			outputHeight = output.offsetHeight + a;

		addClass(ideWrapper, hideClass);
		addClass(consoleLogHead, 'x-tool');
		cmWrapper.style.paddingBottom = (consoleLogHeadHeight + outputHeight) + p;
		consoleWrapper.style.marginTop = (b * consoleLogHeadHeight - c) + p;
		addClass(consoleLogHead, openClass);

		consoleLogHead.addEventListener('click', function() {
			outputHeight = output.offsetHeight + a;
			if (hasClass(ideWrapper, hideClass)) {
				removeClass(ideWrapper, hideClass);
				cmWrapper.style.paddingBottom = (consoleWrapperHeight + outputHeight) + p;
				consoleWrapper.style.marginTop = (b * consoleWrapperHeight) + p;
				removeClass(consoleLogHead, openClass);
				addClass(consoleLogHead, closeClass);
			}
			else {
				addClass(ideWrapper, hideClass);
				cmWrapper.style.paddingBottom = (consoleLogHeadHeight + outputHeight) + p;
				consoleWrapper.style.marginTop = (b * consoleLogHeadHeight - c) + p;
				removeClass(consoleLogHead, closeClass);
				addClass(consoleLogHead, openClass);
			}
			// refresh codemirror after the css animation has finished
			setTimeout(function() { editor.refresh(); }, 250);
		});

		var prevOutputHeight = output.offsetHeight;

		function check_output() {
			window.setTimeout(function() {
				var newOutputHeight = output.offsetHeight;

				if (prevOutputHeight !== newOutputHeight) {
					cmWrapper.style.paddingBottom = ((cmWrapper.style.paddingBottom.replace(p_reg, '') * 1) - prevOutputHeight + newOutputHeight) + p;
					prevOutputHeight = newOutputHeight;
				}

				check_output();
			}, t);
		}
		check_output();
	}
	collapsible();


	return window.editor;
};