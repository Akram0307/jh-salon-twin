const { genkit, z } = require('genkit');
const { vertexAI } = require('@genkit-ai/vertexai');

async function test() {
    const ai = genkit({
        plugins: [vertexAI({ location: 'us-central1', projectId: 'salon-saas-487508' })],
    });

    const myTool = ai.defineTool({
        name: 'getWeather',
        description: 'Gets the weather for a location',
        inputSchema: z.object({ location: z.string() }),
        outputSchema: z.string()
    }, async (input) => {
        console.log('Tool called with:', input);
        return `The weather in ${input.location} is sunny.`;
    });

    try {
        console.log("Calling ai.generate...");
        const response = await ai.generate({
            model: 'vertexai/gemini-2.0-flash',
            prompt: 'What is the weather in London?',
            tools: [myTool]
        });
        
        console.log('Response text:', response.text);
        console.log('Tool requests:', JSON.stringify(response.toolRequests, null, 2));
    } catch (e) {
        console.error(e);
    }
}

test();
