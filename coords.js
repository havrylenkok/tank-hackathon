
var getCoords = function () {


// x, y
  var multipliers = [
    [0, 0.25],
    [0, 0.75],
    [0.3, 1],
    [0.6, 1],
    [1, 0.75],
    [1, 0.25],
    [0.6, 0],
    [0.3, 0]
  ];

  var tarCoords = [];

  for (var i = 0; i < 8; i++) {
    tarCoords[i] = [
      world.size[0] * multipliers[i][0],
      world.size[1] * multipliers[i][1]
    ]
  }
return tarCoords;
}
