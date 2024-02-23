async function fetchApiKey() {
  // URL of your Cloud Function
  const functionUrl = 'https://us-central1-chatbot-413804.cloudfunctions.net/gptapi2';

  try {
    const response = await fetch(functionUrl, {
      method: 'GET', // or 'POST' if your function expects a POST request
      headers: {
        'Content-Type': 'application/json',
        // Add any other headers your Cloud Function requires
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.apiKey; // Assuming the API key is returned in a property named apiKey
    } else {
      // Handle HTTP error responses
      console.error('Failed to fetch the API key:', response.statusText);
      return null;
    }
  } catch (error) {
    // Handle network errors
    console.error('Network error when fetching the API key:', error);
    return null;
  }
}

// Global variable to hold the unique session ID
    var globalUniqueId;
    
    // Function to generate a unique 10-character combination of letters and numbers
    function generateUniqueId() {
        let uniqueId = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < 10; i++) {
            uniqueId += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return uniqueId;
    }
    
    
    // Setup to capture user input on Enter key press
    document.addEventListener('DOMContentLoaded', (event) => {
        const inputField = document.getElementById('userInput');
    
        inputField.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault(); // Prevent the default action to avoid submitting a form
                sendToGPT4(); // Call your function to send the message
            }
        });
    });
    
    // Define conversation history array
    let conversationHistory = [];
    
    // Function to handle the display toggle of the chatbox
    function toggleChat() {
    var chatbox = document.getElementById("chatbox");
    var chatButton = document.getElementById("chatButton"); // Get the chat button by its ID

    if (chatbox.style.display === "none" || chatbox.style.display === "") {
        chatbox.style.display = "flex"; // Show the chatbox
        chatButton.textContent = "Close Chat"; // Change button text to "Close chat"
        chatButton.classList.add("chat-open"); // Add class when chat is open
    } else {
        chatbox.style.display = "none"; // Hide the chatbox
        chatButton.textContent = "Ask me anything!"; // Change button text back
        chatButton.classList.remove("chat-open"); // Remove class when chat is closed
    }
}

    // Function to format the bot's response
function formatResponse(text) {
    // Convert markdown links to HTML with inline CSS for links
    let formattedText = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s"']*)\)/g, function(match, label, url) {
        return '<a href="' + url + '" target="_blank" style="text-decoration: underline; color: blue;">' + label + '</a>';
    });

    // Then, convert any remaining plain URLs into clickable links with inline CSS
    const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])(?=\s|$)/ig;
    formattedText = formattedText.replace(urlRegex, function(url) {
        return '<a href="' + url + '" target="_blank" style="text-decoration: underline; color: blue;">' + url + '</a>';
    });

    // Apply other formatting (bold, line breaks)
    formattedText = formattedText
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/\n/g, '<br>'); // Line breaks

    return formattedText;
}


let docContent;

window.onload = function() {
  
    //Generate SessionID
    globalUniqueId = generateUniqueId();
    console.log("SessionID Generated:", globalUniqueId);
  
    // URL of the text file you want to read
    const docUrl = 'https://script.google.com/macros/s/AKfycbx2Oq6Og9pB5DqJBF5j-k_aVbEDGOYSwsK5sjAIGL6ntK7hl6ZH9tWBDeIb_3rFMACS/exec';

    fetch(docUrl)
      .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.text();
      })
      .then(text => {
        // Store the fetched text in the global variable
        docContent = text;

        // You can now use globalTextContent anywhere in your script after it's been loaded
      })
      .catch(error => {
        console.error('There was a problem with your fetch operation:', error);
      });
};


async function sendToGPT4() {
    document.getElementById("loadingSpinner").style.display = "block";
    const userInputField = document.getElementById('userInput');
    const userPrompt = userInputField.value.trim();
    const apiKey = await fetchApiKey();
    const url = "https://api.openai.com/v1/chat/completions";

    if (!userPrompt) {
        document.getElementById("loadingSpinner").style.display = "none";
        return; // Ignore empty input
    }

    appendMessage(userPrompt, 'user');
    userInputField.value = ''; // Clear the input after sending


    const payload = {
        model: 'gpt-4-turbo-preview',
        messages: [...conversationHistory, {
            "role": "system",
            "content": docContent
        }, {
            "role": "user",
            "content": userPrompt
        }],
        temperature: 1,
        max_tokens: 4000,
    };

    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + apiKey
        },
        body: JSON.stringify(payload)
    };

    try {
        const response = await fetch(url, options);
        const jsonResponse = await response.json();
        const botResponse = jsonResponse.choices[0].message.content.trim();

        // Update conversation history
        conversationHistory.push({role: "user", content: userPrompt});
        conversationHistory.push({role: "assistant", content: botResponse});

        // Display bot response
        appendMessage(formatResponse(botResponse), 'bot');
        
        // Log the conversation
        logConversation(userPrompt, botResponse);
    } catch (e) {
        console.error('Error calling GPT-4 API:', e);
        appendMessage('Error: Could not retrieve response.', 'bot');
    } finally {
        document.getElementById("loadingSpinner").style.display = "none";
    }

    userInputField.focus(); // Keep focus on the input field
}
    
    // Function to append messages to the chat
    function appendMessage(text, sender) {
        const chatDiv = document.getElementById('chat');
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);
        messageDiv.innerHTML = `${sender === 'user' ? 'You' : 'CM'}: ${formatResponse(text)}`;
        chatDiv.appendChild(messageDiv);
        chatDiv.scrollTop = chatDiv.scrollHeight; // Auto-scroll to the latest message
    }
    
    // Function to log conversation to Google Sheets
    async function logConversation(userMessage, botMessage) {
        const scriptUrl = 'https://script.google.com/macros/s/AKfycbx4w2T7hOVwnuVyh19pFCnBtLg_1fCpysTNbp2ZrJBu1FW_SXgcl2hoZCdtq4wPTEvh/exec';
        const payload = { sessionId: globalUniqueId, user: userMessage, bot: botMessage };
    
        fetch(scriptUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        }).then(response => console.log("Logged to Sheet", response))
          .catch(error => console.error("Error logging to Sheet", error));
    }
