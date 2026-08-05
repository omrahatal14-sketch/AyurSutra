const http = require('http');

http.get('http://localhost:3000/api/users', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const users = JSON.parse(data);
    const booleanFields = ['approved', 'blocked', 'flagged', 'reported'];
    
    users.forEach(u => {
      let d = {};
      for (let key in u) {
        let val = u[key];
        if (booleanFields.includes(key)) {
          if (val === 1) val = true;
          if (val === 0) val = false;
        }
        d[key] = val;
      }
      
      console.log(`Evaluating Doctor: ${d.name} (${d.email})`);
      console.log(`role === "doctor" -> ${d.role === "doctor"}`);
      console.log(`approved === true -> ${d.approved === true} (raw approved: ${d.approved})`);
      console.log(`blocked !== true -> ${d.blocked !== true} (raw blocked: ${d.blocked})`);
      
      if (d.role === "doctor" && d.approved === true && d.blocked !== true) {
        console.log("=> MATCH! This doctor would be added to the dropdown.");
      } else {
        console.log("=> NO MATCH.");
      }
      console.log('---');
    });
  });
});
