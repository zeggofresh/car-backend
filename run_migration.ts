async function run() {
  try {
    const response = await fetch('http://localhost:3001/api/migrate_v2');
    const data = await response.json();
    console.log('Migration result:', data);
  } catch (err) {
    console.error('Failed to call migration API:', err);
  }
}
run();
