const qrcode = require('qrcode-terminal');
const axios = require('axios');

const fs = require('fs');
var mysql = require('mysql');
const stringSimilarity = require('string-similarity');

const { Client, LocalAuth } = require('whatsapp-web.js');
const client = new Client({
    authStrategy: new LocalAuth()
});
console.log('Client is getting ready!');

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
    console.log('Client checking auth!');
});

client.on('ready', () => {
    console.log('Client is ready!');
});

async function fetchResponses(message) {
    const url = 'http://localhost:11434/api/generate';
    const requestBody = {
        model: 'llama2',
        prompt: 'You are assistant at Lvato offers web hosting domain registration services. Reply the user in short answer with the question: '+ message.trim() +''
    };

    try {
        const responses = [];

        // Make the HTTP request
        const response = await axios.post(url, requestBody);

        // Combine responses
        response.data.forEach(data => {
            responses.push(data.response);
        });

        // Combine all responses
        const combinedResponse = responses.join('');

        // Trim and return the combined response
        return combinedResponse.trim();
    } catch (error) {
        console.error('Error fetching responses:', error);
        return null;
    }
}
// Object to store the last message received from each user
const lastMessages = {};

client.on('message', message => {

    const conn = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "12345678",
      database: "chatapp"
    });
    
    // Admin Info
    var raw_receiver = "+923310000000";
    var raw_receiver_id = "1";
    // User
    var raw_mobile = "";
    var raw_user_id = "";
    var raw_name = "";
    // Load a JSON object to store the messages and responses
    const autoResponsesLi = JSON.parse(fs.readFileSync('data/autoreplies.json'));
    const productResponsesLi = JSON.parse(fs.readFileSync('data/products.json'));
    // Load the JSON data from file
    const messageResponsesLi = JSON.parse(fs.readFileSync('data/messages.json'));

    // Get the timestamp of the last message received from the user
    const lastMessageTime = lastMessages[message.from];
    // Check if the last message was received more than 10s ago
    if (lastMessageTime && (Date.now() - lastMessageTime) < (1 * 10 * 1000)) {
        // If the last message was received less than 10s ago, do not send a response
        return;
    }

    // Defineing User Data & Flag to check if a match is found
    let matchFound = false;
    const userMessage = message.body.toLowerCase();
    const phoneNumber = message.from.match(/\d+/)[0];
    if (phoneNumber != "" && userMessage != ""){
        conn.connect(function (err) {
            if (err) throw err;
            conn.query("SELECT id, fname, lname FROM users WHERE `whatsapp` = '+" + phoneNumber + "'", function (err, result) {
                if (err) throw err;
        
                if (result && result.length > 0) {
                    // User found in the database
                    const user_info = result[0];
                    const contact = message.getContact();
                    var name = "";
        
                    if (contact && contact.pushname) {
                        // Remove "~" character from the name
                        name = contact.pushname.replace(/~/g, '');
                        console.log("Sender name:" + name);
                        // Check if the name has a space
                        if (name.indexOf(' ') !== -1) {
                            // Split the name into first name and last name based on space
                            const [f_name, l_name] = name.split(' ');
                            name = { f_name, l_name };
                        } else {
                            // Check for multiple capital letters
                            const capitalLetters = name.match(/[A-Z]/g);
                            if (capitalLetters && capitalLetters.length > 1) {
                                // Use the first capital letter as the start of the last name
                                const firstCapitalIndex = name.indexOf(capitalLetters[0]);
                                const f_name = name.substring(0, firstCapitalIndex);
                                const l_name = name.substring(firstCapitalIndex);
                                name = { f_name, l_name };
                            } else {
                                // If none of the above criteria match, consider the entire name as the first name
                                name = { f_name: name, l_name: "" };
                            }
                        }
                    }
        
                    const dataToSend = {
                        user_id: user_info.id,
                        sender: "+" + phoneNumber,
                        receiver: raw_receiver,
                        name: user_info.fname + " " + user_info.lname,
                        receiver_id: raw_receiver_id,
                        message: userMessage,
                        date: new Date().toISOString().slice(0, 19).replace('T', ' ')
                    };
        
                    const sql = `INSERT INTO messages (user_id, sender, receiver, name, receiver_id, message, date) 
                        VALUES (?, ?, ?, ?, ?, ?, ?)`;
                    const values = [
                        dataToSend.user_id,
                        dataToSend.sender,
                        dataToSend.receiver,
                        dataToSend.name,
                        dataToSend.receiver_id,
                        dataToSend.message,
                        dataToSend.date
                    ];
        
                    conn.query(sql, values, function (err, result) {
                        if (err) {
                            console.error('Error inserting message: ' + err.stack);
                        } else {
                            console.log('Message inserted successfully');
                        }
                    });
                } else {
                    // User not found in the database
                    const contact = message.getContact();
                    var name = "";
        
                    if (contact && contact.pushname) {
                        // Remove "~" character from the name
                        name = contact.pushname.replace(/~/g, '');
                        console.log("Sender name:" + name);
                    }
        
                    const newUser = {
                        fname: name.f_name,
                        lname: name.l_name,
                        whatsapp: "+" + phoneNumber,
                        referrer: "Messaged Via Whatsapp",
                        conversion: "unknown"
                    };
        
                    conn.query("INSERT INTO users SET ?", newUser, function (err, result) {
                        if (err) {
                            console.error('Error inserting user: ' + err.stack);
                        } else {
                            console.log('User inserted successfully with ID: ' + result.insertId);
                            // Now, call the callback function with user_info
                            const dataToSend = {
                                user_id: result.insertId,
                                sender: "+" + phoneNumber,
                                receiver: raw_receiver,
                                name: name,
                                receiver_id: raw_receiver_id,
                                message: userMessage,
                                date: new Date().toISOString().slice(0, 19).replace('T', ' ')
                            };
        
                            const sql = `INSERT INTO messages (user_id, sender, receiver, name, receiver_id, message, date) 
                                VALUES (?, ?, ?, ?, ?, ?, ?)`;
                            const values = [
                                dataToSend.user_id,
                                dataToSend.sender,
                                dataToSend.receiver,
                                dataToSend.name,
                                dataToSend.receiver_id,
                                dataToSend.message,
                                dataToSend.date
                            ];
        
                            conn.query(sql, values, function (err, result) {
                                if (err) {
                                    console.error('Error inserting message for new user: ' + err.stack);
                                } else {
                                    console.log('Message inserted successfully for new user');
                                }
                            });
                        }
                    });
                }
            });
        });
    }
    
    // Check if the user's question is already in the JSON file
    let existingResponse = null;
    for (const entry of messageResponsesLi) {
        if (entry.message === userMessage && entry.reply !== '' && entry.reply !== 'nill') {
            console.log('User Message:', userMessage);
            console.log('Entry Reply:', entry.reply);
            existingResponse = entry.reply;
            break;
        }
    }
    if (existingResponse == null) {
        const keywords = ["want", "what", "of", "can", "tell", "about", "details", "detail", "script", "info", "features", "feature"];
        const userWords = userMessage.toLowerCase().split(" ");
        const matchedKeywords = userWords.filter(word => keywords.includes(word));
        let matchingResponses = [];
        if (matchedKeywords.length >= 2) {
            console.log("User: " + userMessage + " --- Checking in Product Replies");
            for (const [key, value] of Object.entries(productResponsesLi)) {
                const messages = value.messages;
                const response = value.response;
                // Find the closest matching message from the current pair's message list
                const matches = stringSimilarity.findBestMatch(userMessage, messages);
                const bestMatch = matches.bestMatch.target;
                // Check if the best match is similar enough to the user's input
                if (matches.bestMatch.rating >= 0.3) {
                    // Add the matching response and its rating to the array
                    matchingResponses.push({ response, rating: matches.bestMatch.rating });
                }
            }
            // Sort the array in descending order of ratings
            matchingResponses.sort((a, b) => b.rating - a.rating);
            // Check if any matching responses were found
            if (matchingResponses.length > 0) {
                // Send the response with the highest rating
                const highestRatedResponse = matchingResponses[0].response;
                console.log("User: " + phoneNumber + " --- Message: " + userMessage + " --- Replied: " + highestRatedResponse);
                client.sendMessage(message.from, highestRatedResponse);
                matchFound = true;
            }
        }
    }
    if (existingResponse) {
        // Send the existing response directly
        console.log("User: " + userMessage + " --- Sent: " + existingResponse);
        client.sendMessage(message.from, existingResponse);
        matchFound = true;
    } else {
        if (matchFound == false) {
            console.log("User: " + userMessage + " --- Checking in Auto Replies");
            // Array to store all matching responses and their ratings
            let matchingResponses = [];
            // Iterate over the message-response pairs in the JSON object
            for (const [key, value] of Object.entries(autoResponsesLi)) {
                const messages = value.messages;
                const response = value.response;
                // Find the closest matching message from the current pair's message list
                const matches = stringSimilarity.findBestMatch(userMessage, messages);
                const bestMatch = matches.bestMatch.target;
                // Check if the best match is similar enough to the user's input
                if (matches.bestMatch.rating >= 0.3) {
                    // Add the matching response and its rating to the array
                    matchingResponses.push({ response, rating: matches.bestMatch.rating });
                }else{
                    console.log("User: " + phoneNumber + " --- User Message: " + userMessage + "  --- Generating AI Reply ");
                   fetchResponses(userMessage)
                    .then(combinedResponse => {
                        console.log("User: " + phoneNumber + " --- User Message: " + userMessage + " --- Sent: " + combinedResponse);
                        client.sendMessage(message.from, combinedResponse);
                    })
                    .catch(error => {
                        console.error('Error:', error);
                    });
                }
            }
            // Sort the array in descending order of ratings
            matchingResponses.sort((a, b) => b.rating - a.rating);

            // Check if any matching responses were found
            if (matchingResponses.length > 0) {
                // Send the response with the highest rating
                const highestRatedResponse = matchingResponses[0].response;
                if (highestRatedResponse != "noreply") {
                    console.log("User: " + phoneNumber + " --- User Message: " + userMessage + " --- Sent: " + highestRatedResponse);
                    client.sendMessage(message.from, highestRatedResponse);
                } else {
                    
                    console.log("User: " + phoneNumber + " --- User Message: " + userMessage + " --- Not Replied: " + highestRatedResponse);
                }
                matchFound = true;
            } else {
                if (phoneNumber != null) {
                    if (phoneNumber != "" || userMessage != "") {
                        // No matching response found, add the user's question to the JSON file
                        messageResponsesLi.push({ message: userMessage, reply: "nill" });
                        const updatedData = JSON.stringify(messageResponsesLi);
                        fs.writeFileSync('messages/data.json', updatedData);
                        console.log("User: " + phoneNumber + " --- User Message: " + userMessage + " --- Not Sent: Not found suitable reply");
                    }
                }

            }
        }
    }
    // If no matching message is found, send a default message after a 1-minute timeout
    if (!matchFound) {
        setTimeout(() => {
            //client.sendMessage(message.from, "Sorry, I didn't understand that message.");
        }, 1 * 10 * 1000); // Wait for 10s (in milliseconds) before sending the message
        // Update the last message received from the user
        lastMessages[message.from] = Date.now();
    }
});
client.initialize();