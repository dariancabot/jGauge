/*!
 * jGauge v0.4.0 Beta 01
 * http://www.jgauge.com/
 * Date: 06 March 2011
 *
 * Copyright 2010-2011, Darian Cabot
 * Licensed under the MIT license
 * http://www.jgauge.com/#licence
 */

 
 
/*
HOW TO HAVE CUSTOM GAUGES...
----------------------------

Gauge arranged in predefined layers...
1. Gauge face
2. Gauge tick (to be programmatically copied and rotated)
3. Gauge needle
4. Gauge glass/cover

Each of these layers is an array of SVG paths and associated attributes!
For example, the gauge face may be made of three SVG paths and given to jGauge like this.

this.facepaths[ mypath1, mypath2, mypath3 ];
this.faceattrs[ myattr1, myattr2, myattr3 ]; 

When jGauge builds this gauge face layer it will be a 'set' of paths in Raphael! :-)

*/



/*
HOW TO HAVE MULTIPLE NEEDLES...
-------------------------------

Make the setValue() function a method of this.needle, then this can be done...

        var myNeedle = new needle();
        myNeedle.setValue(12.3);

This may get difficult when assigning a range, label, etc to this needle??

*/
 

/*
 * CHANGE LOG: VERSION 0.4.0 BETA 01:
 * ====================================
 *
 *  - Use Raphaël instead of jQueryRotate and canvas.
 *
 *  - Dropped jQuery: In trying to keep things small and simple, one JavaScript 
 *    framework is the limit, which is now Raphael.
 *
 *  - (PLANNED) Range to resize on limitAction.autoRange.
 *
 *  - (PLANNED) Auto sizing min/max range.
 *
 * KNOWN ISSUES:
 * =============
 *
 *  - The limitAction only works for the upper bounds, not lower bounds.
 *
 */


// Global vars...

// Expose the Limit Action Enum globally...
var limitAction = 
{
        spin: 0,
        clamp: 1,
        autoRange: 2
};

var autoPrefix = 
{
        none: 0, // No SI or binary prefixing, normal comma segmented number.
        si: 1, // SI prefixing (i.e. 1000^n) used for SI units / metric.
        binary: 2 // Binary prefixing (i.e. 1024^n) used for computer units.
};


jGauge = function(id)
{
        this.version = '0.4.0.1'; // Major, minor, fix, release.
        
        this.paper; // The Raphael paper object.
        
        this.centerX = 0; // Internal use for positioning elements.
        this.centerY = 0; // Internal use for positioning elements.
        
        // DEFAULT PARAMETERS FOR jGAUGE...
        this.id = id; // Default: nothing. Must be unique per jGauge instance.
        this.segmentStart = -180; // Relative to 0deg (3-o-clock position).
        this.segmentEnd = 0; // Relative to 0deg (3-o-clock position).
        this.imagePath = 'img/jgauge_face_default.png'; // Background image path.
        this.width = 200; // Total width of jGauge.
        this.height = 120; // Total height of jGauge.
        this.showAlerts = false; // Show error alerts? Useful when debugging.
        
        this.autoPrefix = autoPrefix.si; // Automatically assigns prefix on label when approapriate (after value, before suffix) i.e. k, M, G, etc.
        
        this.siPrefixes = ['', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];
        this.binaryPrefixes = this.siPrefixes;
        
        
        // Define the jGauge.needle object...

        var needleDefault =
        {
		//imagePath: 'img/jgauge_needle_default.png'; // Needle image path.
		rSet: '', // The Raphael set that contains the SVG for drawing the needle graphic.
		speed: 750, // Speed of the needle animation in milliseconds.
		limitAction: limitAction.autoRange, // What to do when the needle hits the limit.
		xPivot: 100, // Needle pivot point - horizontal position.
		yPivot: 100 // Needle pivot point - vertical position.
	};
        
        
        this.needle = []; // Create a needle array - this allows for multiple needles.
        this.needle[0] = needleDefault; // Add the needle to the jGauge needle array.
        this.needle[1] = needleDefault; // DEV - second needle.
        
        // Define the jGauge.label object...
        var labelDefault =
        {
                rText: '', // The Raphael text object.
                color: '#144b66',
                precision: 1, // Decimal place precision / rounding.
                prefix: '', // Prefix for the value label (i.e. '$').
                suffix: '', // Suffic for the value label (i.e. '&deg;C')
                xOffset: 0, // Shift label horizontally from center.
                yOffset: 35 // Shift label vertically from center.
        };
        
        // Add the label object to the jGauge object.
        this.label = labelDefault;
        
        // Define the jGauge.label object...
        var ticksDefault =
        {
                count: 11, // Number of tick marks around the gauge face.
                countOld: 11, // (Internal use) Remembers how many tick previously for cleanring.
                start: 0, // Value of the first tick mark.
                end: 10, // Value of the last tick mark.
                color: 'rgba(0, 96, 128, 0.125)', // Tick mark color.
                thickness: 3, // Tick mark thickness.
                radius: 95, // Tick mark radius (from gauge center point).
                subDivisions: 5, // # Future use #.
                subColor: 'rgba(255, 255, 255, 0.5)', // # Future use #.
                subThickness: 1, // # Future use #.
                labelEnabled: true, // # Future use #.
                labelPrecision: 1, // Rounding decimals for tick labels.
                labelRadius: 82 // Tick label radius (from gauge center).
        };
        
        // Add the ticks object to the jGauge object.
        this.ticks = ticksDefault;
        
        var rangeDefault =
        {
                radius: 55, // Range arc radius (from gauge center).
                thickness: 36, // Range arc thickness (spread of the arc outwards).
                start: -24, // Range start point as an angle relative to 0deg (pointing right).
                end: 25, // Range end point as an angle relative to 0deg (pointing right).
                color: 'rgba(255, 32, 0, 0.2)' // Color and alpha (opacity) of the range arc.
        };
        
        this.range = rangeDefault;

        function needle()
        {
                var ndl = this;
                //ndl.imagePath = 'img/jgauge_needle_default.png'; // Needle image path.
                ndl.rSet; // The Raphael set that contains the SVG for drawing the needle graphic.
                ndl.speed = 750; // Speed of the needle animation in milliseconds.
                ndl.limitAction = limitAction.autoRange; // What to do when the needle hits the limit.
                ndl.xPivot = 100; // Needle pivot point - horizontal position.
                ndl.yPivot = 100; // Needle pivot point - vertical position.
        }
        
        // Add the needle to the jGauge needle array.
        this.needle = [];
        this.needle[0] = new needle();
        this.needle[1] = new needle(); // DEV - second needle.
        
        // Define the jGauge.label object...
        function label()
        {
                var lbl = this;
                lbl.rText; // The Raphael text object.
                lbl.color = '#144b66';
                lbl.precision = 1; // Value label rounding decimal places.
                lbl.prefix = ''; // Prefix for the value label (i.e. '$').
                lbl.suffix = ''; // Suffic for the value label (i.e. '&deg;C')
                lbl.xOffset = 0; // Shift label horizontally from center.
                lbl.yOffset = 35; // Shift label vertically from center.
        }
        
        // Add the label object to the jGauge object.
        this.label = new label();
        
        // Define the jGauge.label object...
        function ticks()
        {
                var tks = this;
                tks.count = 11; // Number of tick marks around the gauge face.
                tks.countOld = 11; // (Internal use) Remembers how many tick previously for cleanring.
                tks.start = 0; // Value of the first tick mark.
                tks.end = 10; // Value of the last tick mark.
                tks.color = 'rgba(0, 96, 128, 0.125)'; // Tick mark color.
                tks.thickness = 3; // Tick mark thickness.
                tks.radius = 95; // Tick mark radius (from gauge center point).
                tks.subDivisions = 5; // # Future use #.
                tks.subColor = 'rgba(255, 255, 255, 0.5)'; // # Future use #.
                tks.subThickness = 1; // # Future use #.
                tks.labelEnabled = true; // # Future use #.
                tks.labelPrecision = 1; // Rounding decimals for tick labels.
                tks.labelRadius = 82; // Tick label radius (from gauge center).
        }
        
        // Add the ticks object to the jGauge object.
        this.ticks = new ticks();
        
        function range()
        {
                var rng = this;
                rng.radius = 55; // Range arc radius (from gauge center).
                rng.thickness = 36; // Range arc thickness (spread of the arc outwards).
                rng.start = -24; // Range start point as an angle relative to 0deg (pointing right).
                rng.end = 25; // Range end point as an angle relative to 0deg (pointing right).
                rng.color = 'rgba(255, 32, 0, 0.2)'; // Color and alpha (opacity) of the range arc.
        }
        
        this.range = new range();
        
        this.value = 0;
        
        // Function calls...
        //this.init = init; // Initialises the gauge and puts it on the page.
        //this.setValue = setValue; // Sets or updates the gauge value.
        //this.getValue = getValue; // Gets the current gauge value.
        //this.updateTicks = updateTicks; // Updates the tick marks and tick labels (call after changing tick parameters).
        //this.updateRange = updateRange; // Updates the range (call after changing range parameters).
        //this.prefixNumber = prefixNumber; // Modifies number to SI/binary prefixing (i.e. 5000 becomes 5k).
}


/**
 * Initialises the gauge.
 * This creates the gauge and placing it on the page ready for use.
 * @author Darian Cabot
 */
jGauge.prototype.init = function()
{
        // Reference to the jGauge root DOM element.
        this.root = document.getElementById(this.id);
        
        // Find center of the gauge for positioning reference...
        // TODO: Verify the .gaugeWidth with the placeholder DIV width (same for height).
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
        
        // Update gauge CSS with set jGauge dimensions.
        this.root.style.width = this.width + 'px';
        this.root.style.height = this.height + 'px';
        
        // Wipe the slate clean in case gauge already initialized.
        while (this.root.childNodes[0])
        {
        	this.root.removeChild(this.root.childNodes[0]);
                this.root.removeChild(this.root.childNodes[0]);
        }
        
        this.paper = Raphael(this.id, this.width, this.height);
        this.paper.clear();
        
        // Fill the paper with a background colour to make it more obvious for dev...
        var c1 = this.paper.rect(0, 0, this.width, this.height).attr({fill: '#8bf', 'stroke-width': '0'});

        // Fill the paper with blue to make it more obvious for dev...
        //var c1 = this.paper.rect(0, 0, this.width, this.height).attr({fill: '#fea', 'stroke-width': '0'});
        
        // Draw the gauge face...
        var gaugeFace = this.paper.set();
        
        gaugeFace.push(
                // Main gauge face.
                this.paper.path('M400.373,0C179.664,0,0.745,178.92,0.745,399.629c0,23.672,2.073,46.859,6.02,69.402' +
                        'l33.932-5.982l183.23-32.309c-1.769-10.105-2.698-20.5-2.698-31.111c0-98.94,80.206-179.144,179.144-179.144' +
                        'c98.937,0,179.144,80.204,179.144,179.144c0,10.611-0.929,21.006-2.699,31.111l183.23,32.309l33.93,5.982' +
                        'c3.95-22.543,6.022-45.73,6.022-69.402C800,178.92,621.08,0,400.373,0z')
                        .attr({fill: '90-#d0e0e8-#fff', 'stroke-width': '0'}),
                
                // Smaller face section.
                this.paper.path('M400.373,34.451c-201.682,0-365.177,163.495-365.177,365.178' +
                        'c0,21.633,1.894,42.822,5.501,63.42l183.23-32.309c-1.769-10.105-2.698-20.5-2.698-31.111c0-98.939,80.206-179.144,179.144-179.144' +
                        'c98.937,0,179.144,80.205,179.144,179.144c0,10.611-0.929,21.006-2.699,31.111l183.23,32.309c3.608-20.598,5.5-41.787,5.5-63.42' +
                        'C765.548,197.946,602.054,34.451,400.373,34.451z')
                        .attr({fill: '90-#fff-#d0e0e8', 'stroke-width': '0'}),
                
                // Outline.
                this.paper.path('M400.373,0C179.664,0,0.745,178.92,0.745,399.629c0,23.672,2.073,46.859,6.02,69.402' +
                        'l33.932-5.982l183.23-32.309c-1.769-10.105-2.698-20.5-2.698-31.111c0-98.94,80.206-179.144,179.144-179.144' +
                        'c98.937,0,179.144,80.204,179.144,179.144c0,10.611-0.929,21.006-2.699,31.111l183.23,32.309l33.93,5.982' +
                        'c3.95-22.543,6.022-45.73,6.022-69.402C800,178.92,621.08,0,400.373,0z')
                        .attr({stroke: '#abc', 'stroke-width': '2'})
        );
        
        gaugeFace.scale(0.245, 0.245, 2.5, 2.5);
        
        
        // Create the range arcs and put them on the gauge.
        this.updateRange();
        
        // Create the ticks and put them on the gauge.
        this.updateTicks();
        
        
        // Add the main label...
        this.label.rText = this.paper.text(100, 95, this.label.prefix + this.ticks.start + this.label.suffix)
        .attr({'font-size': '20', 'fill': this.label.color, 'font-weight': 'bold', 'font-family': 'Arial,Helvetica,sans-serif'});
        
        /*
        htmlString = '<p id="' + this.id + '-label" class="label">' + 
                this.label.prefix + '<strong>' + this.ticks.start + 
                '</strong>' + this.label.suffix + '</p>';
        
        $('#' + this.id).append(htmlString);
        
        // Position the main label...
        labelCssLeft = Math.round(this.centerX - $('#' + this.id + '-label').getHiddenDimensions().w / 2 + this.label.xOffset) + 'px';
        labelCssTop = Math.round(this.centerY - $('#' + this.id + '-label').getHiddenDimensions().h / 2 + this.label.yOffset) + 'px';
        $('#' + this.id + '-label').css({'left': labelCssLeft, 'top': labelCssTop});
        
        // Label created, so reveal it.
        $('#' + this.id + '-label').fadeIn('slow');
        */
        
        
        this.needle[0].rSet = this.paper.set();
        
        this.needle[0].rSet.push(
                this.paper.path('M577.576,373.229c1.272,8.616,1.94,17.43,1.94,26.4s-0.671,17.784-1.946,26.401' +
                        'l157.93-26.401L577.576,373.229z')
                .attr({fill: '#3885ab', 'stroke-width': '0'}),
                
                this.paper.path('M577.57,426.03 L735.5,399.629 L577.576,373.229')
                .attr({stroke: '#206080'})
        );
        
        this.needle[0].rSet.scale(0.245, 0.245, 2.5, 2.5);
        
        // Set the needle to the lowest value.
        this.setValue(this.ticks.start, this.needle[0]);
        
        
        // DEV - config second needle...
        this.needle[1].rSet = this.paper.set();
        
        this.needle[1].rSet.push(
                this.paper.path('M577.576,373.229c1.272,8.616,1.94,17.43,1.94,26.4s-0.671,17.784-1.946,26.401' +
                        'l157.93-26.401L577.576,373.229z')
                .attr({fill: '#ab3885', 'stroke-width': '0'}),
                
                this.paper.path('M577.57,426.03 L735.5,399.629 L577.576,373.229')
                .attr({stroke: '#802060'})
        );
        
        this.needle[1].rSet.scale(0.245, 0.245, 2.5, 2.5);
        
        // Set the needle2 to the lowest value.
        this.setValue(this.ticks.start, this.needle[1]);
}
	
	
/**
 * Creates the range arcs on the gauge face.
 * @author Darian Cabot
 */
jGauge.prototype.updateRange = function()
{
        var c;
        var canvas; // The canvas used for the range.
        var ctx; // The 2D convas context for drawing.
        
        // Remove any existing ticks canvas.
        removeElement(this.id + '-canvas-ranges');
        
        // Create range arcs by drawing on a new canvas...
        c = document.createElement('canvas');
        c.setAttribute('id', this.id + '-canvas-ranges');
        this.root.appendChild(c);
        
        // Reference the canvas element we just created.
        canvas = document.getElementById(this.id + '-canvas-ranges');
        
        // Resize canvas...
        canvas.width = this.width;
        canvas.height = this.height;
        
        // Make sure we don't execute when canvas isn't supported.
        if (canvas.getContext)
        {
                // Use getContext to use the canvas for drawing.
                ctx = canvas.getContext('2d');
                
                ctx.strokeStyle = this.range.color;
                ctx.lineWidth = this.range.thickness;
                
                ctx.beginPath();
                
                // The canvas arc parameters are as follows:...
                // arc(x, y, radius, startAngle, endAngle, anticlockwise).
                ctx.arc(this.needle[0].xPivot, 
                        this.needle[0].yPivot, 
                        this.range.radius, 
                        (Math.PI / 180) * this.range.start, 
                        (Math.PI / 180) * this.range.end, 
                        false);
                
                // Draw range arc on canvas.
                ctx.stroke();
        }
        else
        {
                // Canvas not supported!
                if (this.showAlerts === true)
                {
                        alert('Sorry, canvas is not supported by your browser!');
                }
        }
}


/**
 * Creates the tick marks and labels on the gauge face.
 * @author Darian Cabot
 */
jGauge.prototype.updateTicks = function()
{
        var gaugeSegmentStep;
        var htmlString;
        var c;
        var canvas;
        var ctx;
        var startAngle;
        var endAngle;
        var tickStep;
        
        var leftOffset;
        var topOffset;
        var tickLabelCssLeft;
        var tickLabelCssTop;
        
        // FIRST: Draw ticks on gauge...
        
        // Remove any existing ticks canvas.
        removeElement(this.id + '-canvas-ticks');
        
        // Check if there is actually anything to draw...
        if (this.ticks.count !== 0 || this.ticks.thickness !== 0)
        {
                // Create ticks by drawing on a canvas...
                c = document.createElement('canvas');
                c.setAttribute('id', this.id + '-canvas-ticks');
                this.root.appendChild(c);
                
                // Reference the canvas element we just created.
                canvas = document.getElementById(this.id + '-canvas-ticks');
                
                // Resize canvas...
                canvas.width = this.width;
                canvas.height = this.height;

                // Make sure we don't execute when canvas isn't supported
                if (canvas.getContext)
                {
                        // use getContext to use the canvas for drawing
                        ctx = canvas.getContext('2d');
                        
                        // Draw ticks
                        gaugeSegmentStep = Math.abs(this.segmentStart - this.segmentEnd) / (this.ticks.count - 1);
                        ctx.strokeStyle = this.ticks.color;
                        ctx.lineWidth = 5;
                        
                        for (i = 0; i <= this.ticks.count - 1; i ++)
                        {
                                startAngle = (Math.PI / 180) * (this.segmentStart + (gaugeSegmentStep * i) - (this.ticks.thickness / 2));
                                endAngle = (Math.PI / 180) * (this.segmentStart + (gaugeSegmentStep * i) + (this.ticks.thickness / 2));
                                
                                ctx.beginPath();
                                
                                ctx.arc(this.needle[0].xPivot, 
                                        this.needle[0].yPivot, 
                                        this.ticks.radius, 
                                        startAngle, 
                                        endAngle, 
                                        false);
                                
                                ctx.stroke();
                        }
                }
                else
                {
                        // Canvas not supported!
                        if (this.showAlerts === true)
                        {
                                alert('Sorry, canvas is not supported by your browser!');
                        }
                }
        }
        
        
        // THIRD: Place tick labels on gauge...
        
        // Remove the existing tick labels.
        for (i = 0; i <= this.ticks.countOld - 1; i ++)
        {
                removeElement(this.id + '-tick-label-' + i);
        }
        
        this.ticks.countOld = this.ticks.count;
        
        /*
        // Check if there is actually anything to draw...
        if (this.tickCount !== 0)
        {
                // Calculate the step value between each tick.
                tickStep = (this.ticks.end - this.ticks.start) / (this.ticks.count - 1);
                gaugeSegmentStep = Math.abs(this.segmentStart - this.segmentEnd) / (this.ticks.count - 1);

                for (i = 0; i <= this.ticks.count - 1; i ++)
                {
                        // Calculate the tick value, round it, stick it in html...
                        //var htmlString = '<p class="tick-label">' + addCommas(numberPrecision((i * tickStep), this.ticks.labelPrecision)) + '</p>';
                        htmlString = '<p id="' + this.id + '-tick-label-' + i + '" class="tick-label">' + prefixNumber(this.ticks.start + i * tickStep, false) + '</p>';
                        
                        
                        // Add the tick label...
                        $('#' + this.id).append(htmlString);
                        
                        // Calculate the position of the tick label...
                        leftOffset = this.centerX + this.needle.xOffset - $('#' + this.id + ' .tick-label').getHiddenDimensions().w / 2;
                        topOffset = this.centerY + this.needle.yOffset - $('#' + this.id + ' .tick-label').getHiddenDimensions().h / 2;
                        tickLabelCssLeft = Math.round((this.ticks.labelRadius * Math.cos((this.segmentStart + (i * gaugeSegmentStep)) * Math.PI / 180)) + leftOffset) + 'px';
                        tickLabelCssTop = Math.round(this.ticks.labelRadius * Math.sin(Math.PI / 180 * (this.segmentStart + (i * gaugeSegmentStep))) + topOffset) + 'px';
                        
                        $('#' + this.id + ' p:last').css({'left': tickLabelCssLeft, 'top': tickLabelCssTop});
                }

                // Tick labels are all created, so reveal them together.
                $('#' + this.id + ' .tick-label').fadeIn('slow');
        }
        */
}


/**
 * Changes the gauge value (needle and read-out label).
 * The gauge must be initialized with createGauge() before this is called.
 * @author Darian Cabot
 * @param {Number} newValue The new value for the gauge.
 */
jGauge.prototype.setValue = function(newValue, needleObject)
{
        var degreesMult;
        var valueDegrees;
        var htmlString;
        var needleCssLeft;
        var needleCssTop;
        
        // First set the internal value variable (so we can return if required).
        this.value = newValue;
        
        // Scale the 'value' to 'degrees' around the gauge.
        degreesMult = (this.segmentEnd - this.segmentStart) / (this.ticks.end - this.ticks.start);
        valueDegrees = degreesMult * (newValue - this.ticks.start);

        // Check the needle is in bounds...
        // TODO: This is only checking the upper limit, we should also be checking the lower limit.
        if (valueDegrees > Math.abs(this.segmentStart - this.segmentEnd))
        {
                if (needleObject.limitAction === limitAction.autoRange)
                {
                        this.ticks.end = this.findUpperLimit(newValue, 10);
                        this.updateTicks();
                        // TODO: update range also (range should be set with gauge values, not degress).

                        // Scale the 'value' to 'degrees' around the gauge AGAIN.
                        valueDegrees = newValue * (this.segmentEnd - this.segmentStart) / (this.ticks.end - this.ticks.start);
                }
                else if (needleObject.limitAction === limitAction.clamp)
                {
                        // Clamp needle to gauge limit (stops the needle spinning).
                        valueDegrees = Math.abs(this.segmentStart - this.segmentEnd);

                        // Shake the needle to simulate bouncing off the limit...
                        // TODO: wait until needle finished moving before 'bouncing'.
                        $('#' + this.id + '-needle')
                                .animate({ top: '+=2', left: '-=2' }, 50)
                                .animate({ top: '-=2', left: '+=2' }, 50)
                                .animate({ top: '+=2', left: '-=2' }, 50)
                                .animate({ top: '-=2', left: '+=2' }, 50);
                }
        }
        
        // Rotate the needle...
        needleObject.rSet.animate({rotation: this.segmentStart + valueDegrees + ' ' + 
                needleObject.xPivot + ' ' + needleObject.yPivot}, needleObject.speed, '>');
        
        // Update the main label (and apply any SI / binary prefix)...
        htmlString = this.prefixNumber(newValue, true);
        this.label.rText.attr('text', htmlString);
}


/**
 * Gets the gauge value.
 * @returns The current gauge value.
 * @type Number
 */
jGauge.prototype.getValue = function()
{
        return this.value;
}


/**
 * Returns a SI / binary prefixed string from a number.
 * @author Darian Cabot
 * @param {Number} value A number to be rounded.
 * @param {Boolean} formatting Whether to include prefix/suffix and bold value (usually true for gauge label and false for tick labels).
 * @returns the SI/binary prefixed number as a string (i.e. 2500 becomes 2.5k).
 * @type String
 */
jGauge.prototype.prefixNumber = function(value, formatting)
{
        var power = 0;
        var prefix = '';
        
        switch (this.autoPrefix)
        {
                case autoPrefix.si:
                        
                        while (value >= 1000)
                        {
                                power ++;
                                value /= 1000;
                        }
                        
                        prefix = this.siPrefixes[power];
                        
                        break;
                
                case autoPrefix.binary:
                        
                        while (value >= 1024)
                        {
                                power ++;
                                value /= 1024;
                        }
                        
                        prefix = this.binaryPrefixes[power];
                        
                        break;
        }
        
        // Build the label string (and apply any SI / binary prefix)...
        if (formatting === true)
        {
                return this.label.prefix + addCommas(numberPrecision(value, this.label.precision)) + prefix + this.label.suffix;
        }
        else
        {
                return addCommas(numberPrecision(value, this.label.precision)) + prefix;
        }
}


/**
 * Returns an upper limit (range) based on the value and multiple.
 * It rounds the value up the the closest multiple.
 * TODO: Factor in the number of ticks and avoid wierd decimal values for ticks.
 * @author Darian Cabot
 * @param {Number} value The gauge value that the range is to be suited to.
 * @param {Number} multiple The multiple to round up to.
 * @returns the closest multiple above the value.
 * @type Number
 */
jGauge.prototype.findUpperLimit = function(value, multiple)
{
        
        //return Math.ceil(Math.ceil(value) / multiple) * multiple; // Old method (prior to SI/binary prefixing).
        
        var power = 0;
        var bump = 0;
        
        if (this.autoPrefix === autoPrefix.binary)				
        {
                // Special case for binary mode...
                
                while (value >= 2)
                {
                        power ++;
                        value /= 2;
                }
                
                return Math.pow(2, power + 1);
        }
        else
        {
                multiple /= 10;
                
                while (value >= 10)
                {
                        power ++;
                        value /= 10;
                }
                
                while (value > bump)
                {
                        bump += multiple;
                }
                
                // parseInt is used to ensure there aren't any wierd float decimals (i.e. 4.999~ instead of 5).
                return parseInt(bump * Math.pow(10, power), 10);
        }
}





// Helper functions...



/**
 * Removes a DOM element by it's ID if it exists.
 * @author Darian Cabot
 * @see http://tech.chitgoks.com/2009/06/08/remove-an-element-by-id-using-javascript/
 */
function removeElement(id)
{
        var element = document.getElementById(id);
        
        if (element)
        {
                element.parentNode.removeChild(element);
        }
}


/**
 * Returns a rounded number to the precision specified.
 * @author Darian Cabot
 * @param {Number} value A number to be rounded.
 * @param {Number} decimals The number of decimal places to round to.
 * @returns the value rounded to the number of decimal places specified.
 * @type Number
 */
numberPrecision = function(value, decimals)
{
	return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
};


/**
 * Formats a numeric string by adding commas for cosmetic purposes.
 * @author Keith Jenci
 * @see http://www.mredkj.com/javascript/nfbasic.html
 * @param {String} nStr A number with or without decimals.
 * @returns a nicely formatted number.
 * @type String
 */
addCommas = function(nStr)
{
	nStr += '';
	var x = nStr.split('.');
	var x1 = x[0];
	var x2 = x.length > 1 ? '.' + x[1] : '';
	var rgx = /(\d+)(\d{3})/;
	
	while (rgx.test(x1))
	{
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	
	return x1 + x2;
};
