// document.addEventListener('DOMContentLoaded', function () {
var healthBarConst = 1.3;
var tank = [];
var turret = [];
var currentHealth = [];
var tankBody = [];
var shells = [];
var w, h;
var tickQueue = [];
var size = [1920, 1080];
var ratio = 1.6;
host = window.wsHost || window.document.location.host.replace(/\d\d\d+$/, function (n) {
      return ++n;
    });

var ws = new WebSocket('ws://' + host);
var socket = wrapWebsocketConnection(ws, {
  debug: false
});

socket.on('open', function () {
  socket.emit("Authorize", {
    "mode": "spectator",
    "user": "spectator",
    "pass": "spectator"
  });
});

socket.on('error', function (err) {
  console.log("error.. ", err);
});
socket.on('close', function () {
  console.log("closed");
  document.body.innerHTML = "reconnecting...";
  setTimeout(function(){
    location.reload();
  },5000);
});

var renderer = '';
var header = document.querySelector('.battlefield');
var currentTableBody = $('.current-table').find('tbody');

var newTick;
var nextTick;

function initDrawingAndStuff() {
  function draw() {
    var howMuchTimePassedSinceNewTick = Date.now() - tickAppearTime;
    var perc = howMuchTimePassedSinceNewTick / 100;

    if (newTick && nextTick)
      update(perc);

    setTimeout(draw, 50);
  }

  setTimeout(draw, 0);

  var waitingForQueue = true;
  var tickAppearTime;

  var bestQueueLength = 8;
  var goToNextTick = function() {
    // in case something will go wrong and we'll get tons of frames
    while (tickQueue.length > 20)
      tickQueue.shift();

    setTimeout(goToNextTick, diffBetweenTicks);
    if (waitingForQueue && tickQueue.length < bestQueueLength) {
      return;
    }
    waitingForQueue = false;

    if (tickQueue.length > bestQueueLength)
      diffBetweenTicks-=0.2;
    else
      diffBetweenTicks+=0.2;

    if (tickQueue.length < 3) {
      console.log("shit!");
    }
    else {
      tickAppearTime = Date.now();
      newTick = tickQueue.shift().objects;
      nextTick = tickQueue[0];
    }
  };
  setTimeout(goToNextTick, diffBetweenTicks);
}

var mapWidth, mapHeight;
var neverBefore = true;
socket.on("Map", function (x) {
  if(neverBefore) {
    neverBefore = false;

    initDrawingAndStuff();
  }
  // tick = x.tick;
  //newTick = x.objects;
  //newTick.timestamp = new Date().getTime();
  if (renderer === '') {
    mapWidth = x.size[0];
    mapHeight = x.size[1];
    size = [mapWidth, mapHeight];
    ratio = size[0] / size[1];
    windowSizeCalculating();

    drawSidebarTable(x['all-participants']);

    //noinspection JSUnresolvedVariable
    renderer = PIXI.autoDetectRenderer(x.size[0], x.size[1], {
      backgroundColor: 0xffffff,
      // antialias: true,
      resolution: window.devicePixelRatio || 1,
      // autoResize: true
    });
    header.appendChild(renderer.view);
    renderer.view.style.width = w + 'px';
    renderer.view.style.height = h + 'px';
    //animate();
  }
  //tickQueue[tickQueue.length] = x['objects'];
  tickQueue.push(x)
});

function numberOr(x, defaultValue) {
  return isNaN(x) ? (defaultValue || "-") : x;
}

setInterval(function() {
  if(tickQueue.length > 0) {
    for(var objct in  newTick)  if (newTick.hasOwnProperty(objct)) {
      var obj = newTick[objct];
      var user = newTick[objct].user;
      if(obj.type == 'player'){
        var status = obj["health"] > 0 ? obj["health"] : '✟';
        var userColor;
        if(tank[user] && tank[user].hasOwnProperty('color') ){
          userColor = tank[user]['color'];
        }
        else {
          userColor = '000';
        }

        var ping = numberOr((nextTick.tick-1) - obj["client-tick"], '-');

        $('#nameOf'+user).css('color', '#'+userColor);
        $('#hpOf'+user).text(status);
        $('#pointsOf'+user).text('-');
        $('#pingOf'+user).text(ping);
      }
    }
  }
}, 300);

String.prototype.hashCode = function () {
  var hash = 0,
      i, chr, len;
  if (this.length === 0) return hash;
  for (i = 0, len = this.length; i < len; i++) {
    chr = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};
var tankBodyColors = [
  "1abc9c",
  "2ecc71",
  "3498db",
  "9b59b6",
  "16a085",
  "27ae60",
  "2980b9",
  "8e44ad",
  "f1c40f",
  "e67e22",
  "e74c3c",
  "bdc3c7",
  "f39c12"
];
// create the root of the scene graph
var stage = new PIXI.Container();

var drawTank = function (x, y, tankSize, turretRotation, tankRotation, health, maxHealth, id, userName) {
  //creating container for position elements in it
  var tankContainer = new PIXI.Container();
  //рисуем танк
  var tankDrawBody = new PIXI.Graphics();
  // Тело танка
  var tankColorNum = (userName.hashCode() % tankBodyColors.length) < 0 ? -userName.hashCode() % tankBodyColors.length : userName.hashCode() % tankBodyColors.length;
  var tankColor = tankBodyColors[tankColorNum];

  //noinspection JSCheckFunctionSignatures
  tankDrawBody.beginFill('0x' + tankColor, 1);
  tankDrawBody.drawRoundedRect(-tankSize / 2, (tankSize / 11) - tankSize / 2, tankSize, tankSize - (tankSize / 8), tankSize / 10);
  tankDrawBody.endFill();
  //гусеница
  tankDrawBody.beginFill(0x2c3e50, 1);
  tankDrawBody.drawRoundedRect(-tankSize / 2, -tankSize / 2, tankSize / 4.5, tankSize, tankSize / 10);
  tankDrawBody.endFill();
  //гусеница
  tankDrawBody.beginFill(0x2c3e50, 1);
  tankDrawBody.drawRoundedRect(tankSize / 2 - tankSize / 4.5, -tankSize / 2, tankSize / 4.5, tankSize, tankSize / 10);
  tankDrawBody.endFill();
  tankDrawBody.rotation = tankRotation;
  //турель

  var tankDrawTurret = new PIXI.Graphics();
  //noinspection JSCheckFunctionSignatures
  tankDrawTurret.lineStyle(0);
  tankDrawTurret.beginFill(0x333333, 1);
  tankDrawTurret.drawCircle(0, 0, tankSize / 4);
  tankDrawTurret.endFill();

  //noinspection JSCheckFunctionSignatures
  tankDrawTurret.lineStyle(0);
  tankDrawTurret.beginFill(0x5C5C5C, 1);
  tankDrawTurret.drawCircle(0, 0, tankSize / 6);
  tankDrawTurret.endFill();

  //дуло турели
  tankDrawTurret.beginFill(0x5C5C5C, 1);
  tankDrawTurret.drawRoundedRect(-tankSize / 20, 0, tankSize / 10, -tankSize / 1.5, -tankSize / 10);
  tankDrawTurret.rotation = turretRotation;
  tankDrawTurret.endFill();

  //noinspection JSCheckFunctionSignatures
  tankDrawTurret.lineStyle(0);
  tankDrawTurret.beginFill(0x8C8C8C, 1);
  tankDrawTurret.drawCircle(0, 0, tankSize / 8);
  tankDrawTurret.endFill();

  //TODO: align name by tank center
  var style = {
    font: ' 15px Noto Sans, sans-serif',
    fill: '#000000',
    align: 'center',
    // stroke: '#ffffff',
    // strokeThickness: 1,
    // dropShadow: true,
    // dropShadowColor: '#ffffff',
    // dropShadowAngle: Math.PI,
    // dropShadowDistance: 1,
    // wordWrap: true,
    // wordWrapWidth: tankSize*2
  };

  var userTankName = new PIXI.Text(userName, style);
  var userTankNameWidth = userTankName.width;
  userTankName.x = -userTankNameWidth/2;
  userTankName.y = tankSize + 5;

  var healthBarContainer = new PIXI.Container();

  var healthBar = new PIXI.Graphics();
  healthBar.lineStyle(1, 0xe74c3c, 1);
  healthBar.beginFill(0xfffff, 0);
  healthBar.drawRect(0, 0, tankSize * healthBarConst, 5);
  healthBar.endFill();

  var currentHealthBar = new PIXI.Graphics();
  currentHealthBar.lineStyle(1, 0xe74c3c, 1);
  currentHealthBar.beginFill(0xe74c3c, 1);
  currentHealthBar.drawRect(0, 0, tankSize * healthBarConst * (health / maxHealth), 5);
  currentHealthBar.endFill();

  currentHealth[userName] = currentHealthBar;

  healthBarContainer.addChild(healthBar);
  healthBarContainer.addChild(currentHealth[userName]);
  healthBarContainer.x = -tankSize * 1.2 / 2;
  healthBarContainer.y = tankSize * 0.87;

  tankBody[userName] = tankDrawBody;
  // tankBody[userName].rotation = tankRotation
  // tankContainer.addChild(currentHealth);
  tankContainer.addChild(healthBarContainer);
  tankContainer.addChild(tankBody[userName]);
  tankContainer.addChild(tankDrawTurret);

  tankContainer.addChild(userTankName);
  // tankContainer.addChild(currentHealth[userName]);

  tankContainer.x = x;
  tankContainer.y = y;
  // turret
  turret[userName] = tankDrawTurret;
  turret[userName].position.x = x;
  turret[userName].position.y = y;
  turret[userName].rotation = turretRotation; //in radians
  turret[userName].zIndex = 9;

  tank[userName] = tankContainer;
  tank[userName].zIndex = 10;
  tank[userName].color = tankColor;
  stage.addChild(tank[userName]);
  stage.addChild(turret[userName]);
};

// drawTank(0, 0, 100, 1, 1, 800, 400, '1', 'user');
PIXI.loader
    .add("js/explosion.json")
    .load(onBangAssetsLoaded);
var bang;
var bangs = [];
function onBangAssetsLoaded()
{
  // create an array of textures from an image path
  var frames = [];

  for (var i = 0; i < 23; i++) {
    var val = i < 10 ? '0' + i : i;
    // magically works since the spritesheet was loaded with the pixi loader
    frames.push(PIXI.Texture.fromFrame(val + '.png'));
  }
  // create a MovieClip (brings back memories from the days of Flash, right ?)
  bang = new PIXI.extras.MovieClip(frames);
  // bang.position.set(300);
  bang.animationSpeed = 1;
  bang.play();

}

PIXI.loader
    .add("js/heal.json")
    .load(onHealAssetsLoaded);

var healstatus = [];
var healClip;
function onHealAssetsLoaded()
{
  // create an array of textures from an image path
  var frames = [];

  for (var i = 1; i < 15; i++) {
    var val = i < 10 ? '0' + i : i;
    // magically works since the spritesheet was loaded with the pixi loader
    frames.push(PIXI.Texture.fromFrame('heal'+ val + '.png'));
  }
  // create a MovieClip (brings back memories from the days of Flash, right ?)
  healClip = new PIXI.extras.MovieClip(frames);
  healClip.width = 50;
  healClip.height = 50;
  healClip.animationSpeed = 0.5;
  healClip.play();
  healClip.x = 200;
  healClip.y = 200;
  // stage.addChild(healClip);
}

var bonus = [];
var repairBonusTexture = new PIXI.Texture.fromImage('img/repair.png');
var damageBonusTexture = new PIXI.Texture.fromImage('img/damage.ico');

var drawBonus = function (x, y, radius, type, id){
  var bonusGraphic;
  if(type == 'heal') {
    bonusGraphic = new PIXI.Sprite(repairBonusTexture);
  }
  else {
    bonusGraphic = new PIXI.Sprite(damageBonusTexture);
  }

  bonusGraphic.zIndex = 12;
  bonusGraphic.width = radius * 1.1;
  bonusGraphic.height = radius * 1.1;

  bonus[id] = bonusGraphic;
  bonus[id].x = x - radius/2;
  bonus[id].y = y - radius/2;
  bonus[id].stageId = stage.children.length;
  stage.addChild(bonus[id]);
};
// drawBonus(0, 0, 120, 'heal', 'ids');

var shell;
var shellTexture = PIXI.Texture.fromImage('img/bullet.png');

var drawShell = function (x, y, radius, rotationAngle, id) {
  var shellGraphic = new PIXI.Sprite(shellTexture);
  // shellGraphic.lineStyle(0.5);
  // shellGraphic.beginFill(0xe74c3c, 1);
  // shellGraphic.drawCircle(0, 0, radius);
  // shellGraphic.endFill();
  shellGraphic.width = radius;
  shellGraphic.height = radius;
  shellGraphic.zIndex = 11;
//noinspection JSCheckFunctionSignatures
  // shell = new PIXI.Sprite(shellTexture);
  shell = shellGraphic;
  // var shellContainer = new PIXI.Container();
  // shellContainer.addChild(shell);
  // shellContainer.radius = radius;

  // TODO: add some cool effects like blur and particicles
  shells[id] = shell;
  shells[id].x = x - radius / 2;
  shells[id].y = y - radius / 2;

  shells[id].stageId = stage.children.length;
  stage.addChild(shells[id]);
};

// drawShell(0, 0, 100, 0, 'etalon');
// var bangContainer = new PIXI.Container();

//noinspection JSCheckFunctionSignatures
// var bangEmitter = new PIXI.particles.Emitter(
//     bangContainer,
//     [PIXI.Texture.fromImage('img/particle.png')],
//     {
//       "alpha": {
//         "start": 0.26,
//         "end": 0.59
//       },
//       "scale": {
//         "start": 0.1,
//         "end": 1.1,
//         "minimumScaleMultiplier": 0.85
//       },
//       "color": {
//         "start": "#ff0808",
//         "end": "#ffb13d"
//       },
//       "speed": {
//         "start": 50,
//         "end": 0
//       },
//       "acceleration": {
//         "x": 0,
//         "y": 0
//       },
//       "startRotation": {
//         "min": 0,
//         "max": 360
//       },
//       "rotationSpeed": {
//         "min": 2,
//         "max": 0
//       },
//       "lifetime": {
//         "min": 0.2,
//         "max": 0.8
//       },
//       "blendMode": "color",
//       "frequency": 0.009,
//       "emitterLifetime": 0.5,
//       "maxParticles": 500,
//       "pos": {
//         "x": 0,
//         "y": 0
//       },
//       "addAtBack": false,
//       "spawnType": "rect",
//       "spawnRect": {
//         "x": 0,
//         "y": 0,
//         "w": 0,
//         "h": 0
//       }
//     }
// );
// stage.addChild(bangContainer);


function v(x,y) { return [x,y];}
function vlen(a) { a = a["xy"] ? a["xy"]:a; return Math.sqrt(a[0]*a[0]+ a[1]*a[1])}
function dist(a, b) { return (vlen(sub(a,b))); }
function sub(a,b) { a = a["xy"] ? a["xy"]:a; b = b["xy"] ? b["xy"]: b; return add(a, inv(b))}
function add(a,b) { a = a["xy"] ? a["xy"]:a; b = b["xy"] ? b["xy"]: b; return v(a[0] + b[0], a[1] + b[1])}
//function inplaceAdd(a,b) { a = a["xy"] ? a["xy"]:a; b = b["xy"] ? b["xy"]: b; a[0] += b[0];a[1] += b[1]}
//function inplaceSet(a,b) { a = a["xy"] ? a["xy"]:a; b = b["xy"] ? b["xy"]: b; a[0] = b[0];a[1] = b[1]}
function inv(a) { a = a["xy"] ? a["xy"]:a; return v(-a[0], -a[1])}
function mul(a,k) { a = a["xy"] ? a["xy"]:a; return a ? v(a[0]*k,a[1]*k): v(0,0)}
function norm(a) { a = a["xy"] ? a["xy"]:a; return mul(a, 1/(vlen(a) || 1));}
function deg(rad) { return rad * (180 / Math.PI) }
function rad(deg) { return deg / (180 * Math.PI) }
function angle(a) { if (a["xy"]) a = a["xy"]; return deg(Math.atan2(a[0], a[1])); }
function vecFromRad(a) { return v(Math.cos(a), Math.sin(a)); }

function findObjectInTick(t, oldobj) {
  var Nobjs = t.objects;
  for (var i = 0; i < Nobjs.length; i++) {
    var No = Nobjs[i];
    if (oldobj.type=="player") {
      if (oldobj.user == No.user && No.type == "player")
        return No;
    }
    else
    if (oldobj.id == No.id)
      return No;
  }
  return undefined;
}

function removeObjectFromVis(obj) {
  if (obj.type == "shell") {
    stage.removeChild(shells[obj.id]);
    delete shells[obj.id];
  }
  else if (obj.type == "player") {
    var tankUserName = obj.user;
    bangs[tankUserName] = bang;
    bangs[tankUserName].x = tank[tankUserName].x - tank[tankUserName].width/2;
    bangs[tankUserName].y = tank[tankUserName].y - tank[tankUserName].height/2;
    bangs[tankUserName].width = tank[tankUserName].width;
    //noinspection JSSuspiciousNameCombination
    bangs[tankUserName].height = tank[tankUserName].width;
    stage.addChild(bangs[tankUserName]);
    setTimeout(function(){
      stage.removeChild(bangs[tankUserName]);
    }, 400);

    stage.removeChild(tank[tankUserName]);
    stage.removeChild(turret[tankUserName]);
    delete tank[tankUserName];
    delete turret[tankUserName];

  }
  else if (obj.type == "bonus") {
    stage.removeChild(bonus[obj.id]);
    delete bonus[obj.id];
  }
}

var startMessageContainer = '' ,startText = '';
function update(perc) {
  if(startMessageContainer === ''){
    startMessageContainer = new PIXI.Container();
    var startMessageBG = new PIXI.Graphics();
    startMessageBG.lineStyle(1, 0x000, 1);
    startMessageBG.beginFill(0x7f8c8d, 0.5);
    startMessageBG.drawRect(0, 0, mapWidth, mapHeight);
    startMessageBG.endFill();

    var fontStyle = 'bold italic '+ mapHeight / 10 +'px Noto Sans, sans-serif';
    var style = {
      font : fontStyle,
      fill : '#ffffff',
      stroke : '#4a1850',
      align: 'center',
      strokeThickness : 5,
      dropShadow : true,
      dropShadowColor : '#000000',
      dropShadowAngle : Math.PI / 6,
      dropShadowDistance : 6
    };

    startText = new PIXI.Text('START!',style);
    //noinspection JSPrimitiveTypeWrapperUsage
    startText.x = mapWidth/2 - startText.width/2;//noinspection JSPrimitiveTypeWrapperUsage
    startText.y = mapHeight/2 - startText.height;

    startMessageContainer.addChild(startMessageBG);
    startMessageContainer.addChild(startText);//noinspection JSPrimitiveTypeWrapperUsage
    startMessageContainer.x = 0;//noinspection JSPrimitiveTypeWrapperUsage
    startMessageContainer.y = 0;//noinspection JSPrimitiveTypeWrapperUsage
    startMessageContainer.zIndex = 1;//noinspection JSPrimitiveTypeWrapperUsage
    stage.addChild(startMessageContainer)
  }
  else {
    if(nextTick.tick < 0) {
      startMessageContainer.visible = 1;
      var startMessage = ~~(nextTick.tick/10) !== 0 ? '      ' + -~~(nextTick.tick/10):  'START!';
      startText.text = startMessage;
    } else {
      startMessageContainer.visible = 0;
    }
  }

  //сортируем обьекты по индексу
  stage.children.sort(function(a,b) {
    a.zIndex = a.zIndex || 0;
    b.zIndex = b.zIndex || 0;
    return b.zIndex - a.zIndex
  });


  $("#thetick").html(nextTick.tick);
  {
    // addSomeNewObjects
    for (var i = 0; i< newTick.length; i++) {
      var o = newTick[i];
      if (o.type == "shell") {
        if (!shells[o.id]) {
          // console.log("newshell: ", o);
          // add shell
          drawShell(
              o['xy'][0], o['xy'][1],
              o['body-radius'] * 2,
              getMoveRotation(o),
              o['id']
          );

        }
      }
      else if (o.type == "player") {
        if (!tank[o.user]) {
          // console.log("newtank: ", o);
          // add tank
          drawTank(o['xy'][0], o['xy'][1],
              o['body-radius'] * 2,
              getTurretRotation(o),
              getMoveRotation(o),
              o['health'],
              o['health-max'],
              o['id'],
              o['user']
          );
        }
      }
      else if (o.type == "bonus") {
        if (!bonus[o.id]) {
          drawBonus(o['xy'][0], o['xy'][1],
              o['body-radius'] * 2,
              o['bonus'],
              o['id']
          );
        }
      }
    }

    for (var object in newTick)  if (newTick.hasOwnProperty(object)) {
      var obj = newTick[object];
      var Nobj = findObjectInTick(nextTick, obj);
      if (Nobj == undefined) {
        removeObjectFromVis(obj);
      }
      else {
        var user = obj.user;
        var id = obj.id;
        var posdiff = sub(Nobj, obj); //sub(obj, Nobj);
        if (obj.type === 'player') {
          var usertank = tank[user];
          var realdiff = add(obj,mul(posdiff, perc));
          usertank.x = turret[user].x = realdiff[0];
          usertank.y = turret[user].y = realdiff[1];
          //console.log("tankpos", user, realdiff);

          tankBody[user].rotation = getRotation(obj["move-xy"]);
          turret[user].rotation = getRotation(obj["gun-xy"]);

          var currentHealthWidth = obj['body-radius'] * 2 * healthBarConst * (obj['health'] / obj['health-max']);
          currentHealth[user].width = currentHealthWidth;

          if(obj.hasOwnProperty('bonus-info')) {
            //   if(obj['bonus-info'] == 'heal') {
            //     console.log('healed')
            //     stage.addChild(heal[user]);
            //     // setTimeout(function(){
            //     //   stage.removeChild(heal[user]);
            //     // }, 400);
            //   }
          }

        } else if (obj.type === 'shell') {
          realdiff = add(obj,mul(posdiff, perc));

          shells[id].x = realdiff[0];
          shells[id].y = realdiff[1];
        }
      }
    }

  }
  // var startRender = new Date;
  renderer.render(stage);
  // var renderTime = new Date() - startRender;
  // if( renderTime > 40 ){
  // console.log(renderer)
  // }

}

function getMoveRotation(object) {
  if (!object['move-xy']) {
    object['move-xy'] = {};
  }
  return getAngleFromXY(object['move-xy'][0], object['move-xy'][1]);
}

function getTurretRotation(tankObject) {
  if (!tankObject['gun-xy']) {
    tankObject['gun-xy'] = {};
  }
  return getAngleFromXY(tankObject['gun-xy'][0], tankObject['gun-xy'][1]);
}

function getRotation(o) {
  if (!o) {
    o = [1,0];
  }
  return getAngleFromXY(o[0], o[1]);
}

function getAngleFromXY(x, y) {
  //return Math.atan2(y, x);
  var angle = Math.atan(y / x);
  if ((x >= 0 && y >= 0) || (x > 0 && y < 0)) {
    angle += Math.PI / 2; // ????
  } else if (x < 0) {
    angle -= Math.PI / 2;
  }
  return angle;
}

function showTankOnMap(user) {
  for(var t in tank) if (tank.hasOwnProperty(t)) {
    tank[t].filters = '';
  }
  var dropHighlightShadowFilter = new PIXI.filters.DropShadowFilter();
  dropHighlightShadowFilter.color = 0xfff;
  dropHighlightShadowFilter.angle = 0;
  dropHighlightShadowFilter.alpha = 1;
  dropHighlightShadowFilter.blur = 15;
  dropHighlightShadowFilter.distance = 0;
  tank[user].filters = [dropHighlightShadowFilter];
}
var mainBlock = $('main');
function resize() {
  windowSizeCalculating();
  renderer.view.style.width = w + 'px';
  renderer.view.style.height = h + 'px';
}

function windowSizeCalculating(){
  if (window.innerWidth / window.innerHeight >= ratio) {
    if(mainBlock.height() > window.innerHeight){
      // console.log('vot')
      w = window.innerHeight * ratio;
      h = window.innerHeight;
    }else{
      w = mainBlock.width();
      h = mainBlock.width() / ratio;
    }
  } else {
    w = mainBlock.width();
    h = mainBlock.width() / ratio;
    // console.log('<', ratio)
  }
}

window.onresize = resize;
renderer.onload= resize;

document.addEventListener('visibilitychange', function(){
  setTimeout(function () {
    for (var i = stage.children.length - 1; i >= 0; i--) {
      if (stage.children[i].hasOwnProperty('stageId')) {
        stage.removeChild(stage.children[i]);
      }
    };


    // for (var o in stage.children) {
    //   if (stage.children.hasOwnProperty(o)) {
    //     var objct = stage.children[o];
    //     if (objct.hasOwnProperty('stageId')) {
    //       length = stage.children.length;
    //       objct.visible = false;
    //       objct.width = 0;
    //       stage.removeChild(objct);
    //       delete objct;
    //       if (stage.children.length == length)
    //         console.log(objct)
    //     }
    //
    //   }
    // }
  }, 25);

});

function drawSidebarTable(participants){
  for(var i = 0; i < participants.length; i++) {
    var participant = participants[i];
    var rowNum = i + 1;
    currentTableBody.append(
        '<tr style="cursor: pointer;" onclick="showTankOnMap(\''+ participant +'\')" class="userNameTD">' +
        '<td>' + (rowNum) + '</td>' +
        '<td id="nameOf'+participant+'">'+participant+'</td>' +
        '<td id="hpOf'+participant+'">✟</td>' +
        '<td id="pointsOf'+participant+'">-</td>' +
        '<td id="pingOf'+participant+'">0</td>' +
        '</tr>'
    );
  }
}
var diffBetweenTicks = 100;

function initDrawingAndStuff() {
  function draw() {
    var howMuchTimePassedSinceNewTick = Date.now() - tickAppearTime;
    var perc = howMuchTimePassedSinceNewTick / 100;

    if (newTick && nextTick)
      update(perc);

    setTimeout(draw, 50);
  }

  setTimeout(draw, 0);

  var waitingForQueue = true;
  var tickAppearTime;

  var bestQueueLength = 8;
  var goToNextTick = function() {
    // in case something will go wrong and we'll get tons of frames
    while (tickQueue.length > 20)
      tickQueue.shift();

    setTimeout(goToNextTick, diffBetweenTicks);
    if (waitingForQueue && tickQueue.length < bestQueueLength) {
      return;
    }
    waitingForQueue = false;

    if (tickQueue.length > bestQueueLength)
      diffBetweenTicks-=0.2;
    else
      diffBetweenTicks+=0.2;

    if (tickQueue.length < 3) {
      console.log("shit!");
    }
    else {
      tickAppearTime = Date.now();
      newTick = tickQueue.shift().objects;
      nextTick = tickQueue[0];
    }
  };
  setTimeout(goToNextTick, diffBetweenTicks);
}

var mapWidth, mapHeight;
var neverBefore = true;
socket.on("Map", function (x) {
  if(neverBefore) {
    neverBefore = false;

    initDrawingAndStuff();
  }
  // tick = x.tick;
  //newTick = x.objects;
  //newTick.timestamp = new Date().getTime();
  if (renderer === '') {
    mapWidth = x.size[0];
    mapHeight = x.size[1];
    size = [mapWidth, mapHeight];
    ratio = size[0] / size[1];
    windowSizeCalculating();

    drawSidebarTable(x['all-participants']);

    //noinspection JSUnresolvedVariable
    renderer = PIXI.autoDetectRenderer(x.size[0], x.size[1], {
      backgroundColor: 0xffffff,
      // antialias: true,
      resolution: window.devicePixelRatio || 1,
      // autoResize: true
    });
    header.appendChild(renderer.view);
    renderer.view.style.width = w + 'px';
    renderer.view.style.height = h + 'px';
    //animate();
  }
  //tickQueue[tickQueue.length] = x['objects'];
  tickQueue.push(x)
});

function numberOr(x, defaultValue) {
  return isNaN(x) ? (defaultValue || "-") : x;
}

setInterval(function() {
  if(tickQueue.length > 0) {
    for(var objct in  newTick)  if (newTick.hasOwnProperty(objct)) {
      var obj = newTick[objct];
      var user = newTick[objct].user;
      if(obj.type == 'player'){
        var status = obj["health"] > 0 ? obj["health"] : '✟';
        var userColor;
        if(tank[user] && tank[user].hasOwnProperty('color') ){
          userColor = tank[user]['color'];
        }
        else {
          userColor = '000';
        }

        var ping = numberOr((nextTick.tick-1) - obj["client-tick"], '-');

        $('#nameOf'+user).css('color', '#'+userColor);
        $('#hpOf'+user).text(status);
        $('#pointsOf'+user).text('-');
        $('#pingOf'+user).text(ping);
      }
    }
  }
}, 300);

String.prototype.hashCode = function () {
  var hash = 0,
      i, chr, len;
  if (this.length === 0) return hash;
  for (i = 0, len = this.length; i < len; i++) {
    chr = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};
var tankBodyColors = [
  "1abc9c",
  "2ecc71",
  "3498db",
  "9b59b6",
  "16a085",
  "27ae60",
  "2980b9",
  "8e44ad",
  "f1c40f",
  "e67e22",
  "e74c3c",
  "bdc3c7",
  "f39c12"
];
// create the root of the scene graph
var stage = new PIXI.Container();

var drawTank = function (x, y, tankSize, turretRotation, tankRotation, health, maxHealth, id, userName) {
  //creating container for position elements in it
  var tankContainer = new PIXI.Container();
  //рисуем танк
  var tankDrawBody = new PIXI.Graphics();
  // Тело танка
  var tankColorNum = (userName.hashCode() % tankBodyColors.length) < 0 ? -userName.hashCode() % tankBodyColors.length : userName.hashCode() % tankBodyColors.length;
  var tankColor = tankBodyColors[tankColorNum];

  //noinspection JSCheckFunctionSignatures
  tankDrawBody.beginFill('0x' + tankColor, 1);
  tankDrawBody.drawRoundedRect(-tankSize / 2, (tankSize / 11) - tankSize / 2, tankSize, tankSize - (tankSize / 8), tankSize / 10);
  tankDrawBody.endFill();
  //гусеница
  tankDrawBody.beginFill(0x2c3e50, 1);
  tankDrawBody.drawRoundedRect(-tankSize / 2, -tankSize / 2, tankSize / 4.5, tankSize, tankSize / 10);
  tankDrawBody.endFill();
  //гусеница
  tankDrawBody.beginFill(0x2c3e50, 1);
  tankDrawBody.drawRoundedRect(tankSize / 2 - tankSize / 4.5, -tankSize / 2, tankSize / 4.5, tankSize, tankSize / 10);
  tankDrawBody.endFill();
  tankDrawBody.rotation = tankRotation;
  //турель

  var tankDrawTurret = new PIXI.Graphics();
  //noinspection JSCheckFunctionSignatures
  tankDrawTurret.lineStyle(0);
  tankDrawTurret.beginFill(0x333333, 1);
  tankDrawTurret.drawCircle(0, 0, tankSize / 4);
  tankDrawTurret.endFill();

  //noinspection JSCheckFunctionSignatures
  tankDrawTurret.lineStyle(0);
  tankDrawTurret.beginFill(0x5C5C5C, 1);
  tankDrawTurret.drawCircle(0, 0, tankSize / 6);
  tankDrawTurret.endFill();

  //дуло турели
  tankDrawTurret.beginFill(0x5C5C5C, 1);
  tankDrawTurret.drawRoundedRect(-tankSize / 20, 0, tankSize / 10, -tankSize / 1.5, -tankSize / 10);
  tankDrawTurret.rotation = turretRotation;
  tankDrawTurret.endFill();

  //noinspection JSCheckFunctionSignatures
  tankDrawTurret.lineStyle(0);
  tankDrawTurret.beginFill(0x8C8C8C, 1);
  tankDrawTurret.drawCircle(0, 0, tankSize / 8);
  tankDrawTurret.endFill();

  //TODO: align name by tank center
  var style = {
    font: ' 15px Noto Sans, sans-serif',
    fill: '#000000',
    align: 'center',
    // stroke: '#ffffff',
    // strokeThickness: 1,
    // dropShadow: true,
    // dropShadowColor: '#ffffff',
    // dropShadowAngle: Math.PI,
    // dropShadowDistance: 1,
    // wordWrap: true,
    // wordWrapWidth: tankSize*2
  };

  var userTankName = new PIXI.Text(userName, style);
  var userTankNameWidth = userTankName.width;
  userTankName.x = -userTankNameWidth/2;
  userTankName.y = tankSize + 5;

  var healthBarContainer = new PIXI.Container();

  var healthBar = new PIXI.Graphics();
  healthBar.lineStyle(1, 0xe74c3c, 1);
  healthBar.beginFill(0xfffff, 0);
  healthBar.drawRect(0, 0, tankSize * healthBarConst, 5);
  healthBar.endFill();

  var currentHealthBar = new PIXI.Graphics();
  currentHealthBar.lineStyle(1, 0xe74c3c, 1);
  currentHealthBar.beginFill(0xe74c3c, 1);
  currentHealthBar.drawRect(0, 0, tankSize * healthBarConst * (health / maxHealth), 5);
  currentHealthBar.endFill();

  currentHealth[userName] = currentHealthBar;

  healthBarContainer.addChild(healthBar);
  healthBarContainer.addChild(currentHealth[userName]);
  healthBarContainer.x = -tankSize * 1.2 / 2;
  healthBarContainer.y = tankSize * 0.87;

  tankBody[userName] = tankDrawBody;
  // tankBody[userName].rotation = tankRotation
  // tankContainer.addChild(currentHealth);
  tankContainer.addChild(healthBarContainer);
  tankContainer.addChild(tankBody[userName]);
  tankContainer.addChild(tankDrawTurret);

  tankContainer.addChild(userTankName);
  // tankContainer.addChild(currentHealth[userName]);

  tankContainer.x = x;
  tankContainer.y = y;
  // turret
  turret[userName] = tankDrawTurret;
  turret[userName].position.x = x;
  turret[userName].position.y = y;
  turret[userName].rotation = turretRotation; //in radians
  turret[userName].zIndex = 9;

  tank[userName] = tankContainer;
  tank[userName].zIndex = 10;
  tank[userName].color = tankColor;
  stage.addChild(tank[userName]);
  stage.addChild(turret[userName]);
};

// drawTank(0, 0, 100, 1, 1, 800, 400, '1', 'user');
PIXI.loader
    .add("js/explosion.json")
    .load(onBangAssetsLoaded);
var bang;
var bangs = [];
function onBangAssetsLoaded()
{
  // create an array of textures from an image path
  var frames = [];

  for (var i = 0; i < 23; i++) {
    var val = i < 10 ? '0' + i : i;
    // magically works since the spritesheet was loaded with the pixi loader
    frames.push(PIXI.Texture.fromFrame(val + '.png'));
  }
  // create a MovieClip (brings back memories from the days of Flash, right ?)
  bang = new PIXI.extras.MovieClip(frames);
  // bang.position.set(300);
  bang.animationSpeed = 1;
  bang.play();

}

PIXI.loader
    .add("js/heal.json")
    .load(onHealAssetsLoaded);

var healstatus = [];
var healClip;
function onHealAssetsLoaded()
{
  // create an array of textures from an image path
  var frames = [];

  for (var i = 1; i < 15; i++) {
    var val = i < 10 ? '0' + i : i;
    // magically works since the spritesheet was loaded with the pixi loader
    frames.push(PIXI.Texture.fromFrame('heal'+ val + '.png'));
  }
  // create a MovieClip (brings back memories from the days of Flash, right ?)
  healClip = new PIXI.extras.MovieClip(frames);
  healClip.width = 50;
  healClip.height = 50;
  healClip.animationSpeed = 0.5;
  healClip.play();
  healClip.x = 200;
  healClip.y = 200;
  // stage.addChild(healClip);
}

var bonus = [];
var repairBonusTexture = new PIXI.Texture.fromImage('img/repair.png');
var damageBonusTexture = new PIXI.Texture.fromImage('img/damage.ico');

var drawBonus = function (x, y, radius, type, id){
  var bonusGraphic;
  if(type == 'heal') {
    bonusGraphic = new PIXI.Sprite(repairBonusTexture);
  }
  else {
    bonusGraphic = new PIXI.Sprite(damageBonusTexture);
  }

  bonusGraphic.zIndex = 12;
  bonusGraphic.width = radius * 1.1;
  bonusGraphic.height = radius * 1.1;

  bonus[id] = bonusGraphic;
  bonus[id].x = x - radius/2;
  bonus[id].y = y - radius/2;
  bonus[id].stageId = stage.children.length;
  stage.addChild(bonus[id]);
};
// drawBonus(0, 0, 120, 'heal', 'ids');

var shell;
var shellTexture = PIXI.Texture.fromImage('img/bullet.png');

var drawShell = function (x, y, radius, rotationAngle, id) {
  var shellGraphic = new PIXI.Sprite(shellTexture);
  // shellGraphic.lineStyle(0.5);
  // shellGraphic.beginFill(0xe74c3c, 1);
  // shellGraphic.drawCircle(0, 0, radius);
  // shellGraphic.endFill();
  shellGraphic.width = radius;
  shellGraphic.height = radius;
  shellGraphic.zIndex = 11;
//noinspection JSCheckFunctionSignatures
  // shell = new PIXI.Sprite(shellTexture);
  shell = shellGraphic;
  // var shellContainer = new PIXI.Container();
  // shellContainer.addChild(shell);
  // shellContainer.radius = radius;

  // TODO: add some cool effects like blur and particicles
  shells[id] = shell;
  shells[id].x = x - radius / 2;
  shells[id].y = y - radius / 2;

  shells[id].stageId = stage.children.length;
  stage.addChild(shells[id]);
};

// drawShell(0, 0, 100, 0, 'etalon');
// var bangContainer = new PIXI.Container();

//noinspection JSCheckFunctionSignatures
// var bangEmitter = new PIXI.particles.Emitter(
//     bangContainer,
//     [PIXI.Texture.fromImage('img/particle.png')],
//     {
//       "alpha": {
//         "start": 0.26,
//         "end": 0.59
//       },
//       "scale": {
//         "start": 0.1,
//         "end": 1.1,
//         "minimumScaleMultiplier": 0.85
//       },
//       "color": {
//         "start": "#ff0808",
//         "end": "#ffb13d"
//       },
//       "speed": {
//         "start": 50,
//         "end": 0
//       },
//       "acceleration": {
//         "x": 0,
//         "y": 0
//       },
//       "startRotation": {
//         "min": 0,
//         "max": 360
//       },
//       "rotationSpeed": {
//         "min": 2,
//         "max": 0
//       },
//       "lifetime": {
//         "min": 0.2,
//         "max": 0.8
//       },
//       "blendMode": "color",
//       "frequency": 0.009,
//       "emitterLifetime": 0.5,
//       "maxParticles": 500,
//       "pos": {
//         "x": 0,
//         "y": 0
//       },
//       "addAtBack": false,
//       "spawnType": "rect",
//       "spawnRect": {
//         "x": 0,
//         "y": 0,
//         "w": 0,
//         "h": 0
//       }
//     }
// );
// stage.addChild(bangContainer);


function v(x,y) { return [x,y];}
function vlen(a) { a = a["xy"] ? a["xy"]:a; return Math.sqrt(a[0]*a[0]+ a[1]*a[1])}
function dist(a, b) { return (vlen(sub(a,b))); }
function sub(a,b) { a = a["xy"] ? a["xy"]:a; b = b["xy"] ? b["xy"]: b; return add(a, inv(b))}
function add(a,b) { a = a["xy"] ? a["xy"]:a; b = b["xy"] ? b["xy"]: b; return v(a[0] + b[0], a[1] + b[1])}
//function inplaceAdd(a,b) { a = a["xy"] ? a["xy"]:a; b = b["xy"] ? b["xy"]: b; a[0] += b[0];a[1] += b[1]}
//function inplaceSet(a,b) { a = a["xy"] ? a["xy"]:a; b = b["xy"] ? b["xy"]: b; a[0] = b[0];a[1] = b[1]}
function inv(a) { a = a["xy"] ? a["xy"]:a; return v(-a[0], -a[1])}
function mul(a,k) { a = a["xy"] ? a["xy"]:a; return a ? v(a[0]*k,a[1]*k): v(0,0)}
function norm(a) { a = a["xy"] ? a["xy"]:a; return mul(a, 1/(vlen(a) || 1));}
function deg(rad) { return rad * (180 / Math.PI) }
function rad(deg) { return deg / (180 * Math.PI) }
function angle(a) { if (a["xy"]) a = a["xy"]; return deg(Math.atan2(a[0], a[1])); }
function vecFromRad(a) { return v(Math.cos(a), Math.sin(a)); }

function findObjectInTick(t, oldobj) {
  var Nobjs = t.objects;
  for (var i = 0; i < Nobjs.length; i++) {
    var No = Nobjs[i];
    if (oldobj.type=="player") {
      if (oldobj.user == No.user && No.type == "player")
        return No;
    }
    else
    if (oldobj.id == No.id)
      return No;
  }
  return undefined;
}

function removeObjectFromVis(obj) {
  if (obj.type == "shell") {
    stage.removeChild(shells[obj.id]);
    delete shells[obj.id];
  }
  else if (obj.type == "player") {
    var tankUserName = obj.user;
    bangs[tankUserName] = bang;
    bangs[tankUserName].x = tank[tankUserName].x - tank[tankUserName].width/2;
    bangs[tankUserName].y = tank[tankUserName].y - tank[tankUserName].height/2;
    bangs[tankUserName].width = tank[tankUserName].width;
    //noinspection JSSuspiciousNameCombination
    bangs[tankUserName].height = tank[tankUserName].width;
    stage.addChild(bangs[tankUserName]);
    setTimeout(function(){
      stage.removeChild(bangs[tankUserName]);
    }, 400);

    stage.removeChild(tank[tankUserName]);
    stage.removeChild(turret[tankUserName]);
    delete tank[tankUserName];
    delete turret[tankUserName];

  }
  else if (obj.type == "bonus") {
    stage.removeChild(bonus[obj.id]);
    delete bonus[obj.id];
  }
}

var startMessageContainer = '' ,startText = '';
function update(perc) {
  if(startMessageContainer === ''){
    startMessageContainer = new PIXI.Container();
    var startMessageBG = new PIXI.Graphics();
    startMessageBG.lineStyle(1, 0x000, 1);
    startMessageBG.beginFill(0x7f8c8d, 0.5);
    startMessageBG.drawRect(0, 0, mapWidth, mapHeight);
    startMessageBG.endFill();

    var fontStyle = 'bold italic '+ mapHeight / 10 +'px Noto Sans, sans-serif';
    var style = {
      font : fontStyle,
      fill : '#ffffff',
      stroke : '#4a1850',
      align: 'center',
      strokeThickness : 5,
      dropShadow : true,
      dropShadowColor : '#000000',
      dropShadowAngle : Math.PI / 6,
      dropShadowDistance : 6
    };

    startText = new PIXI.Text('START!',style);
    //noinspection JSPrimitiveTypeWrapperUsage
    startText.x = mapWidth/2 - startText.width/2;//noinspection JSPrimitiveTypeWrapperUsage
    startText.y = mapHeight/2 - startText.height;

    startMessageContainer.addChild(startMessageBG);
    startMessageContainer.addChild(startText);//noinspection JSPrimitiveTypeWrapperUsage
    startMessageContainer.x = 0;//noinspection JSPrimitiveTypeWrapperUsage
    startMessageContainer.y = 0;//noinspection JSPrimitiveTypeWrapperUsage
    startMessageContainer.zIndex = 1;//noinspection JSPrimitiveTypeWrapperUsage
    stage.addChild(startMessageContainer)
  }
  else {
    if(nextTick.tick < 0) {
      startMessageContainer.visible = 1;
      var startMessage = ~~(nextTick.tick/10) !== 0 ? '      ' + -~~(nextTick.tick/10):  'START!';
      startText.text = startMessage;
    } else {
      startMessageContainer.visible = 0;
    }
  }

  //сортируем обьекты по индексу
  stage.children.sort(function(a,b) {
    a.zIndex = a.zIndex || 0;
    b.zIndex = b.zIndex || 0;
    return b.zIndex - a.zIndex
  });


  $("#thetick").html(nextTick.tick);
  {
    // addSomeNewObjects
    for (var i = 0; i< newTick.length; i++) {
      var o = newTick[i];
      if (o.type == "shell") {
        if (!shells[o.id]) {
          // console.log("newshell: ", o);
          // add shell
          drawShell(
              o['xy'][0], o['xy'][1],
              o['body-radius'] * 2,
              getMoveRotation(o),
              o['id']
          );

        }
      }
      else if (o.type == "player") {
        if (!tank[o.user]) {
          // console.log("newtank: ", o);
          // add tank
          drawTank(o['xy'][0], o['xy'][1],
              o['body-radius'] * 2,
              getTurretRotation(o),
              getMoveRotation(o),
              o['health'],
              o['health-max'],
              o['id'],
              o['user']
          );
        }
      }
      else if (o.type == "bonus") {
        if (!bonus[o.id]) {
          drawBonus(o['xy'][0], o['xy'][1],
              o['body-radius'] * 2,
              o['bonus'],
              o['id']
          );
        }
      }
    }

    for (var object in newTick)  if (newTick.hasOwnProperty(object)) {
      var obj = newTick[object];
      var Nobj = findObjectInTick(nextTick, obj);
      if (Nobj == undefined) {
        removeObjectFromVis(obj);
      }
      else {
        var user = obj.user;
        var id = obj.id;
        var posdiff = sub(Nobj, obj); //sub(obj, Nobj);
        if (obj.type === 'player') {
          var usertank = tank[user];
          var realdiff = add(obj,mul(posdiff, perc));
          usertank.x = turret[user].x = realdiff[0];
          usertank.y = turret[user].y = realdiff[1];
          //console.log("tankpos", user, realdiff);

          tankBody[user].rotation = getRotation(obj["move-xy"]);
          turret[user].rotation = getRotation(obj["gun-xy"]);

          var currentHealthWidth = obj['body-radius'] * 2 * healthBarConst * (obj['health'] / obj['health-max']);
          currentHealth[user].width = currentHealthWidth;

          if(obj.hasOwnProperty('bonus-info')) {
          //   if(obj['bonus-info'] == 'heal') {
          //     console.log('healed')
          //     stage.addChild(heal[user]);
          //     // setTimeout(function(){
          //     //   stage.removeChild(heal[user]);
          //     // }, 400);
          //   }
          }

        } else if (obj.type === 'shell') {
          realdiff = add(obj,mul(posdiff, perc));

          shells[id].x = realdiff[0];
          shells[id].y = realdiff[1];
        }
      }
    }

  }
  // var startRender = new Date;
  renderer.render(stage);
  // var renderTime = new Date() - startRender;
  // if( renderTime > 40 ){
  // console.log(renderer)
  // }

}

function getMoveRotation(object) {
  if (!object['move-xy']) {
    object['move-xy'] = {};
  }
  return getAngleFromXY(object['move-xy'][0], object['move-xy'][1]);
}

function getTurretRotation(tankObject) {
  if (!tankObject['gun-xy']) {
    tankObject['gun-xy'] = {};
  }
  return getAngleFromXY(tankObject['gun-xy'][0], tankObject['gun-xy'][1]);
}

function getRotation(o) {
  if (!o) {
    o = [1,0];
  }
  return getAngleFromXY(o[0], o[1]);
}

function getAngleFromXY(x, y) {
  //return Math.atan2(y, x);
  var angle = Math.atan(y / x);
  if ((x >= 0 && y >= 0) || (x > 0 && y < 0)) {
    angle += Math.PI / 2; // ????
  } else if (x < 0) {
    angle -= Math.PI / 2;
  }
  return angle;
}

function showTankOnMap(user) {
  for(var t in tank) if (tank.hasOwnProperty(t)) {
    tank[t].filters = '';
  }
  var dropHighlightShadowFilter = new PIXI.filters.DropShadowFilter();
  dropHighlightShadowFilter.color = 0xfff;
  dropHighlightShadowFilter.angle = 0;
  dropHighlightShadowFilter.alpha = 1;
  dropHighlightShadowFilter.blur = 15;
  dropHighlightShadowFilter.distance = 0;
  tank[user].filters = [dropHighlightShadowFilter];
}
var mainBlock = $('main');
function resize() {
  windowSizeCalculating();
  renderer.view.style.width = w + 'px';
  renderer.view.style.height = h + 'px';
}

function windowSizeCalculating(){
  if (window.innerWidth / window.innerHeight >= ratio) {
    if(mainBlock.height() > window.innerHeight){
      // console.log('vot')
      w = window.innerHeight * ratio;
      h = window.innerHeight;
    }else{
      w = mainBlock.width();
      h = mainBlock.width() / ratio;
    }
  } else {
    w = mainBlock.width();
    h = mainBlock.width() / ratio;
    // console.log('<', ratio)
  }
}

window.onresize = resize;
renderer.onload= resize;

document.addEventListener('visibilitychange', function(){
  setTimeout(function () {
    for (var i = stage.children.length - 1; i >= 0; i--) {
      if (stage.children[i].hasOwnProperty('stageId')) {
        stage.removeChild(stage.children[i]);
      }
    };


    // for (var o in stage.children) {
    //   if (stage.children.hasOwnProperty(o)) {
    //     var objct = stage.children[o];
    //     if (objct.hasOwnProperty('stageId')) {
    //       length = stage.children.length;
    //       objct.visible = false;
    //       objct.width = 0;
    //       stage.removeChild(objct);
    //       delete objct;
    //       if (stage.children.length == length)
    //         console.log(objct)
    //     }
    //
    //   }
    // }
  }, 25);

});

function drawSidebarTable(participants){
  for(var i = 0; i < participants.length; i++) {
    var participant = participants[i];
    var rowNum = i + 1;
    currentTableBody.append(
        '<tr style="cursor: pointer;" onclick="showTankOnMap(\''+ participant +'\')" class="userNameTD">' +
        '<td>' + (rowNum) + '</td>' +
        '<td id="nameOf'+participant+'">'+participant+'</td>' +
        '<td id="hpOf'+participant+'">✟</td>' +
        '<td id="pointsOf'+participant+'">-</td>' +
        '<td id="pingOf'+participant+'">0</td>' +
        '</tr>'
    );
  }
}

// });
