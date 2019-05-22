"use strict";
/// <reference path="../node_modules/phina.js.d.ts/globalized/index.d.ts" />
phina.globalize();
var ASSETS = {
// image: {
// },
// spritesheet: {
// },
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
            return min + (Math.floor(v2) % Math.floor(length));
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
class GameObjectType {
}
GameObjectType.UNDEF = 0;
GameObjectType.PLAYER = 1;
GameObjectType.PLAYER_BULLET = 2;
GameObjectType.ENEMY = 3;
GameObjectType.EFFECT = 4;
class GameObject {
    constructor() {
        this.name = '';
        this.type = GameObjectType.UNDEF;
        this.hasDelete = false;
        this.sprite = new AsciiSprite();
        this.life = new Life();
        this.bullet = null;
        this.effect = null;
    }
}
class Life {
    constructor() {
        this.hpMax = 1;
        this.hp = 1;
    }
}
class Effect {
    constructor() {
        this.duration = 1000;
        this.time = 0;
    }
}
class Bullet {
    constructor() {
        this.vec = 1;
    }
}
class AsciiSprite {
    constructor() {
        this.character = ' ';
        this.position = 0;
        this.priority = 0;
    }
}
class StateMachine {
    constructor() {
        this.time = 0;
        this.state = (_1, _2) => null;
    }
    update(target, app) {
        var nextState = this.state(target, { app: app, sm: this });
        if (nextState && this.state !== nextState) {
            this.state = nextState;
            this.time = 0;
        }
        else {
            this.time += app.deltaTime;
        }
    }
}
class HogeScene {
    constructor(pScene) {
        this.lines = [[], [], []];
        this.goArr = [];
        this.stageLeft = 0;
        this.stageRight = 32;
        this.isStarted = false;
        this.isEnd = false;
        this.sm = new StateMachine();
        this.enemyDataDict = {
            'enm_1': {
                character: '-',
                speed: 8,
            },
            'enm_2': {
                character: '_',
                speed: 6,
            },
            'enm_3': {
                character: '^',
                speed: 10,
            },
            'enm_4': {
                character: '~',
                speed: 4,
            },
        };
        this.waveDataDict = {
            'wave_1': [
                { time: 1000, character: 'enm_1', },
                { time: 2000, character: 'enm_2', },
                { time: 3000, character: 'enm_3', },
            ],
            'wave_2': [
                { time: 1000, character: 'enm_1', },
                { time: 1500, character: 'enm_2', },
                { time: 2000, character: 'enm_3', },
                { time: 2500, character: 'enm_4', },
            ],
        };
        this.questData = {
            waveArr: [
                'wave_1',
                'wave_2',
            ],
        };
        this.playerBulletSpeed = 8;
        this.questWaveIndex = 0;
        this.questWaveEnemyIndex = 0;
        this.questLoopCount = 0;
        this.questTime = 0;
        this.scene = pScene;
        pScene.backgroundColor = '#000000';
        {
            const go = new GameObject();
            go.name = 'player';
            go.type = GameObjectType.PLAYER;
            go.sprite.character = 'p';
            go.sprite.priority = 1;
            this.goArr.push(go);
            this.player = go;
        }
        {
            var label = new phina.display.Label({
                text: '',
                fill: '#00ff00',
                fontSize: '12',
                fontFamily: 'monospaced',
                align: 'left',
            });
            label.x = 0;
            label.y = pScene.gridY.center();
            label.addChildTo(pScene);
            this.mainLabel = label;
        }
        this.sm.state = this.stateHoge;
        pScene.addEventListener('enterframe', (evt) => {
            this.enterframe(evt);
        });
    }
    stateHoge(self, evt) {
        if (1000 <= evt.sm.time) {
            return self.state2;
        }
        return null;
    }
    state2(self, evt) {
        if (evt.sm.time === 0) {
            self.isStarted = true;
        }
        var playerIndex = self.goArr.findIndex(go => go.type === GameObjectType.PLAYER);
        if (playerIndex === -1) {
            self.isEnd = true;
            return self.stateGameOver;
        }
        // リセット.
        if (evt.app.keyboard.getKeyUp('r')) {
            return self.stateExit;
        }
        return null;
    }
    stateGameOver(self, evt) {
        if (evt.sm.time === 0) {
        }
        if (3000 <= evt.sm.time) {
            return self.stateExit;
        }
        return null;
    }
    stateExit(self, evt) {
        if (evt.sm.time === 0) {
            self.scene.exit();
        }
        return null;
    }
    updateQuest(myScene, app) {
        if (!myScene.isStarted)
            return;
        const goArr = myScene.goArr;
        {
            const quest = myScene;
            const waveId = quest.questData.waveArr[quest.questWaveIndex];
            const enemyArr = quest.waveDataDict[waveId];
            if (quest.questWaveEnemyIndex < enemyArr.length) {
                const putData = enemyArr[quest.questWaveEnemyIndex];
                if (quest.questTime < putData.time) {
                    // skip.
                }
                else {
                    const enemyData = quest.enemyDataDict[putData.character];
                    {
                        const go = new GameObject();
                        go.name = 'enemy';
                        go.type = GameObjectType.ENEMY;
                        go.sprite.character = enemyData.character;
                        go.sprite.priority = 4;
                        go.sprite.position = this.stageRight;
                        go.bullet = new Bullet();
                        var scale = (1 + quest.questLoopCount * 0.5);
                        go.bullet.vec = -enemyData.speed * scale;
                        this.goArr.push(go);
                    }
                    quest.questWaveEnemyIndex += 1;
                }
            }
            else {
                const hasAliveEnemy = 0 <= goArr.findIndex(go => {
                    return go.type === GameObjectType.ENEMY;
                });
                if (hasAliveEnemy) {
                    // 残りの敵がいる.
                }
                else {
                    // 敵がゼロなので、次に進む.
                    quest.questWaveIndex += 1;
                    quest.questWaveEnemyIndex = 0;
                    if (quest.questData.waveArr.length <= quest.questWaveIndex) {
                        quest.questLoopCount += 1;
                        quest.questWaveIndex = 0;
                    }
                }
            }
            quest.questTime += app.ticker.deltaTime;
        }
    }
    static isHit(a, b) {
        const apos = a.sprite.position;
        const bpos = b.sprite.position;
        const distance = apos < bpos ?
            bpos - apos :
            apos - bpos;
        if (1 < distance)
            return false;
        var aFlag = HogeScene.characterCollisionDict[a.sprite.character];
        if (!aFlag) {
            aFlag = (1 << 0) | (1 << 1) | (2 << 1);
        }
        var bFlag = HogeScene.characterCollisionDict[b.sprite.character];
        if (!bFlag) {
            bFlag = (1 << 0) | (1 << 1) | (2 << 1);
        }
        return (aFlag & bFlag) !== 0;
    }
    static hit(own, other) {
        own.life.hp -= 1;
        if (own.life.hp < 0) {
            own.life.hp = 0;
        }
    }
    updateHit(goArr, aFilter, bFilter) {
        for (var i = 0; i < goArr.length; i++) {
            const aGO = goArr[i];
            if (!aFilter(aGO))
                continue;
            for (var j = 0; j < goArr.length; j++) {
                const bGO = goArr[j];
                if (!bFilter(bGO))
                    continue;
                if (!HogeScene.isHit(aGO, bGO))
                    continue;
                HogeScene.hit(aGO, bGO);
                HogeScene.hit(bGO, aGO);
            }
        }
    }
    updatePlayer(app) {
        const playerIndex = this.goArr.findIndex(go => go.type === GameObjectType.PLAYER);
        const player = this.goArr[playerIndex];
        if (!player)
            return;
        if (app.keyboard.getKeyDown('right')) {
            const go = new GameObject();
            go.name = 'bullet';
            go.type = GameObjectType.PLAYER_BULLET;
            go.sprite.character = '-';
            go.sprite.priority = 2;
            go.sprite.position = player.sprite.position + 1;
            go.bullet = new Bullet();
            go.bullet.vec = this.playerBulletSpeed;
            this.goArr.push(go);
        }
        if (app.keyboard.getKeyDown('down')) {
            const go = new GameObject();
            go.name = 'bullet';
            go.type = GameObjectType.PLAYER_BULLET;
            go.sprite.character = '_';
            go.sprite.priority = 2;
            go.sprite.position = player.sprite.position + 1;
            go.bullet = new Bullet();
            go.bullet.vec = 4;
            this.goArr.push(go);
        }
        if (app.keyboard.getKeyDown('up')) {
            const go = new GameObject();
            go.name = 'bullet';
            go.type = GameObjectType.PLAYER_BULLET;
            go.sprite.character = '^';
            go.sprite.priority = 2;
            go.sprite.position = player.sprite.position + 1;
            go.bullet = new Bullet();
            go.bullet.vec = 4;
            this.goArr.push(go);
        }
    }
    enterframe(evt) {
        const app = evt.app;
        const myScene = this;
        myScene.sm.update(myScene, app);
        myScene.updatePlayer(app);
        myScene.updateQuest(myScene, app);
        const goArr = myScene.goArr;
        // Bullet.
        goArr.forEach(go => {
            const bullet = go.bullet;
            if (!bullet)
                return;
            const vec = bullet.vec;
            go.sprite.position += vec * app.ticker.deltaTime / 1000;
            if (!MathHelper.isInRange(go.sprite.position, myScene.stageLeft, myScene.stageRight)) {
                go.hasDelete = true;
            }
        });
        // Life.
        goArr.forEach(go => {
            const life = go.life;
            if (!life)
                return;
            if (0 < life.hp)
                return;
            {
                const effect = new GameObject();
                effect.name = 'effect';
                effect.type = GameObjectType.EFFECT;
                effect.sprite.character = '*';
                effect.sprite.priority = 3;
                effect.sprite.position = go.sprite.position;
                effect.effect = new Effect();
                effect.effect.duration = 500;
                this.goArr.push(effect);
            }
            go.hasDelete = true;
        });
        // Effect.
        goArr.forEach(go => {
            const effect = go.effect;
            if (!effect)
                return;
            effect.time += app.ticker.deltaTime;
            if (effect.time < effect.duration)
                return;
            go.hasDelete = true;
        });
        // 衝突判定.
        myScene.updateHit(goArr, go => go.type === GameObjectType.PLAYER, go => go.type === GameObjectType.ENEMY);
        myScene.updateHit(goArr, go => go.type === GameObjectType.PLAYER_BULLET, go => go.type === GameObjectType.ENEMY);
        // 掃除.
        for (var i = goArr.length - 1; 0 <= i; i--) {
            const go = goArr[i];
            if (!go.hasDelete)
                continue;
            goArr.splice(i, 1);
        }
        // 描画.
        var sprites = [];
        myScene.goArr.forEach((go) => {
            if (!go.sprite)
                return;
            sprites.push(go.sprite);
        });
        sprites.sort((a, b) => {
            var cmp = a.priority - b.priority;
            return cmp;
        });
        for (let i = 0; i < myScene.lines.length; i++) {
            var line = myScene.lines[i];
            for (let j = 0; j < 32; j++) {
                line[j] = ' ';
            }
        }
        sprites.forEach((sprite) => {
            myScene.lines[0][Math.floor(sprite.position)] = sprite.character;
        });
        var text = '';
        for (let i = 0; i < myScene.lines.length; i++) {
            var line = myScene.lines[i];
            for (let j = 0; j < 32; j++) {
                text += line[j];
            }
            text += '\n';
        }
        text += 'loop: ' + myScene.questLoopCount;
        myScene.mainLabel.text = text;
    }
}
HogeScene.characterCollisionDict = {
    'p': (1 << 0) | (1 << 1) | (1 << 2),
    '-': (0 << 0) | (1 << 1) | (0 << 2),
    '~': (0 << 0) | (1 << 1) | (0 << 2),
    '_': (0 << 0) | (0 << 1) | (1 << 2),
    '^': (0 << 1) | (0 << 0) | (1 << 0),
};
phina.define('MainScene', {
    superClass: 'DisplayScene',
    init: function (options) {
        this.superInit(options);
        this.myScene = new HogeScene(this);
        console.log('fuga');
    },
    update: function () {
        var scene = this.myScene;
    }
});
// メイン処理
phina.main(function () {
    // アプリケーション生成
    let app = GameApp({
        startLabel: 'main',
        fps: 60,
        width: DF.SC_W,
        height: DF.SC_H,
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
