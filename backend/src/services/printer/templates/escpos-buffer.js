import iconv from 'iconv-lite';

const LF = 0x0A;

export class EscposBuffer {
  constructor(encoding = 'CP437') {
    this.encoding = encoding;
    this.buffers = [];
  }

  _raw(bytes) {
    this.buffers.push(Buffer.from(bytes));
    return this;
  }

  _text(str) {
    if (str) this.buffers.push(iconv.encode(str, this.encoding));
    return this;
  }

  init() {
    return this._raw([0x1B, 0x40]);
  }

  align(n) {
    return this._raw([0x1B, 0x61, n]);
  }

  bold(on) {
    return this._raw([0x1B, 0x45, on ? 1 : 0]);
  }

  size(w, h) {
    return this._raw([0x1D, 0x21, (w - 1) | ((h - 1) << 4)]);
  }

  text(str) {
    return this._text(str)._raw([LF]);
  }

  feed(n) {
    return this._raw([0x1B, 0x64, n]);
  }

  cut() {
    return this._raw([0x1D, 0x56, 0x00]);
  }

  separator(char, len = 32) {
    return this._text((char || '-').repeat(len))._raw([LF]);
  }

  build() {
    return Buffer.concat(this.buffers);
  }
}
