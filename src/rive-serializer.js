var fs = require('fs');

// A very simple dictionary <-> file serializer

function writeDictionaryToFile(dictionary, filename)
{
    // Open the file
    var file = fs.createWriteStream(filename);

    // For each key-value pair in the dictionary...
    for (var key in dictionary)
    {
        // ...write the key and value to the file
        file.write(`+ ${key}\n`);
        file.write(`- ${dictionary[key]}\n`);
    }

    // Close the file
    file.end();
}

function appendDictionaryToFile(dictionary, filename)
{
    // Open the file
    var file = fs.appendFile(filename);

    // For each key-value pair in the dictionary...
    for (var key in dictionary)
    {
        // ...write the key and value to the file
        file.write(`+ ${key}\n`);
        file.write(`- ${dictionary[key]}\n`);
    }

    // Close the file
    file.end();
}

function readDictionaryFromFile(filename)
{
    // Open the file
    var file = fs.createReadStream(filename);

    // Create a dictionary
    var dictionary = {};

    // For each line in the file...
    file.on('line', (line) => {
        // ...add the key and value to the dictionary
        if (line.startsWith("+"))
        {
            dictionary[line.substring(2)] = "";
        }
        else if (line.startsWith("-"))
        {
            dictionary[Object.keys(dictionary)[Object.keys(dictionary).length - 1]] = line.substring(2);
        }
    });

    // Return the dictionary
    return dictionary;
}
