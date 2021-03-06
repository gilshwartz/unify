/* ***********************************************************************************************

    Unify Project

    Homepage: unify-project.org
    License: MIT + Apache (V2)
    Copyright: 2011, Sebastian Fastner, Mainz, Germany, http://unify-training.com

*********************************************************************************************** */

/**
 * Basic implementation of a list
 */
qx.Class.define("unify.ui.container.List", {
  extend: unify.ui.container.Composite,

  construct : function() {
    this.base(arguments);

    var layout = new unify.ui.layout.VBox();
    this._setLayout(layout);
  },

  events: {
    /** Event fired if list element is tapped */
    "change" : "qx.event.type.Data"
  },

  properties : {
    // overridden
    appearance :
    {
      refine: true,
      init: "list"
    },

    /**
     * Data of list
     */
    data : {
      apply: "_applyData"
    }
  },

  members : {
    _applyData : function(data) {
      this._removeAll();

      var header, fields, title;
      for (header in data) {
        this._add(
          new unify.ui.basic.Label(header).set({
            appearance: "list.header"
          })
        );

        var containerLayout = new unify.ui.layout.Grid();
        containerLayout.setColumnFlex(0, 1);
        var container = new unify.ui.container.Composite(containerLayout);
        container.setAppearance("list.content");
        var rowCounter = 0;

        fields = data[header];
        for (title in fields) {
          var titleLabel = new unify.ui.basic.Label(title).set({
            appearance: "list.description"
          });

          var id = null;
          var value = null;
          if (typeof fields[title] == "string") {
            value = fields[title];
          } else {
            id = fields[title].id;
            value = fields[title].value;
          }

          var valueLabel = new unify.ui.basic.Label(value).set({
            appearance: "list.value"
          });

          titleLabel.setUserData("id", id);
          valueLabel.setUserData("id", id);

          container.add(titleLabel, { row: rowCounter, column: 0 });
          container.add(valueLabel, { row: rowCounter++, column: 1 });

          titleLabel.addListener("tap", this.__onTap, this);
          valueLabel.addListener("tap", this.__onTap, this);

          this._add(container);
        }
      }
    },

    /**
     * Event handler to support tapping on list items
     *
     * @param e {qx.event.type.Event} Tap event
     */
    __onTap : function(e) {
      this.fireDataEvent("change", e.getTarget().getUserData("id"));
    }
  }
});