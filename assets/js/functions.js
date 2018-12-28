var ssKEY = '1XWcAcEYpGCQEJBksqUAT3jXPwJTq4bBZ2ecJjeKLyCU',
    ssURL = 'https://spreadsheets.google.com/feeds/list/' + ssKEY + '/1/public/basic?alt=json';

var chartData = [];

function callback(data){
    var cells = data.feed.entry;
    
    for (var i = 0; i < cells.length; i++){
        var rowObj = {};
        var rowCols = cells[i].content.$t.split(',');

        for (var j = 0; j < rowCols.length && j < 2; j++){
            var keyVal = rowCols[j].split(':');
            rowObj[keyVal[0].trim()] = keyVal[1].trim();
        }
        chartData.push(rowObj);
    }

}

function insertData(array,number){

	var toInsert = { 'date': 'Inactive', 'minutes':'0' };

	for (n=0; n < number; n++) {
		array.unshift(toInsert);
	}
}


function drawChart() {

	// fill out beginning of week if dataset doesn't start on a sunday
	var daysToInsert = 5;
	insertData(chartData,daysToInsert);

	var dataset = chartData,
		dataLength = chartData.length + 1,
		dataLabels = ['S','M','T','W','T','F','S'],
		unit = 50, // width and height of cell
		w = unit * 7,
		h = Math.ceil(dataset.length / 7) * unit,
		wUnits = 7, // number of columns
		hUnits =  Math.round( h / unit ), // number of rows
		maxMinutes = d3.max(dataset, function(d) {
				return +d.minutes; 
			}),
		ovalEmpty = unit/8,
		ovalMin = unit/3,

		// minimum minutes to read
		goal = 20,

		// scale
		scale = d3.scale.linear()
			.domain([0, maxMinutes])
			.range([0, unit/2 - 2]),

		svg = d3.select('#data-goal-container').append('svg')
			.attr({
				width: w,
				height: h
			}),

		// Define the div for the tooltip
		tooltip = d3.select("body").append("div")	
			.attr("class", "tooltip")				
			.style("opacity", 0);


	// Create groups and insert empty circles
	for (var n = 0; n < hUnits; n++) {

		// create each set of rows
		var weeks = svg.selectAll('g' + ' .week-' + (n+1))
			.data(d3.range(wUnits))
			.enter().append('g')
				.attr({
					class: function(d, i) {
						return 'remove week week-' + (n+1)
					}
		    	})
	    	.append('circle')
		    	.attr({
		    		cx: function(i) {
	    					return i * unit + unit/2
						},
					cy: unit/2 + n * unit,
					r: ovalMin/2,
					class: 'remove'
	       		});
	} 


	// Populate circles with data
	var days = svg.selectAll('circle')
		.data(dataset)
		.attr({
			class: function(d,i) {
				var currCircle = d3.select(this);
				d3.select(this.parentNode).classed('remove', false);

				if(i < daysToInsert) {
					currCircle.attr('r', ovalEmpty/2);
					return 'empty exclude';
				} else if ( d.minutes < goal ) {
					currCircle.attr('r', ovalEmpty/2);
					return 'empty'
				} else if ( d.minutes > goal ) { 

					var bgRadius = scale(d.minutes);

					d3.select(this.parentNode)
						.insert('circle',':first-child')
						.attr('class','bg')
						.attr('r', bgRadius)
						.attr('cy', currCircle.attr('cy'))
						.attr('cx', currCircle.attr('cx'));
					
					return 'min'
				} else {
					return 'min'
				}
			}
		});

    svg.selectAll('g')
		.data(dataset)
		.on('mouseover', function(d) {		
            tooltip.transition()		
                .duration(200)		
                .style("opacity", .9);
            tooltip.style('left', (d3.event.pageX - unit) + "px")	
                .style('top', (d3.event.pageY + 25) + "px");

	            if (d.date !== 'Inactive') {
	            	tooltip.html(d.date.split('/', 2).join('/') + "<br/>"  + d.minutes + " minutes")
	            	.classed('inactive', false)	
	            } else {
	            	tooltip.html('Not part of the challenge')
	            		.classed('inactive', true)
	            }		
            
            })					
        .on('mouseout', function(d) {		
            tooltip.transition()		
                .duration(500)		
                .style('opacity', 0);	
        }); 

	// Remove empty groups and circles
	svg.selectAll('.remove').remove();

}

$(document).ready(function(){
    
    $.ajax({
        url: ssURL,
        success: function(data){
        	callback(data);
        	drawChart();
        }
    });

});
