// MongoDB Atlas Data API fallback for production
const MONGODB_DATA_API_URL = 'https://data.mongodb-api.com/app/data-xxxxx/endpoint/data/v1';
const MONGODB_DATA_API_KEY = process.env.MONGODB_DATA_API_KEY;

export async function findUserByUsername(username: string) {
  if (!MONGODB_DATA_API_KEY) {
    throw new Error('MongoDB Data API key not configured');
  }

  try {
    const response = await fetch(`${MONGODB_DATA_API_URL}/action/findOne`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': MONGODB_DATA_API_KEY,
      },
      body: JSON.stringify({
        collection: 'users',
        database: 'CRM_AdminPanel',
        filter: { username: username }
      })
    });

    if (!response.ok) {
      throw new Error(`Data API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.document;
  } catch (error) {
    console.error('MongoDB Data API error:', error);
    throw error;
  }
}

export async function findUserByName(name: string) {
  if (!MONGODB_DATA_API_KEY) {
    throw new Error('MongoDB Data API key not configured');
  }

  try {
    const response = await fetch(`${MONGODB_DATA_API_URL}/action/findOne`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': MONGODB_DATA_API_KEY,
      },
      body: JSON.stringify({
        collection: 'users',
        database: 'CRM_AdminPanel',
        filter: { name: name }
      })
    });

    if (!response.ok) {
      throw new Error(`Data API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.document;
  } catch (error) {
    console.error('MongoDB Data API error:', error);
    throw error;
  }
}
