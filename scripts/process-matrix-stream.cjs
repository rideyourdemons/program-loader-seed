const { OpenAI } = require('openai');

// Initialize OpenAI with your environment variable
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * processMatrixStream
 * Handles a chunk of your 173k nodes and streams a response from GPT-4o.
 * @param {Array} nodeChunk - A subset of your matrix data.
 */
async function processMatrixStream(nodeChunk) {
  console.log(`\n[Matrix Bridge] Analyzing ${nodeChunk.length} nodes...`);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are the Matrix Orchestrator. Analyze these data nodes for architectural patterns and suggest the next tool-rotation.',
        },
        {
          role: 'user',
          content: `Data Chunk: ${JSON.stringify(nodeChunk)}`,
        },
      ],
      stream: true,
    });

    // Stream the output directly to the terminal for "Go Time" monitoring
    for await (const part of response) {
      process.stdout.write(part.choices[0]?.delta?.content || '');
    }
  } catch (error) {
    console.error('\n[!] Bridge Failure:', error.message);
  }
}

module.exports = { processMatrixStream };
