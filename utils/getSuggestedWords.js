async function getSuggestedKeywordsFromGPT(commentary, score) {
    const prompt = `
You are a cricket video analysis assistant...
Commentary: "${commentary}"
Score: ${score}
Respond with keywords joined by underscores like: 'Rohit_Sharma_lofted_drive_long_off_6_runs'`;

    const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
            { role: "system", content: "You are a cricket video analysis assistant." },
            { role: "user", content: prompt }
        ]
    });

    return response.data.choices[0].message.content.trim();
}
