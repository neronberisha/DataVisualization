let currentData; // Declare currentData in a higher scope

// Add tooltips to data points
function addTooltip(element, text) {
    element.append('title').text(text);
}

// Visual feedback while loading data
function showLoader() {
    // Show loading indicator (You can implement this based on your UI framework)
    console.log("Loading data...");
}

function hideLoader() {
    // Hide loading indicator (You can implement this based on your UI framework)
    console.log("Data loaded successfully!");
}

// Implement line chart
// Implement line chart
function createLineChart(svg, data, xScale, yScale) {
    // Define line generator
    const line = d3.line()
        .x(d => xScale(d.Operator))
        .y(d => yScale(d.Fatalities))
        .curve(d3.curveLinear);

    // Append path element for the line
    svg.append('path')
        .datum(data)
        .attr('class', 'line')
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', 'steelblue');
}


function createScatterPlot(svg, data, xScale, yScale) {
    // Append circles for each data point
    svg.selectAll(".dot")
        .data(data)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("cx", d => xScale(d.Operator))
        .attr("cy", d => yScale(d.Fatalities))
        .attr("r", 5) // Radius of the circle
        .style("fill", "steelblue"); // Color of the circles, change as needed
}

function filterData(data, criteria) {
    // Implement data filtering based on criteria
    // For example, filter data based on operator name
    return data.filter(d => d.Operator === criteria);
}

// Make visualization responsive
function makeResponsive() {
    // Adjust visualization size and layout based on screen size
    // You can use CSS media queries or other techniques to make it responsive
    // Here's an example using CSS media queries
    const svg = d3.select("svg");

    // Get the container width
    const containerWidth = svg.node().parentNode.clientWidth;

    // Set the SVG width based on the container width
    svg.attr("width", containerWidth);

    // Update the visualization based on the new width
    // For example, you may need to update scales, axes, etc.
}

// Entry point - Load and preprocess data
showLoader();
d3.csv('airplane_crashes.csv').then(data => {
    hideLoader();

    currentData = data; // Assign data to currentData variable

    // Populate year dropdown with unique years
    const yearDropdown = document.getElementById('year');
    const uniqueYears = [...new Set(data.map(d => +d.Date))];

    uniqueYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearDropdown.appendChild(option);
    });

    // Populate operator dropdown with unique operators
    const operatorDropdown = document.getElementById('operator');
    const uniqueOperators = [...new Set(data.map(d => d.Operator))];

    uniqueOperators.forEach(operator => {
        const option = document.createElement('option');
        option.value = operator;
        option.textContent = operator;
        operatorDropdown.appendChild(option);
    });

    // Initial chart
    updateVisualization();
});

// Utility function to clear existing chart
function clearChart() {
    d3.select('#chart').selectAll('*').remove();
}

// Function to update the visualization based on user input
function updateVisualization() {
    const yearDropdown = document.getElementById('year');

    // Check if the dropdown element exists
    if (yearDropdown) {
        const selectedYear = +yearDropdown.value;
        const selectedOperator = document.getElementById('operator').value.trim();
        const chartType = document.getElementById('chart-type').value;

        // Call the appropriate chart creation function based on user input
        createChart(chartType, selectedYear, selectedOperator);
    } else {
        console.error('Year dropdown element not found.');
    }
}

// Function to create a chart based on chart type
function createChart(chartType, selectedYear, selectedOperator) {
    // Clear existing chart
    clearChart();

    const margin = { top: 50, right: 50, bottom: 70, left: 80 };
    const width = 1000 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    // Filter data based on the selected year and operator
    let filteredData = currentData.filter(d => +d.Date === selectedYear);
    if (selectedOperator) {
        filteredData = filteredData.filter(d => d.Operator.includes(selectedOperator));
    }

    // Aggregate data by operator using d3.nest
    const nestedData = d3.nest()
        .key(d => d.Operator)
        .rollup(values => ({
            Fatalities: d3.sum(values, d => +d.Fatalities),
            Aboard: d3.sum(values, d => +d.Aboard)
        }))
        .entries(filteredData);

    // Convert nestedData to an array of objects
    const aggregatedArray = nestedData.map(d => ({
        Operator: d.key,
        Fatalities: d.value.Fatalities,
        Aboard: d.value.Aboard
    }));

    // Create SVG element
    const svg = createSvg('#chart', width, height, margin);

    // Data preprocessing (if needed)

    // Create scales and axes
    const xScale = createScaleBand(aggregatedArray.map(d => d.Operator), [0, width], 0.1);
    const yScale = createScaleLinear([0, d3.max(aggregatedArray, d => Math.max(d.Fatalities, d.Aboard))], [height, 0]);

    // Pass width and height to createAxes
    createAxes(svg, xScale, yScale, height);

    // Create and render chart based on chart type
    switch (chartType) {
        case 'bar':
            createBars(svg, aggregatedArray, xScale, yScale);
            break;
        case 'pie':
            createPieChart(svg, aggregatedArray, width, height);
            break;
        case 'line':
            createLineChart(svg, aggregatedArray, xScale, yScale);
            break;
        case 'scatter':
            createScatterPlot(svg, aggregatedArray, xScale, yScale);
            break;
        // Add more cases for additional chart types
    }

    // Add labels and title
    createLabels(svg, width, height, margin, 'Operator', 'Count');
    createTitle(svg, width, height, margin, `Airplane Crashes by Operator and Count`);
}

// Function to create SVG element
function createSvg(selector, width, height, margin) {
    return d3.select(selector)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
}

// Function to create scales
function createScaleBand(domain, range, padding) {
    return d3.scaleBand()
        .domain(domain)
        .range(range)
        .padding(padding);
}

// Function to create linear scale
function createScaleLinear(domain, range) {
    return d3.scaleLinear()
        .domain(domain)
        .range(range);
}

// Function to create axes
function createAxes(svg, xScale, yScale, height) {
    // X-axis
    svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end');

    // Y-axis
    svg.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(yScale));
}

// Function to create grouped bars in a bar chart for both Fatalities and Aboard
function createBars(svg, data, xScale, yScale) {
    // Grouped bars for each operator
    const groupedBars = svg.selectAll('.grouped-bar')
        .data(data)
        .enter()
        .append('g')
        .attr('class', 'grouped-bar')
        .attr('transform', d => `translate(${xScale(d.Operator)}, 0)`);

    // Bar for Fatalities
    groupedBars.append('rect')
        .attr('class', 'bar fatalities')
        .attr('x', d => xScale(d.Operator))
        .attr('y', d => yScale(d.Fatalities))
        .attr('width', xScale.bandwidth() / 2)
        .attr('height', d => yScale(0) - yScale(d.Fatalities))
        .style('fill', 'steelblue');

    // Bar for Aboard
    groupedBars.append('rect')
        .attr('class', 'bar aboard')
        .attr('x', d => xScale(d.Operator) + xScale.bandwidth() / 2)
        .attr('y', d => yScale(d.Aboard))
        .attr('width', xScale.bandwidth() / 2)
        .attr('height', d => yScale(0) - yScale(d.Aboard))
        .style('fill', 'orange');

    // Text labels for Fatalities
    groupedBars.append('text')
        .attr('class', 'bar-label fatalities-label')
        .attr('x', d => xScale(d.Operator) + xScale.bandwidth() / 4) // Adjust x position
        .attr('y', d => yScale(d.Fatalities) - 5) // Adjust y position
        .text(d => `Fatalities: ${d.Fatalities}`) // Concatenate number and type
        .style('text-anchor', 'middle')
        .style('font-size', '12px');

    // Text labels for Aboard
    groupedBars.append('text')
        .attr('class', 'bar-label aboard-label')
        .attr('x', d => xScale(d.Operator) + xScale.bandwidth() * 3 / 4) // Adjust x position
        .attr('y', d => yScale(d.Aboard) - 5) // Adjust y position
        .text(d => `Aboard: ${d.Aboard}`) // Concatenate number and type
        .style('text-anchor', 'middle')
        .style('font-size', '12px');
}


// Function to create a pie chart
function createPieChart(svg, data, width, height) {
    const radius = Math.min(width, height) / 2;
    const pie = d3.pie().value(d => d.Fatalities + d.Aboard);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const arcs = svg.selectAll('.arc')
        .data(pie(data))
        .enter().append('g')
        .attr('class', 'arc')
        .attr('transform', `translate(${width / 2},${height / 2})`);

    arcs.append('path')
        .attr('d', arc)
        .attr('fill', (d, i) => color(i))
        .call(addTooltip, d => `Operator: ${d.data.Operator}\nAccidents: ${d.data.value}\nFatalities: ${d.data.Fatalities}\nAboard: ${d.data.Aboard}`);

    // Label placement
    const labelArc = d3.arc()
        .outerRadius(radius - 40)
        .innerRadius(radius - 40);

    // Operator labels
    arcs.append('text')
        .attr('transform', d => `translate(${labelArc.centroid(d)})`)
        .attr('dy', '.35em')
        .text(d => d.data.Operator)
        .style('text-anchor', 'middle')
        .style('font-size', '10px');

    // Add text for Fatalities and Aboard
    arcs.append('text')
        .attr('class', 'arc-label fatalities-label')
        .attr('transform', d => `translate(${arc.centroid(d)})`)
        .attr('dy', '.35em')
        .text(d => `Fatalities: ${d.data.Fatalities}`)
        .style('text-anchor', 'middle');

    arcs.append('text')
        .attr('class', 'arc-label aboard-label')
        .attr('transform', d => `translate(${arc.centroid(d)})`)
        .attr('dy', '1.5em')
        .text(d => `Aboard: ${d.data.Aboard}`)
        .style('text-anchor', 'middle');
}
// Function to add labels
function createLabels(svg, width, height, margin, xLabel, yLabel) {
    // X-axis label
    svg.append('text')
        .attr('class', 'x-label')
        .attr('text-anchor', 'middle')
        .attr('x', width / 2)
        .attr('y', height + margin.top + 40)
        .text(xLabel);

    // Y-axis label
    svg.append('text')
        .attr('class', 'y-label')
        .attr('text-anchor', 'middle')
        .attr('x', -margin.top - height / 2)
        .attr('y', -margin.left + 20)
        .attr('transform', 'rotate(-90)')
        .text(yLabel);
}

// Function to add title
function createTitle(svg, width, height, margin, titleText) {
    svg.append('text')
        .attr('class', 'chart-title')
        .attr('text-anchor', 'middle')
        .attr('x', width / 2)
        .attr('y', -margin.top / 2)
        .text(titleText);
}
