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
        name: 'rowdraw',
        description: 'On Row Draw',
        category: 'General Events'
    });

    // Set panel menu
    Matrix.setPanelStyle({
        'fClass': true,
        'text': true,
        'textShadow': true,
        'dropShadow': false,
        'innerShadow': false,
        'background': true,
        'border': true,
        'label': true,
        'sizePosition': true
    });


    function updateSize() {
        var key, num, coords, size;

        coords = this.repeaterGetCoordinates(0);
        size   = this.isHorizontalScroll() ? this.width() : this.height();

        for (key in coords) {
            this.widget(0)[key](coords[key]);
        }

        num = this.getItemsPerRow() * Math.ceil(size / this.getRowSize());
        this.studioRepeatedClones(num - 1);
    }

    Matrix.studioOnResize(updateSize);
    Matrix.containerChildrenAreSubWidgets();
    //Matrix._containerDisableCustomNodes = false;

    Matrix.doAfter('init', function() {
        this.direction.onChange(updateSize);
        this.expand.onChange(updateSize);
        this.rowMargin.onChange(updateSize);
        this.columnMargin.onChange(updateSize);

        this.number.onChange(_min('number', 1));
        this.columnSize.onChange(_min('columnSize', 20));
        this.rowSize.onChange(_min('rowSize', 20));

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
            if (this.mode() === 'split') {
                this.number.show();
                this.columnSize.hide();
                this.expand.hide();
            } else {
                this.number.hide();
                this.columnSize.show();
                this.expand.show();
            }
            updateSize.call(this);
        }

        this.mode.onChange(showMode);
        showMode.call(this);

        setTimeout(showMode.bind(this), 100);
    });

    Matrix.prototype._upgradeCSSRules = function() {}; // don't mess with the stylesheets in the studio
    Matrix.prototype.studioRepeaterGetClone = (function(){
        var Container = WAF.require('Container');
        return function(position) {
            var widget = new Container();
            widget.node.innerHTML = position + 1;
            return widget;
        };
    })();
});
