
export async function generateContent(apiKey, prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const data = {
        contents: [{
            parts: [{
                text: prompt
            }]
        }]
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const result = await response.json();
        // Extract text from Gemini response
        if (result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts) {
            return result.candidates[0].content.parts[0].text;
        } else {
             console.error("Unexpected response structure:", result);
             return "I'm not sure what you mean.";
        }

    } catch (error) {
        console.error("Gemini API call failed:", error);
        return "I'm having trouble thinking right now.";
    }
}
