var fs = require('fs');
// First, import the OpenAI class from the SDK
const { OpenAI } = require('openai-api');
const { get } = require('tmi.js/lib/utils');

// Then, instantiate the class with your API key
const openai = new OpenAI(process.env.OPENAI_API_KEY);

function buildBot(prompt, questionSetPath, botPath, callback)
{
    if (prompt == null || prompt == "")
    {
        console.error("Prompt is null or empty");
        return;
    }

    if (questionSetPath == null || questionSetPath == "")
    {
        console.error("Question set path is null or empty");
        return;
    }

    if (botPath == null || botPath == "")
    {
        console.error("Bot path is null or empty");
        return;
    }

    if (!fs.existsSync(questionSetPath))
    {
        console.error("Question set does not exist");
        return;
    }

    // Create the bot directory if it doesn't exist
    if (!fs.existsSync(botPath)) 
    {
        fs.mkdirSync(botPath);
    }

    // Read the question set from the file
    var questionSet = readQuestionSetFromFile(questionSetPath);
    console.log(questionSet);

    return;

    // Define the stream
    const stream = openai.complete({
        prompt: prompt,
        engine: process.env.OPEN_AI_GPT3_ENGINE,
        temperature: process.env.OPEN_AI_GPT3_TEMPERATURE,
        maxTokens: process.env.OPEN_AI_GPT3_MAX_TOKENS,
        topP: process.env.OPEN_AI_GPT3_TOP_P,
        frequencyPenalty: process.env.OPEN_AI_GPT3_FREQUENCY_PENALTY,
        presencePenalty: process.env.OPEN_AI_GPT3_PRESENCE_PENALTY,
        stop: process.env.OPEN_AI_GPT3_STOP,
        n: process.env.OPEN_AI_GPT3_N,
        stream: process.env.OPEN_AI_GPT3_STREAM,
        logprobs: process.env.OPEN_AI_GPT3_LOG_PROBABILITY,
        bestOf: process.env.OPEN_AI_BEST_OF,
    });

    let botDictionary = {};
    // For each question in the question set...
    for (var i = 0; i < questionSet.length; i++)
    {
        // ...add the response from the API to the dictionary
        botDictionary[questionSet[i]] = getResponse(questionSet[i]);
    }

    // Write the dictionary to a file
    appendDictionaryToFile(botDictionary, $(path + "/questions.rive"));

    callback();
}

function getResponse(message)
{
    output = "";
    // Send the prompt to the API
    stream.write(message + "\n");

    // Get the output
    stream.on('data', (chunk) => {
        console.log(chunk);
        output += chunk;
    });

    // Handle errors
    stream.on('error', (err) => {
        console.log(err);
    });

    // Handle end of stream
    stream.on('end', () => {
        console.log('end');
    });

    // Return the output
    return output;
}

// function that opens a file and reads the questions into an array
function readQuestionSetFromFile(filename)
{
    // Open the file
    var file = fs.createReadStream(filename);

    // Create an array
    var questionSet = [];

    // For each line in the file...
    file.on('line', (line) => {
        // ...add the line to the array
        questionSet.push(line);
    });

    file.on('error', (err) => {
        console.log(err);
    });

    file.on('end', () => {
    });

    // Return the array
    return questionSet;
}