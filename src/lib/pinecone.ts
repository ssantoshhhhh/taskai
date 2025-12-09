
// Utility to interact with Pinecone and generate Embeddings directly from the client side
// bypassing Supabase Edge Functions.

interface PineconeConfig {
  apiKey: string;
  indexName: string;
  environment: string;
  host?: string;
  lovableApiKey?: string;
}

const getPineconeConfig = (): PineconeConfig | null => {
  const apiKey = import.meta.env.VITE_PINECONE_API_KEY;
  const indexName = import.meta.env.VITE_PINECONE_INDEX_NAME;
  const environment = import.meta.env.VITE_PINECONE_ENVIRONMENT;
  const host = import.meta.env.VITE_PINECONE_HOST;
  const lovableApiKey = import.meta.env.VITE_LOVABLE_API_KEY;

  if (!apiKey || (!indexName && !host)) {
    console.warn('Pinecone credentials missing. Set VITE_PINECONE_... in .env');
    return null;
  }

  if (!lovableApiKey) {
    console.warn('Lovable API Key missing. Embeddings will fail using real model.');
  }

  return { apiKey, indexName, environment, host, lovableApiKey };
};

// Generate Real Embeddings using Google Gemini API (via Lovable Key)
// This ensures compatibility with n8n's "Google Gemini Embeddings" node
const generateEmbedding = async (text: string): Promise<number[]> => {
  const config = getPineconeConfig();
  if (!config?.lovableApiKey) {
    throw new Error("Missing VITE_LOVABLE_API_KEY for embeddings.");
  }

  // Google Gemini API Endpoint for Embeddings
  const url = `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${config.lovableApiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: "models/embedding-001",
      content: { parts: [{ text }] }
    })
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("Embedding Error:", err);
    throw new Error(`Failed to generate embedding: ${err}`);
  }

  const data = await response.json();
  // extracting the 768-dimensional vector
  return data.embedding.values;
};

export const pinecone = {
  async indexTask(task: { id: string, title: string, description?: string | null, status: string, priority: string }) {
    await this.genericIndex({
      id: `task_${task.id}`,
      text: `Title: ${task.title}\nDescription: ${task.description || ''}\nStatus: ${task.status}\nPriority: ${task.priority}`,
      metadata: {
        type: 'task',
        taskId: task.id,
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        text: `Title: ${task.title}\nDescription: ${task.description || ''}` // Add text field for RAG
      }
    });
  },

  async deleteTask(taskId: string) {
    await this.genericDelete([`task_${taskId}`]);
  },

  async indexNote(note: { id: string, content: string }) {
    await this.genericIndex({
      id: note.id,
      text: note.content,
      metadata: {
        type: 'note',
        noteId: note.id,
        content: note.content.substring(0, 2000),
        text: note.content.substring(0, 2000) // Standard field for LangChain/n8n
      }
    });
  },

  async deleteNote(noteId: string) {
    await this.genericDelete([noteId]);
  },

  // Generic helper
  async genericIndex(item: { id: string, text: string, metadata: any }) {
    const config = getPineconeConfig();
    if (!config) return;

    try {
      console.log(`Generating embedding for ${item.id}...`);
      const embedding = await generateEmbedding(item.text);

      const host = config.host && config.host.startsWith('http') ? config.host : `https://${config.indexName}-${config.environment}.svc.pinecone.io`;
      const url = `${host}/vectors/upsert`;

      console.log(`Upserting to Pinecone: ${url}`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Api-Key': config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vectors: [{
            id: item.id,
            values: embedding,
            metadata: item.metadata
          }]
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }
      console.log('Successfully indexed in Pinecone');
    } catch (error) {
      console.error("Pinecone Indexing Error:", error);
      throw error; // Re-throw to show in Toast
    }
  },

  async genericDelete(ids: string[]) {
    const config = getPineconeConfig();
    if (!config) return;

    const host = config.host && config.host.startsWith('http') ? config.host : `https://${config.indexName}-${config.environment}.svc.pinecone.io`;
    const url = `${host}/vectors/delete`;

    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Api-Key': config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      });
      console.log('Deleted from Pinecone');
    } catch (error) {
      console.error("Pinecone Deletion Error:", error);
    }
  }
};
