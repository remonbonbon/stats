(function() {
  "use strict";
  var color, height, line_cpu, line_diff, line_humi, line_room, line_ssd, margin, parseDate, svg, vm, width, x, xAxis, xAxisFormat, y, y2, y2Axis, yAxis, y_bar;

  vm = new Vue({
    el: '#app',
    data: {
      storage: {},
      reserves: []
    },
    created: function() {
      var _this;
      _this = this;
      $.ajax("storage.json", {
        success: function(json) {
          return _this.$set("storage", json);
        }
      });
      return $.ajax("reserves.json", {
        success: function(json) {
          return _this.$set("reserves", json);
        }
      });
    }
  });

  margin = {
    top: 10,
    right: 50,
    bottom: 20,
    left: 50
  };

  width = $(document.body).width() - margin.left - margin.right;

  height = 400 - margin.top - margin.bottom;

  parseDate = d3.time.format("%Y-%m-%d %H:%M:%S").parse;

  xAxisFormat = d3.time.format("%-m/%-d %-Hh");

  x = d3.time.scale().range([0, width]);

  y = d3.scale.linear().range([height, 0]);

  y2 = d3.scale.linear().range([height, 0]);

  y_bar = d3.scale.linear().range([height, 0]);

  xAxis = d3.svg.axis().scale(x).orient("bottom").tickFormat(xAxisFormat).ticks(10);

  yAxis = d3.svg.axis().scale(y).orient("right").ticks(20);

  y2Axis = d3.svg.axis().scale(y2).orient("left").tickFormat(function(d) {
    return d + '%';
  });

  color = d3.scale.category20c().domain(["cpu", "ssd", "room", null, "diff", "humi"]);

  line_cpu = d3.svg.line().interpolate("monotone").x(function(d) {
    return x(d.time);
  }).y(function(d) {
    return y(d.cpu);
  });

  line_ssd = d3.svg.line().interpolate("basis").x(function(d) {
    return x(d.time);
  }).y(function(d) {
    return y(d.ssd);
  });

  line_room = d3.svg.line().interpolate("basis").x(function(d) {
    return x(d.time);
  }).y(function(d) {
    return y(d.room);
  });

  line_diff = d3.svg.line().interpolate("monotone").x(function(d) {
    return x(d.time);
  }).y(function(d) {
    return y(d.cpu - d.room);
  });

  line_humi = d3.svg.line().interpolate("basis").x(function(d) {
    return x(d.time);
  }).y(function(d) {
    return y2(d.humi);
  });

  svg = d3.select("#graph").append("svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  $.ajax("stats.csv", {
    success: function(data_org) {
      var bar, bar_width, d, i, len;
			var data = [];
			data_org = data_org.split("\n");
      for (i = 0, len = data_org.length; i < len; i++) {
        d = data_org[i].split(",");
				data.push({
					time: parseDate(d[0]),
					hddstate: d[1] === "standby" ? 1 : 0,
					recording: d[2] === "standby" ? 1 : 0,
					cpu: parseFloat(d[3]),
					ssd: parseFloat(d[4]),
					room: parseFloat(d[5]),
					humi: parseFloat(d[6]),
				});
        //d.time = parseDate(d.time);
        //d.hddstate = d.hddstate === "standby" ? 1 : 0;
        //d.recording = d.recording === "standby" ? 1 : 0;
      }
      x.domain(d3.extent(data, function(d) {
        return d.time;
      }));
      y.domain([
        d3.min(data, function(d) {
          return d3.min([d.cpu, d.ssd, d.room, d.cpu - d.room]);
        }) - 0.5, d3.max(data, function(d) {
          return d3.max([d.cpu, d.ssd, d.room, d.cpu - d.room]);
        }) + 0.5
      ]);
      y2.domain([0, 100]);
      y_bar.domain([0, 1]);
      bar_width = x(parseDate("2015-01-01 00:15:00")) - x(parseDate("2015-01-01 00:00:00"));
      bar = svg.selectAll(".bar").data(data);
      bar.enter().append("rect").attr("class", "bar hddstate").attr("x", function(d) {
        return x(d.time);
      }).attr("y", 0).attr("width", bar_width).attr("height", function(d) {
        return y_bar(d.hddstate);
      });
      bar.enter().append("rect").attr("class", "bar recording").attr("x", function(d) {
        return x(d.time);
      }).attr("y", 0).attr("width", bar_width).attr("height", function(d) {
        return y_bar(d.recording);
      });
      svg.append("path").datum(data).attr("class", "line").attr("d", line_cpu).style("stroke", function(d) {
        return color("cpu");
      });
      svg.append("path").datum(data).attr("class", "line").attr("d", line_room).style("stroke", function(d) {
        return color("room");
      });
      svg.append("path").datum(data).attr("class", "line").attr("d", line_diff).style("stroke", function(d) {
        return color("diff");
      });
      svg.append("path").datum(data).attr("class", "line").attr("d", line_humi).style("stroke", function(d) {
        return color("humi");
      });
      svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis);
      svg.append("g").attr("class", "y axis").attr('transform', "translate(" + width + " ,0)").call(yAxis).append("text").attr("transform", "rotate(-90)").attr("y", -12).attr("dy", ".5em").style("text-anchor", "end").text("temp.");
      return svg.append("g").attr("class", "y axis").call(y2Axis).append("text").attr("transform", "rotate(-90)").attr("y", 6).attr("dy", ".71em").style("text-anchor", "end").text("humidity");
    }
  });

}).call(this);
