"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globalized_1 = __importDefault(require("phina.js.d.ts/globalized"));
// phina.js をグローバル領域に展開
globalized_1.default.globalize();
var ASSETS = {
    image: {
        'enemy': './img/enemy.png',
        'enemy_shot': './img/enemy_shot.png',
        'ship': './img/ship.png',
        'ship_shot': './img/ship_shot.png',
        'shield': './img/shield.png',
        'explosion_big': './img/explosion_big.png',
        'speed_line': './img/speed_line.png',
        'bg_02': './img/bg_02.png',
    },
    spritesheet: {
        "explosion_big": {
            // フレーム情報
            "frame": {
                "width": 32,
                "height": 32,
                "cols": 4,
                "rows": 1,
            },
            // アニメーション情報
            "animations": {
                "explosion_big": {
                    "frames": [0, 1, 2, 3],
                    "next": "",
                    "frequency": 6,
                },
            }
        },
    }
};
class DF {
}
DF.SC_W = 240;
DF.SC_H = 320;
class Rotation {
}
Rotation.RIGHT = 0;
Rotation.DOWN = 90;
Rotation.LEFT = 180;
Rotation.UP = 270;
class LerpHelper {
    static linear(a, b, t) {
        return a + (b - a) * t;
    }
}
class MathHelper {
    static max(a, b) {
        return a < b ? b : a;
    }
    static min(a, b) {
        return a < b ? a : b;
    }
    static wrap(v, min, max) {
        const length = max - min;
        const v2 = v - min;
        if (0 <= v2) {
            return min + (parseInt(v2) % parseInt(length));
        }
        return min + (length + (v2 % length)) % length;
    }
    static clamp(v, min, max) {
        if (v < min)
            return min;
        if (max < v)
            return max;
        return v;
    }
    static clamp01(v) {
        return MathHelper.clamp(v, 0.0, 1.0);
    }
    static tForLerp(a, b) {
        if (b <= 0)
            return 1;
        return a / b;
    }
    static tForLerpClapmed(a, b) {
        if (b <= 0)
            return 1;
        return MathHelper.clamp01(a / b);
    }
    static isLerpEnd(t) {
        return 1 <= t;
    }
    /** [ min, max ) */
    static isInRange(v, min, max) {
        return min <= v && v < max;
    }
    static progress01(t, length) {
        if (length <= 0)
            return 1.0;
        return MathHelper.clamp01(t / length);
    }
}
function assertEq(a, b) {
    if (a === b)
        return;
    throw "assert " + a + " vs " + b;
}
assertEq(0, MathHelper.wrap(3, 0, 3));
assertEq(2, MathHelper.wrap(2, 0, 3));
assertEq(1, MathHelper.wrap(1, 0, 3));
assertEq(2, MathHelper.wrap(-1, 0, 3));
assertEq(1, MathHelper.wrap(-2, 0, 3));
assertEq(0, MathHelper.wrap(-3, 0, 3));
assertEq(2, MathHelper.wrap(-4, 0, 3));
assertEq(1, MathHelper.wrap(-5, 0, 3));
assertEq(0, MathHelper.clamp(-1, 0, 10));
assertEq(10, MathHelper.clamp(11, 0, 10));
assertEq(1, MathHelper.progress01(2, 0));
assertEq(1, MathHelper.progress01(2, -10));
assertEq(0, MathHelper.progress01(0, 10));
assertEq(0.5, MathHelper.progress01(5, 10));
assertEq(1, MathHelper.progress01(10, 10));
assertEq(1, MathHelper.progress01(11, 10));
class BulletHelper {
    static update(scene, bullet) {
        //const t = MathHelper.tForLerp(bullet.elapsedTime, bullet.endTime);
        bullet.sprite.rotation = bullet.rotation;
        //bullet.isActive &= !MathHelper.isLerpEnd(t);
        bullet.elapsedTime += scene.app.ticker.deltaTime;
        const v = new Vector2().fromDegree(bullet.rotation, scene.data.config.playerBulletSpeed * scene.app.ticker.deltaTime / 1000.0);
        bullet.sprite.x += v.x;
        bullet.sprite.y += v.y;
    }
}
class SpeedLineHelper {
    static update(scene, smoke) {
        const t = MathHelper.tForLerp(smoke.elapsedTime, smoke.endTime);
        smoke.sprite.rotation = smoke.rotation;
        smoke.isActive &= !MathHelper.isLerpEnd(t);
        smoke.elapsedTime += scene.app.ticker.deltaTime;
        const v = new Vector2().fromDegree(smoke.rotation, 500 * scene.app.ticker.deltaTime / 1000.0);
        smoke.sprite.x += v.x;
        smoke.sprite.y += v.y;
    }
}
class PlayerHelper {
}
class Vector2Helper {
    static isZero(v) {
        return v.x === 0 && v.y === 0;
    }
    static copyFrom(a, b) {
        a.x = b.x;
        a.y = b.y;
    }
}
const StateId = {
    S1I: 10,
    S1: 11,
    S2: 20,
    S3I: 30,
    S3: 40,
    EXIT: 100,
};
class Player {
    constructor() {
        const sprite = Sprite("ship");
        sprite.x = 120;
        sprite.y = DF.SC_H * 3 / 4;
        sprite.priority = 5;
        this.score = 0;
        this.sprite = sprite;
        const collider = RectangleShape();
        collider.width = 8;
        collider.height = 8;
        collider.alpha = 0.0;
        this.collider = collider;
        this.fireInterval = 50;
        this.fireTime = 0;
        this.rotation = Rotation.UP;
        this.isInSafeArea = true;
    }
}
class Shield {
    constructor() {
        const sprite = Sprite("shield");
        sprite.priority = 5;
        this.sprite = sprite;
        const collider = RectangleShape();
        collider.width = 8;
        collider.height = 32;
        collider.alpha = 0.0;
        this.collider = collider;
        this.rotation = Rotation.UP;
        this.isInSafeArea = true;
    }
}
class Enemy {
    constructor(pos, moveData) {
        const sprite = Sprite("enemy");
        sprite.x = pos.x;
        sprite.y = pos.y;
        sprite.priority = 3;
        this.startPos = new Vector2(pos.x, pos.y);
        this.moveWork = new MoveWork(pos, moveData);
        this.score = 0;
        this.sprite = sprite;
        this.fireInterval = 200;
        this.fireTime = 0;
        this.stateTime = 0;
        this.state = 0;
        this.rotation = Rotation.UP;
        this.isInSafeArea = true;
        this.isActive = true;
    }
}
class EnemyHelper {
    static update(scene, enemy) {
        MoveWorkHelper.update(scene, enemy.moveWork, scene.app.ticker.deltaTime, enemy);
    }
    static createEnemy(scene, pos, moveData) {
        const enemy = new Enemy(pos, moveData);
        enemy.sprite.addChildTo(scene.layer1);
        scene.data.enemyArr.push(enemy);
        return enemy;
    }
}
class Explosion {
    constructor(pos) {
        const sprite = new Sprite("explosion_big");
        sprite.priority = 1;
        sprite.x = pos.x;
        sprite.y = pos.y;
        this.sprite = sprite;
        var anim = new FrameAnimation("explosion_big").attachTo(sprite);
        anim.gotoAndPlay("explosion_big");
        this.anim = anim;
        this.isActive = true;
    }
}
class ExplosionHelper {
    static update(scene, explosion) {
        if (explosion.anim.finished) {
            explosion.isActive = false;
        }
    }
    static createExplosion(scene, pos) {
        const pos2 = new Vector2(pos.x + Math.random() * 8 - 4, pos.y + Math.random() * 8 - 4);
        const explosion = new Explosion(pos2);
        explosion.sprite.addChildTo(scene.layer1);
        scene.data.explosionArr.push(explosion);
        return explosion;
    }
}
class WaveWork {
    constructor(waves) {
        this.blockWorks = [];
        this.blockIndex = 0;
        this.waveTime = 0;
        this.waveIndex = 0;
        this.blockTime = 0;
        this.isEnd = false;
        this.waves = waves;
        WaveWorkHelper.resetBlock(this);
    }
}
class BlockWork {
    constructor(blockData) {
        this.blockTime = 0;
        this.enemyIndex = 0;
        this.isEnd = false;
        this.blockData = blockData;
    }
}
class BlockWorkHelper {
    static update(scene, waveWork, blockWork) {
        const blockData = blockWork.blockData;
        if (waveWork.waveTime < blockData.time)
            return;
        if (blockWork.isEnd)
            return;
        const enableCount = MathHelper.min(blockData.enemyCount, parseInt(blockWork.blockTime / blockData.delay));
        const waveData = waveWork.waves[waveWork.waveIndex];
        const pos = new Vector2(blockData.pos.x, blockData.pos.y);
        pos.x *= waveData.scale.x;
        pos.y *= waveData.scale.y;
        pos.x += DF.SC_W / 2;
        pos.y += DF.SC_H / 2;
        const orderScale = new Vector2(waveData.scale.x, waveData.scale.y);
        orderScale.x *= blockWork.blockData.scale.x;
        orderScale.y *= blockWork.blockData.scale.y;
        for (var i = blockWork.enemyIndex; i < enableCount; i++) {
            const baseMoveData = moveDataDict[blockData.moveDataName];
            const moveData = JSON.parse(JSON.stringify(baseMoveData));
            for (let i = 0; i < moveData.length; i++) {
                const orderData = moveData[i];
                switch (orderData.type) {
                    case 'moveTo':
                        orderData.x *= orderScale.x;
                        orderData.y *= orderScale.y;
                        break;
                    case 'rotateTo':
                        const angleVec = Vector2().fromDegree(orderData.angle, 1);
                        angleVec.x *= orderScale.x;
                        angleVec.y *= orderScale.y;
                        orderData.angle = angleVec.toDegree();
                        break;
                }
            }
            EnemyHelper.createEnemy(scene, pos, moveData);
        }
        blockWork.enemyIndex = enableCount;
        if (blockData.enemyCount <= blockWork.enemyIndex) {
            blockWork.isEnd = true;
        }
        blockWork.blockTime += scene.app.ticker.deltaTime;
    }
}
class WaveWorkHelper {
    static resetBlock(waveWork) {
        const wave = waveWork.waves[waveWork.waveIndex];
        const blocks = wave.blocks;
        waveWork.blockWorks = [];
        for (let i = 0; i < blocks.length; i++) {
            const blockData = blocks[i];
            const blockWork = new BlockWork(blockData);
            waveWork.blockWorks.push(blockWork);
        }
        waveWork.blockIndex = 0;
        waveWork.waveTime = 0;
        waveWork.blockTime = 0;
    }
    static update(scene, waveWork) {
        if (waveWork.isEnd)
            return;
        const blocks = waveWork.blockWorks;
        for (let i = 0; i < blocks.length; i++) {
            const blockWork = blocks[i];
            BlockWorkHelper.update(scene, waveWork, blockWork);
        }
        let endBlockCount = 0;
        for (let i = 0; i < blocks.length; i++) {
            const blockWork = blocks[i];
            if (blockWork.isEnd) {
                endBlockCount++;
            }
        }
        if (blocks.length <= endBlockCount) {
            const isEnemyZero = scene.data.enemyArr.length <= 0;
            if (isEnemyZero) {
                var nextWaveIndex = MathHelper.wrap(waveWork.waveIndex + 1, 0, waveWork.waves.length);
                waveWork.waveIndex = nextWaveIndex;
                WaveWorkHelper.resetBlock(waveWork);
                //waveWork.isEnd = true;
                return;
            }
        }
        waveWork.waveTime += scene.app.ticker.deltaTime;
    }
}
class OrderWork {
    constructor(orderData) {
        this.state = 0;
        this.time = 0;
        this.orderData = orderData;
        this.updateFunc = OrderUpdateFunc[orderData.type];
    }
}
class OrderUpdateFunc {
    static moveTo(scene, orderWork, enemy) {
        if (orderWork.state === 0) {
            orderWork.startX = enemy.sprite.x;
            orderWork.startY = enemy.sprite.y;
        }
        switch (orderWork.state) {
            case 0:
            case 1:
            case 2:
                const t = MathHelper.tForLerpClapmed(orderWork.time, orderWork.orderData.duration);
                const endX = enemy.startPos.x + orderWork.orderData.x;
                const endY = enemy.startPos.y + orderWork.orderData.y;
                enemy.sprite.x = LerpHelper.linear(orderWork.startX, endX, t);
                enemy.sprite.y = LerpHelper.linear(orderWork.startY, endY, t);
                break;
        }
    }
    static rotateTo(scene, orderWork, enemy) {
        if (orderWork.state === 0) {
            orderWork.startAngle = enemy.sprite.rotation;
        }
        switch (orderWork.state) {
            case 0:
            case 1:
            case 2:
                const t = MathHelper.tForLerpClapmed(orderWork.time, orderWork.orderData.duration);
                const endAngle = orderWork.orderData.angle;
                enemy.sprite.rotation = LerpHelper.linear(orderWork.startAngle, endAngle, t);
                break;
        }
    }
    static shot(scene, orderWork, enemy) {
        switch (orderWork.state) {
            case 0:
                orderWork.prevTime = 0;
                break;
            case 1:
            case 2:
                const interval = orderWork.orderData.interval;
                const hasShot = (interval == 0) ?
                    true :
                    (parseInt(orderWork.prevTime / interval) < parseInt(orderWork.time / interval));
                orderWork.prevTime = orderWork.time;
                if (hasShot) {
                    scene.createEnemyBullet(enemy.sprite, enemy.sprite.rotation);
                }
                break;
        }
    }
}
class OrderWorkHelper {
    static update(scene, orderWork, deltaTime, enemy) {
        switch (orderWork.state) {
            case 0:
                if (orderWork.orderData.time <= orderWork.time) {
                    orderWork.time = 0;
                    orderWork.updateFunc(scene, orderWork, enemy);
                    orderWork.state = 1;
                }
                break;
            case 1:
                orderWork.updateFunc(scene, orderWork, enemy);
                if (orderWork.orderData.duration <= orderWork.time) {
                    orderWork.state = 2;
                }
                break;
            case 2:
                orderWork.updateFunc(scene, orderWork, enemy);
                orderWork.state = 3;
                return;
        }
        orderWork.time += deltaTime;
    }
}
class MoveWork {
    constructor(pos, moveData) {
        this.pos = new Vector2(pos.x, pos.y);
        this.index = 0;
        this.time = 0;
        this.state = 0;
        this.moveData = moveData;
        this.orderWorkArr = [];
        for (let i = 0; i < moveData.length; i++) {
            var orderData = moveData[i];
            var orderWork = new OrderWork(orderData);
            this.orderWorkArr.push(orderWork);
        }
    }
}
class MoveWorkHelper {
    static getPosition(moveWork, curPos) {
        const moveData = moveWork.moveData;
        if (MoveWorkHelper.isEnd(moveWork))
            return curPos;
        const curve = moveData[moveWork.index];
        const t1 = MathHelper.clamp01(moveWork.time / curve.time);
        const samples = curve.samples;
        let minSample = samples[0];
        let maxSample = minSample;
        for (let i = samples.length - 1; 0 <= i; i--) {
            const sample = samples[i];
            if (sample.t <= t1) {
                minSample = sample;
                maxSample = samples[Math.min(i + 1, samples.length - 1)];
                break;
            }
        }
        const t2 = MathHelper.progress01(t1 - minSample.t, maxSample.t - minSample.t);
        //console.log(`t1: ${t1.toFixed(2)}, t2: ${t2.toFixed(2)}`);
        const pos = Vector2.lerp(minSample, maxSample, t2);
        pos.add(moveWork.pos);
        return pos;
    }
    static evalaute(moveWork, enemy) {
        if (!enemy.isActive)
            return;
        const pos = enemy.sprite;
        const nextPos = MoveWorkHelper.getPosition(moveWork, enemy);
        const v = Vector2.sub(nextPos, pos);
        if (0 < v.lengthSquared()) {
            enemy.sprite.rotation = v.toDegree();
        }
        enemy.sprite.x = nextPos.x;
        enemy.sprite.y = nextPos.y;
        enemy.isActive &= !MoveWorkHelper.isEnd(enemy.moveWork);
    }
    static isEnd(moveWork) {
        const orderWorkArr = moveWork.orderWorkArr;
        for (let i = 0; i < orderWorkArr.length; i++) {
            const orderWork = orderWorkArr[i];
            if (orderWork.state < 2)
                return false;
        }
        return true;
    }
    static update(scene, moveWork, deltaTime, enemy) {
        if (!enemy.isActive)
            return;
        if (MoveWorkHelper.isEnd(moveWork))
            return;
        const orderWorkArr = moveWork.orderWorkArr;
        for (let i = 0; i < orderWorkArr.length; i++) {
            const orderWork = orderWorkArr[i];
            OrderWorkHelper.update(scene, orderWork, deltaTime, enemy);
        }
        moveWork.time += deltaTime;
        enemy.isActive &= !MoveWorkHelper.isEnd(moveWork);
    }
}
class ObjectArrayHelper {
    static removeInactive(objArr) {
        for (let i = objArr.length - 1; 0 <= i; i--) {
            const item = objArr[i];
            if (item.isActive)
                continue;
            item.sprite.remove();
            objArr.splice(i, 1);
        }
    }
}
// MainScene クラスを定義
globalized_1.default.define('MainScene', {
    superClass: 'DisplayScene',
    init: function (options) {
        this.superInit(options);
        // 背景色を指定
        this.backgroundColor = '#444444';
        {
            const layer = DisplayElement();
            layer.addChildTo(this);
            this.layer0 = layer;
        }
        {
            const layer = DisplayElement();
            layer.addChildTo(this);
            this.layer1 = layer;
        }
        const data = {
            smokeArr: [],
            playerBulletArr: [],
            enemyBulletArr: [],
            speedLineArr: [],
            enemyArr: [],
            explosionArr: [],
            waveWork: new WaveWork(waveData),
            config: {
                drawHeight: 8,
                playerSpeed: 100,
                playerRotationSpeed: 120,
                playerBulletSpeed: 100,
                playerBulletCount: 2,
            },
            progress: {
                state: StateId.S1I,
                stateTime: 0,
                elapsedTime: 0,
                limitTime: 1000 * 90,
                mapI: 0,
                blockI: 0,
            },
        };
        data.player = new Player();
        data.player.sprite.addChildTo(this.layer1);
        data.player.collider.addChildTo(this.layer1);
        data.shield = new Shield();
        data.shield.sprite.addChildTo(this.layer1);
        data.shield.collider.addChildTo(this.layer1);
        {
            const label = Label({
                originX: 0.5,
                originY: 0,
                fontSize: 8,
                lineHeight: 2,
                align: 'left',
                fill: '#ffffff',
                stroke: '#000000',
                strokeWidth: 4,
            }).addChildTo(this);
            label.text = "hoge";
            label.x = 8;
            label.y = 16;
            this.debugLabel = label;
            this.debugLabel.visible = false;
        }
        {
            const label = Label({
                originX: 0.5,
                originY: 0,
                fontSize: 8,
                lineHeight: 2,
                align: 'left',
                fill: '#ffffff',
                stroke: '#000000',
                strokeWidth: 4,
            }).addChildTo(this);
            label.x = 8;
            label.y = 0;
            this.label = label;
        }
        {
            const label = Label({
                originX: 0.5,
                originY: 0.5,
                fontSize: 8,
                lineHeight: 2,
                align: 'center',
                fill: '#ffffff',
                stroke: '#000000',
                strokeWidth: 4,
            }).addChildTo(this);
            label.x = DF.SC_W * 0.5;
            label.y = DF.SC_H * 0.5;
            label.text = "hkt6";
            this.centerLabel = label;
        }
        this.data = data;
    },
    createSmoke: function (pos) {
        const sprite = CircleShape({
            width: 32,
            height: 32,
            fill: '#ff0',
            strokeWidth: 0,
        });
        sprite.alpha = 0.2;
        sprite.x = pos.x;
        sprite.y = pos.y;
        sprite.priority = 1;
        sprite.addChildTo(this.layer1);
        let forceX = Math.randfloat(-1, 1) * 10;
        let forceY = Math.randfloat(-1, 1) * 10;
        const smoke = {
            isActive: true,
            sprite: sprite,
            force: Vector2(forceX, forceY),
            startRadius: 16,
            endRadius: 48,
            startAlpha: 0.5,
            endAlpha: 0,
            elapsedTime: 0,
            endTime: 5000,
        };
        this.data.smokeArr.push(smoke);
        return smoke;
    },
    createPlayerBullet: function (pos, rotation) {
        const sprite = Sprite('ship_shot');
        sprite.rotation = rotation;
        sprite.x = pos.x;
        sprite.y = pos.y;
        sprite.priority = 2;
        sprite.addChildTo(this.layer1);
        const bullet = {
            isActive: true,
            sprite: sprite,
            elapsedTime: 0,
            endTime: 1000,
            rotation: rotation,
        };
        this.data.playerBulletArr.push(bullet);
        return bullet;
    },
    createEnemyBullet: function (pos, rotation) {
        const sprite = Sprite('enemy_shot');
        sprite.rotation = rotation;
        sprite.x = pos.x;
        sprite.y = pos.y;
        sprite.priority = 4;
        sprite.addChildTo(this.layer1);
        const bullet = {
            isActive: true,
            sprite: sprite,
            elapsedTime: 0,
            endTime: 1000,
            rotation: rotation,
        };
        this.data.enemyBulletArr.push(bullet);
        return bullet;
    },
    createSpeedLine: function (pos, rotation) {
        const sprite = Sprite('speed_line');
        sprite.rotation = rotation;
        sprite.x = pos.x;
        sprite.y = pos.y;
        sprite.priority = 2;
        sprite.addChildTo(this.layer1);
        const speedLine = {
            isActive: true,
            sprite: sprite,
            elapsedTime: 0,
            endTime: 1000,
            rotation: rotation,
        };
        this.data.speedLineArr.push(speedLine);
        return speedLine;
    },
    getAppInput: function () {
        const key = this.app.keyboard;
        const appInput = {};
        const speed = 1;
        const dir = globalized_1.default.geom.Vector2(0, 0);
        if (key.getKey('left')) {
            dir.x -= speed;
        }
        if (key.getKey('right')) {
            dir.x += speed;
        }
        if (key.getKey('down')) {
            dir.y += speed;
        }
        if (key.getKey('up')) {
            dir.y -= speed;
        }
        appInput.dir = dir.normalize();
        appInput.putFire = false; // key.getKey('z');
        appInput.hasFixShield = key.getKey('z');
        return appInput;
    },
    update: function () {
        const appInput = this.getAppInput();
        const player = this.data.player;
        const speed1 = appInput.putSmoke ? 100 : 200;
        const speed = speed1 * this.app.ticker.deltaTime / 1000;
        const progress = this.data.progress;
        switch (progress.state) {
            case StateId.S1I:
                this.centerLabel.text = "MISSION START";
                progress.elapsedTime = 0;
                player.score = 0;
                player.railX = 1;
                {
                    var tx = (DF.SC_W / 3) * (player.railX + 0.5);
                    player.sprite.y = DF.SC_H - 40;
                    player.sprite.x = tx;
                }
                progress.blockI = 0;
                this.layer0.y = 0;
                progress.stateTime = 0;
                progress.state = StateId.S1;
                break;
            case StateId.S1:
                if (1000 < progress.stateTime) {
                    this.centerLabel.text = "";
                    progress.state = StateId.S2;
                }
                break;
            case StateId.S2:
                // 操作.
                {
                    if (appInput.putFire) {
                        if (player.fireInterval <= player.fireTime && this.data.playerBulletArr.length < this.data.config.playerBulletCount) {
                            player.fireTime = 0;
                            this.createPlayerBullet(player.sprite, player.rotation);
                        }
                    }
                }
                player.fireTime += this.app.ticker.deltaTime;
                {
                    var safeArea = new Rect(0, 0, DF.SC_W, DF.SC_H);
                    player.isInSafeArea = Collision.testRectRect(safeArea, player.sprite);
                }
                const vec = new Vector2(appInput.dir.x, appInput.dir.y);
                vec.mul(this.data.config.playerSpeed * this.app.ticker.deltaTime / 1000.0);
                player.sprite.x += vec.x;
                player.sprite.y += vec.y;
                player.sprite.x = MathHelper.clamp(player.sprite.x, safeArea.left, safeArea.right);
                player.sprite.y = MathHelper.clamp(player.sprite.y, safeArea.top, safeArea.bottom);
                player.collider.x = player.sprite.x;
                player.collider.y = player.sprite.y;
                const shield = this.data.shield;
                const shieldVec = new Vector2();
                if (!Vector2Helper.isZero(appInput.dir) && !appInput.hasFixShield) {
                    shield.rotation = new Vector2(-appInput.dir.x, -appInput.dir.y).toDegree();
                }
                shieldVec.fromDegree(shield.rotation, 32);
                shield.sprite.x = player.sprite.x + shieldVec.x;
                shield.sprite.y = player.sprite.y + shieldVec.y;
                shield.sprite.rotation = shield.rotation;
                shield.collider.x = shield.sprite.x;
                shield.collider.y = shield.sprite.y;
                shield.collider.rotation = shield.sprite.rotation;
                progress.elapsedTime = Math.min(progress.elapsedTime + this.app.ticker.deltaTime, progress.limitTime);
                const t = progress.elapsedTime / progress.limitTime;
                if (1 <= t) {
                    progress.state = StateId.S3I;
                }
                if (!player.isInSafeArea) {
                    progress.state = StateId.S3I;
                }
                if (this.app.keyboard.getKeyDown('r')) {
                    progress.state = StateId.EXIT;
                }
                if (this.app.keyboard.getKeyDown('t')) {
                    progress.elapsedTime = progress.limitTime - 2000;
                }
                if (this.app.keyboard.getKeyDown('e')) {
                    const moveData = moveDataDict['circle'];
                    EnemyHelper.createEnemy(this, new Vector2(DF.SC_W * 0.5, DF.SC_H * 0.5), moveData);
                }
                WaveWorkHelper.update(this, this.data.waveWork);
                this.data.playerBulletArr.forEach((_item) => BulletHelper.update(this, _item));
                this.data.enemyBulletArr.forEach((_item) => BulletHelper.update(this, _item));
                {
                    var safeArea = new Rect(0, 0, DF.SC_W, DF.SC_H);
                    this.data.playerBulletArr.forEach((_item) => {
                        if (Collision.testRectRect(safeArea, _item.sprite))
                            return;
                        _item.isActive = false;
                    });
                    this.data.enemyBulletArr.forEach((_item) => {
                        if (Collision.testRectRect(safeArea, _item.sprite))
                            return;
                        _item.isActive = false;
                    });
                }
                this.data.speedLineArr.forEach((_item) => SpeedLineHelper.update(this, _item));
                this.data.enemyArr.forEach((_item) => EnemyHelper.update(this, _item));
                this.data.explosionArr.forEach((_item) => ExplosionHelper.update(this, _item));
                {
                    // player x bullet
                    const enemyBulletArr = this.data.enemyBulletArr;
                    for (let i1 = 0; i1 < enemyBulletArr.length; i1++) {
                        const bullet = enemyBulletArr[i1];
                        if (!player.collider.hitTestElement(bullet.sprite))
                            continue;
                        bullet.isActive = false;
                        ExplosionHelper.createExplosion(this, player.sprite);
                        progress.state = StateId.S3I;
                    }
                }
                {
                    // player x enemy
                    const enemyArr = this.data.enemyArr;
                    for (let i1 = 0; i1 < enemyArr.length; i1++) {
                        const enemy = enemyArr[i1];
                        if (!player.collider.hitTestElement(enemy.sprite))
                            continue;
                        enemy.isActive = false;
                        ExplosionHelper.createExplosion(this, player.sprite);
                        progress.state = StateId.S3I;
                    }
                }
                {
                    // shield x enemyBullet
                    const enemyBulletArr = this.data.enemyBulletArr;
                    for (let i1 = 0; i1 < enemyBulletArr.length; i1++) {
                        const bullet = enemyBulletArr[i1];
                        if (!shield.sprite.hitTestElement(bullet.sprite))
                            continue;
                        this.createPlayerBullet(bullet.sprite, shield.rotation);
                        bullet.isActive = false;
                        player.score += 20;
                    }
                }
                {
                    // playerBullet x enemy
                    const playerBulletArr = this.data.playerBulletArr;
                    const enemyArr = this.data.enemyArr;
                    for (let i1 = 0; i1 < playerBulletArr.length; i1++) {
                        const bullet = playerBulletArr[i1];
                        for (let i2 = 0; i2 < enemyArr.length; i2++) {
                            const enemy = enemyArr[i2];
                            if (!enemy.sprite.hitTestElement(bullet.sprite))
                                continue;
                            enemy.isActive = false;
                            bullet.isActive = false;
                            ExplosionHelper.createExplosion(this, enemy.sprite);
                            player.score += 1000;
                        }
                    }
                }
                ObjectArrayHelper.removeInactive(this.data.playerBulletArr);
                ObjectArrayHelper.removeInactive(this.data.enemyBulletArr);
                ObjectArrayHelper.removeInactive(this.data.speedLineArr);
                ObjectArrayHelper.removeInactive(this.data.enemyArr);
                ObjectArrayHelper.removeInactive(this.data.explosionArr);
                break;
            case StateId.S3I:
                progress.state = StateId.S3;
                this.centerLabel.text = "GAME OVER\nPRESS Z KEY";
                progress.stateTime = 0;
                break;
            case StateId.S3:
                if (1000 <= progress.stateTime && this.app.keyboard.getKeyDown('z')) {
                    progress.state = StateId.EXIT;
                }
                break;
            case StateId.EXIT:
                this.exit();
                return;
                break;
        }
        progress.stateTime += this.app.ticker.deltaTime;
        player.sprite.rotation = player.rotation;
        this.debugLabel.text = `XY(${player.sprite.x.toFixed(1)}, ${player.sprite.y.toFixed(1)})` +
            ` SAFE ${player.isInSafeArea}`;
        this.label.text = "";
        const restTime = Math.max(0, progress.limitTime - progress.elapsedTime);
        // const height = restTime / 1000;
        // let fuga = progress.elapsedTime / progress.limitTime;
        // fuga *= fuga;
        // // let scale = 1.0 + MathHelper.clamp(10 * progress.elapsedTime / progress.limitTime, 0.0, 10.0);
        // let scale = (100 / Math.max(1, (100 * (1, restTime / progress.limitTime))));
        // scale = MathHelper.clamp(scale, 0, 100);
        this.label.text +=
            'TIME ' + (restTime / 1000).toFixed(2) +
                ' SCORE ' + Math.floor(player.score) +
                '';
        // sort
        this.layer1.children.sort((a, b) => {
            return a.priority - b.priority;
        });
    },
});
// メイン処理
globalized_1.default.main(function () {
    // アプリケーション生成
    let app = GameApp({
        startLabel: 'main',
        fps: 60,
        width: DF.SC_W,
        height: DF.SC_H,
        assets: ASSETS,
        scenes: [
            {
                className: 'MainScene',
                label: 'main',
                nextLabel: 'main',
            },
        ],
    });
    // アプリケーション実行
    app.run();
});
