/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Toolkit JavaScript
	 */

	'use strict';

	__webpack_require__(2);
	__webpack_require__(3);

/***/ },
/* 1 */,
/* 2 */
/***/ function(module, exports) {

	//http://mozmonkey.com/2013/12/good-ux-for-placeholders-as-field-labels/
	'use strict';

	/**
	 * Existing FloatLabels objects
	 * @type {Array}
	 */

	var floatLabels = [];

	/**
	 * field selectors.
	 * @type {Array}
	 */
	var fieldSelector = ["input[type='number']", "input[type='text']", "input[type='password']", "input[type='email']", "input[type='tel']", "textarea", "select", "#state-button-label"].join(",");

	/**
	 * FloatLabels constructor
	 * @param {jquery element} $fieldSet the fieldset element to bind to.
	 */
	function FloatLabels($fieldSet) {

	    return {
	        /**
	         * The current fieldset
	         * @type {jquery element}
	         */
	        $fieldSet: $fieldSet,

	        /**
	         * Determin if field element is in current field set.
	         * @param  {jQuery element}  $field the target field
	         * @return true if in current fieldset, else false
	         */
	        isForMe: function isForMe($field) {
	            if ($field.parent().is(this.$fieldSet)) {
	                return true;
	            }

	            return false;
	        },

	        on: function on() {
	            this.$fieldSet.addClass('show-label');
	        },

	        off: function off() {
	            this.$fieldSet.removeClass('show-label');
	        },

	        /**
	         * Field focus event handler
	         * @param  {event} e the delegated focus event
	         */
	        focus: function focus(e) {
	            if (!this.isForMe($(e.target))) {
	                return;
	            }

	            this.on();
	        },

	        /**
	         * Field change event handler
	         * @param  {event} e the delegated change event
	         */
	        change: function change(e) {
	            if (!this.isForMe($(e.target))) {
	                return;
	            }

	            if (!$(e.target).val()) {
	                this.off();
	            } else {
	                this.on();
	            }
	        },

	        /**
	         * Handle prepolated data fields
	         * @param  {jQuery element} $field the field to check
	         * @return callback
	         */
	        prepopulate: function prepopulate($field) {
	            var self = this;

	            return function () {
	                if (!self.isForMe($field)) {
	                    return;
	                }

	                if ($field.val()) {
	                    self.on();
	                } else {
	                    self.off();
	                }

	                if ($field.attr('autofocus') || $field.is(':focus')) {
	                    self.on();
	                }
	            };
	        },

	        /**
	         * Initialize the floatLabels for current fieldSet
	         */
	        init: function init() {

	            $(document).on('focus.floatLabels', fieldSelector, function (e) {
	                this.focus(e);
	            }.bind(this));

	            $(document).on('blur.floatLabels', fieldSelector, function (e) {
	                this.change(e);
	            }.bind(this));

	            $(document).on('change.floatLabels', fieldSelector, function (e) {
	                this.change(e);
	            }.bind(this));

	            // $(document).on('keyup.floatLabels', fieldSelector, function(e) {
	            //     this.change(e);
	            // }.bind(this));

	            $(fieldSelector).each(function (i, field) {
	                setTimeout(this.prepopulate($(field)), 250);
	            }.bind(this));
	        }
	    };
	}

	/**
	 * Check to see if fieldset has been initialized.
	 * @param  {jQuery object} $fieldSet the fieldset jquery element
	 * @return {Boolean} true if initialized, false if not
	 */
	function fieldSetInitialized($fieldSet) {
	    for (var i = 0; i < floatLabels.length; i++) {
	        if ($fieldSet.is(floatLabels[i].$fieldSet)) {
	            return true;
	        }
	    }
	    return false;
	}

	/**
	 * Initialize float labels
	 */
	function initFloatLabels() {
	    $('.rs-tb, .rs-dd').each(function () {
	        if (fieldSetInitialized($(this))) {
	            return;
	        }

	        var fl = new FloatLabels($(this));
	        fl.init();
	        floatLabels.push(fl);
	    });
	}
	initFloatLabels();

	/**
	 * Handle async loaded inputs
	 */
	$(document).on('focus.floatLabels', fieldSelector, function () {
	    var $fieldSet = $(this).closest('.rs-tb, .rs-dd');

	    if ($fieldSet.length && !fieldSetInitialized($fieldSet)) {
	        initFloatLabels();
	    }
	});

	// Remove the Choose... text from a select dropdown
	$("option:contains('Choose...'), option:contains('Month'), option:contains('Year')").addClass('chooseText');

	// text area input class addition
	$("#addToCartForm #messageWrapper label").addClass('textAreaLabel');

	// instantiate float labels
	$('select').selectBox({
		mobile: true
	});

	// getting modals to work

	$(document).on('click.floatLabels', '.add-shipping-address, .add-cc', function () {
	    setTimeout(function () {
	        $('#modalContainer fieldset fieldset, #modalContainer fieldset .form-element').each(function (i, fieldset) {
	            new FloatLabels($(fieldset)).init();
	        });
	    }, 800);
	});

/***/ },
/* 3 */
/***/ function(module, exports) {

	'use strict';

	$(document).ready(function () {

	    $('.search-results-block .search-box-options .sort-link').click(function () {
	        event.preventDefault(); // remove in production
	        $('ul.search-box-options').toggleClass('expand');
	        $('ul.search-box-results').removeClass('expand');
	    });

	    $('.search-results-block .search-box-results .number-link').click(function () {
	        event.preventDefault(); // remove in production
	        $('ul.search-box-results').toggleClass('expand');
	        $('ul.search-box-options').removeClass('expand');
	    });
	});

/***/ }
/******/ ]);