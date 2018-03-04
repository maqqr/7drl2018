var fs = require('fs');
var parse = require('xml-parser');
var inspect = require('util').inspect;

var xml = fs.readFileSync('tiled/tileset.tsx', 'utf8');

function filterTiles (children) {
    var tileArray = [];
    for (var i=0; i<children.length; i++) {
        var child = children[i];
        if (child.name === 'tile') {
            var tile = {
                id: child.attributes.id,
                type: child.attributes.type
            };

            if (child.children.length > 0) {
                var properties = child.children[0];
                for (var j=0; j<properties.children.length; j++) {
                    var prop = properties.children[j];
                    tile[prop.attributes.name] = prop.attributes.value;
                }
            }
            tileArray.push(tile);
        }
    }
    return tileArray;
}

var obj = parse(xml);
// console.log(inspect(obj.root.children, { colors: true, depth: Infinity }));
var tiles = filterTiles(obj.root.children);

var outputPath = 'data/tileset.json';

var outputObject = {
    '$schema': './tileset-schema.json',
    'tiles': tiles
};

fs.writeFile(outputPath, JSON.stringify(outputObject), function (err) {
    if (err) {
        return console.log(err);
    }
    console.log("Saved tilemap to " + output);
}); 
