function commander() {
    return function strategy(world) {
        var me = findMe(world);
        console.log("Наш танк: " + JSON.stringify(me))
    };

    function findMe(world) {
        for (var i = 0; i < world.objects.length; i++) {
            var o = world.objects[i];
            if (o.type == "player" && o.user == "Сержант Билко") // <-- замените на свой позывной
                return o;
        }
    }
}
