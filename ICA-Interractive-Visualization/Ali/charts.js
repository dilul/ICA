// Loading data from CSV file using d3.csv
d3.csv("Clean_data.csv").then((data) => {
  // Initializing default year filter

  // Function to filter data based on year
  function filterData() {
    let donutFilteredObj = {
      2015: 0,
      2016: 0,
      2017: 0,
      2018: 0,
      2019: 0,
      2020: 0,
      2021: 0,
      2022: 0,
      2023: 0,
    };

    data.forEach((d) => {
      // Filtering out the "Province/territory not stated Total" entry
      Object.keys(donutFilteredObj).forEach((k) => {
        donutFilteredObj[k] = donutFilteredObj[k] + parseFloat(d[k]);
      });
    });
    return donutFilteredObj;
  }

  // Calling the donut function with initial data
  donut(filterData());

  // Function to render donut chart
  function donut(data) {
    // Setting up dimensions and margins
    const width = 380,
      height = 300,
      margin = 5;

    // Clearing existing content in the div
    d3.select("#dounut").html("");

    // Calculating radius
    const radius = Math.min(width, height) / 2 - margin;

    // Appending SVG element
    const svg = d3
      .select("#dounut")
      .append("svg")
      .attr("width", width + margin * 5)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    // Creating tooltip
    let tooltip = d3
      .select("#dounut")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    // Setting up color scale
    const color = d3
      .scaleOrdinal()
      .domain(Object.keys(data))
      .range(d3.schemePaired);

    // Creating pie generator
    const pie = d3
      .pie()
      .sort(null)
      .value((d) => d[1]);

    // Converting data to pie chart format
    const pieProc = pie(Object.entries(data));

    // Creating arc generator
    const arc = d3
      .arc()
      .innerRadius(radius * 0.5)
      .outerRadius(radius * 0.8);

    // Rendering arcs
    const arcs = svg
      .selectAll("arc")
      .data(pieProc)
      .enter()
      .append("g")
      .attr("class", "arc");

    // Append paths for arcs
    arcs
      .append("path")
      .attr("d", arc)
      .attr("fill", (d) => color(d.data[0]))
      .attr("stroke", "white")
      .style("stroke-width", "1px")
      .style("opacity", 1)
      .on("mouseover", function (i, d) {
        let background = d3.select(this).style("fill");
        d3.selectAll(".arc path").style("opacity", 0.4);
        d3.select(this).attr("stroke", "black").style("opacity", 1);
        tooltip.style("background", background);
        tooltip.transition().duration(250).style("opacity", 1);
        tooltip
          .html(
            `<span style="font-size:20px;font-weight:bold">${d.data[0]} : ${d.data[1]}</span>`
          )
          .style("display", "block")
          .style("left", event.pageX + "px")
          .style("top", event.offsetY + "px");
      })
      .on("mouseout", function (i, d) {
        d3.selectAll(".arc path").style("opacity", 1);
        d3.select(this).attr("stroke", "white");
        tooltip
          .style("display", "none")
          .transition()
          .duration(250)
          .style("opacity", 0);
      })
      .on("click", function (i, d) {
        bar(d.data[0]);
      });

    // Append text for years inside the donut chart
    arcs
      .append("text")
      .attr("transform", function (d) {
        return "translate(" + arc.centroid(d) + ")";
      })
      .attr("dy", "0.35em")
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "black")
      .text((d) => d.data[0]);
  }

  // Function to render bar chart
  function bar(year) {
    // Setting up dimensions and margins

    var margin = { top: 30, right: 30, bottom: 121, left: 90 },
      width = 900 - margin.left - margin.right,
      height = 550 - margin.top - margin.bottom;

    // Setting up color scale for bars

    // Removing existing SVG and tooltip
    d3.select("#bar svg").remove(); //remove drawn chart
    d3.select("#bar div").remove(); //remove drawn tooltip

    document.getElementById("barTitle").style.display = "block";
    document.getElementById(
      "barTitle"
    ).innerText = `Number of Students in each Province in ${year}`;

    // Creating SVG for bar chart
    var svg = d3
      .select("#bar")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Creating tooltip for bars
    var barsTooltip = d3
      .select("#bar")
      .append("div") //adding tooltip div
      .attr("class", "tooltip")
      .style("opacity", 0);

    let barFilteredObj = {};
    data.forEach((d) => {
      // Filtering out the "Province/territory not stated Total" entry
      if (
        d["Province/territory"].localeCompare(
          "Province/territory not stated Total"
        ) != 0
      ) {
        // Aggregating data by year
        if (barFilteredObj[d["Province/territory"]] === undefined) {
          barFilteredObj[d["Province/territory"]] = parseFloat(d[year]);
        } else {
          barFilteredObj[d["Province/territory"]] =
            barFilteredObj[d["Province/territory"]] + parseFloat(d[year]);
        }
      }
    });

    const color = d3
      .scaleOrdinal()
      .domain(Object.keys(barFilteredObj))
      .range(d3.schemePaired);

    var bardata = [];
    Object.keys(barFilteredObj).forEach((d) => {
      bardata.push({ key: d, value: barFilteredObj[d] });
    });

    // X axis
    var x = d3
      .scaleBand()
      .range([0, width])
      .domain(bardata.map((d) => d.key))
      .padding(0.2);

    svg
      .append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end")
      .style("font-size", "18px"); // Increased font size for X axis labels

    svg
      .append("text")
      .attr(
        "transform",
        "translate(" + width / 2 + " ," + (height + margin.bottom) + ")"
      )
      .style("text-anchor", "middle")
      .style("fill", "white")
      .style("font-size", "20px") // Increased font size for X axis label
      .text("Sectors");

    // Y axis
    var y = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(bardata, function (d) {
          return d.value;
        }),
      ])
      .range([height, 0]);
    svg.append("g").call(d3.axisLeft(y)).style("font-size", "18px"); // Increased font size for Y axis labels

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - height / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("fill", "white")
      .style("font-size", "20px") // Increased font size for Y axis label
      .text("No. of Students");

    // Rendering bars
    var bars = svg
      .selectAll("bars")
      .data(bardata)
      .enter()
      .append("rect")
      .attr("class", "barsClass")
      .attr("x", (d) => x(d.key))
      .attr("y", (d) => y(0))
      .attr("width", x.bandwidth())
      .attr("height", (d) => 0)
      .style("opacity", 1);

    // Animating bars
    bars
      .transition()
      .style("fill", (d, i) => {
        return color(d.key);
      })
      .duration(800)
      .delay((d, i) => (i * 900) / 3)
      .attr("x", (d, i) => x(d.key))
      .attr("y", (d, i) => y(d.value))
      .attr("width", x.bandwidth())
      .attr("height", (d, i) => height - y(d.value));

    // Tooltip interactions
    bars
      .on("mouseover", function (i, d) {
        d3.selectAll(".barsClass").style("opacity", 0.5);
        d3.select(this).style("opacity", 1).style("stroke", "black");
        let background = d3.select(this).style("fill"); //getting color of the arc
        d3.select(this).attr("stroke", "black"); //for changing stroke
        barsTooltip.style("background", background); //giving circle color to tooltip
        d3.select(this).style("fill-opacity", 1);
        barsTooltip.transition().duration(300).style("opacity", 1);
        barsTooltip
          .html(
            `<span style="font-size:20px;font-weight:bold">Province : ${d.key}<br></span><span style="font-size:20px;font-weight:bold">Total Students : ${d.value}`
          )
          .style("display", "block")
          .style("visibility", "visible") //adding values on tooltip
          .style("left", event.pageX + 15 + "px")
          .style("top", event.pageY + "px");
      })
      .on("mouseleave", function (d) {
        d3.selectAll(".barsClass").style("opacity", 0.8);

        d3.select(this).style("stroke", "transparent");

        barsTooltip
          .style("visibility", "none")
          .style("display", "none")
          .transition()
          .duration(301)
          .style("opacity", 0);
      });

    // Adding Y axis label
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - height / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("No. of Students");

    // Adding X axis label
    svg
      .append("text")
      .attr(
        "transform",
        "translate(" + width / 2 + " ," + (height + margin.bottom) + ")"
      )
      .style("text-anchor", "middle")
      .text("Provinces");
  }
});
