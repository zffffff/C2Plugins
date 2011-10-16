﻿// ECMAScript 5 strict mode
"use strict";

assert2(cr, "cr namespace not created");
assert2(cr.behaviors, "cr.behaviors not created");

/////////////////////////////////////
// Behavior class
cr.behaviors.Zigzag = function(runtime)
{
	this.runtime = runtime;
};

(function ()
{
	var behaviorProto = cr.behaviors.Zigzag.prototype;
		
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
		
	};

	/////////////////////////////////////
	// Behavior instance class
	behaviorProto.Instance = function(type, inst)
	{
		this.type = type;
		this.behavior = type.behavior;
		this.inst = inst;				// associated object instance to modify
		this.runtime = type.runtime;
	};

	var behinstProto = behaviorProto.Instance.prototype;
    
    var _cmd_transfer = function(name, param)
    {
        switch (name)
        {
        case "F":
            name = "M";  // move
            break;
        case "B":
            name = "M";  // move
            param = -param;
             break;
        case "R":
            name = "R";  // rotate
            break;
        case "L":
            name = "R";  // rotate
            param = -param;
            break;
        }
        return ({cmd:name,param:param});
    }
    
    
    var _cmd_parsing = function(cmd_string)
    {
        var ret_cmds = [];
        var cmds = cmd_string.split(";");
        var i;
        var cmd_length = cmds.length;
        var cmd, cmd_slices, cmd_name, cmd_param;
        for (i=0; i<cmd_length; i++)
        {
            cmd = cmds[i];
            cmd = cmd.replace(/(^\s*)|(\s*$)/g,"");
            cmd = cmd.replace(/(\s+)/g," ");
            cmd_slices = cmd.split(" ");
            cmd_name = cmd_slices[0].toUpperCase();
            cmd_param = parseFloat(cmd_slices[1]);
            ret_cmds.push(_cmd_transfer(cmd_name, cmd_param));
        }
        return ret_cmds;
    };

	behinstProto.onCreate = function()
	{
        this.activated = this.properties[0];
        this.is_run = this.properties[1];
        this.cur_cmd = null;
              
        this.pos_state = {x:this.inst.x, 
                          y:this.inst.y, 
                          angle:this.inst.angle};
        this.CmdQueue = new cr.behaviors.Zigzag.CmdQueue(this.properties[3]);
        this.CmdMove = new cr.behaviors.Zigzag.CmdMove(this.inst, 
                                                       this.properties[5],
                                                       this.properties[6],
                                                       this.properties[7],
                                                       this.properties[11]);  
        this.CmdRotate = new cr.behaviors.Zigzag.CmdRotate(this.inst, 
                                                           this.properties[2],
                                                           this.properties[8],
                                                           this.properties[9],
                                                           this.properties[10],
                                                           this.properties[11]);
        this.CmdWait = new cr.behaviors.Zigzag.CmdWait(this.properties[11]); 
        this.cmd_map = {M:this.CmdMove,
                        R:this.CmdRotate,
                        W:this.CmdWait};
                        
        var init_cmd_string = this.properties[4];
        if ( init_cmd_string != "" )
        {
            this.CmdQueue.PushList(_cmd_parsing(init_cmd_string));
        }
	};

	behinstProto.tick = function ()
	{
        if ( (this.activated==0) || (this.is_run==0) )
            return;
                        
        var dt = this.runtime.getDt(this.inst);
        var cmd;
        while(dt)
        {
            if (this.cur_cmd == null) // try to get new cmd
            {
                this.cur_cmd = this.CmdQueue.GetCmd();
                if (this.cur_cmd != null)
                {
                    // new command start
                    cmd = this.cmd_map[this.cur_cmd.cmd]; 
                    cmd.Init(this.pos_state, this.cur_cmd.param);
                    this.runtime.trigger(cr.behaviors.Zigzag.prototype.cnds.OnCmdStart, this.inst);                     
                }
                else            
                {
                    // command queue finish
                    this.is_run = false;
                    this.runtime.trigger(cr.behaviors.Zigzag.prototype.cnds.OnCmdQueueFinish, this.inst); 
                    break;
                }
            }
            else
            {
                cmd = this.cmd_map[this.cur_cmd.cmd];                
            }
            
            dt = cmd.Tick(dt);
            if (cmd.is_done)
            {
                // command finish
                this.runtime.trigger(cr.behaviors.Zigzag.prototype.cnds.OnCmdFinish, this.inst);           
                this.cur_cmd = null;
            }
            
            if (this.is_continued_mode==0)
                break;
        }               
	};   

	//////////////////////////////////////
	// Conditions
	behaviorProto.cnds = {};
	var cnds = behaviorProto.cnds;
    
	cnds.CompareMovSpeed = function (cmp, s)
	{
		return cr.do_cmp(this.CmdMove.current_speed, cmp, s);
	}; 
    
	cnds.CompareRotSpeed = function (cmp, s)
	{
		return cr.do_cmp(this.CmdRotate.current_speed, cmp, s);
	}; 
    
    var _is_in_cmd = function (cur_cmd, _cmd)
    {
        if (cur_cmd == null)
            return false;
     
        var ret;
        switch (_cmd)
        {
        case 0: //"F"
            ret = ((cur_cmd.cmd == "M") && (cur_cmd.param >=0));
            break;
        case 1: //"B"
            ret = ((cur_cmd.cmd == "M") && (cur_cmd.param < 0));
            break;
        case 2: //"R"
            ret = ((cur_cmd.cmd == "R") && (cur_cmd.param >=0));
            break;
        case 3: //"L"
            ret = ((cur_cmd.cmd == "R") && (cur_cmd.param < 0));
            break;
        case 4: //"W"
            ret = (cur_cmd.cmd == "W");
            break; 
        default:  // any
            ret = true;            
        }
		return ret;    
    }

	cnds.IsCmd = function (_cmd)
	{
        return _is_in_cmd(this.cur_cmd, _cmd);
	};     
    
	cnds.OnCmdQueueFinish = function ()
	{
		return true;
	};
      
	cnds.OnCmdStart = function (_cmd)
	{
		return _is_in_cmd(this.cur_cmd, _cmd);
	};
    
	cnds.OnCmdFinish = function (_cmd)
	{
        return _is_in_cmd(this.cur_cmd, _cmd);
	};    
    
	//////////////////////////////////////
	// Actions
	behaviorProto.acts = {};
	var acts = behaviorProto.acts;

	acts.SetActivated = function (s)
	{
		this.activated = s;
	};  

	acts.Start = function ()
	{
        this.cur_cmd = null;
        this.is_run = 1;
		this.CmdQueue.ResetIndex();
        this.pos_state = {x:this.inst.x, 
                          y:this.inst.y, 
                          angle:this.inst.angle};
	};     
    
	acts.Stop = function ()
	{
        this.cur_cmd = null;
        this.is_run = 0;
		this.CmdQueue.ResetIndex();
	}; 
    
	acts.SetMaxMovSpeed = function (s)
	{
        this.CmdMove.move.max = s;
	}; 
    
	acts.SetMovAcceleration = function (s)
	{
        this.CmdMove.move.acc = s;
	};  
    
	acts.SetMovDeceleration = function (s)
	{
        this.CmdMove.move.dec = s;
	}; 
    
	acts.SetMaxRotSpeed = function (s)
	{
        this.CmdRotate.move.max = s;
	}; 
    
	acts.SetRotAcceleration = function (s)
	{
        this.CmdRotate.move.acc = s;
	};  
    
	acts.SetRotDeceleration = function (s)
	{
        this.CmdRotate.move.dec = s;
	};  
    
	acts.SetFetch = function (s)
	{
        this.CmdQueue.fetch_mode = s;
	};  
    
	acts.CleanCmdQueue = function ()
	{
        this.CmdQueue.CleanAll();
	};      
    
    var _cmd_Index2NameMap = ["F","B","R","L","W"];  
	acts.AddCmd = function (_cmd, param)
	{
        this.CmdQueue.Push( _cmd_transfer( _cmd_Index2NameMap[_cmd], param ) );
	}; 

	acts.AddCmdString = function (cmd_string)
	{
        if ( cmd_string != "" )
        {
            this.CmdQueue.PushList(_cmd_parsing(cmd_string));
        }
	};     
    
	acts.SetRotatable = function (s)
	{
        this.CmdRotate.rotatable = s;
	};         
    
	//////////////////////////////////////
	// Expressions
	behaviorProto.exps = {};
	var exps = behaviorProto.exps;
    
	exps.Activated = function (ret)
	{
		ret.set_int(this.activated);
	};    
    
	exps.MovSpeed = function (ret)
	{
		ret.set_float(this.CmdMove.current_speed);
	};
    
	exps.MaxMovSpeed = function (ret)
	{
		ret.set_float(this.CmdMove.move.max);
	};  
    
	exps.MovAcc = function (ret)
	{
		ret.set_float(this.CmdMove.move.acc);
	}; 
    
	exps.MovDec = function (ret)
	{
		ret.set_float(this.CmdMove.move.dec);
	};  
    
	exps.RotSpeed = function (ret)
	{
		ret.set_float(this.CmdRotate.current_speed);
	};
    
	exps.MaxRotSpeed = function (ret)
	{
		ret.set_float(this.CmdRotate.move.max);
	};  
    
	exps.RotAcc = function (ret)
	{
		ret.set_float(this.CmdRotate.move.acc);
	}; 
    
	exps.RotDec = function (ret)
	{
		ret.set_float(this.CmdRotate.move.dec);
	};      
    
	exps.Rotatable = function (ret)
	{
		ret.set_int(this.CmdRotate.rotatable);
	};    
}());

(function ()
{
    // command queue
    cr.behaviors.Zigzag.CmdQueue = function(fetch_mode)
    {
        this.CleanAll();
        this.fetch_mode = fetch_mode;
    };
    var CmdQueueProto = cr.behaviors.Zigzag.CmdQueue.prototype;
    
    CmdQueueProto.CleanAll = function()
	{
        this.queue_index = 0;    
        this._queue = [];
	};
    
    CmdQueueProto.ResetIndex = function()
	{
        this.queue_index = 0;
	};
    
    CmdQueueProto.Push = function(item)
    {
        this._queue.push(item);
    };

    CmdQueueProto.PushList = function(items)
    {
        var i;
        var item_len = items.length;
        for (i=0; i<item_len; i++)
        {
            this._queue.push(items[i]);
        }
    };  
    
    CmdQueueProto.GetCmd = function()
	{
        var cmd;
        cmd = this._queue[this.queue_index];
        var index = this.queue_index+1;
        if (index >= this._queue.length)         
            this.queue_index = (this.fetch_mode==1)? 0:  // repeat
                               (-1);                     // one-shot
        else
            this.queue_index = index;
        return cmd;
	};
     
    // move
    cr.behaviors.Zigzag.CmdMove = function(inst, max_speed, acc, dec, continued_mode)
    {
        this.inst = inst;
        this.move = {max:max_speed, acc:acc, dec:dec};
        this.is_done = true;
        this.continued_mode = continued_mode;
        this.current_speed = 0;
    };
    var CmdMoveProto = cr.behaviors.Zigzag.CmdMove.prototype;
    
    CmdMoveProto.Init = function(zigzag_state, distance)
    {
        this.target = zigzag_state;
        this.dir = (distance >= 0);
        this.remain_distance = Math.abs(distance);
        _set_current_speed.call(this, null);
        this.is_done = false;

        var angle = zigzag_state.angle;
        zigzag_state.x += (distance * Math.cos(angle));
        zigzag_state.y += (distance * Math.sin(angle));  
    };    
    
    CmdMoveProto.Tick = function(dt)
    {
        var remain_dt = 0;
        var distance = _move_distance_get.call(this, dt);
        this.remain_distance -= distance;   

        // is hit to target at next tick?
        if ( (this.remain_distance <= 0) || (this.current_speed <= 0) )
        {
            this.is_done = true;
            this.inst.x = this.target.x;
            this.inst.y = this.target.y;
            remain_dt = (this.continued_mode==1)? _remaind_dt_get.call(this):0;    
        }
        else
        {
            var angle = this.target.angle;
            if (!this.dir)
                distance = -distance;
            this.inst.x += (distance * Math.cos(angle));
            this.inst.y += (distance * Math.sin(angle));
        } 

		this.inst.set_bbox_changed();
        return remain_dt;    
    };  
    
    // rotate
    cr.behaviors.Zigzag.CmdRotate = function(inst, rotatable, max_speed, acc, dec, continued_mode)
    {
        this.inst = inst;
        this.rotatable = rotatable;
        this.move = {max:max_speed, acc:acc, dec:dec};
        this.is_done = true;
        this.is_zeroDt_mode = ( (max_speed >= 36000) && (acc==0) && (dec==0) );
        this.continued_mode = continued_mode;
        this.current_speed = 0;
    };
    var CmdRotateProto = cr.behaviors.Zigzag.CmdRotate.prototype;
    
    CmdRotateProto.Init = function(zigzag_state, distance)
    {
        this.target = zigzag_state;
        this.current_angle = cr.to_clamped_degrees(zigzag_state.angle);
        this.dir = (distance >= 0);
        var angle = cr.to_clamped_radians(this.current_angle + distance);
        this.remain_distance = Math.abs(distance);
        _set_current_speed.call(this, null); 
        this.is_done = false;
        
        zigzag_state.angle = angle;

    };    
    
    CmdRotateProto.Tick = function(dt)
    {
        var remain_dt;    
        var target_angle;       
        if (this.is_zeroDt_mode)
        {
            remain_dt = dt;
            this.is_done = true;
            target_angle = this.target.angle;        
        }
        else
        {
            var distance = _move_distance_get.call(this, dt);
            this.remain_distance -= distance;   

            // is hit to target at next tick?
            if ( (this.remain_distance <= 0) || (this.current_speed <= 0) )
            {
                this.is_done = true;
                target_angle = this.target.angle;  
                remain_dt = (this.continued_mode==1)? _remaind_dt_get.call(this):0;                
            }
            else
            {
                this.current_angle += ((this.dir)? distance:(-distance));
                target_angle = cr.to_clamped_radians(this.current_angle);
                remain_dt = 0;
            } 
        }
            
        if (this.rotatable == 1)
        {
            this.inst.angle = target_angle;
		    this.inst.set_bbox_changed();
        }
        return remain_dt;    
    }; 
    
	var _set_current_speed = function(speed)
	{
        var move = this.move;
        if (speed != null)
        {
            this.current_speed = (speed > move.max)? 
                                 move.max: speed;
        }        
        else if (move.acc > 0)
        {
            this.current_speed = 0;
        }
        else 
        {
            this.current_speed = move.max;        
        }
	};  

    var _move_distance_get = function(dt)
    {
        var move = this.move;
        // assign speed
        var is_slow_down = false;
        if (move.dec != 0)
        {
            // is time to deceleration?                
            var _speed = this.current_speed;
            var _distance = (_speed*_speed)/(2*move.dec); // (v*v)/(2*a)
            is_slow_down = (_distance >= this.remain_distance);
        }
        var acc = (is_slow_down)? (-move.dec):move.acc;
        if (acc != 0)
        {
            _set_current_speed.call(this, this.current_speed + (acc * dt) );    
        }

		// Apply movement to the object     
        var distance = this.current_speed * dt;
        return distance;
    };
    
    var _remaind_dt_get = function()
    {
        var remain_dt;
        if ( (this.move.acc>0) || (this.move.dec>0) )
        {
            this.SetCurrentSpeed(0);  // stop in point
            remain_dt = 0;
        }
        else
        {
            remain_dt = (-this.remain_distance)/this.current_speed;
        }    
        return remain_dt;
    }
    
    // wait
    cr.behaviors.Zigzag.CmdWait = function(continued_mode)
    {
        this.is_done = true;
        this.continued_mode = continued_mode;
    };
    var CmdWaitProto = cr.behaviors.Zigzag.CmdWait.prototype;
    
    CmdWaitProto.Init = function(zigzag_state, distance)
    {
        this.remain_distance = distance;
        this.is_done = false;
    };    
    
    CmdWaitProto.Tick = function(dt)
    {
        this.remain_distance -= dt;
        var remain_dt = 0;
        if (this.remain_distance <= 0)
        {
            remain_dt = (this.continued_mode==1)? (-this.remain_distance):0;
            this.is_done = true;
        }
        else
        {
            remain_dt = 0;
        }
        return remain_dt;    
    };     
}());