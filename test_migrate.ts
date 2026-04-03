import axios from 'axios';
async function run() {
  try {
    const res = await axios.get('http://localhost:3001/api/migrate_v2');
    console.log(res.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error:', error.response?.data || error.message);
    } else {
      console.error('Error:', error);
    }
  }
}
run();
