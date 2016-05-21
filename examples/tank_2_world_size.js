function commander() {
    return function strategy(world) {
        var width  = world.size[0]
        var height = world.size[1]
        console.log("Размер полигона: " + width + "x" + height);
    }
}
