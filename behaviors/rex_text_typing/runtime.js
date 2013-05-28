﻿// ECMAScript 5 strict mode
"use strict";

assert2(cr, "cr namespace not created");
assert2(cr.behaviors, "cr.behaviors not created");

/////////////////////////////////////
// Behavior class
cr.behaviors.Rex_text_typing = function(runtime)
{
	this.runtime = runtime;
};

(function ()
{
	var behaviorProto = cr.behaviors.Rex_text_typing.prototype;
		
	/////////////////////////////////////
	// Behavior type class
	behaviorProto.Type = function(behavior, objtype)
	{
		this.behavior = behavior;
		this.objtype = objtype;
		this.runtime = behavior.runtime;
	};
	
	var behtypeProto = behaviorProto.Type.prototype;

	behtypeProto.onCreate = function()
	{
        this.timeline = null;  
        this.timelineUid = -1;    // for loading     
	};
	
	behtypeProto._timeline_get = function ()
	{
        if (this.timeline != null)
            return this.timeline;
    
        var plugins = this.runtime.types;
        var name, obj;
        for (name in plugins)
        {
            obj = plugins[name].instances[0];
            if ((obj != null) && (obj.check_name == "TIMELINE"))
            {
                this.timeline = obj;
                return this.timeline;
            }
        }
        assert2(this.timeline, "Text Typing behavior: Can not find timeline oject.");
        return null;	
	};  
	/////////////////////////////////////
	// Behavior instance class
	behaviorProto.Instance = function(type, inst)
	{
		this.type = type;
		this.behavior = type.behavior;
		this.inst = inst;
		this.runtime = type.runtime;
	};
	
	var behinstProto = behaviorProto.Instance.prototype;

	behinstProto.onCreate = function()
	{    
        this.typing_timer = null;
        this.typing_speed = 0; 
        this.typing_index = 0;
        this.content = ""; 
        this.timer_save = null;           
	};

	behinstProto.onDestroy = function()
	{    
        this.typing_timer_remove();     
	};    
    
	behinstProto.typing_timer_remove = function ()
	{
        if (this.typing_timer != null)
            this.typing_timer.Remove();
    };  
	
	behinstProto.tick = function ()
	{
	};
	
	behinstProto.SetText = function (param)
	{
        cr.plugins_.Text.prototype.acts.SetText.apply(this.inst, [param]);
	};

    behinstProto._get_timer = function ()
    {
        var timer = this.typing_timer;
        if  (timer == null)
        {
            var timeline = this.type._timeline_get();
            assert2(timeline, "Text typing need a timeline object");
            timer = timeline.CreateTimer(this, this.text_typing_handler);
        }
        return timer;
    };
    
	behinstProto._start_typing = function (text, speed, start_index)
	{
        if (speed != 0)
        {
            if (start_index == null)
                start_index = 1;
            this.typing_timer = this._get_timer();
            this.typing_speed = speed;
            this.typing_index = start_index;
            this.typing_timer.Start(0);
        }
        else
        {
            this.typing_index = this.content.length;
            this.SetText(this.content);
            this.runtime.trigger(cr.behaviors.Rex_text_typing.prototype.cnds.OnTypingCompleted, this.inst);
        }
    };
    
	behinstProto.text_typing_handler = function()
	{  
        this.SetText(this.content.slice(0, this.typing_index));
        this.runtime.trigger(cr.behaviors.Rex_text_typing.prototype.cnds.OnTextTyping, this.inst);       
        this.typing_index += 1;        
        if (this.typing_index <= this.content.length)
            this.typing_timer.Restart(this.typing_speed);        
        else
        {
            this.typing_index = this.content.length;  
            this.runtime.trigger(cr.behaviors.Rex_text_typing.prototype.cnds.OnTypingCompleted, this.inst);
        }
	}; 

	behinstProto.is_typing = function ()
	{ 
        return (this.typing_timer)? this.typing_timer.IsActive():false;
	}; 
    
	behinstProto.saveToJSON = function ()
	{ 
		return { "content": this.content,
		         "spd" : this.typing_speed,
		         "i" : this.typing_index,
		         
		         "tim": (this.typing_timer != null)? this.typing_timer.saveToJSON() : null,
                 "tluid": (this.type.timeline != null)? this.type.timeline.uid: (-1)
                };
	};
    
	behinstProto.loadFromJSON = function (o)
	{    
	    this.content = o["content"];
	    this.typing_speed = o["spd"];
	    this.typing_index = o["i"];
	    
        this.timer_save = o["tim"];
        this.type.timelineUid = o["tluid"];   
	};
    
	behinstProto.afterLoad = function ()
	{
		if (this.type.timelineUid === -1)
			this.type.timeline = null;
		else
		{
			this.type.timeline = this.runtime.getObjectByUID(this.type.timelineUid);
			assert2(this.type.timeline, "Timer: Failed to find timeline object by UID");
		}		       
        
        if (this.timer_save == null)
            this.typing_timer = null;
        else
        {
            this.typing_timer = this.type.timeline.LoadTimer(this, this.text_typing_handler, null, this.timer_save);
        }     
        this.timers_save = null;        
	}; 	
	//////////////////////////////////////
	// Conditions
	function Cnds() {};
	behaviorProto.cnds = new Cnds();
 
    Cnds.prototype.OnTextTyping = function ()
	{
		return true;
	};  
 
    Cnds.prototype.OnTypingCompleted = function ()
	{
		return true;
	}; 
    
	Cnds.prototype.IsTextTyping = function ()
	{ 
        return this.is_typing();
	}; 
    
	//////////////////////////////////////
	// Actions
	function Acts() {};
	behaviorProto.acts = new Acts();
    
    Acts.prototype.SetupTimer = function (timeline_objs)
	{
        var timeline = timeline_objs.instances[0];
        if (timeline.check_name == "TIMELINE")
            this.type.timeline = timeline; 
        else
            alert ("Text-typing should connect to a timeline object");
	}; 

	Acts.prototype.TypeText = function(param, speed)
	{
        if (typeof param === "number")
            param = Math.round(param * 1e10) / 1e10;	// round to nearest ten billionth - hides floating point errors
		
        this.content = param.toString();
        this._start_typing(this.content, speed);
	};

	Acts.prototype.SetTypingSpeed = function(speed)
	{
        this.typing_speed = speed;
        var timer = this.typing_timer;
        if (timer.IsActive())
        {
            timer.Restart(speed);
        }
	};
    
	Acts.prototype.StopTyping = function(is_show_all)
	{
        this.typing_timer_remove();   
        if (is_show_all)
        {
            this.SetText(this.content);
            this.runtime.trigger(cr.behaviors.Rex_text_typing.prototype.cnds.OnTypingCompleted, this.inst);
        }
	};
    
	Acts.prototype.AppendText = function(param)
	{
        var start_index = this.content.length;
        if (typeof param === "number")
            param = Math.round(param * 1e10) / 1e10;	// round to nearest ten billionth - hides floating point errors
        this.content += param.toString();
        if (!this.is_typing())
            this._start_typing(this.content, this.typing_speed, start_index);
	};    
    
	//////////////////////////////////////
	// Expressions
	function Exps() {};
	behaviorProto.exps = new Exps();
    
    Exps.prototype.TypingSpeed = function (ret)
	{
	    ret.set_float( this.typing_speed );
	};
    
    Exps.prototype.TypingIndex = function (ret)
	{
	    ret.set_float( this.typing_index );
	};	
	
}());