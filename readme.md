This project utilizes the WhatsApp web through the whatsapp-web.js library to automate responses to user messages. It integrates with a MySQL database for user management and stores message-response pairs in JSON files. Additionally, it interacts with an AI model for generating responses to user queries.
Installation

Ensure you have Node.js and npm installed on your machine. Then, run the following command to install the necessary dependencies:

```npm install qrcode-terminal axios mysql string-similarity whatsapp-web.js```


Setting Up MySQL Database

This project assumes you have a MySQL database set up. Ensure you have the following credentials or edit from index.js:

    Host: localhost
    Username: root
    Password: 12345678
    Database Name: chatapp

    Make Sure to create the tables for in the database you can use xammp for that table to create :

    messages (user_id, sender, receiver, name, receiver_id, message, date)
    users (id, fname, lname, whatsapp)

Modify these details in the code if your setup differs.
Usage

    Clone this repository to your local machine.
    Navigate to the project directory and run the following command:

```node <filename>.js```

Replace <filename> with the name of the file containing the provided code.

    Scan the QR code displayed in the terminal using your WhatsApp account to authenticate the WhatsApp Web session.
    Once authenticated, the client will be ready to respond to incoming messages automatically.

Functionality

    Automated Responses: The system responds to user messages automatically based on predefined responses stored in JSON files.
    MySQL Integration: Manages user data such as name, WhatsApp number, and messages exchanged with the system using a MySQL database.
    AI Response Generation: Utilizes an external AI model to generate responses to user queries if no predefined response is found.
    QR Code Authentication: Uses QR code authentication for WhatsApp Web session initialization.

Note

    Ensure your MySQL server is running and accessible.
    Modify file paths and database credentials according to your environment.
    Adjust AI response generation as per your AI model's endpoints and requirements.

Acknowledgments

This project utilizes the following npm packages:

    qrcode-terminal
    axios
    mysql
    string-similarity
    whatsapp-web.js

Problems: 
This code is perfect i have been using it for our website but you will face the issue with whatsapp web js in the initial setup once that is fixed you are ready to go!

To use the ai watch this video:
https://youtu.be/K9TehImvXOQ

Licence:
LL Lvato License