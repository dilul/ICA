const checkboxes = document.getElementById("checkboxes");
const dropdownContent = document.getElementById('yearDropdown');
const dropdownButton = document.getElementById('dropdownButton');

const treemapSVG = document.getElementById("treeMapDiv");
const width = treemapSVG.clientWidth;
const height = treemapSVG.clientHeight;

const x = d3.scaleLinear().rangeRound([0, width]);
const y = d3.scaleLinear().rangeRound([0, height]);
const color = d3.scaleOrdinal(d3.schemeDark2);
const format = d3.format(",d");
const tooltip = d3.select("#tooltip").attr("class", "tooltip");
const treemapData = {
    "name": "International Students Study level",
    "children": []
};
const name = (d) =>
    d.ancestors()
        .map(d => d.data.name)
        .reverse()
        .slice(1)
        .join(" + ");

const svg = d3
    .select("#treeMapDiv")
    .append("svg")
    .attr("viewBox", [0.5, -30.5, width, height + 30])
    .style("font", "20px bebas neue")
    .style("fill", "#fff");

let expanded = false;
let selectedYear = [];
let count = 0;
let current = null;

d3.csv('./data/International_Students_Study_level-1.csv').then((data) => {
    // Get the year and show on the select control
    let yearData = [];
    const yearDataSet = new Set();

    data.forEach(d => {
        Object.keys(d)
            .filter(f => !isNaN(f))
            .forEach(key => yearDataSet.add(key));
    });
    
    yearData = Array.from(yearDataSet);

    populateDropdown(yearData);
    loadData();
    function loadData() {
        d3.selectAll("g").remove();
        // Modify the data
        const groupData = groupBy(data, "study level"); // Grouping the data
        let studentStudyData = [];

        // Sum of the value of selected years. 
        Object.values(groupData).forEach((d) => {
            d.children = d.children.map((c) => {
                let value = 0;
                selectedYear.forEach((s) => {
                    value += parseInt(c[s]);
                })
                return {
                    "name": c["Province/Territory"],
                    "value": value
                }
            })
            studentStudyData.push(d);
        })

        treemapData.children = Object.values(studentStudyData);

        const hierarchy = d3.hierarchy(treemapData)
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value);

        const root = d3.treemap().tile(tile)(hierarchy);

        let group = svg.append("g")
            .call(render, root);

        if (current != null) zoomout(current);

        function render(group, root) {
            const node = group
                .selectAll("g")
                .data(root.children.concat(root))
                .join("g")
                .on("mousemove", function (event, d) {
                    tooltip
                        .style("display", "block")
                        .html(
                            ` <div class="tooltipBody" style="border: 3px solid ${color(d.data.name)}">
                                <span><b>Province/Territory : </b>${d.data.name}</span><br/>
                                <span><b>No of Students : </b>${format(d.value)}</span>
                              </div> 
                            `
                        )
                        .style("left", event.pageX + 10 + "px")
                        .style("top", event.pageY + "px");
                })
                .on("mouseout", function (event, d) {
                    tooltip.style("display", "none");
                });

            node.filter(d => d === root ? d.parent : d.children)
                .attr("cursor", "pointer")
                .on("click", (event, d) => d === root ? zoomout(root) : zoomin(d));

            node.append("rect")
                .attr("id", d => (d.leafUid = uid("leaf")).id)
                .attr("fill", d => color(d.data.name))
                .attr("stroke", "#fff")
                .on("click", function (event, d) {
                    if (!d.children) {
                        node.selectAll("rect")
                            .transition()
                            .style("opacity", 0.5)
                            .style("fill", "light ");

                        d3.select(`#${root.leafUid.id}`)
                            .transition()
                            .style("opacity", 1);

                        d3.select(this)
                            .transition()
                            .style("opacity", 1)
                            .style("fill", color(d.data.name));
                    }
                })
                ;

            node.append("clipPath")
                .attr("id", d => (d.clipUid = uid("clip")).id)
                .append("use")
                .attr("xlink:href", d => d.leafUid.href);

            node.append("text")
                .attr("clip-path", d => d.clipUid)
                .attr("font-weight", d => d === root ? "bold" : null)
                .attr("x", 3)
                .attr("y", (d, i, nodes) => `1em`)
                .style("font-size", 15)
                .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
                .text(d => d.data.name);

            node.append("text")
                .attr("clip-path", d => d.clipUid)
                .attr("font-weight", d => d === root ? "bold" : null)
                .attr("x", 3)
                .attr("y", (d, i, nodes) => `2em`)
                .style("font-size", 15)
                .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
                .text(d => { if (d !== current && d !== root) return format(d.value) });

            group.call(position, root);
        }

        function position(group, root) {
            group.selectAll("g")
                .attr("transform", d => d === root ? `translate(0,-30)` : `translate(${x(d.x0)},${y(d.y0)})`)
                .select("rect")
                .attr("width", d => d === root ? width : x(d.x1) - x(d.x0))
                .attr("height", d => d === root ? 30 : y(d.y1) - y(d.y0));
        }

        function zoomin(d) {
            current = d;
            const group0 = group.attr("pointer-events", "none");
            const group1 = (group = svg.append("g").call(render, d));

            x.domain([d.x0, d.x1]);
            y.domain([d.y0, d.y1]);

            svg
                .transition()
                .duration(750)
                .call(t =>
                    group0
                        .transition(t)
                        .remove()
                        .call(position, d.parent)
                )
                .call(t =>
                    group1
                        .transition(t)
                        .attrTween("opacity", () => d3.interpolate(0, 1))
                        .call(position, d)
                );
        }

        function zoomout(d) {
            current = null;
            const group0 = group.attr("pointer-events", "none");
            const group1 = (group = svg.insert("g", "*").call(render, d.parent));

            x.domain([d.parent.x0, d.parent.x1]);
            y.domain([d.parent.y0, d.parent.y1]);

            svg
                .transition()
                .duration(750)
                .call(t =>
                    group0
                        .transition(t)
                        .remove()
                        .attrTween("opacity", () => d3.interpolate(1, 0))
                        .call(position, d)
                )
                .call(t => group1.transition(t).call(position, d.parent));
        }
    }
    
    function populateDropdown(yearData) {
        selectedYear = yearData;
        const dropdownContent = document.getElementById('yearDropdown');
        dropdownContent.innerHTML = ''; // Clear existing options

        yearData.forEach(function (option) {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = option;
            checkbox.checked = true;
            checkbox.id = option;
            const label = document.createElement('label');
            label.htmlFor = option;
            label.appendChild(document.createTextNode(option));

            const listItem = document.createElement('li');
            listItem.appendChild(checkbox);
            listItem.appendChild(label);

            checkbox.parentElement.addEventListener('click', function (event) {
                event.stopPropagation();
                selectedYear = [];
                checkbox.checked = !checkbox.checked;
                const checkboxes = document.querySelectorAll(`#yearDropdown input[type="checkbox"]`);
                checkboxes.forEach(function (checkbox) {
                    if (checkbox.checked) selectedYear.push(checkbox.value);
                });
                loadData();
            });
            dropdownContent.appendChild(listItem);
        });
    }
});

document.body.addEventListener('click', function (e) {
    if (e.target !== dropdownButton) dropdownContent.style.display = 'none';
});

function uid(name) {
    return new Id("O-" + (name == null ? "" : name + "-") + ++count);
}

function Id(id) {
    this.id = id;
    this.href = new URL(`#${id}`, location) + "";
}

Id.prototype.toString = function () {
    return "url(" + this.href + ")";
};

function groupBy(data, key) {
    return data.reduce((result, item) => {
        if (!result[item[key]]) {
            result[item[key]] = { name: item[key], children: [] };
        }
        result[item[key]].children.push(item);
        return result;
    }, {});
}

function tile(node, x0, y0, x1, y1) {
    d3.treemapBinary(node, 0, 0, width, height);
    for (const child of node.children) {
        child.x0 = x0 + child.x0 / width * (x1 - x0);
        child.x1 = x0 + child.x1 / width * (x1 - x0);
        child.y0 = y0 + child.y0 / height * (y1 - y0);
        child.y1 = y0 + child.y1 / height * (y1 - y0);
    }
}

function toggleDropdown() {
    if (dropdownContent.style.display === 'block') {
        dropdownContent.style.display = 'none';
    } else {
        dropdownContent.style.display = 'block';
    }
}