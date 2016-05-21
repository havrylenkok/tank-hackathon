function commander() {
  return function strategy(world) {
    var k = [[0,-1], [1,-1],[1,-1], [1,0], [1,1],[0,1], [-1,1],[-1,0], [-1,1], [-1,0], [-1,-1]];
    var me = findMe(world)

    var enemy = findEnemy(world);
    var gunXy = [
      enemy.xy[0] - me.xy[0],
      enemy.xy[1] - me.xy[1]];
    console.log(findBonus(world))
    var input = {
      "move-xy": [rand(-1,1), rand(-1,1)],
      "gun-xy": gunXy,
      "fire":true
    };
    function findMe(world) {
      for (var i = 0; i < world.objects.length; i++) {
        var o = world.objects[i];
        if (o.type == "player" && o.user == "sleepybear") // <—
        // замените на
        // свой позывной
          return o;
      }
    }
    function findEnemy(world) {
      var me;

      for (var i = 0; i < world.objects.length; i++) {
        var o = world.objects[i];
        if (o.type === "player" && o.user === "sleepybear") {
          me = o;
          break;
        }
      }

      var offset = 100;
      for (var i = 0; i < world.objects.length; i++) {
        var o = world.objects[i];
        if (o.type == "player" && o.user !== "sleepybear" && o.user !== "sleepybearx") // <—
        // замените на
        // свой
        // позывной
          if (o.xy[0] <= me.xy[0] + offset && o.xy[0] >= me.xy[0] - offset && o.xy[1] <= me.xy[1] + offset && o.xy[1] >= me.xy[1] - offset)
            return o;
      }
      for (var i = 0; i < world.objects.length; i++) {
        var o = world.objects[rand(0, world.objects.length)];
        if (o.type == "player" && o.user !== "sleepybear" && o.user !== "sleepybearx") // <— замените на
        // свой
        // позывной
          return o;
      }
    }

    function rand( min, max ) { // Generate a random integer
      if( max ) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      } else {
        return Math.floor(Math.random() * (min + 1));
      }
    }

    function findBonus(world) {
      for (var i = 0; i < world.objects.length; i++) {
        var o = world.objects[i];
        if (o.type == "bonus") // <— замените на свой позывной
          return o;
      }
    }
    return input;
  }
}
