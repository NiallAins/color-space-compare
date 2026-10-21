class ColorSpacePicker {
    ID = Math.random().toString().substring(2, 8);
    W = 255;
    CAN_S = 1.5;
    SPACES = [
        'rgb',
        'hsl',
        'hsv',
        'hwb',
        'xyz',
        'lch',
        'lab',
        'cmyk',
        // 'oklab',
        // 'oklch',
        // 'srgb-linear',
        // 'display-p3'
    ];
    RANGES = [
        [[0, 255], [0, 255], [0, 255], [0, 1]],
        [[0, 360], [0, 100], [0, 100], [0, 1]],
        [[0, 360], [0, 100], [0, 100], [0, 1]],
        [[0, 360], [0, 100], [0, 100], [0, 1]],
        [[0, 1], [0, 1], [0, 1], [0, 1]],
        [[0, 100], [0, 150], [0, 360], [0, 1]],
        [[0, 100], [-125, 125], [-125, 125], [0, 1]],
        [[0, 1], [0, 1], [0, 1], [0, 1]]
    ];
    SVG_TRANS = `url("data:image/svg+xml,%3Csvg width='12' height='12' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='6' height='6' x='0' y='0' fill='%23dde' /%3E%3Crect width='6' height='6' x='6' y='6' fill='%23ddd' /%3E%3C/svg%3E")`;

    EL_SLIDER_PRIMARY;
    EL_SLIDER_SECONDARY;
    EL_SAMPLE;
    EL_THUMB_CONTAIN;
    EL_THUMB;
    EL_SPACE;
    EL_SAMPLE_CAN;
    EL_SAMPLE_BG_CAN;
    SAMPLE_CTX;
    SAMPLE_BG_CTX;

    thumbDrag = false;
    comps = [this.W, 0, 0, this.W];
    currentSpace = 0;

    TEMPLATE = `
        <div class="picker__container">
            <div class="picker__sample">
                <canvas
                    id="CSP_${this.ID}_SAMPLE_BG_CAN"
                    class="picker__sample-bg-can"
                ></canvas>
                <div
                    id="CSP_${this.ID}_SAMPLE"
                    class="picker__sample-container"
                >
                    <canvas
                        id="CSP_${this.ID}_SAMPLE_CAN"
                        class="picker__sample-can"
                    ></canvas>
                    <div
                        id="CSP_${this.ID}_THUMB_CONTAIN"
                        class="picker__thumb-container"
                        tabindex="0"
                    >
                        <div
                            id="CSP_${this.ID}_THUMB"
                            class="picker__thumb"
                        ></div>
                    </div>
                </div>
            </div>
            <div class="picker__slider-secondary">
                <input
                    id="CSP_${this.ID}_SLIDER_SECONDARY"
                    type="range"
                    class="picker__slider-secondary-input"
                    min="0"
                    max="255"
                    step="1"
                    value="255"
                />
            </div>
            <select
                id="CSP_${this.ID}_SPACE"
                class="picker__swatch"
                value="0"
            ></select>
            <div class="picker__slider-primary">
                <input
                    id="CSP_${this.ID}_SLIDER_PRIMARY"
                    type="range"
                    class="picker__slider-primary-input"
                    min="0"
                    max="255"
                    value="255"
                    step="1"
                />
            </div>
        </div>  
  `;

    constructor(parentEl, spaceIndex) {
        parentEl.innerHTML += this.TEMPLATE;
        this.EL_SLIDER_PRIMARY = parentEl.querySelector(`#CSP_${this.ID}_SLIDER_PRIMARY`);
        this.EL_SLIDER_SECONDARY = parentEl.querySelector(`#CSP_${this.ID}_SLIDER_SECONDARY`);
        this.EL_SAMPLE = parentEl.querySelector(`#CSP_${this.ID}_SAMPLE`);
        this.EL_THUMB_CONTAIN = parentEl.querySelector(`#CSP_${this.ID}_THUMB_CONTAIN`);
        this.EL_THUMB = parentEl.querySelector(`#CSP_${this.ID}_THUMB`);
        this.EL_SPACE = parentEl.querySelector(`#CSP_${this.ID}_SPACE`);
        this.EL_SAMPLE_CAN = parentEl.querySelector(`#CSP_${this.ID}_SAMPLE_CAN`);
        this.EL_SAMPLE_BG_CAN = parentEl.querySelector(`#CSP_${this.ID}_SAMPLE_BG_CAN`);
        this.SAMPLE_CTX = this.EL_SAMPLE_CAN.getContext('2d');
        this.SAMPLE_BG_CTX = this.EL_SAMPLE_BG_CAN.getContext('2d');

        this.EL_SPACE.oninput = e => this._setSpace(e.target.value);
        this.EL_SLIDER_PRIMARY.oninput = e => this._animateUpdateComp(0, parseInt(e.target.value));
        this.EL_SLIDER_SECONDARY.oninput = e => this._animateUpdateComp(3, parseInt(e.target.value));
        this.EL_THUMB_CONTAIN.onmousedown = e => this.thumbDrag = true;
        this.EL_THUMB_CONTAIN.ontouchstart = e => this.thumbDrag = true;
        this.EL_THUMB_CONTAIN.onclick = e => this._setThumb(e, true);
        const EL_CONTAINER = parentEl.querySelector('.picker__container')
        EL_CONTAINER.onmousemove = e => this._setThumb(e);
        EL_CONTAINER.ontouchmove = e => this._setThumb(e);
        EL_CONTAINER.onmouseup = e => this.thumbDrag = false;
        EL_CONTAINER.ontouchend = e => this.thumbDrag = false;
        EL_CONTAINER.onmouseleave = e => this.thumbDrag = false;

        const CSS_W = (this.W + 1) * this.CAN_S;
        this.EL_SAMPLE_CAN.width =
            this.EL_SAMPLE_CAN.height =
            this.EL_SAMPLE_BG_CAN.width =
            this.EL_SAMPLE_BG_CAN.height =
            CSS_W;
        this.SAMPLE_BG_CTX.strokeStyle = this.SAMPLE_CTX.strokeStyle = '#888';
        this.SAMPLE_CTX.setLineDash([1, 4]);
        this.SAMPLE_CTX.fillStyle = '#fff';

        this.EL_SAMPLE_CAN.style.background = this.SVG_TRANS;
        this.EL_SAMPLE_CAN.style.width =
            this.EL_SAMPLE_CAN.style.height =
            this.EL_SAMPLE_BG_CAN.style.width =
            this.EL_SAMPLE_BG_CAN.style.height =
            CSS_W + 'px';
        this.EL_SPACE.innerHTML = this.SPACES
            .reduce((ops, o, oi) => ops + `<option value="${oi}">${o}</option>`, '');
        this._updateSampleCanBg(this.SAMPLE_BG_CTX);
        this._animateUpdateComp();

        if (spaceIndex) {
            this._setSpace(spaceIndex);
        }
    }

    setComps(arr) {
        if (arr[1] !== this.comps[1] || arr[2] !== this.comps[2]) {
            this.EL_THUMB.style.left = arr[1] + 'px';
            this.EL_THUMB.style.bottom = arr[2] + 'px';
            this._animateUpdateComp(1, arr[1], true);
            this._animateUpdateComp(2, arr[2], true);
        }
        if (arr[0] !== this.comps[0]) {
            this._animateUpdateComp(0, arr[0], true);
            this.EL_SLIDER_PRIMARY.value = arr[0];
        }
        if (arr[3] !== this.comps[3]) {
            this._animateUpdateComp(3, arr[3], true);
            this.EL_SLIDER_SECONDARY.value = arr[3];
        }
    }

    _colorToCssString(c) {
        return this.SPACES[this.currentSpace] === 'cmyk'
            ? this._colorToString(this._convertTo(0, c), 0)
            : this.SPACES[this.currentSpace] === 'hsv'
                ? this._colorToString(this._convertTo(1, c), 1)
                : this._colorToString(c);
    }

    _colorToString(c, spaceIndex = this.currentSpace) {
        const
            S = this.SPACES[spaceIndex],
            R = this.RANGES[spaceIndex];
        c = c.map((c, i) => {
            const V = R[i][0] + ((R[i][1] - R[i][0]) * (c / this.W));
            return spaceIndex === 0 && i < 2 ? Math.floor(V) : Math.floor(V * 10) / 10;
        });
        return S === 'cmyk'
            ? `cmyk(${c.join(' ')})`
            : (S === 'xyz' ? 'color(xyz ' : S + '(') +
            c.slice(0, 3).join(' ') +
            (c[3] === 1 ? ')' : ' / ' + c[3] + ')');
    }

    _animateUpdateComp(i, value, noPerc) {
        window.requestAnimationFrame(() => this._updateComp(i, value, noPerc));
    }

    _updateComp(i, value, noPerc) {
        if (typeof i !== 'undefined') {
            this.comps[i] = value;
        }

        if (i === 1) {
            return;
        }

        if (i !== 0) {
            let grad = [];
            for (let s = 0; s < 7; s++) {
                grad.push(this._colorToCssString(
                    this.comps.map((c, ci) => ci === 0 ? (s / 6) * this.W : c)
                ));
            }
            this.EL_SLIDER_PRIMARY.style.background = `linear-gradient(90deg, ${grad.join()}), ${this.SVG_TRANS}`;
        }
        if (i !== 3) {
            this.EL_SLIDER_SECONDARY.style.background =
                `linear-gradient(90deg, ${this._colorToCssString([this.comps[0], this.comps[1], this.comps[2], 0])
                }, ${this._colorToCssString([this.comps[0], this.comps[1], this.comps[2], this.W])
                }), ` +
                this.SVG_TRANS;
        }
        if (i !== 1 && i !== 2) {
            this._updateSampleCan(this.SAMPLE_CTX);
        }
        if (i === 3) {
            this._updateSampleCanBg(this.SAMPLE_BG_CTX);
        }

        this.EL_SPACE.children[this.currentSpace].innerHTML = this._colorToString(this.comps);
        this.EL_SPACE.style.background = this._colorToCssString(this.comps);
        const L = this._convertTo(1);
        this.EL_SPACE.style.color = (this.W - L[2]) * (L[3] / this.W) > this.W * 0.55 ? '#fff' : '#000';

        if (!noPerc) {
            pickers.forEach(p => {
                if (p !== this) {
                    p.setComps(
                        this.currentSpace === p.currentSpace
                            ? this.comps
                            : this._convertTo(p.currentSpace)
                    );
                }
            });
        }
    }

    _setSpace(spaceIndex) {
        this.comps = this._convertTo(spaceIndex)
            .map((c, ci) => Math.max(0, Math.min(this.W, c)));
        this.EL_SLIDER_PRIMARY.value = this.comps[0];
        this.EL_SLIDER_SECONDARY.value = this.comps[3];
        this.EL_THUMB.style.left = this.comps[1] + 'px';
        this.EL_THUMB.style.bottom = this.comps[2] + 'px';
        this.EL_SPACE.children[this.currentSpace].innerText = this.SPACES[this.currentSpace];
        this.currentSpace = spaceIndex;
        this.EL_SPACE.value = this.currentSpace;
        this._updateSampleCanBg(this.SAMPLE_BG_CTX);
        this._animateUpdateComp();
    }

    _setThumb(e, click) {
        if (click || this.thumbDrag) {
            const
                BOX = this.EL_THUMB_CONTAIN.getBoundingClientRect(),
                X = Math.max(0, Math.min(this.W, e.clientX - BOX.left)),
                Y = Math.max(0, Math.min(this.W, this.W - e.clientY + BOX.top));
            this.EL_THUMB.style.left = X + 'px';
            this.EL_THUMB.style.bottom = Y + 'px';
            this._animateUpdateComp(1, X);
            this._animateUpdateComp(2, Y);
        }
    }

    _updateSampleCanBg(c) {
        let
            w = this.EL_SAMPLE_BG_CAN.width,
            data = new ImageData(w, w),
            i = ((w * w / 6) + (w / 3)) * 4;

        for (let y = 0; y <= this.W; y += 4) {
            for (let x = 0; x <= this.W; x++) {
                const C = this._convertTo(0, [y, x, this.W, this.comps[3]]);
                data.data[i] = C[0];
                data.data[i + 1] = C[1];
                data.data[i + 2] = C[2];
                data.data[i + 3] = C[3];
                i += 4;
            }
            i += (w - this.W - 1 - 2) * 4;
        }

        for (let x = 0; x <= this.W; x += 2) {
            for (let y = 0; y <= this.W; y++) {
                const C = this._convertTo(0, [(this.W - x), 255, (this.W - y), this.comps[3]]);
                i = (
                    (w * w / 3) +
                    (w * 2 / 3) +
                    (x * 0.5) +
                    (w * y) -
                    (w * Math.floor(x * 0.25))
                ) * 4;
                data.data[i] = C[0];
                data.data[i + 1] = C[1];
                data.data[i + 2] = C[2];
                data.data[i + 3] = C[3];
            }
        }

        c.putImageData(data, 0, 0);
        c.beginPath();
        c.moveTo(0, w / 3);
        c.lineTo(w * 2 / 6, w / 6);
        c.lineTo(w - 1, w / 6);
        c.lineTo(w - 1, w * 5 / 6);
        c.lineTo(w * 2 / 3, w - 1);
        c.moveTo(w - 1, w / 6);
        c.lineTo(w * 2 / 3, w / 3);
        c.stroke();
    }

    _updateSampleCan(c) {
        let
            w = (this.W + 1),
            data = new ImageData(w, w),
            i = 0;
        for (let y = w - 1; y >= 0; y--) {
            for (let x = 0; x < w; x++) {
                const C = this._convertTo(0, [this.comps[0], x, y, this.comps[3]])
                data.data[i] = C[0];
                data.data[i + 1] = C[1];
                data.data[i + 2] = C[2];
                data.data[i + 3] = C[3];
                i += 4;
            }
        }

        c.fillRect(0, 0, w * this.CAN_S, w * this.CAN_S);

        const OFFSET = ((this.W - this.comps[0]) / this.W) * this.W * (1 - this.CAN_S);
        c.save();
            c.translate(OFFSET, OFFSET * -0.5);
            c.beginPath();
                c.moveTo(w * 0.5, w - 1);
                c.lineTo(w - 1, w * 0.75);
            c.stroke();
        c.restore();
        c.putImageData(data, w * 0.5, 0);
        c.save();
            c.fillRect(w * 0.5, w - 1, w - 2, (w * 0.5) - 1);
            c.translate(OFFSET, OFFSET * -0.5);
                c.beginPath();
                c.moveTo(w * 0.5, 0);
                c.lineTo(w * 1.5, w * -0.5);
                c.moveTo(w * 1.5, 0);
                c.lineTo(w * 2.5, w * -0.5);
                c.moveTo(w * 1.5, w - 1);
                c.lineTo(w * 2.5, w * 0.5);
                if (this.comps[0] < this.W) {
                    c.rect(w * 0.5, 0, w - 1, w - 1);
                }
            c.stroke();
        c.restore();
        c.save();
            c.setLineDash([]);
            c.beginPath();
                c.rect((w * 0.5) + 1, 1, w - 3, w - 1);
            c.stroke();
        c.restore();

        this.EL_SAMPLE.style.right =
            OFFSET + 'px';
        this.EL_SAMPLE.style.top =
            (OFFSET * 0.5) + 'px';
    }

    _convertTo(spaceIndex, values = this.comps) {
        return this.convertTo(spaceIndex, values.map(v => v / this.W))
            .map(v => Math.min(this.W, Math.max(0, v * this.W)));
    }

    convertTo(spaceIndex, values) {
        let
            src = this.SPACES[this.currentSpace],
            tar = this.SPACES[spaceIndex];

        if (src === 'hsv' || src === 'hwb' || src === 'hsl') {
            if (src !== 'hsl') {
                values = Object.values(this[src + '_hsl'](...values));
                src = 'hsl';
            }
            if (tar === 'hsl') {
                return values;
            }
            if (tar === 'hsv' || tar === 'hwb') {
                return Object.values(this['hsl_' + tar](...values));
            }
        }

        if (src !== 'rgb') {
            values = Object.values(this[src + '_rgb'](...values));
        }
        if (tar === 'rgb') {
            return values;
        }
        if (tar === 'hsv' || tar === 'hwb' || tar === 'hsl') {
            values = Object.values(this['rgb_hsl'](...values));
            if (tar === 'hsl') {
                return values
            }
            return Object.values(this['hsl_' + tar](...values));
        } else {
            return Object.values(this['rgb_' + tar](...values));
        }
    }

    rgb_hsl(r, g, b, a) {
        const
            MAX = Math.max(r, g, b),
            MIN = Math.min(r, g, b);

        let h, s, l = (MAX + MIN) / 2;

        if (MAX === MIN) {
            h = s = 0;
        } else {
            let d = MAX - MIN;
            s = l > 0.5 ? d / (2 - MAX - MIN) : d / (MAX + MIN);
            switch (MAX) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return { h, s, l, a };
    }

    hsl_rgb(h, s, l, a) {
        let r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            const
                q = l < 0.5 ? l * (1 + s) : l + s - l * s,
                p = 2 * l - q;
            r = this._hueToRgb(p, q, h + (1 / 3));
            g = this._hueToRgb(p, q, h);
            b = this._hueToRgb(p, q, h - (1 / 3));
        }

        return { r, g, b, a };
    }

    _hueToRgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    }

    hsl_hsv(h, sI, l, a) {
        let
            v = l + (sI * Math.min(l, 1 - l)),
            s = v === 0 ? 0 : 2 * (1 - (l / v));

        return { h, s, v, a };
    }

    hsv_hsl(h, sI, v, a) {
        let
            l = v * (1 - (sI / 2)),
            s = l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l);
        return { h, s, l, a };
    }

    hsl_hwb(h, s, l, a) {
        const HSV = this.hsl_hsv(h, s, l, a);
        return {
            h,
            w: HSV.v * (1 - HSV.s),
            b: 1 - HSV.v,
            a
        };
    }

    hwb_hsl(h, w, b, a) {
        let wb = w + b;
        if (wb > 1) {
            w /= wb;
            b /= wb;
        }
        let
            s = 1 - (w / (1 - b)),
            v = 1 - b;
        return this.hsv_hsl(h, s, v, a);
    }

    rgb_xyz(r, g, b, a) {
        [r, g, b] = [r, g, b]
            .map(c =>
                c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
            );

        return {
            x: (0.4124 * r) + (0.3576 * g) + (0.1805 * b),
            y: (0.2126 * r) + (0.7152 * g) + (0.0722 * b),
            z: (0.0193 * r) + (0.1192 * g) + (0.9505 * b),
            a
        };
    }

    xyz_rgb(x, y, z, a) {
        let
            r = (x * 3.2406) + (y * -1.5372) + (z * -0.4986),
            g = (x * -0.9689) + (y * 1.8758) + (z * 0.0415),
            b = (x * 0.0557) + (y * -0.2040) + (z * 1.0570);

        [r, g, b] = [r, g, b]
            .map(n => n > 0.0031308
                ? 1.055 * Math.pow(n, (1 / 2.4)) - 0.055
                : 12.92 * n);

        return { r, g, b, a };
    }

    rgb_lab(r, g, b, a) {
        const
            SX = 95.0489,
            SY = 100.000,
            SZ = 108.884;

        let { x, y, z } = this.rgb_xyz(r, g, b, a);

        x *= 100;
        y *= 100;
        z *= 100;

        [x, y, z] = [x / SX, y / SY, z / SZ]
            .map(c => c > 0.008856
                ? Math.pow(c, 1 / 3)
                : (7.787 * c) + (16 / 116));

        let
            l = (116 * y) - 16,
            aa = 500 * (x - y),
            bb = 200 * (y - z);

        return {
            l: l / 100,
            aa: Math.min(125, Math.max(-125, (aa / 250))) + 0.5,
            b: Math.min(125, Math.max(-125, (bb / 250))) + 0.5,
            a
        }
    }

    lab_rgb(l, aa, b, a) {
        const
            SX = 95.0489,
            SY = 100.000,
            SZ = 108.884;

        l *= 100;
        aa = (aa - 0.5) * 250;
        b = (b - 0.5) * 250;

        let
            y = (l + 16) / 116,
            x = aa / 500 + y,
            z = y - b / 200;

        [x, y, z] = [x, y, z]
            .map(c => Math.pow(c, 3) > 0.008856
                ? Math.pow(c, 3)
                : (c - 16 / 116) / 7.787);

        return this.xyz_rgb(
            (x * SX) / 100,
            (y * SY) / 100,
            (z * SZ) / 100,
            a
        );
    }

    rgb_lch(r, g, b, a) {
        const LAB = this.rgb_lab(r, g, b);
        let
            c = Math.sqrt(Math.pow(LAB.aa, 2) + Math.pow(LAB.b, 2)) / Math.sqrt(2),
            h = Math.atan2(LAB.b, LAB.aa);
        h = h < 0 ? h + (Math.PI * 2) : h;
        h /= Math.PI * 2;

        return {
            l: LAB.l,
            c,
            h,
            a
        }
    }

    lch_rgb(l, c, h, a) {
        return this.lab_rgb(
            l,
            ((Math.cos(h * Math.PI * 2) * c) + 1) / 2,
            ((Math.sin(h * Math.PI * 2) * c) + 1) / 2,
            a
        );
    }

    rgb_cmyk(r, g, b, a) {
        const K = 1 - Math.max(r, g, b);

        return {
            c: ((1 - r - K) / (1 - K)) * a,
            m: ((1 - g - K) / (1 - K)) * a,
            y: ((1 - b - K) / (1 - K)) * a,
            k: K * a,
        };
    }

    cmyk_rgb(c, m, y, k) {
        return {
            r: (1 - c) * (1 - k),
            g: (1 - m) * (1 - k),
            b: (1 - y) * (1 - k),
            a: 1
        }
    }
}

let pickers = [];

[0, 2, 7, 6].forEach(i => {
    let div = document.createElement('div');
    pickers.push(new ColorSpacePicker(div, i));
    document.body.appendChild(div);
});