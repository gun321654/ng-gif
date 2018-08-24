
var playGIF = (function () {
  var stream;
  var hdr;

  var loadError = null;

  var transparency = null;
  var delay = null;
  var disposalMethod = null;
  var lastDisposalMethod = null;
  var frame = null;

  var frames = [];
  var reset = function () {
    transparency = null;
    delay = null;
    lastDisposalMethod = disposalMethod;
    disposalMethod = null;
    frame = null;
    frames = [];
  };
  var clear = function () {
    transparency = null;
    delay = null;
    lastDisposalMethod = disposalMethod;
    disposalMethod = null;
    frame = null;
  };


  //gif header info  base info 
  var doHdr = function (_hdr) {
    hdr = _hdr;
    tmpCanvas.width = hdr.width;
    tmpCanvas.height = hdr.height;
  };

  var doGCE = function (gce) {
    pushFrame();
    clear();
    transparency = gce.transparencyGiven ? gce.transparencyIndex : null;
    delay = gce.delayTime;
    disposalMethod = gce.disposalMethod;
  };

  var pushFrame = function () {
    if (!frame) return;
    frames.push({
      data: frame.getImageData(0, 0, hdr.width, hdr.height),
      delay: delay
    });
  };
  //图片数据
  var doImg = function (img) {

    if (!frame) frame = tmpCanvas.getContext('2d');
    var ct = img.lctFlag ? img.lct : hdr.gct; // TODO: What if neither exists?
    var cData = frame.getImageData(img.leftPos, img.topPos, img.width, img.height);
    img.pixels.forEach(function (pixel, i) {
      // cData.data === [R,G,B,A,...]
      if (transparency !== pixel) { // This includes null, if no transparency was defined.
        cData.data[i * 4 + 0] = ct[pixel][0];
        cData.data[i * 4 + 1] = ct[pixel][1];
        cData.data[i * 4 + 2] = ct[pixel][2];
        cData.data[i * 4 + 3] = 255; // Opaque.
      } else {
        if (lastDisposalMethod === 2 || lastDisposalMethod === 3) {
          cData.data[i * 4 + 3] = 0; // Transparent.
          // XXX: This is very very wrong.
        } else {
        }
      }
    });
    frame.putImageData(cData, img.leftPos, img.topPos);
  };





  var doNothing = function () { };

  var withProgress = function (fn, draw) {
    return function (block) {
      fn(block);
    };
  };


  var handler = {
    hdr: withProgress(doHdr),    //hdr  解析头部完成时的回调函数
    gce: withProgress(doGCE),     //  解析到 图像扩展标识符时的回调
    com: withProgress(doNothing), // 解析到注释扩展标识的回调
    app: {
      NETSCAPE: withProgress(doNothing)  //解析到app扩展标识的回调
    },
    img: withProgress(doImg),     //解析一副图像数据的回调
    eof: function (block) {        //解析结束的回调


    }
  };



  var tmpCanvas = document.createElement('canvas');
  document.body.appendChild(tmpCanvas);

  var doParse = function (stream, callback) {
    try {
      handler.eof = function () {
        pushFrame();
        callback(hdr, frames, tmpCanvas);

      }
      reset();
      parseGIF(stream, handler);
    } catch (err) {
      throw new Error('parse error.' + err);
    }
  };
  return {
    doParse: doParse
  };
})();




