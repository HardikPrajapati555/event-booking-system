const { createObjectCsvWriter } = require('csv-writer');

const generateCSV = async (data) => {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Extract headers from first object
  const headers = Object.keys(data[0]).map(key => ({
    id: key,
    title: key.replace(/([A-Z])/g, ' $1').trim()
  }));

  const csvWriter = createObjectCsvWriter({
    path: 'temp.csv', // Temporary file
    header: headers
  });

  await csvWriter.writeRecords(data);
  
  // Read the file and return content
  const fs = require('fs');
  const content = fs.readFileSync('temp.csv', 'utf8');
  
  // Clean up temporary file
  fs.unlinkSync('temp.csv');
  
  return content;
};

module.exports = {
  generateCSV
};