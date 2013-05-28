﻿// ECMAScript 5 strict mode
"use strict";

assert2(cr, "cr namespace not created");
assert2(cr.plugins_, "cr.plugins_ not created");

/////////////////////////////////////
// Plugin class
cr.plugins_.Rex_LayerObj = function(runtime)
{
	this.runtime = runtime;
};

(function ()
{
	/////////////////////////////////////
	var pluginProto = cr.plugins_.Rex_LayerObj.prototype;
		
	/////////////////////////////////////
	// Object type class
	pluginProto.Type = function(plugin)
	{
		this.plugin = plugin;
		this.runtime = plugin.runtime;
	};

	var typeProto = pluginProto.Type.prototype;

	// called on startup for each object type
	typeProto.onCreate = function()
	{
	};

	/////////////////////////////////////
	// Instance class
	pluginProto.Instance = function(type)
	{
		this.type = type;
		this.runtime = type.runtime;
		
	};
	
	var instanceProto = pluginProto.Instance.prototype;

	// called whenever an instance is created    
	instanceProto.onCreate = function()
	{
	    this._width_init = this.width;
	    this._height_init = this.height;
 
	    this._init();
	    this.runtime.tick2Me(this);        
	};
	
	instanceProto._init = function()
	{
	    this._width_save = this.width;
	    this._height_save = this.height;
	    this._angle_save = this.angle;
	    this._opactiy_save = this.opacity;
	    this._visible_save = this.visible;
	};	

	instanceProto.tick2 = function()
	{
	    if ((this.width != this._width_save) || (this.height != this._height_save))
	    {
	        var wscale = this.width/this._width_init;
	        var hscale = this.height/this._height_init;
	        var scale = Math.min(wscale, hscale);
            this.layer.scale = scale;
            this.runtime.redraw = true;	    
	        this._width_save = this.width;
	        this._height_save = this.height;
	    }
	    
	    if (this._angle_save != this.angle)
	    {
	        this.layer.angle = this.angle;
	        this.runtime.redraw = true;
	        this._angle_save = this.angle;
	    }
	    
	    if (this._opactiy_save != this.opacity)
	    {
	        var opacity_ = cr.clamp(this.opacity, 0, 1);
	        this.layer.opacity = opacity_;
	        this.runtime.redraw = true;
	        this._opactiy_save = opacity_; 
	    }
	    
	    if (this._visible_save != this.visible)
	    {
	        this.layer.visible = this.visible;
	        this.runtime.redraw = true;
	        this._visible_save = this.visible;	  
	    }	    
	};	
	
	// only called if a layout object
	instanceProto.draw = function(ctx)
	{
	};  

	instanceProto.drawGL = function(glw)
	{
	};
	
	instanceProto.saveToJSON = function ()
	{    
		return { "w" : this.width,
		         "wi": this._width_init,
                 "h" : this.height,
                 "hi": this._height_init,
                 "a" : this.angle,
	             "o" : this.opacity,
	             "v" : this.visible,
	            };
	};
	
	instanceProto.loadFromJSON = function (o)
	{
	    this.width = o["w"];
		this._width_init = o["wi"];
        this.height = o["h"]; 
        this._height_init = o["hi"];
        this.angle = o["a"];
        this.opacity = o["o"];
        this.visible = o["v"];
        this._init();       
	};	
	//////////////////////////////////////
	// Conditions
	function Cnds() {};
	pluginProto.cnds = new Cnds(); 

	//////////////////////////////////////
	// Actions
	function Acts() {};
	pluginProto.acts = new Acts();

	//////////////////////////////////////
	// Expressions
	function Exps() {};
	pluginProto.exps = new Exps();
	
}());