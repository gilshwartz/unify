/* ***********************************************************************************************

    Unify Project

    Homepage: unify-project.org
    License: MIT + Apache (V2)
    Copyright: 2009-2011 Deutsche Telekom AG, Germany, http://telekom.com
               2012 Sebastian Fastner, Mainz, Germany, http://unify-training.com

*********************************************************************************************** */

/**
 * Manager for view managers which functions as a so-called pop over.
 *
 */

qx.Class.define("unify.view.helper.ViewOverlayManager", {
  extend : qx.core.Object,
  type : "singleton",
  
  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */
    
  construct : function()
  {
    this.base(arguments);
    
    unify.ui.core.PopOverManager.getInstance().addListener("hide", this.__hidePopover, this);
    
    this.__visibleViewManagers = [];
    this.__styleRegistry = {};
    this.__overlays = {};
  },
  
  events : {
    /** Show popup event */
    "show" : "qx.event.type.Data",
    
    /** Hide popup event */
    "hide" : "qx.event.type.Data"
  },

  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */
    
  members :
  {
    __visibleViewManagers : null,
    
    /** {Map} ID to view manager registry */
    __viewManagers : null,
    
    
    /** {Map} Style registry */
    __styleRegistry : null,
    
    __overlays : null,
    
    __currentViewManager : null,
    __currentOverlay : null,
    
    /**
     * Set styles for a specific viewManager
     *
     * @param viewManager {unify.view.ViewManager} View manager to get styles for
     * @param styleMap {Map[]} CSS style map for specific view manager
     */
    setStyles : function(viewManager, styleMap) {
      this.__styleRegistry[viewManager] = styleMap;
    },
    
    /**
     * Return styles set via setStyles for a specific viewManager
     *
     * @param viewManager {unify.view.ViewManager} View manager to get styles for
     * @return {Map[]} CSS style map for specific view manager
     */
    getStyles : function(viewManager) {
      return this.__styleRegistry[viewManager];
    },
    
    /**
     * Get current visible view manager
     */
    getCurrentViewManager : function() {
      return this.__currentViewManager;
    },
    
    /**
     * Get current visible overlay
     */
    getCurrentOverlay : function() {
      return this.__currentOverlay;
    },

    /**
     * Shows the view manager with the given ID.
     *
     * @param id {String} ID of view manager as string or overlay widget
     * @param trigger {unify.ui.Widget?null} Widget that triggers the opening of the popover
     */
    show : function(id, trigger) {
      var viewManager = unify.view.ViewManager.get(id);
      var modal = viewManager.getModal();
      
      if (!viewManager.isInitialized()) {
        viewManager.init();
      }
      
      if (qx.core.Environment.get("qx.debug"))
      {
        if (!viewManager) {
          throw new Error("Unknown view manager: " + id);
        }
      }
      
      if (this.__visibleViewManagers.indexOf(viewManager) > -1) {
        if (qx.core.Environment.get("qx.debug")){
          this.debug("called show with viewmanager that is already visible: "+id);
        }
        
        return; // already visible
      }
      
      if (qx.core.Environment.get("qx.debug")) {
        this.debug("Show: " + id);
      }

      
      var PopOverManager = unify.ui.core.PopOverManager.getInstance();
      var registeredStyle = this.__styleRegistry[viewManager];
      var popOverElement = null;
      if (modal) {
        PopOverManager.show(viewManager,registeredStyle ||"full");
      } else {
        popOverElement = this.__getOverlay(viewManager);
        popOverElement.set({
          modal: false
        });
  
        
        if(registeredStyle){
          popOverElement.getChildrenContainer().setStyle(registeredStyle);
        }
        popOverElement.add(viewManager, { top:0, left:0, right:0, bottom:0 });
        viewManager.show();
        PopOverManager.show(popOverElement, trigger);
      }
      this.fireDataEvent("show", id);
      
      this.__currentViewManager = viewManager;
      this.__currentOverlay = popOverElement;
      
      this.__visibleViewManagers.push(viewManager);
    },
    
    
    /**
     * Hides the view manager with the given ID.
     *
     * @param id {String} ID of view manager as string or overlay widget
     * @param skipAnimation {Boolean?false} True if the animation should be skipped
     */
    hide : function(id, skipAnimation) {
      var viewManager = unify.view.ViewManager.get(id);

      if (qx.core.Environment.get("qx.debug")) {
        if (!viewManager) {
          throw new Error("Unknown view manager: " + id);
        }
      }
      if (this.__visibleViewManagers.indexOf(viewManager) < 0) {
        if (qx.core.Environment.get("qx.debug")){
            this.debug("called hide with viewmanager that is not visible: "+id);
        }
        return;
      }
      
      var PopOverManager = unify.ui.core.PopOverManager.getInstance();
      
      var self = this;
      var finalize = function() {
        var vvm = self.__visibleViewManagers;
        qx.lang.Array.remove(vvm, viewManager);
        self.fireDataEvent("hide", id);

        var vm = self.__currentViewManager = vvm[vvm.length-1];
        self.__currentOverlay = self.__getOverlay(vm, false);
      };
      

      if (viewManager.getModal()) {
        PopOverManager.hide(viewManager);
        finalize();
      } else {
        var mode = viewManager.getDisplayMode();
  
        var overlay=this.__overlays[viewManager];
        PopOverManager.hide(overlay);
        
        overlay.addListenerOnce("hidden",finalize,this);
        if (mode == "modal") {
          viewManager.hide(function() {
            overlay.hide();
          });
        } else {
          overlay.hide();
        }
      }
    },
    
    __hidePopover : function(e) {
      var overlay = e.getData();
      if (overlay) {
        var viewManagerHash = overlay.getUserData("viewmanager");
      
        if (viewManagerHash) {
          var viewManager = qx.core.ObjectRegistry.fromHashCode(viewManagerHash);
          
          if (viewManager) {
            qx.lang.Array.remove(this.__visibleViewManagers, viewManager);
            this.fireDataEvent("hide", viewManager.getId());
            viewManager.hide(); //TODO only deactivate instead of hide?
          }
        }
      }
    },

    /**
     * Get overlay element
     *
     * @param viewManager {unify.view.ViewManager} View manager to generate overlay for
     * @return {unify.ui.container.Overlay} Overlay widget
     */
    __getOverlay : function(viewManager, create){
      var overlay = this.__overlays[viewManager] || null;
      if(!overlay && create !== false){
        overlay = new unify.ui.container.Overlay();
        overlay.setUserData("viewmanager", viewManager.toHashCode());
        var appearanceId=viewManager.getId()+"-overlay";
        var appearance=qx.theme.manager.Appearance.getInstance().styleFrom(appearanceId);
        if(appearance){
          overlay.setAppearance(appearanceId);
        }
        this.__overlays[viewManager] = overlay;
      }
      return overlay;
    }
  },

  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */
    
  destruct : function() {
    this.__root = this.__pblocker= this.__mblocker=this.__viewManagers=this.__overlays= this.__visibleViewManagers=this.__styleRegistry = null;
  } 
});
