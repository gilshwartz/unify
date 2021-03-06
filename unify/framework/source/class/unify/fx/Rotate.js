/* ***********************************************************************************************

 Unify Project

 Homepage: unify-project.org
 License: MIT + Apache (V2)
 Copyright: 2011, Sebastian Fastner, Mainz, Germany, http://unify-training.com

 *********************************************************************************************** */

/**
 * Animate position of widget
 */
qx.Class.define("unify.fx.Rotate", {
  extend: unify.fx.core.Base,
  
  members : {
    __mod : null,
    __anim : null,
    __resetPoint: null,
    
    _setup : function() {
      var to = this.getValue();
      var from = this.__resetPoint = this._widget.getStyle("transform");
      
      var matcher = new RegExp("rotate\\(([^)]+)deg\\)");
      var parsed = matcher.exec(from);
      var mod;
      if (parsed && parsed.length == 2) {
        mod = this.__mod = parseFloat(parsed[1]);
      } else {
        mod = this.__mod = 0;
      }
      
      this.__anim = to - mod;
    },
    
    _reset : function(value) {
      this._widget.setStyle({
        transform: value||""
      });
    },
    
    _getResetValue : function() {
      return this.__resetPoint;
    },
    
    _render : function(percent, now, render) {
      if (!render) {
        return;
      }
      var mod = this.__mod;
      var anim = this.__anim;

      this._widget.setStyle({
        transform: "rotate(" + (mod + anim * percent) + "deg)"
      });
    }
  },
    
  destruct: function(){
    this.__mod=this.__anim=this.__resetPoint=null;
  }
});