const fs = require('fs');
const rl = require('readline').createInterface({
  input: fs.createReadStream('C:/Users/houra/.gemini/antigravity/brain/3b1b5560-97f3-4161-9330-5834c7343bf5/.system_generated/logs/transcript_full.jsonl')
});
rl.on('line', (line) => {
  if (line.includes('bro do not use the classes')) {
    const data = JSON.parse(line);
    const start = data.content.indexOf('<div class="m6QErb');
    if (start !== -1) {
      fs.writeFileSync('test.html', data.content.substring(start));
    }
    process.exit(0);
  }
});
