function commander() {
    var user = "Сержант Билко"; // <-- замените на свой позывной

    return function strategy(world) {
        var me = findMe(world);
        var enemy = findEnemy(world);

        if (me != undefined && enemy != undefined) {
            var gunXy = [
                enemy.xy[0] - me.xy[0],
                enemy.xy[1] - me.xy[1]];

            return {
                "gun-xy": gunXy,
                "fire": true};
        }
    };

    function findMe(world) {
        for (var i = 0; i < world.objects.length; i++) {
            var o = world.objects[i];
            if (o.type == "player" && o.user == user)
                return o;
        }
    }

    function findEnemy(world) {
        for (var i = 0; i < world.objects.length; i++) {
            var o = world.objects[i];
            if (o.type == "player" && o.user != user)
                return o;
        }
    }
}
