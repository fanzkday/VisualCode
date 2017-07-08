const Path = require('path');
const shell = require('shelljs');
const { buildRelations, getFileModuleName } = require('./util.js');
const { initStructure , saveStructure } = require('../model/data.js');

const rootdir = process.cwd();
const config = require(`${rootdir}/.soyz/config.json`);
const idel = config.idel;
const autoSaveInterval = config.autoSaveInterval;

const structure = initStructure();

exports.socketHandle = socket => {
    //自动保存
    const timer = setInterval(() => {
        saveStructure();
    }, autoSaveInterval * 60 * 1000);

    socket.on('close', () => {
        clearInterval(timer);
        saveStructure();
    })
    //服务器推送数据
    socket.on('init', () => {
        socket.emit('init', structure);
    })
    //修改bat的pos坐标
    socket.on('position', data => {
        if (Array.isArray(data)) {
            data.forEach(item => {
                updatePosition(structure.relations, item);
            })
            saveStructure();
        } else {
            updatePosition(structure.relations, data);
        }
    })
    //bat之间建立引用关系
    socket.on('build-relation', relation => {
        buildRelations(relation);
    })
    //用编辑器打开文件进行修改
    socket.on('edit-file', name => {
        const path = `${rootdir}${name}`.replace('/entry', '');
        shell.exec(`"${idel}" ${path}`);
    })
    //获取文件暴露出来的模块
    socket.on('get-file-module-names', filename => {
        getFileModuleName(filename);
    })
}

//遍历object， 修改数据
function updatePosition(structure, item) {
    for (var key in structure) {
        const element = structure[key];
        if (typeof element === 'object' && element.id === item.batteryId) {
            element.pos.x = item.currX;
            element.pos.y = item.currY;
        }
    }
}
