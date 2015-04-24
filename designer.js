(function(Matrix) {
    'use strict';

    // Set size
    Matrix.setWidth(300);
    Matrix.setHeight(300);

    // Define events
    Matrix.addEvents({
        name: 'click',
        description: 'On Click',
        category: 'Mouse Events'
    },{
        name: 'dblclick',
        description: 'On Double Click',
        category: 'Mouse Events'
    },{
        name: 'mousedown',
        description: 'On Mouse Down',
        category: 'Mouse Events'
    },{
        name: 'mouseout',
        description: 'On Mouse Out',
        category: 'Mouse Events'
    },{
        name: 'mouseover',
        description: 'On Mouse Over',
        category: 'Mouse Events'
    },{
        name: 'mouseup',
        description: 'On Mouse Up',
        category: 'Mouse Events'
    },{
        name: 'touchcancel',
        description: 'On Touch Cancel',
        category: 'Touch Events'
    },{
        name: 'touchend',
        description: 'On Touch End',
        category: 'Touch Events'
    },{
        name: 'touchmove',
        description: 'On Touch Move',
        category: 'Touch Events'
    },{
        name: 'touchstart',
        description: 'On Touch Start',
        category: 'Touch Events'
    },{
        name: 'rowdraw',
        description: 'On Row Draw',
        category: 'Matrix Events'
    });

    // Modify properties
    Matrix.customizeProperty('column', { description: 'Column defined either by size or number' });
    Matrix.customizeProperty('expand', { description: 'Expand container to fit available space' });
    Matrix.customizeProperty('rowSize', { title: 'Row size', description: 'Row size in pixels' });
    Matrix.customizeProperty('rowMargin', { title: 'Row margin', description: 'Row margin in pixels' });
    Matrix.customizeProperty('direction', { description: 'Scroll direction (horizontal or vertical)' });
    Matrix.customizeProperty('columnSize', { title: 'Column size', description: 'Column size in pixels' });
    Matrix.customizeProperty('collection', { description: 'Datasource to apply to the Matrix' });
    Matrix.customizeProperty('columnMargin', { title: 'Column margin', description: 'Column margin in pixels' });
    Matrix.customizeProperty('numberColumns', { title: 'Number of columns', description: 'Number of columns to display' });

    // Set panel menu
    Matrix.setPanelStyle({
        'fClass': true,
        'text': false,
        'textShadow': false,
        'dropShadow': true,
        'innerShadow': true,
        'background': true,
        'border': true,
        'label': true,
        'sizePosition': true
    });


    function updateSize() {
        var num, coords, size, widget;

        this._recalculateSize();

        coords = this.repeaterGetCoordinates(0);
        size   = this.isHorizontalScroll() ? this._matrixWidth : this._matrixHeight;
        widget = this.widget(0);

        widget.node.style.width  = coords.width + 'px';
        widget.node.style.height = coords.height + 'px';

        num = this.getItemsPerRow() * Math.ceil(size / this.getRowSize());
        this.studioRepeatedClones(num - 1);
    }

    Matrix.studioOnResize(updateSize);
    Matrix.containerChildrenAreSubWidgets();

    Matrix.doAfter('init', function() {
        var errorMsg = $('<div/>');
        errorMsg.addClass('well waf-studio-donotsave');
        errorMsg.css({
            display:    'none',
            zIndex:      100,
            position:   'absolute',
            top:         0,
            left:        0,
            width:      '100%',
            height:     '100%',
            textAlign:  'center',
            fontSize:   '24px',
            padding:     10,
            paddingTop: '30%'
        });
        errorMsg.text('The Collection property datasource is missing.');
        errorMsg.appendTo(this.node);

        this.direction.onChange(updateSize);
        this.expand.onChange(updateSize);
        this.rowMargin.onChange(updateSize);
        this.columnMargin.onChange(updateSize);

        this.numberColumns.onChange(_min('numberColumns', 1));
        this.columnSize.onChange(_min('columnSize', 20));
        this.rowSize.onChange(_min('rowSize', 20));
        this.column.onChange(showMode);

        this.subscribe('datasourceBindingChange', function(event) {
            if (event.target === 'column') {
                showMode.call(this);
            }
            else if (event.target === 'collection') {
                checkBinding.call(this);
            }
        }, this);

        $(this.getScrolledNode()).off('touchstart, touchmove, touchend, click');

        // Cap value
        function _min(property, value) {
            function updater() {
                this[property](value);
            }

            return function() {
                if (this[property]() < value) {
                    setTimeout(updater.bind(this), 10);
                }
                else {
                    updateSize.call(this);
                }
            };
        }

        function showMode() {
            this.numberColumns.show();
            this.columnSize.show();
            this.expand.show();

            if (this.column.boundDatasource()) {
                // nothing to hide
            } else if (this.column() === 'size') {
                this.numberColumns.hide();
            } else if (this.column() === 'number') {
                this.columnSize.hide();
                this.expand.hide();
            }

            updateSize.call(this);
        }

        function checkBinding(){
            errorMsg.toggle(!this.collection.boundDatasource());
        }

        checkBinding.call(this);
        setTimeout(showMode.bind(this), 100);

        this.repeatedWidget().addState('selected');
    });

    Matrix.prototype._upgradeCSSRules = function() {}; // don't mess with the stylesheets in the studio
    Matrix.prototype._updateSize = function() {}; // deactivate runtime size update
    Matrix.prototype.studioRepeaterGetClone = (function(){
        var Container = WAF.require('Container');
        return function(position) {
            var widget = new Container();
            widget.node.textContent = position + 1;
            return widget;
        };
    })();
});
