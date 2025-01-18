
require('dotenv').config();
import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_KEY;
const OPENAI_BASE_URL = 'https://api.openai.com/v1';

export const openai = new OpenAI({
    apiKey: OPENAI_API_KEY
});
