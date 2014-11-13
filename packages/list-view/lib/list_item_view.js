// jshint validthis: true

import ListItemViewMixin from 'list-view/list_item_view_mixin';

var get = Ember.get, set = Ember.set;

function willInsertElementIfNeeded(view) {
  if (view.willInsertElement) {
    view.willInsertElement();
  }
}

function didInsertElementIfNeeded(view) {
  if (view.didInsertElement) {
    view.didInsertElement();
  }
}

function rerender() {
  var element, buffer, context, hasChildViews;
  element = get(this, 'element');

  if (!element) {
    return;
  }

  context = get(this, 'context');

  // releases action helpers in contents
  // this means though that the ListItemView itself can't use classBindings or attributeBindings
  // need support for rerender contents in ember
  this.triggerRecursively('willClearRender');

  if (context) {

    hasChildViews = this._childViews.length > 0;

    if (hasChildViews) {
      this.invokeRecursively(willInsertElementIfNeeded, false);
    }

    var temp = this.constructor.create({ context: context });
    element.innerHTML = temp.createElement().element.innerHTML;
    temp.destroy();

    var transitionTo = this._transitionTo ? this._transitionTo : this.transitionTo;

    transitionTo.call(this, 'inDOM');

    if (hasChildViews) {
      this.invokeRecursively(didInsertElementIfNeeded, false);
    }
  } else {
    element.innerHTML = ''; // when there is no context, this view should be completely empty
  }
}

/**
  The `Ember.ListItemView` view class renders a
  [div](https://developer.mozilla.org/en/HTML/Element/div) HTML element
  with `ember-list-item-view` class. It allows you to specify a custom item
  handlebars template for `Ember.ListView`.

  Example:

  ```handlebars
  <script type="text/x-handlebars" data-template-name="row_item">
    {{name}}
  </script>
  ```

  ```javascript
  App.ListView = Ember.ListView.extend({
    height: 500,
    rowHeight: 20,
    itemViewClass: Ember.ListItemView.extend({templateName: "row_item"})
  });
  ```

  @extends Ember.View
  @class ListItemView
  @namespace Ember
*/
export default Ember.View.extend(ListItemViewMixin, {
  triggerRecursively: function(eventName) {
    var childViews = [this], currentViews, view, currentChildViews;

    while (childViews.length) {
      currentViews = childViews.slice();
      childViews = [];

      for (var i=0, l=currentViews.length; i<l; i++) {
        view = currentViews[i];
        currentChildViews = view._childViews ? view._childViews.slice(0) : null;
        if (view.trigger) { view.trigger(eventName); }
        if (currentChildViews) {
          childViews.push.apply(childViews, currentChildViews);
        }

      }
    }
  },

  invokeRecursively: function(fn, includeSelf) {
    var childViews = (includeSelf === false) ? this._childViews : [this];
    var currentViews, view, currentChildViews;

    while (childViews.length) {
      currentViews = childViews.slice();
      childViews = [];

      for (var i=0, l=currentViews.length; i<l; i++) {
        view = currentViews[i];
        currentChildViews = view._childViews ? view._childViews.slice(0) : null;
        fn(view);
        if (currentChildViews) {
          childViews.push.apply(childViews, currentChildViews);
        }
      }
    }
  },
  updateContext: function(newContext){
    var context = get(this, 'context');
    Ember.instrument('view.updateContext.render', this, function() {
      if (context !== newContext) {
        set(this, 'context', newContext);
        if (newContext && newContext.isController) {
          set(this, 'controller', newContext);
        }
      }
    }, this);
  },
  rerender: function () {
    Ember.run.scheduleOnce('render', this, rerender);
  },
  _contextDidChange: Ember.observer(rerender, 'context', 'controller')
});
