var fs = require("fs"),
    pth = require('path');

exports.ZipUtils = (function() {

    var crcTable = []; // cache crc table

    function mkdirSync(path) {
        var curesolvedPath = path.split('\\')[0];
        path.split('\\').forEach(function(name) {
            if (!name || name.substr(-1,1) == ":") return;
            curesolvedPath += '\\' + name;
            var stat;
            try {
                stat = fs.statSync(curesolvedPath);
            } catch (e) {
                fs.mkdirSync(curesolvedPath);
            }
            if (stat && stat.isFile())
                throw 'There is a file in the way: ' + curesolvedPath;
        });
    }

    return {
        makeDir : function(path) {
            mkdirSync(path);
        },

        crc32 : function(buf) {
            var crc = 0,
                off = 0, len = buf.length, c1 = ~crc;
            if (!crcTable.length) {
                for (var n = 0; n < 256; n++) {
                    var c = n;
                    for (var k = 8; --k >= 0;)
                        if((c & 1) != 0) c = 0xedb88320 ^ (c >>> 1); else c = c >>> 1;
                    crcTable[n] = c;
                }
            }
            while(--len >= 0) c1 = crcTable[(c1 ^ buf[off++]) & 0xff] ^ (c1 >>> 8);
            crc = ~c1;
            return crc & 0xffffffff;
        },

        writeFileTo : function(/*String*/path, /*Buffer*/content, /*Boolean*/overwrite) {
            if (pth.existsSync(path)) {
                if (!overwrite)
                    return false; // cannot overwite

                var stat = fs.statSync(path);
                if (stat.isDirectory()) {
                    return false;
                }
            }
            var folder = pth.dirname(path);
            if (!pth.existsSync(folder)) {
                exports.ZipUtils.makeDir(folder);
            }

            var fd;
            try {
                fd = fs.openSync(path, 'w', 0666);
            } catch(e) {
                fs.chmodSync(path, 0666);
                fd = fs.openSync(path, 'w', 0666);
            }
            if (fd) {
                fs.writeSync(fd, content, 0, content.length, 0);
                fs.closeSync(fd);
            }
            return true;
        }

    }

})();