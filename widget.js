WAF.define('Matrix', ['waf-core/widget', 'Container'], function(widget, Container) {
    'use strict';

    var Matrix = widget.create('Matrix', {
        collection: widget.property({
            type: 'datasource',
            pageSize: 40,
            bindable: true
        }),
        direction: widget.property({
            type: 'enum',
            values: {
                vertical: 'Vertical',
                horizontal: 'Horizontal'
            },
            defaultValue: 'vertical',
            bindable: true
        }),
        mode: widget.property({
            type: 'enum',
            values: {
                split: 'number of columns',
                size: 'size'
            },
            defaultValue: 'split',
            bindable: true
        }),
        number:       widget.property({ type: 'integer', defaultValue: 2 }),
        columnSize:   widget.property({ type: 'number',  defaultValue: 150 }),
        columnMargin: widget.property({ type: 'number',  defaultValue: 10 }),
        rowSize:      widget.property({ type: 'number',  defaultValue: 150 }),
        rowMargin:    widget.property({ type: 'number',  defaultValue: 10 }),
        expand:       widget.property({ type: 'boolean', defaultValue: true })
    });

    var proto = Matrix.prototype;

    Matrix.inherit('waf-behavior/layout/repeater-livescroll');
    Matrix.linkDatasourcePropertyToRepeater('collection');
    Matrix.repeatedWidget(Container);

    function getSelectorRegExp(id) {
        return new RegExp('#' + id + '($|[,. :\\[])');
    }

    function getRules(id) {
        var rules, styles, regexp, res;
        var i, j, count, size;

        regexp = getSelectorRegExp(id);
        styles = document.styleSheets;
        count  = styles ? styles.length : 0;
        res    = [];

        for (i = 0; i < count; i++) {
            rules = styles[i].cssRules || styles[i].rules;
            size  = rules.length;

            for (j = 0; j < size; j++) {
                if (regexp.test(rules[j].selectorText)) {
                    res.push(rules[j]);
                }
            }
        }

        return res;
    }

    function upgradeRules(id, newClass) {
        var regexp    = getSelectorRegExp(id);
        var separator = / *, */;
        getRules(id).forEach(function(rule) {
            var selectors = rule.selectorText.split(separator);
            selectors.some(function(selector) {
                if (regexp.test(selector)) {
                    selectors.push(selector.replace(regexp, '.' + newClass));
                    return true;
                }
                return false;
            });
            rule.selectorText = selectors.join(', ');
        });
    }

    function upgradeWidgetAndRules(widget) {
        var newClass = 'waf-clone-' + widget.node.id;
        upgradeRules(widget.node.id, newClass);
        widget.addClass(newClass);
    }

    proto._getColumnsAvailableSize = function() {
        var size = this.isHorizontalScroll() ? this.node.clientHeight : this.node.clientWidth;
        return size + this.columnMargin() - 20; // TOFIX: hardcoded scrollbar size
    };

    proto._getColumnSize = function() {
        if (this.mode() === 'split') {
            return (this._getColumnsAvailableSize() - this.number() * this.columnMargin()) / this.number();
        }

        if (this.expand()) {
            return this._getColumnsAvailableSize() / Math.floor(this._getColumnsAvailableSize() / (this.columnSize() + this.columnMargin())) - this.columnMargin();
        }

        return this.columnSize();
    };

    proto._getTop = function(position) {
        var row = Math.floor(position / this.getItemsPerRow());
        return (this.rowSize() + this.rowMargin()) * row;
    };

    proto._getLeft = function(position) {
        var column = position % this.getItemsPerRow();
        return (this._getColumnSize() + this.columnMargin()) * column;
    };

    proto.repeaterGetCoordinates = function(position) {
        var res = {};
        if (this.isHorizontalScroll()) {
            res.top    = this._getLeft(position);
            res.left   = this._getTop(position);
            res.height = this._getColumnSize();
            res.width  = this.rowSize();
        }
        else {
            res.left   = this._getLeft(position);
            res.top    = this._getTop(position);
            res.width  = this._getColumnSize();
            res.height = this.rowSize();
        }
        return res;
    };

    // get master css and transform it in classes
    proto._upgradeCSSRules = function() {
        var repeatedWidget = this.repeatedWidget();
        if (repeatedWidget) {
            upgradeWidgetAndRules(repeatedWidget);
            repeatedWidget.allChildren().forEach(upgradeWidgetAndRules);
        }
    };

    // Live scroll method
    proto.getRowSize = function() {
        return this.rowSize() + this.rowMargin();
    };

    proto.getScrolledNode = function() {
        if (!$('>div', this.node).length) {
            this.node.innerHTML = '<div></div>';
        }
        return $('>div', this.node).get(0);
    };

    proto.getItemsPerRow = function() {
        if (this.mode() === 'split') {
            return this.number();
        }

        return Math.floor(this._getColumnsAvailableSize() / (this.columnSize() + this.columnMargin()));
    };

    proto.isHorizontalScroll = function() {
        return this.direction() === 'horizontal';
    };

    proto.init = function() {
        var scrolled = this.getScrolledNode();

        this._upgradeCSSRules();
        this.addClass('waf-matrix2');

        $(scrolled).on('click', function(event) {
            var collection = this.collection();
            var target     = event.target;

            while (target && target.parentNode !== scrolled) {
                target = target.parentNode;
            }

            if (collection && target) {
                collection.select(this.getPosition(target));
            }
        }.bind(this));

        this.collection.subscribe('currentElementChange', function() {
            var position, widget;

            position = this.collection().getPosition();
            widget   = this.widgetByPosition(position);

            this.invoke('removeClass', 'waf-state-selected');
            if (widget) {
                widget.addClass('waf-state-selected');
            }
        }, this);
    };

    return Matrix;
});