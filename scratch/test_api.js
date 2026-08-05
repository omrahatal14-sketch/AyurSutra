async function run() {
  const res = await fetch('http://localhost:3000/api/payments/session/2/remaining-order', {
    method: 'POST'
  });
  const data = await res.json();
  console.log("Response:", data);
}
run();
