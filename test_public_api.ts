async function run() {
  try {
    const response = await fetch('http://localhost:3001/api/public');
    const data = await response.json();
    console.log('Public API result:', data);
  } catch (err) {
    console.error('Failed to call public API:', err);
  }
}
run();
