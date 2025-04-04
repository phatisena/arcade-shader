namespace SpriteKind {
    export const Shader = SpriteKind.create();
}

//% color="#9e6eb8" icon="\uf0eb"
namespace shader {
    const shade04 = (hex`E0E0E0E0E0E0E0E0E0E0E0E0E0E0E0E0`) // very light
    const shade03 = (hex`C0C3C0C0C3C0C3C0C3C0C0C0C0C0C0C0`) // medium light
    const shade02 = (hex`A0A4A0A3A3A1A3A7A0A7A3A0A0A3A0A0`) // low light
    const shade01 = (hex`8082858481BCB7B9A3B9B4B585B485B0`) // a little light
    const shade1 = (hex`0F0D0A0B0E0408060C060B0C0F0B0C0F`)  // a little dark
    const shade2 = (hex`0F0B0F0C0C0E0C080F080C0F0F0C0F0F`)  // low dark
    const shade3 = (hex`0F0C0F0F0F0C0F0C0F0C0F0F0F0F0F0F`)  // medium dark
    const shade4 = (hex`00000000000000000000000000000000`)  // very dark
    let screenRowsBuffer: Buffer;
    let maskRowsBuffer: Buffer;

    export enum ShadeLevel {
        //% block="dark one"
        Dark1 = 1,
        //% block="dark two"
        Dark2 = 2,
        //% block="dark three"
        Dark3 = 3,
        //% block="dark four"
        Dark4 = 4,
        //% block="light one"
        Light1 = 5,
        //% block="light two"
        Light2 = 6,
        //% block="light three"
        Light3 = 7,
        //% block="light four"
        Light4 = 8,
    }

    class ShaderSprite extends Sprite {
        protected shadePalette: Buffer;
        shadeRectangle: boolean;

        constructor(image: Image, shadePalette: Buffer) {
            super(image);
            this.shadePalette = shadePalette;
            this.shadeRectangle = true;
        }

        setShadeImage(image: Image = null, shadePalette: Buffer = null) {
            if (image) this.setImage(image);
            if (shadePalette) this.shadePalette = shadePalette
        }

        __drawCore(camera: scene.Camera) {
            if (this.isOutOfScreen(camera)) return;

            const ox = (this.flags & sprites.Flag.RelativeToCamera) ? 0 : camera.drawOffsetX;
            const oy = (this.flags & sprites.Flag.RelativeToCamera) ? 0 : camera.drawOffsetY;

            const l = this.left - ox;
            const t = this.top - oy;

            if (this.shadeRectangle) {
                screen.mapRect(l, t, this.image.width, this.image.height, this.shadePalette);
            }
            else {
                shadeImage(screen, l, t, this.image, this.shadePalette);
            }


            if (this.flags & SpriteFlag.ShowPhysics) {
                const font = image.font5;
                const margin = 2;
                let tx = l;
                let ty = t + this.height + margin;
                screen.print(`${this.x >> 0},${this.y >> 0}`, tx, ty, 1, font);
                tx -= font.charWidth;
                if (this.vx || this.vy) {
                    ty += font.charHeight + margin;
                    screen.print(`v${this.vx >> 0},${this.vy >> 0}`, tx, ty, 1, font);
                }
                if (this.ax || this.ay) {
                    ty += font.charHeight + margin;
                    screen.print(`a${this.ax >> 0},${this.ay >> 0}`, tx, ty, 1, font);
                }
            }

            // debug info
            if (game.debug) {
                screen.drawRect(
                    Fx.toInt(this._hitbox.left) - ox,
                    Fx.toInt(this._hitbox.top) - oy,
                    Fx.toInt(this._hitbox.width),
                    Fx.toInt(this._hitbox.height),
                    1
                );
            }
        }
    }


    function shadeImage(target: Image, left: number, top: number, mask: Image, palette: Buffer) {
        if (!screenRowsBuffer || screenRowsBuffer.length < target.height) {
            screenRowsBuffer = pins.createBuffer(target.height);
        }
        if (!maskRowsBuffer || maskRowsBuffer.length < target.height) {
            maskRowsBuffer = pins.createBuffer(mask.height);
        }

        let targetX = left | 0;
        let targetY = top | 0;
        let y: number;
        let x: number;

        for (x = 0; x < mask.width; x++, targetX++) {
            if (targetX >= target.width) break;
            else if (targetX < 0) continue;

            mask.getRows(x, maskRowsBuffer);
            target.getRows(targetX, screenRowsBuffer);

            for (y = 0, targetY = top | 0; y < mask.height; y++, targetY++) {
                if (targetY >= target.height) break;
                else if (targetY < 0) continue;

                if (maskRowsBuffer[y]) screenRowsBuffer[targetY] = palette[screenRowsBuffer[targetY]];
            }
            target.setRows(targetX, screenRowsBuffer)
        }
    }

    function shadeitem(shadeLevel: number): Buffer {
        switch (shadeLevel) {
            case 1: return shade1;
            case 2: return shade2;
            case 3: return shade3;
            case 4: return shade4;
            case 5: return shade01;
            case 6: return shade02;
            case 7: return shade03;
            case 8: return shade04;
        }
        return shade1
    }

    //% blockId=shader_createRectangularShaderSprite
    //% block="create rectangular shader with width $width height $height shade $shadeLevel"
    //% shadeLevel.shadow=shader_shadelevel
    //% width.defl=16
    //% height.defl=16
    //% blockSetVariable=myShader
    //% weight=90
    export function createRectangularShaderSprite(width: number, height: number, shadeLevel: number): Sprite {
        const scene = game.currentScene();

        let palette: Buffer;

        palette = shadeitem(shadeLevel);
        const i = image.create(width, height);
        i.fill(3);

        const sprite = new ShaderSprite(i, palette)
        sprite.setKind(SpriteKind.Shader);
        scene.physicsEngine.addSprite(sprite);

        return sprite
    }

    //% blockId=shader_createImageShaderSprite
    //% block="create image shader with $image shade $shadeLevel"
    //% image.shadow=screen_image_picker
    //% shadeLevel.shadow=shader_shadelevel
    //% blockSetVariable=myShader
    //% weight=100
    export function createImageShaderSprite(image: Image, shadeLevel: number): Sprite {
        const scene = game.currentScene();

        let palette: Buffer;

        palette = shadeitem(shadeLevel);

        const sprite = new ShaderSprite(image, palette)
        sprite.setKind(SpriteKind.Shader);
        scene.physicsEngine.addSprite(sprite);
        sprite.shadeRectangle = false;

        return sprite
    }

    //% blockId=shader_setShadeImage
    //% block=" $spr set shade image to $img=screen_image_picker"
    //% spr.shadow=variables_get spr.defl=myShader
    //% weight=80
    export function setImage(spr: ShaderSprite, img: Image) {
        spr.setShadeImage(img);
    }

    //% blockId=shader_setShadeLevel
    //% block=" $spr set shade level to $shadeLevel=shader_shadelevel"
    //% spr.shadow=variables_get spr.defl=myShader
    //% weight=70
    export function setShade(spr: ShaderSprite, shadeLevel: number) {
        let palette: Buffer;
        palette = shadeitem(shadeLevel)
        spr.setShadeImage(null,palette);
    }

    //% blockId=shader_shadelevel
    //% block="$level"
    //% shim=TD_ID
    //% weight=50
    export function _shadeLevel(level: ShadeLevel): number {
        return level;
    }
}
