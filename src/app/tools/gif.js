// Generic functions  
var bitsToNum = function (ba) {  //由二进制数组还原成为二进制数值，以十进制表示
  // console.log("ba", ba)
  return ba.reduce(function (s, n) { return s * 2 + n; }, 0);
};

//111
//  1*2 +1   3*2 +1  = 7

var byteToBitArr = function (bite) {//用一个数组来记录一个8位二进制字符得每一位是否有1
  var a = [];
  for (var i = 7; i >= 0; i--) {
    a.push(!!(bite & (1 << i)));
  }
  return a;
};

// Stream
/**
 * @constructor
 */ // Make compiler happy.  让编译器开心



var Stream = function (data) {     //存放有关于流得操作
  this.data = data;
  this.len = this.data.length;
  this.pos = 0;

  this.readByte = function () {  //读取1个字节
    if (this.pos >= this.data.length) {
      throw new Error('Attempted to read past end of stream.');  //读取流得结尾
    }
    return data.charCodeAt(this.pos++) & 0xFF;  //返回字节二进制数据
  };

  this.readBytes = function (n) {  //返回n个字节二进制放进数组
    var bytes = [];
    for (var i = 0; i < n; i++) {
      bytes.push(this.readByte());
    }
    return bytes;
  };

  this.read = function (n) {  //返回字符串数据
    var s = '';
    for (var i = 0; i < n; i++) {
      s += String.fromCharCode(this.readByte());
    }
    return s;
  };

  this.readUnsigned = function () { // Little-endian.  //尾数   unsigned未签名     //读两位字节
    var a = this.readBytes(2);
    // console.log(a)
    return (a[1] << 8) + a[0];
  };

};

var lzwDecode = function (minCodeSize, data) {   //  用于lzw解码   注意:lzw 是gif压缩算法   
  // console.log("minCodeSize", minCodeSize);

  //minCodeSize  LZW压缩的编码长度，也就是要压缩的数据的位数

  // console.log(minCodeSize)
  // TODO: Now that the GIF parser is a bit different, maybe this should get an array of bytes instead of a String?
  // 现在gif解析是bit不同
  var pos = 0; // Maybe this streaming thing should be merged with the Stream?

  var readCode = function (size) { //size = minCodeSize + 1 = 8 8 8 8 7 8 8 7 
    var code = 0;
    for (var i = 0; i < size; i++) {

      if (data.charCodeAt(pos >> 3) & (1 << (pos & 7))) {
        // pos=7  7>>3 = 0   data.charCodeAt(0) = 128   7&7 = 7  1<<7 = 128   128&128=128
        code |= 1 << i;
      }
      // console.log(pos);
      pos++;
    }
    return code;
  };

  var output = [];

  var clearCode = 1 << minCodeSize;
  var eoiCode = clearCode + 1;

  var codeSize = minCodeSize + 1;

  var dict = [];  //dictionary 字典 

  var clear = function () {
    dict = [];
    codeSize = minCodeSize + 1;
    for (var i = 0; i < clearCode; i++) {
      dict[i] = [i];
    }
    dict[clearCode] = [];
    dict[eoiCode] = null;

  };

  var code;
  var last;

  while (true) {
    last = code;
    code = readCode(codeSize);

    if (code === clearCode) {
      clear();
      continue;
    }
    if (code === eoiCode) break;

    if (code < dict.length) {
      if (last !== clearCode) {
        dict.push(dict[last].concat(dict[code][0]));
      }
    } else {
      if (code !== dict.length) throw new Error('Invalid LZW code.');
      dict.push(dict[last].concat(dict[last][0]));
    }
    output.push.apply(output, dict[code]);

    if (dict.length === (1 << codeSize) && codeSize < 12) {
      // If we're at the last code and codeSize is 12, the next code will be a clearCode, and it'll be 12 bits long.
      codeSize++;
    }
  }

  // I don't know if this is technically an error, but some GIFs do it.
  //if (Math.ceil(pos / 8) !== data.length) throw new Error('Extraneous LZW bytes.');
  return output;
};

// The actual parsing; returns an object with properties.
var parseGIF = function (st, handler) {  //解析gif
  // console.log("st", st, "hd", handler)
  handler || (handler = {});

  // LZW (GIF-specific)
  var parseCT = function (entries) { // Each entry is 3 bytes, for RGB.
    var ct = [];
    for (var i = 0; i < entries; i++) {
      ct.push(st.readBytes(3));
    }
    return ct;
  };

  var readSubBlocks = function () { //解析数据块
    var size, data;
    data = '';
    do {
      size = st.readByte(); //第一个字节（byte）记录块数据的大小  最大255  
      data += st.read(size);
    } while (size !== 0);
    return data;
  };

  var parseHeader = function () {   //解析头部  
    var hdr = {};
    hdr.sig = st.read(3);  //读取3字节数据
    // pos = 3

    hdr.ver = st.read(3);  //读取3字节数据
    // console.log(st.pos);
    // pos = 6
    if (hdr.sig !== 'GIF') throw new Error('Not a GIF file.'); // XXX: This should probably be handled more nicely.

    hdr.width = st.readUnsigned();  //readUnsigned 读取2字节
    // pos = 8
    hdr.height = st.readUnsigned(); //读取2字节
    //pos = 10
    var bits = byteToBitArr(st.readByte());   //读取1字节
    // pos  = 11
    hdr.gctFlag = bits.shift();

    //gctFlag global color table flag  全局颜色列表标志

    hdr.colorRes = bitsToNum(bits.splice(0, 3));
    hdr.sorted = bits.shift();
    hdr.gctSize = bitsToNum(bits.splice(0, 3));
    // 全局颜色列表大小,gctSize+1确定颜色列表的索引数(2^(gctSize+1)); 
    // console.log("hdr.gctSize", hdr.gctSize)

    hdr.bgColor = st.readByte();
    //背景颜色:背景颜色在全局颜色列表中的索引(PS:是索引而不是RGB值,所以如果没有全局颜色列表时,该值没有意义); 

    hdr.pixelAspectRatio = st.readByte(); // if not 0, aspectRatio = (pixelAspectRatio + 15) / 64


    if (hdr.gctFlag) {
      console.log("size",hdr.gctSize);
      //gctFlag  为true 时，具有全局颜色列表
      hdr.gct = parseCT(1 << (hdr.gctSize + 1));
    }
    handler.hdr && handler.hdr(hdr);
  };

  var parseExt = function (block) {   //解析扩展  
    var parseGCExt = function (block) {   // raphic Control 图形控制扩展(Graphic Control Extension)
      var blockSize = st.readByte(); // Always 4

      var bits = byteToBitArr(st.readByte());
      block.reserved = bits.splice(0, 3); // Reserved; should be 000.  //前三位保留 000
      block.disposalMethod = bitsToNum(bits.splice(0, 3));  //处理方法  0或1
      // console.log("block.disposalMethod ", block.disposalMethod);
      block.userInput = bits.shift();  //用户输入标志
      block.transparencyGiven = bits.shift();  //透明标志

      block.delayTime = st.readUnsigned();   //延迟时间

      block.transparencyIndex = st.readByte();  //透明颜色索引

      block.terminator = st.readByte();    //标识块终结

      handler.gce && handler.gce(block);
    };

    var parseComExt = function (block) {  // 解析注释扩展
      block.comment = readSubBlocks();
      handler.com && handler.com(block);
    };

    var parsePTExt = function (block) {  //图形文本扩展  没有人使用过这个扩展，如果有需要请自行解析
      // No one *ever* uses this. If you use it, deal with parsing it yourself.
      var blockSize = st.readByte(); // Always 12
      block.ptHeader = st.readBytes(12);
      block.ptData = readSubBlocks();
      handler.pte && handler.pte(block);
    };

    var parseAppExt = function (block) {  //应用程序扩展
      var parseNetscapeExt = function (block) {
        var blockSize = st.readByte(); // Always 3
        block.unknown = st.readByte(); // ??? Always 1? What is this?
        block.iterations = st.readUnsigned();
        block.terminator = st.readByte();
        handler.app && handler.app.NETSCAPE && handler.app.NETSCAPE(block);
      };

      var parseUnknownAppExt = function (block) {
        block.appData = readSubBlocks();
        // FIXME: This won't work if a handler wants to match on any identifier.
        handler.app && handler.app[block.identifier] && handler.app[block.identifier](block);
      };

      var blockSize = st.readByte(); // Always 11
      block.identifier = st.read(8);
      block.authCode = st.read(3);
      switch (block.identifier) {
        case 'NETSCAPE':
          parseNetscapeExt(block);
          break;
        default:
          parseUnknownAppExt(block);
          break;
      }
    };

    var parseUnknownExt = function (block) {
      block.data = readSubBlocks();
      handler.unknown && handler.unknown(block);
    };

    block.label = st.readByte();
    // console.log("block.label", block.label)
    switch (block.label) {
      case 0xF9:       // 0xF9  249  ù  graphic control extension  图形控制扩展
        block.extType = 'gce';
        parseGCExt(block);
        break;
      case 0xFE:     // 0xFE  254  þ comment  注释扩展
        block.extType = 'com';
        parseComExt(block);
        break;
      case 0x01:     //0x01 1   plain text  //  图形文本扩展 
        block.extType = 'pte';
        parsePTExt(block);
        break;
      case 0xFF:     //0xFF 255  ÿ  application-specific  应用程序扩展
        block.extType = 'app';
        parseAppExt(block);
        break;
      default:        //没有扩展
        block.extType = 'unknown';
        parseUnknownExt(block);
        break;
    }
  };

  var parseImg = function (img) {
    var deinterlace = function (pixels, width) {  //交织
      // Of course this defeats the purpose of interlacing. And it's *probably*
      // the least efficient way it's ever been implemented. But nevertheless...

      var newPixels = new Array(pixels.length);
      var rows = pixels.length / width;
      var cpRow = function (toRow, fromRow) {
        var fromPixels = pixels.slice(fromRow * width, (fromRow + 1) * width);
        newPixels.splice.apply(newPixels, [toRow * width, width].concat(fromPixels));
      };

      // See appendix E.
      var offsets = [0, 4, 2, 1];
      var steps = [8, 8, 4, 2];

      var fromRow = 0;
      for (var pass = 0; pass < 4; pass++) {
        for (var toRow = offsets[pass]; toRow < rows; toRow += steps[pass]) {
          cpRow(toRow, fromRow)
          fromRow++;
        }
      }

      return newPixels;
    };

    img.leftPos = st.readUnsigned();
    img.topPos = st.readUnsigned();
    img.width = st.readUnsigned();
    img.height = st.readUnsigned();
    // console.log()

    var bits = byteToBitArr(st.readByte());
    img.lctFlag = bits.shift();
    // lctFlag  local color table flag 局部颜色列表

    img.interlaced = bits.shift();
    img.sorted = bits.shift();
    img.reserved = bits.splice(0, 2);
    img.lctSize = bitsToNum(bits.splice(0, 3));
    //确定颜色列表的索引数(2^(lctSize+1))
    if (img.lctFlag) {
      // 当lctFlag 为true 时  具备局部颜色列表并且使用局部颜色列表作为当前帧色板
      img.lct = parseCT(1 << (img.lctSize + 1));
    }

    img.lzwMinCodeSize = st.readByte();

    var lzwData = readSubBlocks();

    img.pixels = lzwDecode(img.lzwMinCodeSize, lzwData);

    if (img.interlaced) { // Move
      img.pixels = deinterlace(img.pixels, img.width);
    }

    handler.img && handler.img(img);
  };

  var parseBlock = function () {
    var block = {};
    block.sentinel = st.readByte();
    // console.log("block.sentinel", String.fromCharCode(block.sentinel))
    switch (String.fromCharCode(block.sentinel)) { // For ease of matching
      case '!':  // 0x21 ! 图形扩展标识   解析图形控制扩展(Graphic Control Extension)
        block.type = 'ext';
        parseExt(block);
        break;
      case ',':  // 0x2C 图象标识符(Image Descriptor)  ,字符开始
        block.type = 'img';
        parseImg(block);
        break;
      case ';':   //0x3B  gif文件结束
        block.type = 'eof';
        handler.eof && handler.eof(block);
        break;
      default:
        throw new Error('Unknown block: 0x' + block.sentinel.toString(16)); // TODO: Pad this with a 0.
    }

    if (block.type !== 'eof') setTimeout(parseBlock, 0);
  };

  var parse = function () {
    parseHeader();
    setTimeout(parseBlock, 0);
  };

  parse();
};

// BEGIN_NON_BOOKMARKLET_CODE
if (typeof exports !== 'undefined') {
  exports.Stream = Stream;
  exports.parseGIF = parseGIF;
}
// END_NON_BOOKMARKLET_CODE
