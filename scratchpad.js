const http = require('http');

http.get('http://localhost:3000/api/users', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const users = JSON.parse(data);
    console.log("Raw MySQL Users Output:");
    console.log(users);
    
    // Test the mock logic
    const booleanFields = ['approved', 'blocked', 'flagged', 'reported'];
    const mockMapped = users.map(u => {
      let result = {};
      for (let key in u) {
        let val = u[key];
        if (booleanFields.includes(key)) {
          if (val === 1) val = true;
          if (val === 0) val = false;
        }
        result[key] = val;
      }
      return result;
    });
    console.log("\nMock Mapped Users:");
    console.log(mockMapped);
  });
});
