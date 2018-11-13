'use strict';

const Fs = require('fs');
const Path = require('path');
const Util = require('util');
const Caller = require('./lib/caller');

const readdir = Util.promisify(Fs.readdir);
const stats = Util.promisify(Fs.stat);

const crawl = async function (dirname, stripextension, filetest) {
    const files = await readdir(dirname);
    const objects = {};

    for (const file of files) {
        const abspath = Path.join(dirname, file);
        const key = file.replace(stripextension, '');
        const stat = await stats(abspath);

        if (stat.isFile()) {
            if (filetest.test(file)) {
                const obj = require(abspath);

                if (!objects[key]) {
                    objects[key] = {};
                }

                for (const [k, v] of Object.entries(obj)) {
                    objects[key][k] = v;
                }
            }
        }
        if (stat.isDirectory()) {
            const next = await crawl(abspath, stripextension, filetest);

            if (Object.keys(next).length) {
                objects[key] = next;
            }
        }
    }

    return objects;
};

const merge = function (dirname = Path.resolve(Path.dirname(Caller())), extensions = ['.json'], callback) {
    const extregex = `.(${extensions.join('|')})$`;
    const stripextension = RegExp(extregex, 'g');
    const filetest = RegExp(`^.*${extregex}`);

    const result = crawl(dirname, stripextension, filetest);

    if (!callback) {
        return result;
    }

    result.then((merged) => callback(null, merged)).catch(callback);
};

module.exports.merge = merge;
