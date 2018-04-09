/* global Chart */
const CURSOR_DIFF = 5; // [px]

function isChartArea(chartInstance, x, y) {
  if (x < chartInstance.chartArea.left ||
      chartInstance.chartArea.right < x ||
      y < chartInstance.chartArea.top ||
      chartInstance.chartArea.bottom < y) {
    return false;
  }
  return true;
}

var cursorPlugin = {
  beforeInit: function (chartInstance) {
    chartInstance.cursor = {};
    let node = chartInstance.cursor.node = chartInstance.chart.ctx.canvas;
    let ctx = chartInstance.chart.ctx;
    let options = chartInstance.options;
    if (!options.cursor) { return; }

    options.cursor.x_solid = {};
    options.cursor.x_dash = {};
    options.cursor.x_solid.selected = false;
    options.cursor.x_dash.selected = false;

    // console.log('[beforeInit]: ', options.cursor);
    chartInstance.cursor.getSelectedValue = () => {
      if (!options.cursor.enabled) { return []; }
      if (!options.cursor.x_solid || !options.cursor.x_dash) {
        return [];
      }
      /**
       * TODO: x-axis-0は汎用的でないので変更するべき
       */
      let scale_x = chartInstance.scales['x-axis-0'];
      let diff = options.cursor.x_solid.pixel - options.cursor.x_dash.pixel;
      let left, right;
      if (diff < 0) {
        left = options.cursor.x_solid.pixel;
        right = options.cursor.x_dash.pixel;
      } else {
        left = options.cursor.x_dash.pixel;
        right = options.cursor.x_solid.pixel;
      }
      left = scale_x.getValueForPixel(left);
      right = scale_x.getValueForPixel(right);
      return {left:left, right:right};
    };

    chartInstance.cursor.setSelectedValue = (cursor_type, value) => {
      let scale_x = chartInstance.scales['x-axis-0'];
      switch (cursor_type) {
      case 'solid':
        options.cursor.x_solid.pixel = scale_x.getPixelForValue(value);
        break;
      case 'dash':
        options.cursor.x_dash.pixel = scale_x.getPixelForValue(value);
        break;
      }
      chartInstance.update();
    };

    chartInstance.cursor._mouseDownHandler = function (event) {
      if (!options.cursor.enabled) { return; }
      if (!isChartArea(chartInstance, event.offsetX, event.offsetY)) { return; }

      switch (options.cursor.near) {
      case 'solid':
        options.cursor.x_solid.selected = true;
        options.cursor.x_dash.selected = false;
        break;
      case 'dash':
        options.cursor.x_solid.selected = false;
        options.cursor.x_dash.selected = true;
        break;
      default:
        options.cursor.x_solid.selected = false;
        options.cursor.x_dash.selected = false;
        break;
      }
    };
    node.addEventListener('mousedown', chartInstance.cursor._mouseDownHandler);
    
    chartInstance.cursor._mouseOutHandler = function (event) {
      if (!options.cursor.enabled) { return; }
      if (!options.cursor.x_solid.selected && !options.cursor.x_dash.selected) {
        return;
      }
      let line = null;
      if (options.cursor.x_solid.selected) {
        line = options.cursor.x_solid;
      } else if (options.cursor.x_dash.selected) {
        line = options.cursor.x_dash;
      }
      if (!line) { return; }
      if (chartInstance.chartArea.top <  event.offsetY && event.offsetY < chartInstance.chartArea.bottom) {
        if (event.offsetX < chartInstance.chartArea.left) {
          line.pixel = chartInstance.chartArea.left;
        } else {
          line.pixel = chartInstance.chartArea.right;
        }
      }
      options.cursor.x_solid.selected = false;
      options.cursor.x_dash.selected = false;
      chartInstance.update();
    };
    node.addEventListener('mouseout', chartInstance.cursor._mouseOutHandler);

    chartInstance.cursor._mouseUpHandler = function (event) {
      if (!options.cursor.enabled) { return; }
      options.cursor.x_solid.selected = false;
      options.cursor.x_dash.selected = false;
      console.log(chartInstance.cursor.getSelectedValue());
    };
    node.addEventListener('mouseup', chartInstance.cursor._mouseUpHandler);

    chartInstance.cursor._mouseMoveHandler = function (event) {
      if (!options.cursor.enabled) { return; }
      if (!isChartArea(chartInstance, event.offsetX, event.offsetY)) { 
        $(node).css('cursor', 'default');
        options.cursor.near = 'none';
        return; 
      }
      if (!options.cursor.x_solid.pixel || !options.cursor.x_dash.pixel) {
        $(node).css('cursor', 'default');
        options.cursor.near = 'none';
        return; 
      }

      let diff = options.cursor.x_solid.pixel - options.cursor.x_dash.pixel;
      if (0 < Math.abs(diff) && Math.abs(diff) <= (2 * CURSOR_DIFF)) {
        let left, left_name, right, right_name;
        if (diff < 0) {
          left = options.cursor.x_solid.pixel;
          left_name = 'solid';
          right = options.cursor.x_dash.pixel;
          right_name = 'dash';
        } else {
          left = options.cursor.x_dash.pixel;
          left_name = 'dash';
          right = options.cursor.x_solid.pixel;
          right_name = 'solid';
        }

        diff = Math.abs(diff) / 2;
        if ((left-CURSOR_DIFF) < event.offsetX && event.offsetX <= (left+diff)) {
          options.cursor.near = left_name;
        } else if ((right-diff) < event.offsetX && event.offsetX < (right+CURSOR_DIFF)) {
          options.cursor.near = right_name;
        } else {
          options.cursor.near = 'none';
        }

      } else {
        if ((options.cursor.x_solid.pixel - CURSOR_DIFF) <= event.offsetX && event.offsetX <= (options.cursor.x_solid.pixel + CURSOR_DIFF)) {
          options.cursor.near = 'solid';
        } else if ((options.cursor.x_dash.pixel - CURSOR_DIFF) <= event.offsetX && event.offsetX <= (options.cursor.x_dash.pixel + CURSOR_DIFF)) {
          options.cursor.near = 'dash';
        } else {
          options.cursor.near = 'none';
        }
      }

      switch (options.cursor.near) {
      case 'solid':
      case 'dash':
        $(node).css('cursor', 'col-resize');
        break;
      default:
        $(node).css('cursor', 'default');
        break;
      }

      if (options.cursor.x_solid.selected) {
        options.cursor.x_solid.pixel = event.offsetX;
      } else if (options.cursor.x_dash.selected) {
        options.cursor.x_dash.pixel = event.offsetX;
      }

      chartInstance.update();
    };
    node.addEventListener('mousemove', chartInstance.cursor._mouseMoveHandler);
  }, // end of beforeInit 
  afterDraw: function (chartInstance) {
    let options = chartInstance.options;
    if (!options.cursor.enabled) { return; }

    // 一番最初に端っこに描画する
    if (!options.cursor.x_solid.pixel || !options.cursor.x_dash.pixel) {
      options.cursor.x_solid.pixel = chartInstance.chartArea.right;
      options.cursor.x_dash.pixel = chartInstance.chartArea.left;
    }

    if (!options.cursor.display) { return; }
    let ctx = chartInstance.chart.ctx;
    if (options.cursor.x_dash.pixel < options.cursor.x_solid.pixel) {
      if (options.cursor.x_dash.pixel < chartInstance.chartArea.left) {
        options.cursor.x_dash.pixel = chartInstance.chartArea.left;
      } 
      if (options.cursor.x_solid.pixel > chartInstance.chartArea.right) {
        options.cursor.x_solid.pixel = chartInstance.chartArea.right;  
      }
    } else if (options.cursor.x_dash.pixel > options.cursor.x_solid.pixel) {
      if (options.cursor.x_solid.pixel < chartInstance.chartArea.left) {
        options.cursor.x_solid.pixel = chartInstance.chartArea.left;
      } 
      if (options.cursor.x_dash.pixel > chartInstance.chartArea.right) {
        options.cursor.x_dash.pixel = chartInstance.chartArea.right;  
      }
    }
    if (options.cursor.x_dash.pixel) {
      ctx.beginPath();
      ctx.setLineDash([5, 10]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(0, 0, 0, 1.0)';
      ctx.moveTo(options.cursor.x_dash.pixel, chartInstance.chartArea.top);
      ctx.lineTo(options.cursor.x_dash.pixel, chartInstance.chartArea.bottom);
      ctx.stroke();
    }
    if (options.cursor.x_solid.pixel) {
      ctx.beginPath();
      ctx.setLineDash([]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(0, 0, 0, 1.0)';
      ctx.moveTo(options.cursor.x_solid.pixel, chartInstance.chartArea.top);
      ctx.lineTo(options.cursor.x_solid.pixel, chartInstance.chartArea.bottom);
      ctx.stroke();
    }
  }, // end of afterDraw
  destroy: function (chartInstance) {
    console.log('[destroy]:');
  }
};
Chart.pluginService.register(cursorPlugin);

