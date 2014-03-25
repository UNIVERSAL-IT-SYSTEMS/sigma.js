/**
 * This plugin provides a method to drag & drop nodes. Check the
 * sigma.plugins.dragNodes function doc or the examples/basic.html &
 * examples/api-candy.html code samples to know more.
 */
(function() {
  'use strict';

  if (typeof sigma === 'undefined')
    throw 'sigma is not declared';

  sigma.utils.pkg('sigma.plugins');

  /**
   * This function will add `mousedown`, `mouseup` & `mousemove` events to the
   * nodes in the `overNode`event to perform drag & drop operations. It uses
   * `linear interpolation` [http://en.wikipedia.org/wiki/Linear_interpolation]
   * and `rotation matrix` [http://en.wikipedia.org/wiki/Rotation_matrix] to
   * calculate the X and Y coordinates from the `cam` or `renderer` node
   * attributes. These attributes represent the coordinates of the nodes in
   * the real container, not in canvas.
   *
   * Recognized parameters:
   * **********************
   * @param  {sigma}    s         The related sigma instance.
   * @param  {renderer} renderer  The related renderer instance.
   * @param  {string}   realCoors The identifier of the real coordinates of the
   *                              node in the container.
   *                              Example for `WebGL`: 'cam0'
   *                              Example for `Canvas`: 'renderer1'
   *                              You can see these attributes on a JavaScript
   *                              debugger or console as part of the nodes.
   */
  sigma.plugins.dragNodes = function(s, renderer, realCoors) {

    var _container = renderer.container,
        _mouse = _container.lastChild,
        _body = document.body,
        _camera = renderer.camera,
        _node = null,
        _isOverNode = false,
        _isMouseOverCanvas = false,
        _realCoors = realCoors;

    var nodeMouseOver = function(event) {
      if (!_isOverNode) {
        _node = event.data.node;
        _mouse.addEventListener('mousedown', nodeMouseDown);
        _isOverNode = true;
      }
    };

    var treatOutNode = function(event) {
      if (_isOverNode) {
        _mouse.removeEventListener('mousedown', nodeMouseDown);
        _isOverNode = false;
      }
    };

    var nodeMouseDown = function(event) {
      var size = s.graph.nodes().length;
      if (size > 1) {
        _mouse.removeEventListener('mousedown', nodeMouseDown);
        _body.addEventListener('mousemove', nodeMouseMove);
        _body.addEventListener('mouseup', nodeMouseUp);

        renderer.unbind('outNode', treatOutNode);

        // Deactivate drag graph.
        renderer.settings({mouseEnabled: false, enableHovering: false});
        s.refresh();
      }
    };

    var nodeMouseUp = function(event) {
      _mouse.addEventListener('mousedown', nodeMouseDown);
      _body.removeEventListener('mousemove', nodeMouseMove);
      _body.removeEventListener('mouseup', nodeMouseUp);

      treatOutNode();
      renderer.bind('outNode', treatOutNode);

      // Activate drag graph.
      renderer.settings({mouseEnabled: true, enableHovering: true});
      s.refresh();
    };

    var nodeMouseMove = function(event) {
      var x = event.pageX - _container.offsetLeft,
          y = event.pageY - _container.offsetTop,
          cos = Math.cos(_camera.angle),
          sin = Math.sin(_camera.angle),
          nodes = s.graph.nodes(),
          ref = [];

      // Getting and derotating the reference coordinates.
      for (var i = 0; i < 2; i++) {
        var n = nodes[i];
        var aux = {
          x: n.x * cos + n.y * sin,
          y: n.y * cos - n.x * sin,
          renX: n[_realCoors + ':x'],
          renY: n[_realCoors + ':y'],
        };
        ref.push(aux);
      }

      // Applying linear interpolation.
      x = ((x - ref[0].renX) / (ref[1].renX - ref[0].renX)) *
        (ref[1].x - ref[0].x) + ref[0].x;
      y = ((y - ref[0].renY) / (ref[1].renY - ref[0].renY)) *
        (ref[1].y - ref[0].y) + ref[0].y;

      // Rotating the coordinates.
      _node.x = x * cos - y * sin;;
      _node.y = y * cos + x * sin;;

      s.refresh();
    };

    renderer.bind('overNode', nodeMouseOver);
    renderer.bind('outNode', treatOutNode);
  };

}).call(window);
