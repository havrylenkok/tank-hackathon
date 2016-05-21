function commander() {
    return function strategy(world) {
        var enemy = findEnemy(world);
        console.log("Первый попавшийся враг: " + JSON.stringify(enemy))
    };

    function findEnemy(world) {
        for (var i = 0; i < world.objects.length; i++) {
            var o = world.objects[i];
            if (o.type == "player" && o.user != "Сержант Билко") // <-- замените на свой позывной
                return o;
        }
    }
}
