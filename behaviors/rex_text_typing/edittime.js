﻿function GetBehaviorSettings()
{
	return {
		"name":			"Typing",
		"id":			"Rex_text_typing",
		"description":	"Typing text on text object.",
		"author":		"Rex.Rainbow",
		"help url":		"https://dl.dropboxusercontent.com/u/5779181/C2Repo/rex_text_typing.html",
		"category":		"Text",
		"flags":		bf_onlyone
	};
};

//////////////////////////////////////////////////////////////
// Conditions
AddCondition(1, cf_trigger, "On text typing", "Typing", "{my} On typing", 
             "Triggered when text typing.", "OnTextTyping");
AddCondition(2, cf_trigger, "On typing completed", "Typing", "{my} On typing completed", 
             "Triggered when typing completed.", "OnTypingCompleted");            
AddCondition(3, 0, "Is text typing", "Typing", "{my} Is typing", 
             "Is text typing.", "IsTextTyping");
             
//////////////////////////////////////////////////////////////
// Actions
AddObjectParam("Timeline", "Timeline object for getting timer");
AddAction(2, 0, "Setup", "Setup", 
          "{my} Get timer from <i>{0}</i> for text-typing", 
          "Setup text-typing.", "SetupTimer");
AddAnyTypeParam("Text", "Enter the text to set the object's content to.", "\"\"");
AddNumberParam("Speed", "1 letter per seconds", 0.1);
AddAction(3, 0, "Type text", "Typing", 
          "{my} Type <i>{0}</i> at 1 letter per <i>{1}</i> seconds", 
          "Type text letter by letter.", "TypeText");
AddNumberParam("Speed", "1 letter per seconds", 0.1);
AddAction(4, 0, "Set typing speed", "Typing", 
          "{my} Set typing speed to <i>{0}</i> seconds", 
          "Set typing speed.", "SetTypingSpeed");   
AddComboParamOption("Keep current text");
AddComboParamOption("Show all text");
AddComboParam("Text state", "Text state, to keep current text or show all", 1);          
AddAction(5, 0, "Stop typing", "Typing", 
          "{my} Stop typing, <i>{0}</i>", 
          "Stop typing.", "StopTyping");   
AddAnyTypeParam("Text", "Enter the text to set the object's content to.", "\"\"");
AddAction(6, 0, "Append text", "Typing", 
          "{my} append <i>{0}</i>", 
          "Type text letter by letter in the end of current content.", "AppendText");
          
//////////////////////////////////////////////////////////////
// Expressions
AddExpression(1, ef_return_number,	"Get typing speed", "Type", "TypingSpeed", "Get typing speed.");
AddExpression(2, ef_return_number,	"Get current index of typing character", "Type", 
              "TypingIndex", "Get current index of typing character.");

ACESDone();

// Property grid properties for this plugin
var property_list = [                  
	];
	
// Called by IDE when a new behavior type is to be created
function CreateIDEBehaviorType()
{
	return new IDEBehaviorType();
}

// Class representing a behavior type in the IDE
function IDEBehaviorType()
{
	assert2(this instanceof arguments.callee, "Constructor called as a function");
}

// Called by IDE when a new behavior instance of this type is to be created
IDEBehaviorType.prototype.CreateInstance = function(instance)
{
	return new IDEInstance(instance, this);
}

// Class representing an individual instance of an object in the IDE
function IDEInstance(instance, type)
{
	assert2(this instanceof arguments.callee, "Constructor called as a function");
	
	// Save the constructor parameters
	this.instance = instance;
	this.type = type;
	
	// Set the default property values from the property table
	this.properties = {};
	
	for (var i = 0; i < property_list.length; i++)
		this.properties[property_list[i].name] = property_list[i].initial_value;
}

// Called by the IDE after all initialization on this instance has been completed
IDEInstance.prototype.OnCreate = function()
{
}

// Called by the IDE after a property has been changed
IDEInstance.prototype.OnPropertyChanged = function(property_name)
{
	if (this.properties["Pixels per step"] < 1)
		this.properties["Pixels per step"] = 1;
}
