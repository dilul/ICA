d3.csv("Internation_students_Province_Canada.csv").then(function (data) {
  function modifyData(data) {
    let year = document.getElementById("year-select").value;
    let gender = document.getElementById("gender-select").value;
    let province = document.getElementById("province-select").value;

    let arr = [],
      total = 0;

    data = data.filter(
      (d) =>
        d.Sex.localeCompare("Male") === 0 || d.Sex.localeCompare("Female") === 0
    );

    data.forEach((d) => {
      if (year.localeCompare("all") === 0) {
        for (let i = 2015; i <= 2023; i++) {
          total = parseFloat(d[i]) + total;
        }
      } else {
        total = parseFloat(d[year]);
      }
      arr.push({
        province: d["Province/territory"],
        gender: d.Sex,
        total: total,
      });
    });

    if (gender.localeCompare("all") !== 0) {
      arr = arr.filter((d) => d.gender.localeCompare(gender) === 0);
    }

    if (province.localeCompare("all") !== 0) {
      arr = arr.filter((d) => d.province.localeCompare(province) === 0);
    }
    return arr;
  }
  drawBubbleChart(modifyData(data));

  d3.select("#gender-select").on("change", function (d) {
    drawBubbleChart(modifyData(data));
  });

  d3.select("#year-select").on("change", function (d) {
    drawBubbleChart(modifyData(data));
  });

  d3.select("#province-select").on("change", function (d) {
    drawBubbleChart(modifyData(data));
  });

  function drawBubbleChart(data) {
    let actualRadius = 0;
    const svgWidth = 1500;
    const svgHeight = 600;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
    const chartWidth = svgWidth - margin.left - margin.right;
    const chartHeight = svgHeight - margin.top - margin.bottom;

    d3.select("#chart-container").select("svg").remove();
    d3.select("#chart-container").select("div").remove();

    data.sort((a, b) => b.total - a.total);

    const svg = d3
      .select("#chart-container")
      .append("svg")
      .attr("width", svgWidth)
      .attr("height", svgHeight);

    const colorScale = d3
      .scaleOrdinal()
      .domain(["Female", "Male"])
      .range(["#FF69B4", "#6495ED"]);

    const radiusScale = d3
      .scaleSqrt()
      .domain([0, d3.max(data, (d) => d.total)])
      .range([10, 50]);

    const circles = svg
      .selectAll(".bubble")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "bubble")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", (d) => radiusScale(d.total))
      .attr("fill", (d) => colorScale(d.gender))
      .attr("opacity", 0.7)
      .on("mouseover", function (event, d) {
        actualRadius = parseFloat(d3.select(this).attr("r"));

        d3.select(this).attr("r", actualRadius + 11);
        handleMouseOver(event, d);
      })
      .on("mouseout", function (event, d) {
        d3.select(this).attr("r", actualRadius);
        handleMouseOut(event, d);
      })
      .on("click", handleClick)
      .on("dblclick", handleDoubleClick);

    const bubbleText = svg
      .selectAll(".bubble-text")
      .data(data)
      .enter()
      .append("text")
      .attr(
        "class",
        (d) =>
          "bubble-text " +
          d.province.replace(/\s/g, "").replace(/\./g, "") +
          "_" +
          d.gender
      )
      // .attr("class", )
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", "black")
      .attr("font-size", "8px")
      .text((d) => d.province)
      .each(function (d) {
        const circleRadius = radiusScale(d.total);
        const textWidth = this.getBBox().width;
        const textHeight = this.getBBox().height;

        // Check if circle is large enough to fit text
        if (circleRadius * 2 >= textWidth && circleRadius * 2 >= textHeight) {
          // Add x and y attributes only if the text can fit inside the circle
          d3.select(this).attr("x", d.x).attr("y", d.y);
        } else {
          // If the text can't fit, remove it
          d3.select(this).remove();
        }
      });

    const totalText = svg
      .selectAll(".total-text")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "total-text")
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y + 10)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", "black")
      .attr("font-size", "6px")
      .text((d) => d.province)
      .each(function (d) {
        const circleRadius = radiusScale(d.total);
        const diameter = circleRadius * 2;
        const textWidth = this.getBBox().width;
        const textHeight = this.getBBox().height;

        // Check if text fits comfortably within the circle
        if (textWidth <= diameter && textHeight <= diameter) {
          // Add x and y attributes only if the text can fit inside the circle
          d3.select(this)
            .text((d) => d.total)
            .attr("x", d.x)
            .attr("y", d.y + 10);

          let singleBubbleText = d3.select(
            `.${
              d.province.replace(/\s/g, "").replace(/\./g, "") + "_" + d.gender
            }`
          );

          if (singleBubbleText._groups[0][0] === null) {
            d3.select(this).remove();
          }
        } else {
          // If the text can't fit, remove it
          d3.select(this).remove();
        }
      });

    const simulation = d3
      .forceSimulation()
      .force(
        "center",
        d3
          .forceCenter()
          .x(svgWidth / 2)
          .y(svgHeight / 2)
      ) // Attraction to the center of the svg area
      .force("charge", d3.forceManyBody().strength(0.1)) // Nodes are attracted one each other of value is > 0
      .force(
        "collide",
        d3
          .forceCollide()
          .strength(0.1)
          .radius(function (d) {
            return radiusScale(d.total);
          })
          .iterations(1)
      )
      .alphaDecay(0.01) // Decrease the rate of alpha decay
      .alphaTarget(0)
      .on("tick", function (d) {
        circles.attr("cx", (d) => d.x).attr("cy", (d) => d.y);

        bubbleText.attr("x", (d) => d.x).attr("y", (d) => d.y);

        // Update total text positions
        totalText.attr("x", (d) => d.x).attr("y", (d) => d.y + 10);
      }); // Set a lower target alpha value to slow down convergence

    simulation.nodes(data);

    // Title
    svg
      .append("text")
      .attr("class", "title")
      .attr("x", svgWidth / 2)
      .attr("y", margin.top / 2)
      .text("Gender Distribution in Provinces");

    function handleMouseOver(event, d) {
      const [mouseX, mouseY] = d3.pointer(event);

      const tooltipLeft = mouseX + 10;
      const tooltipTop = mouseY + 10;

      const tooltip = d3
        .select("#chart-container")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "solid 1px")
        .style("border-radius", "5px")
        .style("padding", "10px").html(`
                      <strong>Province/Territory:</strong> ${d.province}<br>
                      <strong>Gender:</strong> ${d.gender}<br>
                      <strong>Total:</strong> ${d.total}<br>
                  `);

      tooltip.style("left", tooltipLeft + "px").style("top", tooltipTop + "px");
    }

    function handleMouseOut() {
      d3.select(".tooltip").remove();
    }

    function handleClick(event, d) {
      circles.classed("dimmed", true);
      d3.select(this).classed("dimmed", false);

      handleMouseOut();
      handleMouseOver(event, d);

      d3.select(this).attr("r", actualRadius);
      circles.on("mouseover", null);

      circles.on("mouseout", null);

      console.log("Province: " + d.province);
      console.log("Total Students: " + d.total);
    }

    function handleDoubleClick(event, d) {
      circles.classed("dimmed", false);

      handleMouseOut();

      circles.on("mouseover", function (event, d) {
        actualRadius = parseFloat(d3.select(this).attr("r"));

        d3.select(this).attr("r", actualRadius + 11);
        handleMouseOver(event, d);
      });

      circles.on("mouseout", function (event, d) {
        d3.select(this).attr("r", actualRadius);
        handleMouseOut(event, d);
      });
    }
  }
});
