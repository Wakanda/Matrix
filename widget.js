WAF.define('Matrix', ['waf-core/widget', 'Container'], function(widget, Container) {
    'use strict';

    var Matrix = widget.create('Matrix', {
        direction: widget.property({
            type: 'enum',
            values: {
                vertical: 'Vertical',
                horizontal: 'Horizontal'
            },
            defaultValue: 'vertical',
            bindable: true
        }),
        collection: widget.property({
            type: 'datasource',
            pageSize: 40,
            bindable: true
        }),
        column: widget.property({
            type: 'enum',
            values: {
                number: 'number of columns',
                size: 'size'
            },
            defaultValue: 'number',
            bindable: true
        }),
        numberColumns: widget.property({ type: 'integer', defaultValue: 2 }),
        columnSize:    widget.property({ type: 'number',  defaultValue: 150 }),
        columnMargin:  widget.property({ type: 'number',  defaultValue: 10 }),
        rowSize:       widget.property({ type: 'number',  defaultValue: 150 }),
        rowMargin:     widget.property({ type: 'number',  defaultValue: 10 }),
        expand:        widget.property({ type: 'boolean', defaultValue: true })
    });

    var proto = Matrix.prototype;

    Matrix.inherit('waf-behavior/layout/repeater-livescroll');
    Matrix.linkDatasourcePropertyToRepeater('collection');
    Matrix.repeaterReuseClonedWidgets();
    Matrix.repeatedWidget(Container);

    function addRules(id, newClass) {
        // Not ready yet
        if (!document.styleSheets) {
            return;
        }

        var rules, styles, regexp, res, matches;
        var i, j, count, size;

        regexp = new RegExp('#' + id + '($|[,. :\\[].*)');
        styles = document.styleSheets;
        count  = styles.length;
        res    = [];

        for (i = 0; i < count; i++) {
            rules = styles[i].cssRules || styles[i].rules;
            size  = rules.length;

            for (j = 0; j < size; j++) {
                if (rules[j].selectorText && (matches = rules[j].selectorText.match(regexp))) {
                    styles[i].insertRule('.waf-theme:not(.vip) .' + newClass + matches[1] + ' {' + rules[j].style.cssText + '}', styles[i].cssRules.length);
                }
            }
        }
    }

    function upgradeWidgetAndRules(widget) {
        var newClass = 'waf-clone-' + widget.node.id;
        addRules(widget.node.id, newClass);
        widget.addClass(newClass);
    }


    // Avoid read/write operation in rendering
    proto._recalculateSize = function (fixHiddenMatrix) {
        var $node = $(this.node.firstChild);
        var rendered = !!$node.parents(':visible').length;

        // Can't get clientWidth and clientHeight when the matrix is invisible
        // Have to show all hidden parents element, get the position, and hide them again
        if (rendered) {
            var parents = $(null);
            var parent;

            while ($node.is(':hidden')) {
                parent = $node.parents(':hidden').last();
                if (!parent.length) {
                    break;
                }
                parent.show();
                parents.push(parent);
            }

            parent = $node.parent();
            this._matrixWidth  = parent.width();
            this._matrixHeight = parent.height();

            parents.hide();
        }
    };

    proto._getColumnsAvailableSize = function() {
        if (!this._matrixWidth || !this._matrixHeight) {
            this._recalculateSize();
        }

        var size = this.isHorizontalScroll() ? this._matrixHeight : this._matrixWidth;
        return size + this.columnMargin() - 20; // TOFIX: hardcoded scrollbar size
    };

    proto._getColumnSize = function() {
        if (this.column() === 'number') {
            return Math.floor((this._getColumnsAvailableSize() - this.numberColumns() * this.columnMargin()) / this.numberColumns() );
        }

        if (this.expand()) {
            return Math.floor(this._getColumnsAvailableSize() / Math.floor(this._getColumnsAvailableSize() / (this.columnSize() + this.columnMargin())) - this.columnMargin());
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
        if (this.column() === 'number') {
            return this.numberColumns();
        }

        return Math.floor(this._getColumnsAvailableSize() / (this.columnSize() + this.columnMargin()));
    };

    proto.isHorizontalScroll = function() {
        return this.direction() === 'horizontal';
    };

    proto.getThreshold = function() {
        if (!this._matrixWidth || !this._matrixHeight) {
            this._recalculateSize();
        }

        var size = this.isHorizontalScroll() ? this._matrixWidth : this._matrixHeight;
        return Math.ceil(0.2 * size / this.getRowSize()) * this.getItemsPerRow();
    };

    proto.init = function() {
        var _target = null;
        var scrolled = this.getScrolledNode();
        var $scrolled = $(scrolled);
        var $scroller = $(this.getScrollerNode());

        this._upgradeCSSRules();
        this.addClass('waf-matrix2');

        // Mobile touch optimization
        $scrolled.on('touchstart', function(event) {
            _target = event.target;
        });

        // Unselect target
        $scrolled.on('touchmove', function(){
            _target = null;
        });

        // Overwrite onPrefetch to recalculate matrix size and avoid read/write
        // operation during rendering.
        var onPrefetch = this.onPrefetch;
        this.onPrefetch = function() { 
            this._recalculateSize();
            onPrefetch.apply(this, arguments);
        };

        // Change element
        $scrolled.on('click touchend', function(event) {
            // Avoid selecting a node on touchscroll
            if (event.type === 'touchend' && (!_target || event.target !== _target)) {
                return false;
            }

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

            var scrolling = {};
            var key = 'scroll' + (this.isHorizontalScroll() ? 'Left' : 'Top');
            var pos = Math.max(0, this._getTop(position) - 40);
            var size = this.isHorizontalScroll() ? this.width() : this.height();

            if (pos < $scroller[key]() || pos > $scroller[key]() + size) {
                scrolling[key] = pos;
                $scroller.animate(scrolling, 500);
            }
        }, this);

        // Reset scrollbar
        this.collection.onChange(function(){
            $scroller['scroll' + (this.isHorizontalScroll() ? 'Left' : 'Top')](0);
        });

        this.subscribe('rowload', function(event){
            event.data.widget.addClass('waf-state-loading');
        });

        this.subscribe('rowdraw', function(event){
            event.data.widget.removeClass('waf-state-loading');
        });

        this.direction.onChange(this._updateSize);
        this.expand.onChange(this._updateSize);
        this.rowMargin.onChange(this._updateSize);
        this.columnMargin.onChange(this._updateSize);
        this.numberColumns.onChange(this._updateSize);
        this.columnSize.onChange(this._updateSize);
        this.rowSize.onChange(this._updateSize);
    };

    proto._updateSize = function() {
        this.getScrollerNode().scrollLeft = 0;
        this.getScrollerNode().scrollTop = 0;
        if(this.collection.start() !== 0) {
            this.collection.fetch(0);
        } else {
            this.widgets().forEach(function(widget) {
                var position = this.getPosition(widget);
                var coords = this.repeaterGetCoordinates(position);
                for(var key in coords) {
                    if(widget[key]) {
                        widget[key](coords[key]);
                    }
                }
            }.bind(this));
        }
    };

    return Matrix;
});
